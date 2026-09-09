import React from "react";
import { Icon } from "@/components/ui/icon";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, required, options, placeholder = "Select...", className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="text-sm font-semibold text-espresso dark:text-cream">
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`w-full px-3 py-2 text-sm border rounded-lg bg-card dark:bg-card text-espresso dark:text-cream border-border dark:border-border transition appearance-none focus:outline-none focus:ring-2 focus:ring-ember dark:focus:ring-ember/80 ${
              error ? "border-error dark:border-error" : "border-border dark:border-border"
            } ${className}`}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Icon
            name="chevron-down"
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
        </div>
        {error && <p className="text-xs text-error dark:text-error">{error}</p>}
        {hint && !error && <p className="text-xs text-text-muted dark:text-text-muted">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
