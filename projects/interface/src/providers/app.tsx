import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { BrowserRouter } from "react-router-dom";
import { ErrorFallBack, LoadingFallBack } from "./fallback";

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <Suspense fallback={<LoadingFallBack />}>
      <ErrorBoundary FallbackComponent={ErrorFallBack}>
        <BrowserRouter>{children}</BrowserRouter>
      </ErrorBoundary>
    </Suspense>
  );
};
