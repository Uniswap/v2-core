import { useModal, useWeb3 } from "@/hooks";
import { InfoButton } from "../Elements";
import { AccountModal } from "../Modal";

export const Account: React.FC = () => {
  const { isConnected, accounts } = useWeb3();
  const { isOpen, close, open } = useModal();
  return (
    <>
      <AccountModal open={isOpen} onClose={close} />
      {isConnected ? (
        <InfoButton onClick={open}>{accounts[0].ellipsisAddress}</InfoButton>
      ) : (
        <InfoButton onClick={open}>Connect Wallet</InfoButton>
      )}
    </>
  );
};
