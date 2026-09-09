import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, required, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="text-sm font-semibold text-espresso dark:text-cream">
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-3 py-2 text-sm border rounded-lg bg-card dark:bg-card text-espresso dark:text-cream placeholder-text-muted dark:placeholder-text-muted/60 border-border dark:border-border transition focus:outline-none focus:ring-2 focus:ring-ember dark:focus:ring-ember/80 ${
            error ? "border-error dark:border-error" : "border-border dark:border-border"
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-error dark:text-error">{error}</p>}
        {hint && !error && <p className="text-xs text-text-muted dark:text-text-muted">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
