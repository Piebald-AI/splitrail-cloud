import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const codeVariants = cva("relative rounded font-mono text-sm", {
  variants: {
    variant: {
      default: "bg-muted px-[0.3rem] py-[0.2rem]",
      outline: "border bg-background px-[0.3rem] py-[0.2rem]",
      inline: "bg-muted px-1 py-0.5 text-xs",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface CodeProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof codeVariants> {}

function Code({ className, variant, ...props }: CodeProps) {
  return (
    <code className={cn(codeVariants({ variant, className }))} {...props} />
  );
}

export { Code, codeVariants };
