import React from "react";
import { Icon } from "@/components/ui/icon";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        <label className="flex items-center gap-2 cursor-pointer group">
          <div className="relative">
            <input
              ref={ref}
              type="checkbox"
              className="sr-only"
              {...props}
            />
            <div className="w-5 h-5 border-2 border-border dark:border-border rounded-md bg-card dark:bg-card group-hover:border-ember dark:group-hover:border-ember/80 transition flex items-center justify-center group-has-[:checked]:border-ember dark:group-has-[:checked]:border-ember group-has-[:checked]:bg-ember dark:group-has-[:checked]:bg-ember">
              <Icon
                name="check"
                size={14}
                className="text-cream opacity-0 group-has-[:checked]:opacity-100 transition"
              />
            </div>
          </div>
          {label && <span className="text-sm text-espresso dark:text-cream">{label}</span>}
        </label>
        {error && <p className="text-xs text-error dark:text-error ml-7">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
