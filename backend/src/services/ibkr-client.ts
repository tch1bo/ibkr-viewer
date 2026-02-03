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
  const params = new URLSearchParams({
    acctIds: accountIds.join(','),
    freq: 'M', // Monthly
    ...(period && { period }),
  });
  return ibkrFetch<PerformanceData>(`/pa/performance?${params}`);
}

export async function getTransactions(accountIds: string[], days: number = 365) {
  const params = new URLSearchParams({
    acctIds: accountIds.join(','),
    days: days.toString(),
  });
  return ibkrFetch<Transaction[]>(`/pa/transactions?${params}`);
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

// Types
export interface AuthStatus {
  authenticated: boolean;
  competing: boolean;
  connected: boolean;
  message?: string;
  MAC?: string;
  serverInfo?: {
    serverName: string;
    serverVersion: string;
  };
}

export interface Account {
  id: string;
  accountId: string;
  accountVan: string;
  accountTitle: string;
  displayName: string;
  accountAlias: string | null;
  accountStatus: number;
  currency: string;
  type: string;
  tradingType: string;
  ibEntity: string;
  faclient: boolean;
  clearingStatus: string;
  covestor: boolean;
  parent?: {
    mmc: string[];
    accountId: string;
    isMParent: boolean;
    isMChild: boolean;
    isMultiplex: boolean;
  };
  desc: string;
}

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

export interface Position {
  acctId: string;
  conid: number;
  contractDesc: string;
  position: number;
  mktPrice: number;
  mktValue: number;
  currency: string;
  avgCost: number;
  avgPrice: number;
  realizedPnl: number;
  unrealizedPnl: number;
  exchs: string | null;
  expiry: string | null;
  putOrCall: string | null;
  multiplier: number | null;
  strike: number | null;
  exerciseStyle: string | null;
  conExchMap: string[];
  assetClass: string;
  undConid: number;
  model: string;
  time: number;
  chineseName: string | null;
  allExchanges: string;
  listingExchange: string;
  countryCode: string;
  name: string;
  lastTradingDay: string | null;
  group: string | null;
  sector: string | null;
  sectorGroup: string | null;
  ticker: string;
  type: string;
  undComp: string | null;
  undSym: string | null;
  fullName: string;
  pageSize: number;
  isEventContract: boolean;
}

export interface Ledger {
  [currency: string]: {
    commoditymarketvalue: number;
    futuremarketvalue: number;
    settledcash: number;
    exchangerate: number;
    sessionid: number;
    cashbalance: number;
    corporatebondsmarketvalue: number;
    warrantsmarketvalue: number;
    netliquidationvalue: number;
    interest: number;
    unrealizedpnl: number;
    stockmarketvalue: number;
    moneyfunds: number;
    currency: string;
    realizedpnl: number;
    funds: number;
    acctcode: string;
    issueroptionsmarketvalue: number;
    key: string;
    timestamp: number;
    severity: number;
  };
}

export interface Allocation {
  assetClass: {
    long: { [key: string]: number };
    short: { [key: string]: number };
  };
  sector: {
    long: { [key: string]: number };
    short: { [key: string]: number };
  };
  group: {
    long: { [key: string]: number };
    short: { [key: string]: number };
  };
}

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

export interface HistoricalData {
  symbol: string;
  text: string;
  priceFactor: number;
  startTime: string;
  high: string;
  low: string;
  timePeriod: string;
  barLength: number;
  mdAvailability: string;
  mktDataDelay: number;
  outsideRth: boolean;
  volumeFactor: number;
  priceFormat: string;
  chartAnnotations: string;
  data: Array<{
    o: number;
    c: number;
    h: number;
    l: number;
    v: number;
    t: number;
  }>;
  points: number;
  travelTime: number;
}

export interface ContractSearchResult {
  conid: number;
  companyHeader: string;
  companyName: string;
  symbol: string;
  description: string;
  restricted: string | null;
  fop: string | null;
  opt: string | null;
  war: string | null;
  sections: Array<{
    secType: string;
    months: string;
    symbol: string;
    exchange: string;
    legSecType: string | null;
  }>;
}

export interface ContractInfo {
  cfi_code: string;
  symbol: string;
  cusip: string | null;
  expiry_full: string | null;
  con_id: number;
  maturity_date: string | null;
  industry: string;
  instrument_type: string;
  trading_class: string;
  valid_exchanges: string;
  allow_sell_long: boolean;
  is_zero_commission_security: boolean;
  local_symbol: string;
  currency: string;
  company_name: string;
  smart_available: boolean;
  exchange: string;
  category: string;
}
