import { connectMethods } from "@/constant/connectMethods";
import { useWeb3 } from "@/hooks";
import { Dialog } from "@headlessui/react";
import { Modal, ModalProps } from "../Elements";

export const ConnectWalletModal: React.FC<ModalProps> = (props) => {
  const { connectWallet } = useWeb3();
  return (
    <Modal className="modal-box" {...props}>
      <Dialog.Title className="mb-4 text-xl font-bold sm:text-3xl">
        Connect Wallet
      </Dialog.Title>
      <div className="menu">
        {connectMethods.map(([name, symbol, connector]) => (
          <li key={name}>
            <button
              className="items-center text-2xl font-bold sm:text-3xl rounded-box"
              onClick={() => void connectWallet(connector)}
            >
              <img className="aspect-square w-12 sm:w-16" src={symbol} />
              {name}
            </button>
          </li>
        ))}
      </div>
    </Modal>
  );
};
