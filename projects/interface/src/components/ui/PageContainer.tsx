import React from "react";
import clsx from "clsx";

export const PageContainer: React.VFC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div
      className={clsx("flex flex-col items-center justify-center", className)}
    >
      {children}
    </div>
  );
};
