import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useLedger } from '../../hooks/useAccount';
import { LoadingState } from '../ui/Spinner';
import { formatCurrency } from '../../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CashBalancesProps {
  accountId: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function CashBalances({ accountId }: CashBalancesProps) {
  const { data: ledger, isLoading } = useLedger(accountId);

  if (isLoading) {
    return <LoadingState message="Loading cash balances..." />;
  }

  if (!ledger) {
    return null;
  }

  // Filter out BASE currency summary and prepare chart data
  const currencies = Object.entries(ledger)
    .filter(([currency]) => currency !== 'BASE')
    .map(([currency, data]) => ({
      currency,
      cashBalance: data.cashbalance,
      netliquidationvalue: data.netliquidationvalue,
    }))
    .filter((c) => Math.abs(c.cashBalance) > 0.01)
    .sort((a, b) => Math.abs(b.cashBalance) - Math.abs(a.cashBalance));

  const chartData = currencies.map((c, i) => ({
    name: c.currency,
    value: Math.abs(c.cashBalance),
    actualValue: c.cashBalance,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Balances</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Chart */}
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(_value: number, name: string, props) => [
                    formatCurrency(props.payload.actualValue, name),
                    name,
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* List */}
          <div className="space-y-3">
            {currencies.map((c, i) => (
              <div
                key={c.currency}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="font-medium">{c.currency}</span>
                </div>
                <span
                  className={
                    c.cashBalance >= 0 ? 'text-foreground' : 'text-destructive'
                  }
                >
                  {formatCurrency(c.cashBalance, c.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
