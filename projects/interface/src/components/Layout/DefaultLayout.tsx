import clsx from "clsx";
import Image from "next/image";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React from "react";

const Header: React.VFC = () => {
  return (
    <div className="top-0 gap-4 justify-between navbar">
      <a className="btn btn-ghost btn-square btn-lg">
        <Image
          className="rounded-full"
          src="/penta.jpg"
          alt="logo"
          width={300}
          height={300}
        />
      </a>

      <nav className="flex fixed bottom-2 justify-center w-full sm:static sm:w-auto">
        <Nav />
      </nav>
    </div>
  );
};

const Nav: React.VFC = () => {
  const { pathname } = useRouter();
  return (
    <ul className="p-1 font-bold sm:gap-2 menu bg-base-100 menu-horizontal card">
      <li>
        <NextLink href="/swap">
          <a
            className={clsx(
              pathname === "/swap" && "bg-secondary text-secondary-content"
            )}
          >
            Swap
          </a>
        </NextLink>
      </li>
      <li>
        <NextLink href="/pool">
          <a
            className={clsx(
              pathname === "/pool" && "bg-secondary text-secondary-content"
            )}
          >
            Pool
          </a>
        </NextLink>
      </li>
      <li>
        <a>Penta</a>
      </li>
    </ul>
  );
};

export const DefaultLayout: React.VFC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div
      className="flex relative flex-col min-h-full transition-all bg-base-200 text-base-content"
      data-theme="light"
    >
      <Header />
      <div className="grow mt-16 text-base-content">{children}</div>
    </div>
  );
};
