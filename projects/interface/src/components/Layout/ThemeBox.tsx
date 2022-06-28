import { globalThemeState } from "@/states";
import clsx from "clsx";
import { useRecoilValue } from "recoil";

export const ThemeBox: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { transparent?: boolean }
> = ({ className, transparent, ...props }) => {
  const theme = useRecoilValue(globalThemeState);

  return (
    <div
      className={clsx(transparent && "bg-transparent", className)}
      {...props}
      data-theme={theme}
    />
  );
};
