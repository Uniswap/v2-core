import clsx from "clsx";
import React from "react";

export const Card: React.VFC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div className={clsx("shadow-xl bg-base-100 card", className)}>
      {children}
    </div>
  );
};
