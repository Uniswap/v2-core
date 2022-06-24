import { QueryClient } from "react-query";
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 5 * 60 * 1000,
      retry: 0,
      retryOnMount: false,
      refetchOnMount: false,
    },
  },
});
