import { accountsSelector } from "@/states/web3/selector";
import { useRecoilValue } from "recoil";
import { Modal, ModalProps, ModalTitle } from "../Elements";

export const AccountInfoModal: React.FC<ModalProps> = (props) => {
  const account = useRecoilValue(accountsSelector);
  return (
    <Modal className="flex flex-col gap-2 p-4 sm:p-6" {...props}>
      <ModalTitle className="text-lg font-bold">Account</ModalTitle>
      <div></div>
    </Modal>
  );
};
