import { Spinner } from "@/components/Elements";
import { ThemeBox } from "@/components/Layout";

export const ErrorFallBack = () => {
  return (
    <ThemeBox className="min-h-screen flex justify-center items-center">
      <h2>Some Error Happen!!!</h2>
    </ThemeBox>
  );
};

export const LoadingFallBack = () => {
  return (
    <ThemeBox className="min-h-screen flex justify-center items-center">
      <Spinner size="lg" />
    </ThemeBox>
  );
};
