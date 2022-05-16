import "@/assets/styles/global.css";
import { DefaultLayout } from "@/components/Layout/DefaultLayout";
import { Web3Provider } from "@inaridiy/useful-web3";
import React from "react";

function MyApp({
  Component,
  pageProps,
}: {
  Component: React.FC;
  pageProps: any;
}) {
  return (
    <Web3Provider>
      <DefaultLayout>
        <Component {...pageProps} />
      </DefaultLayout>
    </Web3Provider>
  );
}

export default MyApp;
