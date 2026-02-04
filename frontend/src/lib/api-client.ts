import type {
  Account,
  AccountSummary,
  Position,
  Ledger,
  Allocation,
  PerformanceData,
  Transaction,
  HistoricalData,
  SessionStatus,
  HistoricalPerformance,
  ValueVsInvested,
} from '../types';

const API_BASE = '/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Session
export async function getSessionStatus(): Promise<SessionStatus> {
  return fetchApi('/session/status');
}

export async function tickleSession(): Promise<void> {
  return fetchApi('/session/tickle', { method: 'POST' });
}

// Account
export async function getAccounts(): Promise<Account[]> {
  return fetchApi('/account');
}

export async function getAccountSummary(accountId: string): Promise<AccountSummary> {
  return fetchApi(`/account/${accountId}/summary`);
}

export async function getLedger(accountId: string): Promise<Ledger> {
  return fetchApi(`/account/${accountId}/ledger`);
}

// Portfolio
export async function getPositions(accountId: string): Promise<Position[]> {
  return fetchApi(`/portfolio/${accountId}/positions`);
}

export async function getAllocation(accountId: string): Promise<Allocation> {
  return fetchApi(`/portfolio/${accountId}/allocation`);
}

// Performance
export async function getPerformance(accountId: string, period = '1Y'): Promise<PerformanceData> {
  return fetchApi(`/performance/${accountId}?period=${period}`);
}

export async function getTransactions(accountId: string, days = 3650): Promise<Transaction[]> {
  return fetchApi(`/performance/${accountId}/transactions?days=${days}`);
}

export async function getHistoricalPerformance(accountId: string): Promise<HistoricalPerformance> {
  return fetchApi(`/performance/${accountId}/historical`);
}

export async function getValueVsInvested(accountId: string): Promise<ValueVsInvested> {
  return fetchApi(`/performance/${accountId}/value-vs-invested`);
}

// Market Data
export async function getHistoricalData(
  conid: number,
  period = '1Y',
  bar = '1d'
): Promise<HistoricalData> {
  return fetchApi(`/marketdata/history/${conid}?period=${period}&bar=${bar}`);
}

export async function getSpyBenchmark(period = '1Y'): Promise<HistoricalData> {
  return fetchApi(`/marketdata/benchmark/spy?period=${period}`);
}
