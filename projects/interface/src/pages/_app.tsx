import "@/assets/styles/global.css";
import { DefaultLayout } from "@/components/Layout/DefaultLayout";
import { Web3Provider } from "@inaridiy/useful-web3";
import React from "react";
import { QueryClient, QueryClientProvider } from "react-query";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 0 } }
});

function MyApp({
  Component,
  pageProps
}: {
  Component: React.FC;
  pageProps: any;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <Web3Provider>
        <DefaultLayout>
          <Component {...pageProps} />
        </DefaultLayout>
      </Web3Provider>
    </QueryClientProvider>
  );
}

export default MyApp;
