import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallBack, LoadingFallBack } from "./fallback";

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <Suspense fallback={<LoadingFallBack />}>
      <ErrorBoundary FallbackComponent={ErrorFallBack}>
        {children}
      </ErrorBoundary>
    </Suspense>
  );
};
