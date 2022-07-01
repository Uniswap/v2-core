import { useModal } from "@/hooks/useModal";
import { ConnectWalletModal } from "../Modal";

export const AccountConnect = () => {
  const { open, close, isOpen } = useModal();
  return (
    <>
      <ConnectWalletModal open={isOpen} onClose={close} />
      <button className="btn btn-outline" onClick={open}>
        Connect Wallet
      </button>
    </>
  );
};
