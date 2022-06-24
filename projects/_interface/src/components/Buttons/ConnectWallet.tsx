import { getConnector } from "@/lib/getConnector";
import { useWeb3 } from "@inaridiy/useful-web3";
import React from "react";

export const ConnectWallet: React.VFC<{
  className?: string;
  children?: React.ReactNode;
}> = ({ className, children }) => {
  const { connectWallet } = useWeb3();
  return (
    <button
      className={className}
      onClick={() => void connectWallet(getConnector())}
    >
      {children ? children : "Connect Wallet"}
    </button>
  );
};
