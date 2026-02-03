import { useAccounts, useSessionStatus } from '../hooks/useAccount';
import { AccountSummary } from '../components/dashboard/AccountSummary';
import { PositionsTable } from '../components/dashboard/PositionsTable';
import { CashBalances } from '../components/dashboard/CashBalances';
import { EquityCurve } from '../components/charts/EquityCurve';
import { PositionTreemap } from '../components/charts/PositionTreemap';
import { LoadingState } from '../components/ui/Spinner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { AlertTriangle, ExternalLink } from 'lucide-react';

export function Dashboard() {
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: sessionStatus, isLoading: sessionLoading } = useSessionStatus();

  const isAuthenticated = sessionStatus?.current?.authenticated;

  if (sessionLoading || accountsLoading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Card className="max-w-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <CardTitle>Authentication Required</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Please log in to the IBKR Client Portal Gateway to access your account data.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Ensure the gateway container is running</li>
              <li>
                Open{' '}
                <a
                  href="https://localhost:5000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  https://localhost:5000
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Log in with your IBKR credentials</li>
              <li>Complete two-factor authentication</li>
              <li>Return to this dashboard</li>
            </ol>
            <p className="text-xs text-muted-foreground">
              Note: You may need to accept the self-signed certificate warning in your browser.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const accountId = accounts?.[0]?.accountId;

  if (!accountId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No accounts found. Please check your IBKR connection.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your Interactive Brokers account
        </p>
      </div>

      {/* Account Summary Cards */}
      <AccountSummary accountId={accountId} />

      {/* Cash Balances & Equity Curve */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CashBalances accountId={accountId} />
        <EquityCurve accountId={accountId} />
      </div>

      {/* Position Treemap */}
      <PositionTreemap accountId={accountId} />

      {/* Top Positions Table */}
      <PositionsTable accountId={accountId} compact />
    </div>
  );
}
