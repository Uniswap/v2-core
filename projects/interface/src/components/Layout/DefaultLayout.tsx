import { Outlet } from "react-router-dom";
import { Account } from "../Account";
import { IconLink, Logo } from "../Elements";
import { ThemeBox } from "./ThemeBox";

export const Header = () => {
  return (
    <header className="fixed top-0 w-full">
      <div className="gap-4 justify-between mx-auto max-w-screen-lg navbar">
        <IconLink to="/" className="py-0 w-36 sm:w-48">
          <Logo large />
        </IconLink>
        <div className="">
          <Account />
        </div>
      </div>
    </header>
  );
};

export const DefaultLayout = () => {
  return (
    <ThemeBox className="min-h-screen">
      <Header />
      <Outlet />
    </ThemeBox>
  );
};
