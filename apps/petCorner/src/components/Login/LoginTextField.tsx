// src/pages/Login/components/LoginTextField.tsx
import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

const LoginTextField = forwardRef<HTMLInputElement, Props>(
  ({ error, className, ...props }, ref) => {
    const inputClassName = className ? `login-field__input ${className}` : "login-field__input";

    return (
      <div className={`login-field${error ? " has-error" : ""}`}>
        <input ref={ref} className={inputClassName} {...props} />
        {error ? (
          <small className="login-field__error" role="alert">
            {error}
          </small>
        ) : null}
      </div>
    );
  }
);

LoginTextField.displayName = "LoginTextField";

export default LoginTextField;
