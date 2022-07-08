import { memo } from "react";

// eslint-disable-next-line react/display-name
export const NumberInput: React.FC<JSX.IntrinsicElements["input"]> = memo(
  (props) => {
    return (
      <input
        type="text"
        inputMode="decimal"
        pattern="^[0-9]*[.,]?[0-9]*$"
        autoComplete="off"
        autoCorrect="off"
        minLength={1}
        maxLength={79}
        spellCheck="false"
        placeholder="0.0"
        {...props}
      />
    );
  }
);
