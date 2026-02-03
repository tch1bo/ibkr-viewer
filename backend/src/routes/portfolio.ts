import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import * as ibkr from '../services/ibkr-client.js';
import { cacheManager, CACHE_TTL } from '../services/cache-manager.js';

export const portfolioRouter: RouterType = Router();

// Get all positions
portfolioRouter.get('/:accountId/positions', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const cacheKey = `positions_${accountId}`;
    const cached = await cacheManager.get<ibkr.Position[]>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const response = await ibkr.getAllPositions(accountId);
    if (response.error) {
      return res.status(response.status).json({ error: response.error });
    }

    await cacheManager.set(cacheKey, response.data, CACHE_TTL.POSITIONS);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

// Get allocation
portfolioRouter.get('/:accountId/allocation', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const cacheKey = `allocation_${accountId}`;
    const cached = await cacheManager.get<ibkr.Allocation>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const response = await ibkr.getAllocation(accountId);
    if (response.error) {
      return res.status(response.status).json({ error: response.error });
    }

    await cacheManager.set(cacheKey, response.data, CACHE_TTL.ALLOCATION);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching allocation:', error);
    res.status(500).json({ error: 'Failed to fetch allocation' });
  }
});
