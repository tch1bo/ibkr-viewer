import { useState, useMemo } from 'react';
import { useAccounts } from '../hooks/useAccount';
import { useTransactions } from '../hooks/usePerformance';
import { LoadingState } from '../components/ui/Spinner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { formatCurrency, formatNumber, formatDate, getPnLColor } from '../lib/utils';
import { Search, Filter } from 'lucide-react';

const TRANSACTION_TYPES: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' }> = {
  BUY: { label: 'Buy', variant: 'success' },
  SELL: { label: 'Sell', variant: 'destructive' },
  DIV: { label: 'Dividend', variant: 'secondary' },
  INT: { label: 'Interest', variant: 'secondary' },
  DEP: { label: 'Deposit', variant: 'default' },
  WD: { label: 'Withdrawal', variant: 'default' },
  FEE: { label: 'Fee', variant: 'destructive' },
  COMM: { label: 'Commission', variant: 'destructive' },
};

export function Transactions() {
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const accountId = accounts?.[0]?.accountId;
  const { data: transactions, isLoading: transactionsLoading } = useTransactions(accountId, 3650);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    return transactions
      .filter((t) => {
        const matchesSearch =
          search === '' ||
          t.desc?.toLowerCase().includes(search.toLowerCase()) ||
          t.type?.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === '' || t.type === typeFilter;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, search, typeFilter]);

  // Calculate summary stats
  const stats = useMemo(() => {
    if (!transactions) return null;

    const buys = transactions.filter((t) => t.type === 'BUY');
    const sells = transactions.filter((t) => t.type === 'SELL');
    const dividends = transactions.filter((t) => t.type === 'DIV');

    return {
      totalTransactions: transactions.length,
      totalBuys: buys.length,
      totalSells: sells.length,
      totalDividends: dividends.reduce((sum, t) => sum + t.amount, 0),
      totalCommissions: transactions.reduce((sum, t) => sum + Math.abs(t.commission || 0), 0),
    };
  }, [transactions]);

  if (accountsLoading || transactionsLoading) {
    return <LoadingState message="Loading transactions..." />;
  }

  if (!accountId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No accounts found. Please check your IBKR connection.
      </div>
    );
  }

  const uniqueTypes = [...new Set(transactions?.map((t) => t.type) || [])];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-muted-foreground">
          View your trading history and transaction details
        </p>
      </div>

      {/* Summary Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Buy Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalBuys}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sell Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.totalSells}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Dividends Received
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalDividends)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Commissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.totalCommissions)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transaction History</CardTitle>
          <div className="flex gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-64 rounded-md border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-9 w-40 rounded-md border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
              >
                <option value="">All Types</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {TRANSACTION_TYPES[type]?.label || type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Commission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction, index) => {
                const typeInfo = TRANSACTION_TYPES[transaction.type] || {
                  label: transaction.type,
                  variant: 'secondary' as const,
                };

                return (
                  <TableRow key={`${transaction.date}-${transaction.conid}-${index}`}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(transaction.date)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {transaction.desc}
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.qty !== 0 ? formatNumber(transaction.qty, 0) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.price > 0
                        ? formatCurrency(transaction.price, transaction.currency)
                        : '-'}
                    </TableCell>
                    <TableCell className={`text-right ${getPnLColor(transaction.amount)}`}>
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {transaction.commission !== 0
                        ? formatCurrency(Math.abs(transaction.commission), transaction.currency)
                        : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredTransactions.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              No transactions found matching your criteria
            </p>
          )}

          <p className="mt-4 text-sm text-muted-foreground">
            Showing {filteredTransactions.length} of {transactions?.length || 0} transactions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
