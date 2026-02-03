import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { useValueVsInvested } from '../../hooks/usePerformance';
import { LoadingState } from '../ui/Spinner';
import { formatCurrency, formatCompactNumber } from '../../lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ValueVsInvestedChartProps {
  accountId: string;
}

export function ValueVsInvestedChart({ accountId }: ValueVsInvestedChartProps) {
  const { data, isLoading } = useValueVsInvested(accountId);

  if (isLoading) {
    return <LoadingState message="Loading investment data..." />;
  }

  if (!data || !data.months.length) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No investment history available. Data will accumulate over time as you use the dashboard.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.months.map((month, i) => ({
    month,
    portfolioValue: data.portfolioValues[i],
    amountInvested: data.amountInvested[i],
    gain: data.portfolioValues[i] - data.amountInvested[i],
  }));

  const latestValue = chartData[chartData.length - 1]?.portfolioValue || 0;
  const latestInvested = chartData[chartData.length - 1]?.amountInvested || 0;
  const totalGain = latestValue - latestInvested;
  const gainPercent = latestInvested > 0 ? (totalGain / latestInvested) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Portfolio Value vs Amount Invested</CardTitle>
            <CardDescription>
              Monthly comparison of your portfolio worth versus total money invested
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {formatCurrency(latestValue)}
            </div>
            <div
              className={`text-sm ${
                totalGain >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {totalGain >= 0 ? '+' : ''}
              {formatCurrency(totalGain)} ({totalGain >= 0 ? '+' : ''}
              {gainPercent.toFixed(1)}%)
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                tickFormatter={(month) => {
                  const [year, m] = month.split('-');
                  return `${m}/${year.slice(2)}`;
                }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => formatCompactNumber(v)}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'portfolioValue' ? 'Portfolio Value' : 'Amount Invested',
                ]}
                labelFormatter={(label) => {
                  const [year, month] = label.split('-');
                  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(
                    'en-US',
                    { month: 'long', year: 'numeric' }
                  );
                }}
              />
              <Legend
                formatter={(value) =>
                  value === 'portfolioValue' ? 'Portfolio Value' : 'Amount Invested'
                }
              />
              <Area
                type="monotone"
                dataKey="portfolioValue"
                name="portfolioValue"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorValue)"
              />
              <Area
                type="monotone"
                dataKey="amountInvested"
                name="amountInvested"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorInvested)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Current Value</div>
            <div className="text-xl font-bold">{formatCurrency(latestValue)}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Total Invested</div>
            <div className="text-xl font-bold">{formatCurrency(latestInvested)}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Total Gain/Loss</div>
            <div
              className={`text-xl font-bold ${
                totalGain >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {totalGain >= 0 ? '+' : ''}
              {formatCurrency(totalGain)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
