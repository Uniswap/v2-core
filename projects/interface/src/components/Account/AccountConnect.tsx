import { useModal } from "@/hooks/useModal";
import { InfoButton } from "../Elements";
import { ConnectWalletModal } from "../Modal";

export const AccountConnect = () => {
  const { open, close, isOpen } = useModal();
  return (
    <>
      <ConnectWalletModal open={isOpen} onClose={close} />
      <InfoButton onClick={open}>Connect Wallet</InfoButton>
    </>
  );
};
