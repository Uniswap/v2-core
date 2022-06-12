import { Web3Provider } from "@inaridiy/useful-web3";
import { QueryProvider } from "./QueryProvider";

type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider: React.VFC<AppProviderProps> = ({ children }) => {
  return (
    <QueryProvider>
      <Web3Provider>{children}</Web3Provider>
    </QueryProvider>
  );
};
