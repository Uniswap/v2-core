import "@/assets/styles/global.css";
import React from "react";
import { Web3Provider } from "@inaridiy/useful-web3";

function MyApp({
  Component,
  pageProps,
}: {
  Component: React.FC;
  pageProps: any;
}) {
  return (
    <Web3Provider>
      <Component {...pageProps} />
    </Web3Provider>
  );
}

export default MyApp;
