import "@/assets/styles/global.css";
import { DefaultLayout } from "@/components/Layout/DefaultLayout";
import React from "react";

import { AppProvider } from "@/providers/app";

function MyApp({
  Component,
  pageProps,
}: {
  Component: React.FC;
  pageProps: any;
}) {
  return (
    <AppProvider>
      <DefaultLayout>
        <Component {...pageProps} />
      </DefaultLayout>
    </AppProvider>
  );
}

export default MyApp;
