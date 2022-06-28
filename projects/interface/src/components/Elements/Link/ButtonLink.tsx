import clsx from "clsx";
import { Link as RouterLink, LinkProps } from "react-router-dom";

export const ButtonLink = ({ className, children, ...props }: LinkProps) => {
  return (
    <RouterLink
      className={clsx("btn btn-square btn-ghost btn-lg", className)}
      {...props}
    >
      {children}
    </RouterLink>
  );
};
