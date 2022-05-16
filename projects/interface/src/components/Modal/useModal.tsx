import { ReactNode, useCallback, useState } from "react";
import { ModalBase } from "./Modal";

export const useModal = (node: ReactNode) => {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(!open);
  const Modal = useCallback(
    () => (
      <ModalBase open={open} onChange={setOpen}>
        {node}
      </ModalBase>
    ),
    [open, node]
  );

  return { open, setOpen, toggle, Modal };
};
