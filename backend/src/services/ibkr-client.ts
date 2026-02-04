import type { components } from '../types/ibkr-openapi.js';

const GATEWAY_URL = process.env.IBKR_GATEWAY_URL || 'https://localhost:5000';
const API_BASE = `${GATEWAY_URL}/v1/api`;

export interface IBKRResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

async function ibkrFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<IBKRResponse<T>> {
  const url = `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const status = response.status;

    if (!response.ok) {
      const errorText = await response.text();
      return { error: errorText || `HTTP ${status}`, status };
    }

    const data = await response.json() as T;
    return { data, status };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { error: message, status: 500 };
  }
}

// Session Management
export async function tickle() {
  return ibkrFetch('/tickle', { method: 'POST' });
}

export async function getAuthStatus() {
  return ibkrFetch<AuthStatus>('/iserver/auth/status');
}

export async function reauthenticate() {
  return ibkrFetch('/iserver/reauthenticate', { method: 'POST' });
}

export async function initBrokerageSession() {
  return ibkrFetch('/iserver/auth/ssodh/init', { method: 'POST' });
}

// Account & Portfolio
export async function getAccounts() {
  return ibkrFetch<Account[]>('/portfolio/accounts');
}

export async function getAccountSummary(accountId: string) {
  return ibkrFetch<AccountSummary>(`/portfolio/${accountId}/summary`);
}

export async function getPositions(accountId: string, pageId: number = 0) {
  return ibkrFetch<Position[]>(`/portfolio/${accountId}/positions/${pageId}`);
}

export async function getAllPositions(accountId: string): Promise<IBKRResponse<Position[]>> {
  const allPositions: Position[] = [];
  let pageId = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await getPositions(accountId, pageId);
    if (response.error || !response.data) {
      if (pageId === 0) {
        return { error: response.error || 'Failed to fetch positions', status: response.status };
      }
      break;
    }
    if (response.data.length === 0) {
      hasMore = false;
    } else {
      allPositions.push(...response.data);
      pageId++;
    }
  }

  return { data: allPositions, status: 200 };
}

export async function getLedger(accountId: string) {
  return ibkrFetch<Ledger>(`/portfolio/${accountId}/ledger`);
}

export async function getAllocation(accountId: string) {
  return ibkrFetch<Allocation>(`/portfolio/${accountId}/allocation`);
}

// Performance Analytics
export async function getPerformance(accountIds: string[], period: string = '1Y') {
  return ibkrFetch<PerformanceData>('/pa/performance', {
    method: 'POST',
    body: JSON.stringify({
      acctIds: accountIds,
      freq: 'M',
      ...(period && { period }),
    }),
  });
}

export interface TransactionsResponse {
  rc?: number;
  currency?: string;
  from?: number;
  to?: number;
  includesRealTime?: boolean;
  transactions?: Array<{
    date?: string;
    rawDate?: string;
    cur?: string;
    fxRate?: number;
    pr?: number;
    qty?: number;
    acctid?: string;
    amt?: number;
    conid?: number;
    type?: string;
    desc?: string;
  }>;
}

export async function getTransactions(accountIds: string[], days: number = 3650, currency: string = 'CHF', conids: number[]) {
  return ibkrFetch<TransactionsResponse>('/pa/transactions', {
    method: 'POST',
    body: JSON.stringify({
      acctIds: accountIds,
      ...(conids?.length && { conids }),
      currency,
      days,
    }),
  });
}

// Market Data
export async function getMarketDataSnapshot(conids: number[], fields: string[] = ['31', '84', '86']) {
  const params = new URLSearchParams({
    conids: conids.join(','),
    fields: fields.join(','),
  });
  return ibkrFetch<MarketDataSnapshot[]>(`/iserver/marketdata/snapshot?${params}`);
}

export async function getHistoricalData(
  conid: number,
  period: string = '1Y',
  bar: string = '1d'
) {
  const params = new URLSearchParams({
    conid: conid.toString(),
    period,
    bar,
  });
  return ibkrFetch<HistoricalData>(`/iserver/marketdata/history?${params}`);
}

export async function searchContracts(symbol: string) {
  return ibkrFetch<ContractSearchResult[]>(`/iserver/secdef/search?symbol=${encodeURIComponent(symbol)}`);
}

export async function getContractInfo(conid: number) {
  return ibkrFetch<ContractInfo>(`/iserver/contract/${conid}/info`);
}

// Types from IBKR OpenAPI spec
export type AuthStatus = components['schemas']['brokerageSessionStatus'];
export type Account = components['schemas']['accountAttributes'];
export type Position = components['schemas']['individualPosition'];
export type Ledger = components['schemas']['ledger'];
export type Allocation = components['schemas']['portfolioAllocations'];
// Not in IBKR OpenAPI spec — performanceResponse schema doesn't match
// the actual /pa/performance response structure (dates/returns/navs arrays
// are on each data item, not on the parent object).
export interface PerformanceData {
  currencyType: string;
  rc: number;
  nav: {
    data: Array<{
      idType: string;
      baseCurrency: string;
      start: string;
      end: string;
      returns: number[];
      navs: number[];
      dates: string[];
    }>;
  };
  tpps?: {
    data: Array<{
      idType: string;
      baseCurrency: string;
      start: string;
      end: string;
      returns: number[];
      dates: string[];
    }>;
  };
  cps?: {
    data: Array<{
      id: string;
      start: string;
      end: string;
      depositsWithdraws: number[];
      dates: string[];
    }>;
  };
}
export type HistoricalData = components['schemas']['iserverHistoryLastResponse'];
export type ContractSearchResult = components['schemas']['secdefSearchResponse'][number];
export type ContractInfo = components['schemas']['contractInfo'];

// Not in IBKR OpenAPI spec — the /portfolio/{accountId}/summary endpoint
// returns a dynamic key-value map, not the fixed accountSummaryResponse schema.
export interface AccountSummary {
  [key: string]: {
    amount: number;
    currency: string;
    isNull: boolean;
    timestamp: number;
    value: string | null;
    severity: number;
  };
}

// Not in IBKR OpenAPI spec — transactionsResponse is a wrapper with
// nested rpnl/transactions arrays; individual transaction shape is inline.
export interface Transaction {
  acctId: string;
  conid: number;
  currency: string;
  fxRate: number;
  desc: string;
  date: string;
  type: string;
  qty: number;
  amount: number;
  price: number;
  commission: number;
}

// Not in IBKR OpenAPI spec — iserverSnapshot is typed as unknown[].
// We define the actual shape based on observed API responses.
export interface MarketDataSnapshot {
  conid: number;
  minTick?: number;
  BboExchange?: string;
  HasDelayed?: boolean;
  _updated?: number;
  '31'?: string; // Last price
  '84'?: string; // Bid
  '86'?: string; // Ask
  '87'?: string; // Volume
  '88'?: string; // Exchange
  [key: string]: string | number | boolean | undefined;
}
