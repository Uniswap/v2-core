import { Outlet } from "react-router-dom";
import { ThemeBox } from "../ThemeBox";
import { Header } from "./Header";

export const DefaultLayout = () => {
  return (
    <ThemeBox className="min-h-screen">
      <Header />
      <Outlet />
    </ThemeBox>
  );
};
