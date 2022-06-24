import { queryClient } from "@/lib/react-query";
import { Web3Provider } from "@inaridiy/useful-web3";
import { QueryClientProvider } from "react-query";
import { RecoilRoot } from "recoil";

type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider: React.VFC<AppProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <RecoilRoot>
        <Web3Provider>{children}</Web3Provider>
      </RecoilRoot>
    </QueryClientProvider>
  );
};
