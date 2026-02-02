import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Flag, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useCreateReport, type ReportType } from "@/hooks/useReports";
import { useToast } from "@/hooks/use-toast";

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  {
    value: "spam",
    label: "Spam",
    description: "Unsolicited or repetitive content",
  },
  {
    value: "fake_profile",
    label: "Fake Profile",
    description: "Impersonation or fake donor identity",
  },
  {
    value: "harassment",
    label: "Harassment",
    description: "Threatening or abusive behavior",
  },
  {
    value: "inappropriate",
    label: "Inappropriate",
    description: "Content violating community guidelines",
  },
  {
    value: "other",
    label: "Other",
    description: "Other issues not listed above",
  },
];

interface ReportDialogProps {
  reportedUserId?: string;
  reportedEmergencyId?: string;
  triggerButton?: React.ReactNode;
  onSuccess?: () => void;
}

export function ReportDialog({
  reportedUserId,
  reportedEmergencyId,
  triggerButton,
  onSuccess,
}: ReportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
            <Flag className="w-4 h-4 mr-1" />
            Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <ReportForm
          reportedUserId={reportedUserId}
          reportedEmergencyId={reportedEmergencyId}
          onSuccess={() => {
            setIsOpen(false);
            onSuccess?.();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

interface ReportFormProps {
  reportedUserId?: string;
  reportedEmergencyId?: string;
  onSuccess?: () => void;
}

export function ReportForm({
  reportedUserId,
  reportedEmergencyId,
  onSuccess,
}: ReportFormProps) {
  const { toast } = useToast();
  const createReport = useCreateReport();

  const [step, setStep] = useState<"type" | "details" | "submitted">("type");
  const [reportType, setReportType] = useState<ReportType | undefined>();
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!reportType) {
      toast({
        variant: "destructive",
        title: "Select a reason",
        description: "Please select the type of issue you're reporting",
      });
      return;
    }

    try {
      await createReport.mutateAsync({
        reported_user_id: reportedUserId,
        reported_emergency_id: reportedEmergencyId,
        report_type: reportType,
        description: description || undefined,
      });

      setStep("submitted");
      toast({
        title: "Report submitted",
        description: "Our team will review this report within 24 hours",
      });
      
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to submit report",
        description: error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            step === "submitted"
              ? "bg-success/10 text-success"
              : "bg-destructive/10 text-destructive"
          }`}>
            {step === "submitted" ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <Flag className="w-6 h-6" />
            )}
          </div>
          <div>
            <DialogTitle className="text-xl">
              {step === "submitted" ? "Report Submitted" : "Report an Issue"}
            </DialogTitle>
            <DialogDescription>
              {step === "type" && "Select the type of issue"}
              {step === "details" && "Provide additional details"}
              {step === "submitted" && "Thank you for helping keep our community safe"}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {step === "type" && (
        <div className="space-y-4 animate-fade-in">
          <RadioGroup
            value={reportType}
            onValueChange={(value) => setReportType(value as ReportType)}
            className="space-y-2"
          >
            {REPORT_TYPES.map((type) => (
              <label
                key={type.value}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  reportType === type.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <RadioGroupItem value={type.value} className="mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">{type.label}</p>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
              </label>
            ))}
          </RadioGroup>

          <Button
            onClick={() => setStep("details")}
            disabled={!reportType}
            className="w-full"
          >
            Continue
          </Button>
        </div>
      )}

      {step === "details" && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-xl bg-muted/50 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <div className="text-sm">
              <p className="font-medium">
                {REPORT_TYPES.find((t) => t.value === reportType)?.label}
              </p>
              <p className="text-muted-foreground">
                {REPORT_TYPES.find((t) => t.value === reportType)?.description}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional Details (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe the issue in more detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep("type")}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createReport.isPending}
              className="flex-1"
            >
              {createReport.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </div>
        </div>
      )}

      {step === "submitted" && (
        <div className="text-center space-y-4 animate-fade-in py-4">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <div>
            <p className="font-semibold text-lg">Thank You</p>
            <p className="text-sm text-muted-foreground">
              We take all reports seriously and will investigate promptly
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
