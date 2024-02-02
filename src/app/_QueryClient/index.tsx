'use client'

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function QueryClientProvide({
    children,
}: {
    children: React.ReactNode
}){
    const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 60,
            cacheTime: 1000 * 60 * 60 + 1,
            refetchOnWindowFocus: false,
            retry: 2,
            onError: (err) => {
              alert((err as Error).message);
            },
          },
        },
    });

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}