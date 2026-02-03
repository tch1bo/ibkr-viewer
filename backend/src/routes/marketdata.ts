import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import * as ibkr from '../services/ibkr-client.js';
import { cacheManager, CACHE_TTL } from '../services/cache-manager.js';

export const marketDataRouter: RouterType = Router();

// Get market data snapshot
marketDataRouter.get('/snapshot', async (req: Request, res: Response) => {
  try {
    const { conids, fields } = req.query;

    if (!conids) {
      return res.status(400).json({ error: 'conids parameter required' });
    }

    const conidArray = (conids as string).split(',').map(Number);
    const fieldArray = fields ? (fields as string).split(',') : undefined;

    const response = await ibkr.getMarketDataSnapshot(conidArray, fieldArray);
    if (response.error) {
      return res.status(response.status).json({ error: response.error });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching market data snapshot:', error);
    res.status(500).json({ error: 'Failed to fetch market data snapshot' });
  }
});

// Get historical data
marketDataRouter.get('/history/:conid', async (req: Request, res: Response) => {
  try {
    const { conid } = req.params;
    const { period = '1Y', bar = '1d' } = req.query;

    const cacheKey = `history_${conid}_${period}_${bar}`;
    const cached = await cacheManager.get<ibkr.HistoricalData>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const response = await ibkr.getHistoricalData(
      parseInt(conid, 10),
      period as string,
      bar as string
    );

    if (response.error) {
      return res.status(response.status).json({ error: response.error });
    }

    await cacheManager.set(cacheKey, response.data, CACHE_TTL.HISTORICAL_DATA);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

// Search contracts
marketDataRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: 'symbol parameter required' });
    }

    const response = await ibkr.searchContracts(symbol as string);
    if (response.error) {
      return res.status(response.status).json({ error: response.error });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Error searching contracts:', error);
    res.status(500).json({ error: 'Failed to search contracts' });
  }
});

// Get contract info
marketDataRouter.get('/contract/:conid', async (req: Request, res: Response) => {
  try {
    const { conid } = req.params;

    const response = await ibkr.getContractInfo(parseInt(conid, 10));
    if (response.error) {
      return res.status(response.status).json({ error: response.error });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching contract info:', error);
    res.status(500).json({ error: 'Failed to fetch contract info' });
  }
});

// Get SPY (S&P 500) historical data for benchmark
marketDataRouter.get('/benchmark/spy', async (req: Request, res: Response) => {
  try {
    const { period = '1Y' } = req.query;

    const cacheKey = `spy_benchmark_${period}`;
    const cached = await cacheManager.get<ibkr.HistoricalData>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // SPY conid is 756733 (SPDR S&P 500 ETF)
    const SPY_CONID = 756733;

    const response = await ibkr.getHistoricalData(
      SPY_CONID,
      period as string,
      '1d'
    );

    if (response.error) {
      return res.status(response.status).json({ error: response.error });
    }

    await cacheManager.set(cacheKey, response.data, CACHE_TTL.SPY_DATA);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching SPY benchmark data:', error);
    res.status(500).json({ error: 'Failed to fetch SPY benchmark data' });
  }
});
