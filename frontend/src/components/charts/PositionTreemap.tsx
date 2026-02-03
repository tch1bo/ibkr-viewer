import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { usePositions } from '../../hooks/usePositions';
import { LoadingState } from '../ui/Spinner';
import { formatCurrency, formatPercent } from '../../lib/utils';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';

interface PositionTreemapProps {
  accountId: string;
}

interface TreemapData {
  name: string;
  size: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  ticker: string;
}

const COLORS = {
  positive: ['#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e'],
  negative: ['#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444'],
  neutral: '#e5e7eb',
};

function getColor(pnlPercent: number): string {
  if (Math.abs(pnlPercent) < 1) return COLORS.neutral;

  const colors = pnlPercent > 0 ? COLORS.positive : COLORS.negative;
  const absPercent = Math.abs(pnlPercent);

  if (absPercent < 5) return colors[0];
  if (absPercent < 10) return colors[1];
  if (absPercent < 20) return colors[2];
  if (absPercent < 50) return colors[3];
  return colors[4];
}

function CustomTreemapContent(props: {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  value: number;
  pnlPercent: number;
  ticker: string;
}) {
  const { x, y, width, height, ticker, pnlPercent } = props;

  if (width < 40 || height < 30) {
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={getColor(pnlPercent)}
          stroke="#fff"
          strokeWidth={2}
        />
      </g>
    );
  }

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={getColor(pnlPercent)}
        stroke="#fff"
        strokeWidth={2}
      />
      <text
        x={x + width / 2}
        y={y + height / 2 - 6}
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-bold fill-foreground"
      >
        {ticker}
      </text>
      <text
        x={x + width / 2}
        y={y + height / 2 + 8}
        textAnchor="middle"
        dominantBaseline="central"
        className={`text-xs ${pnlPercent >= 0 ? 'fill-green-700' : 'fill-red-700'}`}
      >
        {pnlPercent >= 0 ? '+' : ''}
        {pnlPercent.toFixed(1)}%
      </text>
    </g>
  );
}

export function PositionTreemap({ accountId }: PositionTreemapProps) {
  const { data: positions, isLoading } = usePositions(accountId);

  if (isLoading) {
    return <LoadingState message="Loading positions..." />;
  }

  if (!positions?.length) {
    return null;
  }

  const treeData: TreemapData[] = positions
    .filter((p) => p.mktValue > 0)
    .map((p) => {
      const pnlPercent =
        p.avgPrice > 0 ? ((p.mktPrice - p.avgPrice) / p.avgPrice) * 100 : 0;
      return {
        name: p.name || p.ticker,
        size: p.mktValue,
        value: p.mktValue,
        pnl: p.unrealizedPnl,
        pnlPercent,
        ticker: p.ticker,
      };
    })
    .sort((a, b) => b.size - a.size);

  const totalValue = treeData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Position Sizes & Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treeData}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="#fff"
              content={<CustomTreemapContent x={0} y={0} width={0} height={0} name="" value={0} pnlPercent={0} ticker="" />}
            >
              <Tooltip
                content={({ payload }) => {
                  if (!payload?.[0]) return null;
                  const data = payload[0].payload as TreemapData;
                  const portfolioPercent = (data.value / totalValue) * 100;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-lg">
                      <div className="font-bold">{data.ticker}</div>
                      <div className="text-sm text-muted-foreground">{data.name}</div>
                      <div className="mt-2 space-y-1 text-sm">
                        <div>Value: {formatCurrency(data.value)}</div>
                        <div>Portfolio: {formatPercent(portfolioPercent)}</div>
                        <div
                          className={
                            data.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                          }
                        >
                          P&L: {data.pnl >= 0 ? '+' : ''}
                          {formatCurrency(data.pnl)} ({data.pnlPercent >= 0 ? '+' : ''}
                          {formatPercent(data.pnlPercent)})
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {COLORS.negative.map((color, i) => (
                <div
                  key={i}
                  className="h-4 w-4"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-muted-foreground">Loss</span>
          </div>
          <div
            className="h-4 w-4"
            style={{ backgroundColor: COLORS.neutral }}
          />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Gain</span>
            <div className="flex gap-0.5">
              {COLORS.positive.map((color, i) => (
                <div
                  key={i}
                  className="h-4 w-4"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
