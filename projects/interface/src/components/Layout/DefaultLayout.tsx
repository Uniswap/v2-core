import { Outlet } from "react-router-dom";
import { ThemeBox } from "./ThemeBox";

export const DefaultLayout = () => {
  return (
    <ThemeBox className="min-h-screen">
      <Outlet />
    </ThemeBox>
  );
};
