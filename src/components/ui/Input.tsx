import React, { useState } from "react";
import styles from "./Input.module.css";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  variant?: "default" | "search";
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  wrapperClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      variant = "default",
      iconLeft,
      iconRight,
      wrapperClassName,
      className,
      id,
      type,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const isPassword = type === "password";
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    return (
      <div
        className={`${styles.wrapper} ${variant === "search" ? styles.search : ""} ${wrapperClassName || ""}`}
      >
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={styles.inputWrapper}>
          {iconLeft && <span className={styles.iconLeft}>{iconLeft}</span>}
          <input
            ref={ref}
            id={inputId}
            className={[
              styles.input,
              error ? styles.inputError : "",
              iconLeft ? styles.hasIconLeft : "",
              iconRight ? styles.hasIconRight : "",
              isPassword ? styles.hasPasswordToggle : "",
              className || "",
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
            type={isPassword ? (isPasswordVisible ? "text" : "password") : type}
          />
          {iconRight && <span className={styles.iconRight}>{iconRight}</span>}
          {isPassword && (
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setIsPasswordVisible((visible) => !visible)}
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
              aria-pressed={isPasswordVisible}
            >
              {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          )}
        </div>
        {error && <span className={styles.errorMessage}>{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.7" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m3.5 3.5 17 17M10.3 6.3A10.8 10.8 0 0 1 12 6c6.1 0 9.5 6 9.5 6a18.3 18.3 0 0 1-3.2 3.9M6.1 8.1A18.1 18.1 0 0 0 2.5 12S5.9 18 12 18c1 0 1.9-.2 2.8-.5" />
      <path d="M9.7 9.7a3.2 3.2 0 0 0 4.6 4.6" />
    </svg>
  );
}
