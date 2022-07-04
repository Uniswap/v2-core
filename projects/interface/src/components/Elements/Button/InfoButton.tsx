import clsx from "clsx";

export const InfoButton: React.FC<JSX.IntrinsicElements["button"]> = ({
  className,
  ...props
}) => {
  return (
    <button
      className={clsx("normal-case btn btn-sm btn-outline", className)}
      {...props}
    />
  );
};
