import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import * as ibkr from '../services/ibkr-client.js';
import { cacheManager, CACHE_TTL } from '../services/cache-manager.js';

export const accountRouter: RouterType = Router();

// Get all accounts
accountRouter.get('/', async (req: Request, res: Response) => {
  try {
    const cacheKey = 'accounts';
    const cached = await cacheManager.get<ibkr.Account[]>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const response = await ibkr.getAccounts();
    if (response.error) {
      return res.status(response.status).json({ error: response.error });
    }

    await cacheManager.set(cacheKey, response.data, CACHE_TTL.ACCOUNT_SUMMARY);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Get account summary
accountRouter.get('/:accountId/summary', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const cacheKey = `account_summary_${accountId}`;
    const cached = await cacheManager.get<ibkr.AccountSummary>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const response = await ibkr.getAccountSummary(accountId);
    if (response.error) {
      return res.status(response.status).json({ error: response.error });
    }

    await cacheManager.set(cacheKey, response.data, CACHE_TTL.ACCOUNT_SUMMARY);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching account summary:', error);
    res.status(500).json({ error: 'Failed to fetch account summary' });
  }
});

// Get account ledger
accountRouter.get('/:accountId/ledger', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const cacheKey = `ledger_${accountId}`;
    const cached = await cacheManager.get<ibkr.Ledger>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const response = await ibkr.getLedger(accountId);
    if (response.error) {
      return res.status(response.status).json({ error: response.error });
    }

    await cacheManager.set(cacheKey, response.data, CACHE_TTL.LEDGER);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching ledger:', error);
    res.status(500).json({ error: 'Failed to fetch ledger' });
  }
});
