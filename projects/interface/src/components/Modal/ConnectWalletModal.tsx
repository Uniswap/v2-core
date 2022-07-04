import { connectMethodNames, connectMethods } from "@/constant/connectMethods";
import { useWeb3 } from "@/hooks";
import { Connector } from "@/libs/connectors";
import { connectorIsValidStates } from "@/states/web3";
import { Suspense } from "react";
import { useRecoilValue } from "recoil";
import { Modal, ModalProps, ModalTitle } from "../Elements";

const ConnectButton: React.FC<{
  name: string;
  symbol: string;
  connector: Connector;
}> = ({ name, symbol, connector }) => {
  const { connectWallet } = useWeb3();
  const isValid = useRecoilValue(
    connectorIsValidStates(name as connectMethodNames)
  );

  return isValid ? (
    <button
      className="justify-start px-0 text-2xl normal-case btn btn-block btn-lg btn-ghost"
      onClick={() => void connectWallet(connector)}
    >
      <img className="aspect-square h-full" src={symbol} />
      {name}
    </button>
  ) : (
    <></>
  );
};

export const ConnectWalletModal: React.FC<ModalProps> = (props) => {
  return (
    <Modal className="flex flex-col gap-2 p-4 sm:p-6" {...props}>
      <ModalTitle className="text-lg font-bold">Connect Wallet</ModalTitle>
      <div className="flex flex-col">
        {Object.values(connectMethods).map(([name, symbol, connector]) => (
          <Suspense key={name}>
            <ConnectButton {...{ name, symbol, connector }} />
          </Suspense>
        ))}
      </div>
    </Modal>
  );
};
