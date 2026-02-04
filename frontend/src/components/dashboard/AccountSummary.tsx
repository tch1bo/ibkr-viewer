import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useAccountSummary, useLedger } from '../../hooks/useAccount';
import { LoadingState } from '../ui/Spinner';
import {
  formatCurrency,
  formatPercent,
  getPnLColor,
  getChangeIndicator,
} from '../../lib/utils';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
} from 'lucide-react';

interface AccountSummaryProps {
  accountId: string;
}

export function AccountSummary({ accountId }: AccountSummaryProps) {
  const { data: summary, isLoading: summaryLoading } = useAccountSummary(accountId);
  const { data: ledger, isLoading: ledgerLoading } = useLedger(accountId);

  if (summaryLoading || ledgerLoading) {
    return <LoadingState message="Loading account summary..." />;
  }

  if (!summary || !ledger) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Unable to load account summary. Please ensure you are logged in to the IBKR gateway.
      </div>
    );
  }

  // Extract key metrics from summary
  const nav = summary.netliquidationvalue?.amount ?? 0;
  const totalCash = summary.totalcashvalue?.amount ?? 0;
  const unrealizedPnl = summary.unrealizedpnl?.amount ?? 0;
  const realizedPnl = summary.realizedpnl?.amount ?? 0;
  const dailyPnl = summary.dailypnl?.amount ?? 0;
  const grossPositionValue = summary.grosspositionvalue?.amount ?? 0;
  const currency = summary.netliquidationvalue?.currency ?? 'CHF';

  // Calculate day change percentage
  const previousNav = nav - dailyPnl;
  const dayChangePercent = previousNav > 0 ? (dailyPnl / previousNav) * 100 : 0;

  const metrics = [
    {
      title: 'Net Liquidation Value',
      value: formatCurrency(nav, currency),
      change: dailyPnl,
      changePercent: dayChangePercent,
      icon: DollarSign,
      description: 'Total account value',
    },
    {
      title: 'Total Cash',
      value: formatCurrency(totalCash, currency),
      icon: Wallet,
      description: 'Available cash balance',
    },
    {
      title: 'Position Value',
      value: formatCurrency(grossPositionValue, currency),
      icon: PiggyBank,
      description: 'Gross value of all positions',
    },
    {
      title: 'Unrealized P&L',
      value: formatCurrency(unrealizedPnl, currency),
      change: unrealizedPnl,
      icon: unrealizedPnl >= 0 ? TrendingUp : TrendingDown,
      description: 'Open position gains/losses',
    },
    {
      title: 'Realized P&L',
      value: formatCurrency(realizedPnl, currency),
      change: realizedPnl,
      icon: realizedPnl >= 0 ? TrendingUp : TrendingDown,
      description: 'Closed position gains/losses',
    },
    {
      title: "Day's P&L",
      value: formatCurrency(dailyPnl, currency),
      change: dailyPnl,
      changePercent: dayChangePercent,
      icon: dailyPnl >= 0 ? TrendingUp : TrendingDown,
      description: "Today's change",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </CardTitle>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            {metric.change !== undefined && (
              <p className={`text-xs ${getPnLColor(metric.change)}`}>
                {getChangeIndicator(metric.change)}
                {formatCurrency(Math.abs(metric.change), currency)}
                {metric.changePercent !== undefined && (
                  <span className="ml-1">
                    ({getChangeIndicator(metric.changePercent)}
                    {formatPercent(Math.abs(metric.changePercent))})
                  </span>
                )}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {metric.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
