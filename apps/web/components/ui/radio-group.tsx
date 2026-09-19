"use client";

import React from "react";

interface RadioGroupContextType {
  value: string | undefined;
  onChange: (value: string) => void;
}

const RadioGroupContext = React.createContext<RadioGroupContextType | undefined>(undefined);

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ value, onValueChange, className, ...props }, ref) => (
    <RadioGroupContext.Provider value={{ value, onChange: onValueChange || (() => {}) }}>
      <div ref={ref} className={`grid gap-2 ${className}`} {...props} />
    </RadioGroupContext.Provider>
  )
);
RadioGroup.displayName = "RadioGroup";

interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ value, className, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext);
    return (
      <input
        ref={ref}
        type="radio"
        value={value}
        checked={context?.value === value}
        onChange={(e) => context?.onChange(e.target.value)}
        className={`h-4 w-4 rounded-full border-gray-300 text-blue-600 focus:border-blue-500 focus:ring-blue-500 ${className}`}
        {...props}
      />
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
