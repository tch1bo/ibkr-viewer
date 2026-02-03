import { useQuery } from '@tanstack/react-query';
import * as api from '../lib/api-client';

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: api.getAccounts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAccountSummary(accountId: string | undefined) {
  return useQuery({
    queryKey: ['accountSummary', accountId],
    queryFn: () => api.getAccountSummary(accountId!),
    enabled: !!accountId,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useLedger(accountId: string | undefined) {
  return useQuery({
    queryKey: ['ledger', accountId],
    queryFn: () => api.getLedger(accountId!),
    enabled: !!accountId,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useSessionStatus() {
  return useQuery({
    queryKey: ['sessionStatus'],
    queryFn: api.getSessionStatus,
    refetchInterval: 30 * 1000, // 30 seconds
  });
}
