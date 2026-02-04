import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import * as ibkr from '../services/ibkr-client.js';
import { cacheManager, CACHE_TTL } from '../services/cache-manager.js';
import fs from 'fs/promises';
import path from 'path';

export const performanceRouter: RouterType = Router();

const CACHE_DIR = process.env.DATA_CACHE_DIR || './cache';

// Get performance data
performanceRouter.get('/:accountId', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { period = '1Y' } = req.query;

    const cacheKey = `performance_${accountId}_${period}`;
    const cached = await cacheManager.get<ibkr.PerformanceData>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const response = await ibkr.getPerformance([accountId], period as string);
    if (response.error) {
      return res.status(response.status).json({ error: response.error });
    }

    await cacheManager.set(cacheKey, response.data, CACHE_TTL.PERFORMANCE);

    // Also save to persistent historical cache
    await saveHistoricalPerformance(accountId, response.data);

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching performance:', error);
    res.status(500).json({ error: 'Failed to fetch performance' });
  }
});

// Get transactions
performanceRouter.get('/:accountId/transactions', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { days = '3650' } = req.query;

    const cacheKey = `transactions_${accountId}_${days}`;
    const cached = await cacheManager.get<ibkr.Transaction[]>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // IBKR requires a non-empty conids array — fetch from current positions
    const positions = await ibkr.getAllPositions(accountId);
    if (positions.error || !positions.data) {
      return res.status(positions.status).json({ error: positions.error || 'Failed to fetch positions for conids' });
    }

    const conids = [...new Set(positions.data.map(p => p.conid).filter((c): c is number => c !== undefined))];
    if (conids.length === 0) {
      return res.json([]);
    }

    const response = await ibkr.getTransactions([accountId], parseInt(days as string, 10), 'CHF', conids);
    if (response.error) {
      return res.status(response.status).json({ error: response.error });
    }

    // Map IBKR response fields to our Transaction interface
    const transactions: ibkr.Transaction[] = (response.data?.transactions ?? []).map(t => ({
      acctId: t.acctid ?? accountId,
      conid: t.conid ?? 0,
      currency: t.cur ?? 'CHF',
      fxRate: t.fxRate ?? 1,
      desc: t.desc ?? '',
      date: formatRawDate(t.rawDate) || t.date || '',
      type: normalizeTransactionType(t.type),
      qty: t.qty ?? 0,
      amount: t.amt ?? 0,
      price: t.pr ?? 0,
      commission: 0,
    }));

    await cacheManager.set(cacheKey, transactions, CACHE_TTL.TRANSACTIONS);

    // Also save to persistent historical cache
    await saveHistoricalTransactions(accountId, transactions);

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get all historical performance data (accumulated over time)
performanceRouter.get('/:accountId/historical', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const data = await loadHistoricalPerformance(accountId);
    res.json(data);
  } catch (error) {
    console.error('Error fetching historical performance:', error);
    res.status(500).json({ error: 'Failed to fetch historical performance' });
  }
});

// Get portfolio value vs invested amount over time
performanceRouter.get('/:accountId/value-vs-invested', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;

    // Load historical data
    const performanceData = await loadHistoricalPerformance(accountId);
    const transactionsData = await loadHistoricalTransactions(accountId);

    // Calculate monthly portfolio values and cumulative investments
    const result = calculateValueVsInvested(performanceData, transactionsData);

    res.json(result);
  } catch (error) {
    console.error('Error calculating value vs invested:', error);
    res.status(500).json({ error: 'Failed to calculate value vs invested' });
  }
});

// Map IBKR transaction type strings to our short codes
function normalizeTransactionType(type?: string): string {
  if (!type) return '';
  const map: Record<string, string> = {
    'Buy': 'BUY',
    'Sell': 'SELL',
    'Dividend Payment': 'DIV',
    'Interest': 'INT',
    'Deposit': 'DEP',
    'Withdrawal': 'WD',
    'Fee': 'FEE',
    'Commission': 'COMM',
    'Transfer': 'DEP',
  };
  return map[type] ?? type.toUpperCase();
}

// Convert rawDate "20200602" to "2020-06-02"
function formatRawDate(raw?: string): string {
  if (!raw || raw.length !== 8) return '';
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

// Helper functions for persistent historical data

interface HistoricalPerformanceCache {
  lastUpdated: string;
  data: {
    dates: string[];
    navs: number[];
    returns: number[];
    depositsWithdraws: number[];
  };
}

interface HistoricalTransactionsCache {
  lastUpdated: string;
  transactions: ibkr.Transaction[];
}

async function saveHistoricalPerformance(accountId: string, data: ibkr.PerformanceData | undefined): Promise<void> {
  if (!data?.nav?.data?.[0]) return;

  const filePath = path.join(CACHE_DIR, `historical_performance_${accountId}.json`);

  let existing: HistoricalPerformanceCache = {
    lastUpdated: new Date().toISOString(),
    data: { dates: [], navs: [], returns: [], depositsWithdraws: [] },
  };

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    existing = JSON.parse(content);
  } catch {
    // File doesn't exist yet
  }

  const navData = data.nav.data[0];
  const cpsData = data.cps?.data?.[0];

  // Merge new data with existing, avoiding duplicates
  const existingDates = new Set(existing.data.dates);

  for (let i = 0; i < navData.dates.length; i++) {
    const date = navData.dates[i];
    if (!existingDates.has(date)) {
      existing.data.dates.push(date);
      existing.data.navs.push(navData.navs[i]);
      existing.data.returns.push(navData.returns[i]);
      if (cpsData?.depositsWithdraws?.[i] !== undefined) {
        existing.data.depositsWithdraws.push(cpsData.depositsWithdraws[i]);
      }
    }
  }

  // Sort by date
  const indices = existing.data.dates.map((_, i) => i);
  indices.sort((a, b) => existing.data.dates[a].localeCompare(existing.data.dates[b]));

  existing.data = {
    dates: indices.map(i => existing.data.dates[i]),
    navs: indices.map(i => existing.data.navs[i]),
    returns: indices.map(i => existing.data.returns[i]),
    depositsWithdraws: indices.map(i => existing.data.depositsWithdraws[i] || 0),
  };

  existing.lastUpdated = new Date().toISOString();

  await fs.writeFile(filePath, JSON.stringify(existing, null, 2));
}

async function loadHistoricalPerformance(accountId: string): Promise<HistoricalPerformanceCache> {
  const filePath = path.join(CACHE_DIR, `historical_performance_${accountId}.json`);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {
      lastUpdated: new Date().toISOString(),
      data: { dates: [], navs: [], returns: [], depositsWithdraws: [] },
    };
  }
}

async function saveHistoricalTransactions(accountId: string, transactions: ibkr.Transaction[] | undefined): Promise<void> {
  if (!transactions) return;

  const filePath = path.join(CACHE_DIR, `historical_transactions_${accountId}.json`);

  let existing: HistoricalTransactionsCache = {
    lastUpdated: new Date().toISOString(),
    transactions: [],
  };

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    existing = JSON.parse(content);
  } catch {
    // File doesn't exist yet
  }

  // Merge transactions, using date + conid + amount as unique key
  const existingKeys = new Set(
    existing.transactions.map(t => `${t.date}_${t.conid}_${t.amount}`)
  );

  for (const t of transactions) {
    const key = `${t.date}_${t.conid}_${t.amount}`;
    if (!existingKeys.has(key)) {
      existing.transactions.push(t);
    }
  }

  // Sort by date
  existing.transactions.sort((a, b) => a.date.localeCompare(b.date));
  existing.lastUpdated = new Date().toISOString();

  await fs.writeFile(filePath, JSON.stringify(existing, null, 2));
}

async function loadHistoricalTransactions(accountId: string): Promise<HistoricalTransactionsCache> {
  const filePath = path.join(CACHE_DIR, `historical_transactions_${accountId}.json`);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {
      lastUpdated: new Date().toISOString(),
      transactions: [],
    };
  }
}

interface ValueVsInvestedData {
  months: string[];
  portfolioValues: number[];
  amountInvested: number[];
}

function calculateValueVsInvested(
  performance: HistoricalPerformanceCache,
  transactions: HistoricalTransactionsCache
): ValueVsInvestedData {
  // Group NAV data by month
  const monthlyNavs: Map<string, number> = new Map();
  for (let i = 0; i < performance.data.dates.length; i++) {
    const date = performance.data.dates[i];
    const month = date.substring(0, 7); // YYYY-MM
    monthlyNavs.set(month, performance.data.navs[i]); // Last value of month
  }

  // Calculate cumulative deposits/withdrawals by month
  const monthlyDeposits: Map<string, number> = new Map();
  let cumulative = 0;

  // Group deposits by month from performance data
  for (let i = 0; i < performance.data.dates.length; i++) {
    const date = performance.data.dates[i];
    const month = date.substring(0, 7);
    const deposit = performance.data.depositsWithdraws[i] || 0;
    cumulative += deposit;
    monthlyDeposits.set(month, cumulative);
  }

  // Get sorted months
  const allMonths = new Set([...monthlyNavs.keys(), ...monthlyDeposits.keys()]);
  const sortedMonths = Array.from(allMonths).sort();

  // Build result arrays
  const portfolioValues: number[] = [];
  const amountInvested: number[] = [];

  let lastNav = 0;
  let lastDeposit = 0;

  for (const month of sortedMonths) {
    lastNav = monthlyNavs.get(month) ?? lastNav;
    lastDeposit = monthlyDeposits.get(month) ?? lastDeposit;

    portfolioValues.push(lastNav);
    amountInvested.push(lastDeposit);
  }

  return {
    months: sortedMonths,
    portfolioValues,
    amountInvested,
  };
}
