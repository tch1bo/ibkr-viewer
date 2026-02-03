import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import * as ibkr from '../services/ibkr-client.js';
import { SessionManager } from '../services/session-manager.js';

export const sessionRouter: RouterType = Router();

// Get auth status
sessionRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const sessionManager: SessionManager = req.app.locals.sessionManager;

    // Get cached status from session manager
    const cachedStatus = sessionManager.getAuthStatus();

    // Also fetch fresh status
    const response = await ibkr.getAuthStatus();

    res.json({
      cached: cachedStatus,
      current: response.data || null,
      error: response.error || null,
    });
  } catch (error) {
    console.error('Error fetching auth status:', error);
    res.status(500).json({ error: 'Failed to fetch auth status' });
  }
});

// Tickle (keep session alive)
sessionRouter.post('/tickle', async (req: Request, res: Response) => {
  try {
    const response = await ibkr.tickle();

    if (response.error) {
      return res.status(response.status).json({ error: response.error });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Error tickling session:', error);
    res.status(500).json({ error: 'Failed to tickle session' });
  }
});

// Re-authenticate
sessionRouter.post('/reauthenticate', async (req: Request, res: Response) => {
  try {
    const response = await ibkr.reauthenticate();

    if (response.error) {
      return res.status(response.status).json({ error: response.error });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Error reauthenticating:', error);
    res.status(500).json({ error: 'Failed to reauthenticate' });
  }
});

// Initialize brokerage session
sessionRouter.post('/init', async (req: Request, res: Response) => {
  try {
    const response = await ibkr.initBrokerageSession();

    if (response.error) {
      return res.status(response.status).json({ error: response.error });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Error initializing brokerage session:', error);
    res.status(500).json({ error: 'Failed to initialize brokerage session' });
  }
});
