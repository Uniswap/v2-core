import { Outlet } from "react-router-dom";
import { ThemeBox } from "../Elements/Layout";

export const DefaultLayout = () => {
  return (
    <ThemeBox className="min-h-screen bg-base-100">
      <Outlet />
    </ThemeBox>
  );
};
