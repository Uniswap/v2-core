import "@/assets/styles/global.css";
import React from "react";
import { Web3Provider } from "@inaridiy/useful-web3";
import { DefaultLayout } from "@/components/Layout/DefaultLayout";

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
