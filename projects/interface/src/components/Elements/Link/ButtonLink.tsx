import clsx from "clsx";
import { Link as RouterLink, LinkProps } from "react-router-dom";

export const IconLink: React.FC<LinkProps> = ({
  className,
  children,

  ...props
}) => {
  return (
    <RouterLink className={clsx("px-0 btn btn-ghost", className)} {...props}>
      {children}
    </RouterLink>
  );
};
