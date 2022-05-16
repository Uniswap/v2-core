import { ReactNode, useState } from "react";
import { ModalBase } from "./Modal";

export const useModal = (node: ReactNode) => {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(!open);
  const Modal = () => (
    <ModalBase open={open} onChange={setOpen}>
      {node}
    </ModalBase>
  );

  return { open, setOpen, toggle, Modal };
};
