import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-md hover:bg-primary-hover hover:shadow-lg",
        destructive: "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 hover:shadow-lg",
        outline: "border-2 border-input bg-background hover:bg-muted hover:border-primary/30",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-muted",
        link: "text-primary underline-offset-4 hover:underline",
        // Emergency variants
        emergency: "bg-primary text-primary-foreground shadow-glow hover:shadow-xl pulse-emergency min-h-[56px] text-base font-bold",
        hero: "bg-primary text-primary-foreground shadow-lg hover:shadow-glow hover:scale-[1.02] min-h-[52px] text-base",
        "hero-outline": "border-2 border-primary text-primary bg-background/80 backdrop-blur-sm hover:bg-primary/10 min-h-[52px] text-base",
        // Medical/trust variants  
        trust: "bg-secondary text-secondary-foreground shadow-md hover:shadow-lg",
        success: "bg-success text-success-foreground shadow-md hover:bg-success/90",
        warning: "bg-warning text-warning-foreground shadow-md hover:bg-warning/90",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9",
        "icon-lg": "h-12 w-12",
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
