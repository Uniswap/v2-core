import clsx from "clsx";
import React from "react";

export const PageContainer: React.VFC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div
      className={clsx(
        "flex flex-col justify-center items-center px-4",
        className
      )}
    >
      {children}
    </div>
  );
};
