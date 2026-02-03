import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { accountRouter } from './routes/account.js';
import { portfolioRouter } from './routes/portfolio.js';
import { marketDataRouter } from './routes/marketdata.js';
import { sessionRouter } from './routes/session.js';
import { performanceRouter } from './routes/performance.js';
import { errorHandler } from './middleware/error-handler.js';
import { SessionManager } from './services/session-manager.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize session manager
const sessionManager = new SessionManager();
sessionManager.start();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));
app.use(express.json());

// Make session manager available to routes
app.locals.sessionManager = sessionManager;

// Routes
app.use('/api/account', accountRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/marketdata', marketDataRouter);
app.use('/api/session', sessionRouter);
app.use('/api/performance', performanceRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
  console.log(`IBKR Gateway URL: ${process.env.IBKR_GATEWAY_URL || 'https://localhost:5000'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  sessionManager.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  sessionManager.stop();
  process.exit(0);
});
