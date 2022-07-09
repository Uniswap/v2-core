import { Modal, ModalProps } from "../Elements";

export const CurrencySelectModal: React.FC<ModalProps> = (props) => {
  return <Modal className="flex flex-col gap-2 p-4 sm:p-6" {...props}></Modal>;
};
