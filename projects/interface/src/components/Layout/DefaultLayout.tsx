import { Outlet } from "react-router-dom";
import { ButtonLink, Logo } from "../Elements";
import { ThemeBox } from "./ThemeBox";

export const Header = () => {
  return (
    <header className="fixed top-0 w-full">
      <div className="gap-4 mx-auto max-w-screen-md navbar">
        <ButtonLink to="/">
          <Logo />
        </ButtonLink>
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
