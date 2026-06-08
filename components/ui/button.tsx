import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans font-medium",
    "ring-offset-background transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    "active:scale-[0.97]",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground rounded-xl text-sm",
          "shadow-[0_1px_3px_hsl(200_35%_16%/0.15),0_2px_8px_hsl(200_35%_16%/0.1)]",
          "hover:shadow-[0_4px_12px_hsl(200_35%_16%/0.2),0_8px_20px_hsl(200_35%_16%/0.1)]",
          "hover:-translate-y-[1px] hover:brightness-110",
        ].join(" "),
        destructive: [
          "bg-destructive text-destructive-foreground rounded-xl text-sm",
          "shadow-[0_1px_3px_hsl(0_65%_50%/0.15)]",
          "hover:shadow-[0_4px_12px_hsl(0_65%_50%/0.2)] hover:-translate-y-[1px] hover:brightness-110",
        ].join(" "),
        outline: [
          "border border-border/50 bg-card/80 backdrop-blur-sm text-foreground rounded-xl text-sm",
          "hover:bg-accent hover:text-accent-foreground hover:border-border/70",
          "hover:shadow-[0_2px_8px_hsl(200_35%_16%/0.06)] hover:-translate-y-[0.5px]",
        ].join(" "),
        secondary: [
          "bg-secondary text-secondary-foreground rounded-xl text-sm",
          "hover:bg-secondary/80 hover:shadow-[0_2px_8px_hsl(200_35%_16%/0.06)]",
          "hover:-translate-y-[0.5px]",
        ].join(" "),
        ghost: [
          "text-foreground rounded-xl text-sm",
          "hover:bg-accent/60 hover:text-accent-foreground",
        ].join(" "),
        link: "text-primary underline-offset-4 hover:underline text-sm",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-3.5 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
