import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/Table';
import { Badge } from '../ui/Badge';
import { usePositions } from '../../hooks/usePositions';
import { LoadingState } from '../ui/Spinner';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  getPnLColor,
  getChangeIndicator,
} from '../../lib/utils';
import { ArrowUpDown, Search } from 'lucide-react';
import type { Position } from '../../types';

interface PositionsTableProps {
  accountId: string;
  compact?: boolean;
}

type SortField = 'ticker' | 'mktValue' | 'unrealizedPnl' | 'pnlPercent';
type SortDirection = 'asc' | 'desc';

export function PositionsTable({ accountId, compact = false }: PositionsTableProps) {
  const { data: positions, isLoading, error } = usePositions(accountId);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('mktValue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filteredAndSorted = useMemo(() => {
    if (!positions) return [];

    let filtered = positions.filter(
      (p) =>
        p.ticker?.toLowerCase().includes(search.toLowerCase()) ||
        p.name?.toLowerCase().includes(search.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aVal: number, bVal: number;

      switch (sortField) {
        case 'ticker':
          return sortDirection === 'asc'
            ? (a.ticker || '').localeCompare(b.ticker || '')
            : (b.ticker || '').localeCompare(a.ticker || '');
        case 'mktValue':
          aVal = a.mktValue;
          bVal = b.mktValue;
          break;
        case 'unrealizedPnl':
          aVal = a.unrealizedPnl;
          bVal = b.unrealizedPnl;
          break;
        case 'pnlPercent':
          aVal = a.avgCost > 0 ? ((a.mktPrice - a.avgPrice) / a.avgPrice) * 100 : 0;
          bVal = b.avgCost > 0 ? ((b.mktPrice - b.avgPrice) / b.avgPrice) * 100 : 0;
          break;
        default:
          return 0;
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return compact ? filtered.slice(0, 10) : filtered;
  }, [positions, search, sortField, sortDirection, compact]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading positions..." />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-destructive">
            Failed to load positions. Please check your connection.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalValue = positions?.reduce((sum, p) => sum + p.mktValue, 0) ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{compact ? 'Top Positions' : 'All Positions'}</CardTitle>
        {!compact && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search positions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-64 rounded-md border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort('ticker')}
              >
                <div className="flex items-center gap-1">
                  Symbol
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Price</TableHead>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => toggleSort('mktValue')}
              >
                <div className="flex items-center justify-end gap-1">
                  Value
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="text-right">% Portfolio</TableHead>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => toggleSort('unrealizedPnl')}
              >
                <div className="flex items-center justify-end gap-1">
                  P&L
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => toggleSort('pnlPercent')}
              >
                <div className="flex items-center justify-end gap-1">
                  P&L %
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSorted.map((position) => (
              <PositionRow
                key={position.conid}
                position={position}
                portfolioValue={totalValue}
              />
            ))}
          </TableBody>
        </Table>
        {compact && positions && positions.length > 10 && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Showing top 10 of {positions.length} positions
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function PositionRow({
  position,
  portfolioValue,
}: {
  position: Position;
  portfolioValue: number;
}) {
  const pnlPercent =
    position.avgPrice > 0
      ? ((position.mktPrice - position.avgPrice) / position.avgPrice) * 100
      : 0;

  const portfolioPercent = portfolioValue > 0 ? (position.mktValue / portfolioValue) * 100 : 0;

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{position.ticker}</span>
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {position.name}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={position.position > 0 ? 'success' : 'destructive'}>
          {formatNumber(position.position, 0)}
        </Badge>
      </TableCell>
      <TableCell>{formatCurrency(position.mktPrice, position.currency)}</TableCell>
      <TableCell className="text-right font-medium">
        {formatCurrency(position.mktValue, position.currency)}
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
        {formatPercent(portfolioPercent)}
      </TableCell>
      <TableCell className={`text-right ${getPnLColor(position.unrealizedPnl)}`}>
        {getChangeIndicator(position.unrealizedPnl)}
        {formatCurrency(Math.abs(position.unrealizedPnl), position.currency)}
      </TableCell>
      <TableCell className={`text-right ${getPnLColor(pnlPercent)}`}>
        {getChangeIndicator(pnlPercent)}
        {formatPercent(Math.abs(pnlPercent))}
      </TableCell>
    </TableRow>
  );
}
