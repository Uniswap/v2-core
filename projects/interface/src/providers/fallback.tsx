import { Spinner } from "@/components/Elements";
import { ThemeBox } from "@/components/Layout";

export const ErrorFallBack = () => {
  return (
    <ThemeBox className="flex justify-center items-center min-h-screen">
      <h2>Some Error Happen!!!</h2>
    </ThemeBox>
  );
};

export const LoadingFallBack = () => {
  return (
    <ThemeBox className="flex justify-center items-center min-h-screen">
      <Spinner size="lg" />
    </ThemeBox>
  );
};
