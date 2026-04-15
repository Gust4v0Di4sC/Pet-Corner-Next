// src/pages/Login/components/LoginTextField.tsx
import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

const LoginTextField = forwardRef<HTMLInputElement, Props>(
  ({ error, ...props }, ref) => {
    return (
      <div style={{ width: "100%" }}>
        <input ref={ref} {...props} />
        {error ? (
          <small style={{ display: "block", marginTop: 6, color: "#ff6b6b" }}>
            {error}
          </small>
        ) : null}
      </div>
    );
  }
);

LoginTextField.displayName = "LoginTextField";

export default LoginTextField;
