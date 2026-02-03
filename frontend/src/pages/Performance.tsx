import { useAccounts } from '../hooks/useAccount';
import { EquityCurve } from '../components/charts/EquityCurve';
import { ValueVsInvestedChart } from '../components/charts/ValueVsInvestedChart';
import { LoadingState } from '../components/ui/Spinner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { usePerformance } from '../hooks/usePerformance';
import { formatPercent } from '../lib/utils';

export function Performance() {
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const accountId = accounts?.[0]?.accountId;
  const { data: performance, isLoading: perfLoading } = usePerformance(accountId, '1Y');

  if (accountsLoading) {
    return <LoadingState message="Loading performance..." />;
  }

  if (!accountId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No accounts found. Please check your IBKR connection.
      </div>
    );
  }

  // Calculate performance metrics
  const navData = performance?.nav?.data?.[0];
  const returns = navData?.returns || [];

  const ytdReturn = returns.reduce((acc, r) => acc * (1 + r / 100), 1) - 1;

  // Calculate additional metrics
  const positiveMonths = returns.filter(r => r > 0).length;
  const negativeMonths = returns.filter(r => r < 0).length;
  const avgMonthlyReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const maxReturn = returns.length > 0 ? Math.max(...returns) : 0;
  const minReturn = returns.length > 0 ? Math.min(...returns) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Performance</h1>
        <p className="text-muted-foreground">
          Track your investment performance against benchmarks
        </p>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              YTD Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${ytdReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {perfLoading ? '...' : `${ytdReturn >= 0 ? '+' : ''}${formatPercent(ytdReturn * 100)}`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Monthly Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${avgMonthlyReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {perfLoading ? '...' : `${avgMonthlyReturn >= 0 ? '+' : ''}${formatPercent(avgMonthlyReturn)}`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Win/Loss Months
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {perfLoading ? '...' : (
                <>
                  <span className="text-green-600">{positiveMonths}</span>
                  <span className="text-muted-foreground mx-1">/</span>
                  <span className="text-red-600">{negativeMonths}</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Best / Worst Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {perfLoading ? '...' : (
                <>
                  <span className="text-green-600">+{formatPercent(maxReturn)}</span>
                  <span className="text-muted-foreground mx-1">/</span>
                  <span className="text-red-600">{formatPercent(minReturn)}</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equity Curve with S&P 500 benchmark */}
      <EquityCurve accountId={accountId} period="1Y" />

      {/* Portfolio Value vs Amount Invested */}
      <ValueVsInvestedChart accountId={accountId} />
    </div>
  );
}
