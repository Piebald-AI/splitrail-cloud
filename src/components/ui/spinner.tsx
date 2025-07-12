import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const spinnerVariants = cva(
  "animate-spin rounded-full border-2 border-transparent",
  {
    variants: {
      variant: {
        default: "border-t-primary border-r-primary",
        muted: "border-t-muted-foreground border-r-muted-foreground",
        destructive: "border-t-destructive border-r-destructive",
      },
      size: {
        default: "h-6 w-6",
        sm: "h-4 w-4",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  children?: React.ReactNode;
}

function Spinner({
  className,
  variant,
  size,
  children,
  ...props
}: SpinnerProps) {
  return (
    <div className="flex items-center gap-2" {...props}>
      <div
        className={cn(spinnerVariants({ variant, size, className }))}
        aria-label="Loading"
      />
      {children}
    </div>
  );
}

export { Spinner, spinnerVariants };
