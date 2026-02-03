import { useQuery } from '@tanstack/react-query';
import * as api from '../lib/api-client';

export function usePositions(accountId: string | undefined) {
  return useQuery({
    queryKey: ['positions', accountId],
    queryFn: () => api.getPositions(accountId!),
    enabled: !!accountId,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useAllocation(accountId: string | undefined) {
  return useQuery({
    queryKey: ['allocation', accountId],
    queryFn: () => api.getAllocation(accountId!),
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
