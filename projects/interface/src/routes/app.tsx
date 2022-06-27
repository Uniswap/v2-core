import { lazyImport } from "@/utils/lazyImport";
import { Route, Routes } from "react-router-dom";

const { DefaultLayout } = lazyImport(
  () => import("@/components/Layout"),
  "DefaultLayout"
);

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<DefaultLayout />} />
    </Routes>
  );
};
