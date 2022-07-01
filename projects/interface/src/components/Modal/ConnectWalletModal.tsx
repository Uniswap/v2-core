import { connectMethodNames, connectMethods } from "@/constant/connectMethods";
import { useWeb3 } from "@/hooks";
import { Connector } from "@/libs/connectors";
import { connectorIsValidStates } from "@/states/web3";
import { Dialog } from "@headlessui/react";
import { Suspense } from "react";
import { useRecoilValue } from "recoil";
import { Modal, ModalProps } from "../Elements";

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
    <li>
      <button
        className="items-center text-2xl font-bold sm:text-3xl rounded-box"
        onClick={() => void connectWallet(connector)}
      >
        <img className="aspect-square w-12 sm:w-16" src={symbol} />
        {name}
      </button>
    </li>
  ) : (
    <></>
  );
};

export const ConnectWalletModal: React.FC<ModalProps> = (props) => {
  return (
    <Modal className="p-4 sm:p-8" {...props}>
      <Dialog.Title className="mb-4 text-xl font-bold sm:text-3xl">
        Connect Wallet
      </Dialog.Title>
      <div className="menu">
        {Object.values(connectMethods).map(([name, symbol, connector]) => (
          <Suspense key={name}>
            <ConnectButton {...{ name, symbol, connector }} />
          </Suspense>
        ))}
      </div>
    </Modal>
  );
};
