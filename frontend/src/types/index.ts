// API Response Types

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
  desc: string;
}

export interface AccountSummaryItem {
  amount: number;
  currency: string;
  isNull: boolean;
  timestamp: number;
  value: string | null;
  severity: number;
}

export interface AccountSummary {
  [key: string]: AccountSummaryItem;
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

export interface LedgerEntry {
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
}

export interface Ledger {
  [currency: string]: LedgerEntry;
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

export interface PerformanceNavData {
  idType: string;
  baseCurrency: string;
  start: string;
  end: string;
  returns: number[];
  navs: number[];
  dates: string[];
}

export interface PerformanceData {
  currencyType: string;
  rc: number;
  nav: {
    data: PerformanceNavData[];
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

export interface HistoricalDataBar {
  o: number;
  c: number;
  h: number;
  l: number;
  v: number;
  t: number;
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
  data: HistoricalDataBar[];
  points: number;
  travelTime: number;
}

export interface AuthStatus {
  authenticated: boolean;
  competing: boolean;
  connected: boolean;
  message?: string;
}

export interface SessionStatus {
  cached: AuthStatus | null;
  current: AuthStatus | null;
  error: string | null;
}

export interface HistoricalPerformance {
  lastUpdated: string;
  data: {
    dates: string[];
    navs: number[];
    returns: number[];
    depositsWithdraws: number[];
  };
}

export interface ValueVsInvested {
  months: string[];
  portfolioValues: number[];
  amountInvested: number[];
}
