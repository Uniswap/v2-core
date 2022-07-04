import { accountsSelector } from "@/states/web3/selector";
import { Account } from "@/states/web3/types";
import { ClipboardCopyIcon, ExternalLinkIcon } from "@heroicons/react/outline";
import { useRecoilValue } from "recoil";
import { Modal, ModalProps, ModalTitle } from "../Elements";

const AccountCard: React.FC<{ account: Account }> = ({ account }) => {
  return (
    <div className="p-2 py-4 border-2 card">
      <p className="px-4 text-2xl font-bold">{account.ellipsisAddress}</p>
      <div className="flex gap-1">
        <button className="gap-1 normal-case btn btn-sm btn-ghost">
          <ClipboardCopyIcon className="w-5 h-5" />
          Copy Address
        </button>
        <button className="gap-1 normal-case btn btn-sm btn-ghost">
          <ExternalLinkIcon className="w-5 h-5" />
          View on Explorer
        </button>
      </div>
    </div>
  );
};

export const AccountInfoModal: React.FC<ModalProps> = (props) => {
  const accounts = useRecoilValue(accountsSelector);
  return (
    <Modal className="flex flex-col gap-2 p-4 sm:p-6" {...props}>
      <ModalTitle className="text-lg font-bold">Account</ModalTitle>
      {accounts[0] && <AccountCard account={accounts[0]} />}
      <div className="flex gap-1">
        <button className="grow btn btn-sm">Disconnect</button>
        <button className="grow btn btn-sm">Disconnect</button>
      </div>
    </Modal>
  );
};
