import { cn } from "@/lib/utils";

type Status = "available" | "later" | "unavailable" | "emergency";

interface StatusIndicatorProps {
  status: Status;
  label?: string;
  pulse?: boolean;
  className?: string;
}

const statusConfig = {
  available: {
    color: "bg-success",
    label: "Available Now",
  },
  later: {
    color: "bg-warning",
    label: "Available Later",
  },
  unavailable: {
    color: "bg-muted-foreground",
    label: "Not Available",
  },
  emergency: {
    color: "bg-primary",
    label: "Emergency",
  },
};

export function StatusIndicator({
  status,
  label,
  pulse = false,
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="relative flex h-2.5 w-2.5">
        {pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              config.color
            )}
          />
        )}
        <span
          className={cn(
            "relative inline-flex h-2.5 w-2.5 rounded-full",
            config.color
          )}
        />
      </span>
      <span className="text-sm font-medium text-muted-foreground">
        {label || config.label}
      </span>
    </div>
  );
}
