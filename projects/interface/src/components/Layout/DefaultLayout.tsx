import React from "react";
import { BsTwitter } from "react-icons/bs";
import Image from "next/image";

const Header: React.VFC = () => {
  return (
    <div className="navbar sticky top-0">
      <a className="btn btn-ghost normal-case text-xl gap-2">
        <div className="w-10 h-10">
          <Image
            className="rounded-full"
            src="/penta.jpg"
            width={300}
            height={300}
          />
        </div>
        Penta
      </a>
    </div>
  );
};

const Footer: React.VFC = () => {
  return (
    <footer className="footer p-10 bg-neutral text-neutral-content">
      <div>
        <p>
          PENTA | Listen to Earn Music Player.
          <br />
          Providing reliable tech since 2022
        </p>
      </div>
    </footer>
  );
};

export const DefaultLayout: React.VFC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div
      className="relative flex min-h-full flex-col bg-base-200 text-base-content transition-all"
      data-theme="lofi"
    >
      <Header />
      <div className="mt-16 text-base-content grow">{children}</div>
      <Footer />
    </div>
  );
};
