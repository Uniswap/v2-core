import { Outlet } from "react-router-dom";
import { ThemeBox } from "../ThemeBox";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";

export const DefaultLayout = () => {
  return (
    <ThemeBox className="min-h-screen">
      <Header />
      <Outlet />
      <BottomNav />
    </ThemeBox>
  );
};
