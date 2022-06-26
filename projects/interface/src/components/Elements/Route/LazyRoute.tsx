import { Suspense } from "react";
import { Route, RouteProps } from "react-router-dom";
import { Spinner } from "../Loading";

export const LazyRoute: React.FC<
  RouteProps & { fallBack?: React.ReactNode }
> = ({ element, fallBack, ...props }) => {
  return (
    <Route
      {...props}
      element={
        <Suspense fallback={fallBack || <Spinner />}>{element}</Suspense>
      }
    ></Route>
  );
};
