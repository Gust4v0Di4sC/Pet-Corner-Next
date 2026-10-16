// src/pages/Login/components/LoginTextField.tsx
import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label: string;
};

const LoginTextField = forwardRef<HTMLInputElement, Props>(
  ({ error, label, className, id, name, ...props }, ref) => {
    const inputClassName = className ? `login-field__input ${className}` : "login-field__input";
    const inputId = id || `login-${name}`;
    const errorId = `${inputId}-error`;

    return (
      <div className={`login-field${error ? " has-error" : ""}`}>
        <label htmlFor={inputId} className="login-field__label">{label}</label>
        <input ref={ref} id={inputId} name={name} className={inputClassName} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} {...props} />
        {error ? (
          <small id={errorId} className="login-field__error" role="alert">
            {error}
          </small>
        ) : null}
      </div>
    );
  }
);

LoginTextField.displayName = "LoginTextField";

export default LoginTextField;
