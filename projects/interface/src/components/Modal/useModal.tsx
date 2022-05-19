import { ReactNode, useCallback, useState } from "react";
import { ModalBase } from "./Modal";

export const useModal = (nodeFunc: (toggle: () => void) => ReactNode) => {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(!open);

  const Modal = useCallback(
    () => (
      <ModalBase open={open} onChange={setOpen}>
        {nodeFunc(toggle)}
      </ModalBase>
    ),
    [open, nodeFunc]
  );

  return { open, setOpen, toggle, Modal };
};
