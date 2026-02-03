import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { usePerformance, useSpyBenchmark } from '../../hooks/usePerformance';
import { LoadingState } from '../ui/Spinner';
import { formatCurrency, formatPercent, cumulativeReturns } from '../../lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface EquityCurveProps {
  accountId: string;
  period?: string;
}

export function EquityCurve({ accountId, period = '1Y' }: EquityCurveProps) {
  const { data: performance, isLoading: perfLoading } = usePerformance(accountId, period);
  const { data: spyData, isLoading: spyLoading } = useSpyBenchmark(period);

  const chartData = useMemo(() => {
    if (!performance?.nav?.data?.[0]) return [];

    const navData = performance.nav.data[0];
    const portfolioReturns = cumulativeReturns(navData.returns);

    // Calculate SPY cumulative returns
    let spyReturns: number[] = [];
    if (spyData?.data) {
      const spyDailyReturns = spyData.data.map((bar, i) => {
        if (i === 0) return 0;
        const prev = spyData.data[i - 1].c;
        return prev > 0 ? ((bar.c - prev) / prev) * 100 : 0;
      });
      spyReturns = cumulativeReturns(spyDailyReturns);
    }

    return navData.dates.map((date, i) => ({
      date,
      portfolio: portfolioReturns[i] || 0,
      nav: navData.navs[i],
      spy: spyReturns[i] || null,
    }));
  }, [performance, spyData]);

  if (perfLoading || spyLoading) {
    return <LoadingState message="Loading performance data..." />;
  }

  if (!chartData.length) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No performance data available
          </p>
        </CardContent>
      </Card>
    );
  }

  const latestPortfolio = chartData[chartData.length - 1]?.portfolio || 0;
  const latestSpy = chartData[chartData.length - 1]?.spy || 0;
  const latestNav = chartData[chartData.length - 1]?.nav || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Performance vs S&P 500</CardTitle>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Portfolio: </span>
              <span
                className={latestPortfolio >= 0 ? 'text-green-600' : 'text-red-600'}
              >
                {latestPortfolio >= 0 ? '+' : ''}
                {formatPercent(latestPortfolio)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">S&P 500: </span>
              <span
                className={latestSpy >= 0 ? 'text-green-600' : 'text-red-600'}
              >
                {latestSpy >= 0 ? '+' : ''}
                {formatPercent(latestSpy)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">NAV: </span>
              <span>{formatCurrency(latestNav)}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(date) => {
                  const d = new Date(date);
                  return d.toLocaleDateString('en-US', {
                    month: 'short',
                    year: '2-digit',
                  });
                }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value >= 0 ? '+' : ''}${formatPercent(value)}`,
                  name === 'portfolio' ? 'Portfolio' : 'S&P 500',
                ]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Legend />
              <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="portfolio"
                name="Portfolio"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="spy"
                name="S&P 500"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
