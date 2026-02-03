import { useAccounts } from '../hooks/useAccount';
import { PositionsTable } from '../components/dashboard/PositionsTable';
import { AllocationChart } from '../components/charts/AllocationChart';
import { PositionTreemap } from '../components/charts/PositionTreemap';
import { LoadingState } from '../components/ui/Spinner';

export function Positions() {
  const { data: accounts, isLoading } = useAccounts();

  if (isLoading) {
    return <LoadingState message="Loading positions..." />;
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
        <h1 className="text-3xl font-bold">Positions</h1>
        <p className="text-muted-foreground">
          Detailed view of all your holdings and allocations
        </p>
      </div>

      {/* Allocation Charts */}
      <AllocationChart accountId={accountId} />

      {/* Position Treemap */}
      <PositionTreemap accountId={accountId} />

      {/* Full Positions Table */}
      <PositionsTable accountId={accountId} />
    </div>
  );
}
