import { MetamaskConnector, useWeb3 } from "@inaridiy/useful-web3";
import clsx from "clsx";
import Image from "next/image";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React from "react";

const Header: React.VFC = () => {
  return (
    <header className="fixed top-0 w-full">
      <div className="gap-4 justify-between mx-auto max-w-screen-lg navbar">
        <a className="btn btn-ghost btn-square btn-lg">
          <Image
            className="rounded-full"
            src="/penta.jpg"
            alt="logo"
            width={300}
            height={300}
          />
        </a>

        <nav className="fixed bottom-2 justify-center w-full sm:static sm:w-auto">
          <Nav />
        </nav>
        <Account />
      </div>
    </header>
  );
};

const Account: React.VFC = () => {
  const { accounts, connectWallet } = useWeb3();
  const name = accounts[0]
    ? `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`
    : null;

  if (name) return <div className="text-lg font-bold">{name}</div>;

  return (
    <button
      className="btn btn-ghost"
      onClick={() => void connectWallet(new MetamaskConnector())}
    >
      Connect Wallet
    </button>
  );
};

const Nav: React.VFC = () => {
  const { pathname } = useRouter();
  return (
    <ul className="p-2 font-bold sm:gap-2 menu bg-base-100 menu-horizontal card">
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
      <div className="grow mt-28 text-base-content">{children}</div>
    </div>
  );
};
