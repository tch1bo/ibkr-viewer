import { useQuery } from '@tanstack/react-query';
import * as api from '../lib/api-client';

export function useHistoricalData(conid: number | undefined, period = '1Y', bar = '1d') {
  return useQuery({
    queryKey: ['historicalData', conid, period, bar],
    queryFn: () => api.getHistoricalData(conid!, period, bar),
    enabled: !!conid,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
