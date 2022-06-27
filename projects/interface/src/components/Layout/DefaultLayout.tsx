import { Outlet } from "react-router-dom";

export const DefaultLayout = () => {
  return (
    <div className="min-h-screen bg-base-100">
      <Outlet />
    </div>
  );
};
