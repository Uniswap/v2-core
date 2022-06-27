import { Spinner } from "@/components/Elements";

export const ErrorFallBack = () => {
  return <div></div>;
};

export const LoadingFallBack = () => {
  return (
    <div className="min-h-screen flex justify-center items-center">
      <Spinner size="lg" />
    </div>
  );
};
