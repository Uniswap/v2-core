import React from "react";
import Image from "next/image";

const Header: React.VFC = () => {
  return (
    <div className="navbar sticky top-0">
      <a className="btn btn-ghost normal-case text-xl btn-square btn-lg">
        <Image
          className="rounded-full"
          src="/penta.jpg"
          width={300}
          height={300}
        />
      </a>
    </div>
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
    </div>
  );
};
