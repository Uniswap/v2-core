import { Outlet } from "react-router-dom";
import { ThemeBox } from "../Elements";

export const DefaultLayout = () => {
  return (
    <ThemeBox className="min-h-screen bg-base-100">
      <Outlet />
    </ThemeBox>
  );
};
