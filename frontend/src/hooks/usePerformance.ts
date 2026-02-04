import { useQuery } from '@tanstack/react-query';
import * as api from '../lib/api-client';

export function usePerformance(accountId: string | undefined, period = '1Y') {
  return useQuery({
    queryKey: ['performance', accountId, period],
    queryFn: () => api.getPerformance(accountId!, period),
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTransactions(accountId: string | undefined, days = 3650) {
  return useQuery({
    queryKey: ['transactions', accountId, days],
    queryFn: () => api.getTransactions(accountId!, days),
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useHistoricalPerformance(accountId: string | undefined) {
  return useQuery({
    queryKey: ['historicalPerformance', accountId],
    queryFn: () => api.getHistoricalPerformance(accountId!),
    enabled: !!accountId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useValueVsInvested(accountId: string | undefined) {
  return useQuery({
    queryKey: ['valueVsInvested', accountId],
    queryFn: () => api.getValueVsInvested(accountId!),
    enabled: !!accountId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useSpyBenchmark(period = '1Y') {
  return useQuery({
    queryKey: ['spyBenchmark', period],
    queryFn: () => api.getSpyBenchmark(period),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
