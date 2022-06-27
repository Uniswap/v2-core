import { globalThemeState } from "@/states";
import { useRecoilValue } from "recoil";

export const ThemeBox: React.FC<React.HTMLAttributes<HTMLDivElement>> = (
  props
) => {
  const theme = useRecoilValue(globalThemeState);

  return <div {...props} data-theme={theme} />;
};
