import { useCallback, useState } from "react";

export const useModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);
  const open = useCallback(() => setIsOpen(true), []);
  return { isOpen, setIsOpen, close, open };
};
