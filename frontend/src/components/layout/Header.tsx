import { TrendingUp, Circle } from 'lucide-react';
import { useSessionStatus } from '../../hooks/useAccount';
import { cn } from '../../lib/utils';

export function Header() {
  const { data: sessionStatus } = useSessionStatus();

  const isConnected = sessionStatus?.current?.authenticated && sessionStatus?.current?.connected;
  const isAuthenticated = sessionStatus?.current?.authenticated;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">IBKR Dashboard</span>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Circle
              className={cn(
                'h-2 w-2 fill-current',
                isConnected
                  ? 'text-green-500'
                  : isAuthenticated
                  ? 'text-yellow-500'
                  : 'text-red-500'
              )}
            />
            <span className="text-muted-foreground">
              {isConnected
                ? 'Connected'
                : isAuthenticated
                ? 'Authenticated (not connected)'
                : 'Not authenticated'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
