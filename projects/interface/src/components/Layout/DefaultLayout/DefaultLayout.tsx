import { Outlet } from "react-router-dom";
import { ThemeBox } from "../ThemeBox";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";

export const DefaultLayout = () => {
  return (
    <ThemeBox className="min-h-screen">
      <Header />
      <div className="flex flex-col items-center py-24 h-full">
        <Outlet />
      </div>
      <BottomNav />
    </ThemeBox>
  );
};
