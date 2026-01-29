import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary border border-primary/20",
        secondary: "bg-secondary/10 text-secondary border border-secondary/20",
        success: "bg-success/10 text-success border border-success/20",
        warning: "bg-warning/10 text-warning-foreground border border-warning/20",
        destructive: "bg-destructive/10 text-destructive border border-destructive/20",
        outline: "border border-border text-foreground",
        // Trust & verification badges
        verified: "bg-secondary/15 text-secondary border border-secondary/30",
        trusted: "bg-success/15 text-success border border-success/30",
        // Blood type badges
        blood: "bg-primary/10 text-primary border-2 border-primary/30 font-bold",
        // Status badges
        available: "bg-success/15 text-success border border-success/30",
        later: "bg-warning/15 text-warning-foreground border border-warning/30",
        unavailable: "bg-muted text-muted-foreground border border-border",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
        xl: "px-4 py-1.5 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
