import { tickle, getAuthStatus, initBrokerageSession, AuthStatus } from './ibkr-client.js';

export class SessionManager {
  private tickleInterval: NodeJS.Timeout | null = null;
  private statusCheckInterval: NodeJS.Timeout | null = null;
  private lastAuthStatus: AuthStatus | null = null;
  private isRunning = false;

  // Tickle every 60 seconds to keep session alive
  private readonly TICKLE_INTERVAL = parseInt(process.env.TICKLE_INTERVAL || '60000', 10);
  // Check auth status every 30 seconds
  private readonly STATUS_CHECK_INTERVAL = 30000;

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('Session manager started');

    // Initial status check
    this.checkAuthStatus();

    // Set up intervals
    this.tickleInterval = setInterval(() => this.sendTickle(), this.TICKLE_INTERVAL);
    this.statusCheckInterval = setInterval(() => this.checkAuthStatus(), this.STATUS_CHECK_INTERVAL);
  }

  stop() {
    this.isRunning = false;

    if (this.tickleInterval) {
      clearInterval(this.tickleInterval);
      this.tickleInterval = null;
    }

    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
    }

    console.log('Session manager stopped');
  }

  private async sendTickle() {
    try {
      const response = await tickle();
      if (response.error) {
        console.warn('Tickle failed:', response.error);
      }
    } catch (error) {
      console.error('Tickle error:', error);
    }
  }

  private async checkAuthStatus() {
    try {
      const response = await getAuthStatus();
      if (response.data) {
        this.lastAuthStatus = response.data;

        if (!response.data.authenticated) {
          console.warn('Session not authenticated. Please log in via https://localhost:5000');
        } else if (!response.data.connected) {
          console.log('Authenticated but not connected, initializing brokerage session...');
          await initBrokerageSession();
        }
      }
    } catch (error) {
      console.error('Auth status check error:', error);
    }
  }

  getAuthStatus(): AuthStatus | null {
    return this.lastAuthStatus;
  }

  isAuthenticated(): boolean {
    return this.lastAuthStatus?.authenticated ?? false;
  }

  isConnected(): boolean {
    return this.lastAuthStatus?.connected ?? false;
  }
}
