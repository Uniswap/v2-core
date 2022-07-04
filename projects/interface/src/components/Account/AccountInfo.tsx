import { useWeb3 } from "@/hooks";
import { useModal } from "@/hooks/useModal";
import { InfoButton } from "../Elements";
import { AccountInfoModal } from "../Modal";

export const AccountInfo: React.FC = () => {
  const { accounts } = useWeb3();
  const { isOpen, close, open } = useModal();
  return (
    <>
      <AccountInfoModal open={isOpen} onClose={close} />
      <InfoButton className="btn btn-sm" onClick={open}>
        {accounts[0].ellipsisAddress}
      </InfoButton>
    </>
  );
};
