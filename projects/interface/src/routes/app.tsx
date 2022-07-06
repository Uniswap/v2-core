import { lazyImport } from "@/utils/lazyImport";
import { Navigate, Route, Routes } from "react-router-dom";

const { DefaultLayout } = lazyImport(
  () => import("@/components/Layout"),
  "DefaultLayout"
);

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<DefaultLayout />}>
        <Route index element={<Navigate to="/swap" replace={true} />} />
        <Route path="/swap" element={<DefaultLayout />} />
      </Route>
    </Routes>
  );
};
