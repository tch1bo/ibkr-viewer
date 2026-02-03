import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useAllocation } from '../../hooks/usePositions';
import { LoadingState } from '../ui/Spinner';
import { formatPercent } from '../../lib/utils';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface AllocationChartProps {
  accountId: string;
}

const ASSET_COLORS: Record<string, string> = {
  STK: '#3b82f6',   // Stocks - blue
  OPT: '#10b981',   // Options - green
  FUT: '#f59e0b',   // Futures - amber
  CASH: '#8b5cf6',  // Cash - purple
  BOND: '#ec4899',  // Bonds - pink
  FOP: '#ef4444',   // Future options - red
  WAR: '#6366f1',   // Warrants - indigo
  FUND: '#14b8a6',  // Funds - teal
};

const SECTOR_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#84cc16',
  '#06b6d4', '#a855f7',
];

export function AllocationChart({ accountId }: AllocationChartProps) {
  const { data: allocation, isLoading } = useAllocation(accountId);

  if (isLoading) {
    return <LoadingState message="Loading allocation..." />;
  }

  if (!allocation) {
    return null;
  }

  // Asset class data
  const assetClassData = Object.entries(allocation.assetClass.long)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name: getAssetClassName(name),
      value: value * 100,
      color: ASSET_COLORS[name] || '#94a3b8',
    }))
    .sort((a, b) => b.value - a.value);

  // Sector data
  const sectorData = Object.entries(allocation.sector.long)
    .filter(([_, value]) => value > 0)
    .map(([name, value], index) => ({
      name: name || 'Other',
      value: value * 100,
      color: SECTOR_COLORS[index % SECTOR_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 sectors

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Asset Class Allocation */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Class Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetClassData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${formatPercent(value)}`}
                  labelLine={false}
                >
                  {assetClassData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatPercent(value)}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Sector Allocation */}
      <Card>
        <CardHeader>
          <CardTitle>Sector Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sectorData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => formatPercent(v)}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={90}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={(value: number) => formatPercent(value)} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getAssetClassName(code: string): string {
  const names: Record<string, string> = {
    STK: 'Stocks',
    OPT: 'Options',
    FUT: 'Futures',
    CASH: 'Cash',
    BOND: 'Bonds',
    FOP: 'Fut Options',
    WAR: 'Warrants',
    FUND: 'Funds',
  };
  return names[code] || code;
}
