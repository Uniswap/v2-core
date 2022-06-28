import { ThemeBox } from "@/components/Layout";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

export type ModalProps = {
  children?: React.ReactNode;
  open: boolean;
  onClose: (state: boolean) => void;
};

export const Modal: React.FC<ModalProps> = ({ children, open, onClose }) => {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={() => onClose(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>
        <ThemeBox
          transparent
          className="flex fixed inset-0 justify-center items-center p-4"
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="overflow-hidden w-full max-w-md rounded-2xl shadow-xl bg-base-100">
              {children}
            </Dialog.Panel>
          </Transition.Child>
        </ThemeBox>
      </Dialog>
    </Transition>
  );
};
