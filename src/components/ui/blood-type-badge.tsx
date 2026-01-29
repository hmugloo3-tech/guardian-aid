import { cn } from "@/lib/utils";

type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

interface BloodTypeBadgeProps {
  type: BloodType;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-10 h-10 text-sm",
  md: "w-14 h-14 text-lg",
  lg: "w-20 h-20 text-2xl",
};

export function BloodTypeBadge({ type, size = "md", className }: BloodTypeBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-bold",
        "bg-primary/10 text-primary border-2 border-primary/25",
        "shadow-sm transition-transform hover:scale-105",
        sizeClasses[size],
        className
      )}
    >
      {type}
    </div>
  );
}

export function BloodTypeGrid({ 
  selected, 
  onSelect,
  className 
}: { 
  selected?: BloodType; 
  onSelect?: (type: BloodType) => void;
  className?: string;
}) {
  const bloodTypes: BloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  
  return (
    <div className={cn("grid grid-cols-4 gap-3", className)}>
      {bloodTypes.map((type) => (
        <button
          key={type}
          onClick={() => onSelect?.(type)}
          className={cn(
            "flex items-center justify-center h-14 rounded-xl font-bold text-lg transition-all",
            "border-2 hover:scale-105 active:scale-95",
            selected === type
              ? "bg-primary text-primary-foreground border-primary shadow-glow"
              : "bg-primary/5 text-primary border-primary/20 hover:border-primary/40"
          )}
        >
          {type}
        </button>
      ))}
    </div>
  );
}
