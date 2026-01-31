import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateAvailability } from "@/hooks/useAvailability";
import { useToast } from "@/hooks/use-toast";
import { Check, Clock, X, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AvailabilityStatus = Database["public"]["Enums"]["availability_status"];

interface AvailabilityDialogProps {
  currentStatus: AvailabilityStatus;
  trigger?: React.ReactNode;
}

const STATUS_OPTIONS: {
  value: AvailabilityStatus;
  label: string;
  description: string;
  icon: typeof Check;
  color: string;
}[] = [
  {
    value: "available",
    label: "Available Now",
    description: "I can donate blood right now",
    icon: Check,
    color: "text-success",
  },
  {
    value: "available_later",
    label: "Available Later",
    description: "I'll be available after some time",
    icon: Clock,
    color: "text-warning",
  },
  {
    value: "unavailable",
    label: "Not Available",
    description: "I cannot donate currently",
    icon: X,
    color: "text-muted-foreground",
  },
];

const EXPIRY_OPTIONS = [
  { value: "0", label: "No expiry" },
  { value: "2", label: "2 hours" },
  { value: "4", label: "4 hours" },
  { value: "8", label: "8 hours" },
  { value: "12", label: "12 hours" },
  { value: "24", label: "24 hours" },
  { value: "48", label: "2 days" },
  { value: "168", label: "1 week" },
];

export function AvailabilityDialog({ currentStatus, trigger }: AvailabilityDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<AvailabilityStatus>(currentStatus);
  const [expiryHours, setExpiryHours] = useState("0");
  const updateAvailability = useUpdateAvailability();
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      await updateAvailability.mutateAsync({
        status: selectedStatus,
        expiresInHours: parseInt(expiryHours) || undefined,
      });

      toast({
        title: "Availability updated! ✓",
        description: `Your status is now "${STATUS_OPTIONS.find((s) => s.value === selectedStatus)?.label}"`,
      });
      setOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="hero">Update Availability</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Your Availability</DialogTitle>
          <DialogDescription>
            Let others know when you're available to donate blood
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Selection */}
          <div className="space-y-3">
            <Label>Your Status</Label>
            {STATUS_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedStatus === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedStatus(option.value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? "bg-primary/20" : "bg-muted"
                    } ${option.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Auto-expiry */}
          {selectedStatus !== "unavailable" && (
            <div className="space-y-2">
              <Label>Auto-expire after</Label>
              <Select value={expiryHours} onValueChange={setExpiryHours}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Your status will automatically change to "Not Available" after this time
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="hero"
            onClick={handleSave}
            disabled={updateAvailability.isPending}
          >
            {updateAvailability.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
