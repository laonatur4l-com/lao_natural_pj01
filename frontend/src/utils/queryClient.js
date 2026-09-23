import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // Data stays fresh for 30 seconds
      gcTime: 1000 * 60 * 5, // Cache garbage collected after 5 minutes
      refetchOnWindowFocus: true, // Auto refetch when user switches back to tab
      retry: 1,
    },
  },
});

export default queryClient;
