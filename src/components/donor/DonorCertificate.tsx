import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Award, Download, Share2, Heart, Droplets, Calendar, Shield, X, Facebook, Twitter, Linkedin, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface DonorCertificateProps {
  donorName: string;
  bloodType: string;
  totalDonations: number;
  lastDonationDate: string | null;
  isVerified: boolean;
  memberId?: string;
}

type BadgeLevel = "new" | "bronze" | "silver" | "gold" | "platinum";

interface BadgeInfo {
  level: BadgeLevel;
  label: string;
  icon: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  minDonations: number;
}

const badges: BadgeInfo[] = [
  { level: "platinum", label: "Platinum Hero", icon: "💎", color: "from-slate-200 via-slate-300 to-slate-400", bgGradient: "from-slate-50 to-slate-100", borderColor: "border-slate-400", textColor: "text-slate-700", minDonations: 25 },
  { level: "gold", label: "Gold Champion", icon: "🥇", color: "from-yellow-300 via-amber-400 to-yellow-500", bgGradient: "from-amber-50 to-yellow-100", borderColor: "border-amber-400", textColor: "text-amber-700", minDonations: 10 },
  { level: "silver", label: "Silver Guardian", icon: "🥈", color: "from-gray-200 via-gray-300 to-gray-400", bgGradient: "from-gray-50 to-gray-100", borderColor: "border-gray-400", textColor: "text-gray-700", minDonations: 5 },
  { level: "bronze", label: "Bronze Warrior", icon: "🥉", color: "from-orange-300 via-orange-400 to-orange-500", bgGradient: "from-orange-50 to-orange-100", borderColor: "border-orange-400", textColor: "text-orange-700", minDonations: 1 },
  { level: "new", label: "New Donor", icon: "🌟", color: "from-primary/30 via-primary/50 to-primary/70", bgGradient: "from-primary/5 to-primary/10", borderColor: "border-primary/30", textColor: "text-primary", minDonations: 0 },
];

function getBadge(donations: number): BadgeInfo {
  return badges.find(b => donations >= b.minDonations) || badges[badges.length - 1];
}

export function DonorCertificate({
  donorName,
  bloodType,
  totalDonations,
  lastDonationDate,
  isVerified,
  memberId = "LK" + Math.random().toString(36).substring(2, 8).toUpperCase(),
}: DonorCertificateProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const badge = getBadge(totalDonations);
  const livesImpacted = totalDonations * 3;

  const handleDownload = async () => {
    if (!certificateRef.current) return;

    try {
      // Use html2canvas dynamically
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      const link = document.createElement("a");
      link.download = `lifeline-kashmir-certificate-${donorName.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast({
        title: "Certificate Downloaded!",
        description: "Share your achievement on social media",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Could not generate certificate image",
      });
    }
  };

  const shareText = `🩸 I'm a ${badge.label} blood donor with LifeLine Kashmir! I've donated ${totalDonations} time(s) and helped save up to ${livesImpacted} lives. Join me in making a difference! #BloodDonation #LifeLineKashmir #SaveLives`;

  const shareUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handleShare = async (platform: "facebook" | "twitter" | "linkedin" | "copy") => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);

    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    };

    if (platform === "copy") {
      await navigator.clipboard.writeText(shareText + "\n\n" + shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to clipboard!",
        description: "Share your achievement anywhere",
      });
    } else {
      window.open(urls[platform], "_blank", "width=600,height=400");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Award className="w-4 h-4" />
          View Certificate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Your Donor Certificate
          </DialogTitle>
          <DialogDescription>
            Download or share your achievement with the world
          </DialogDescription>
        </DialogHeader>

        {/* Certificate */}
        <div
          ref={certificateRef}
          className={`relative bg-gradient-to-br ${badge.bgGradient} p-8 rounded-2xl border-4 ${badge.borderColor} overflow-hidden`}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          {/* Corner Decorations */}
          <div className="absolute top-4 left-4 w-16 h-16 border-l-4 border-t-4 border-primary/20 rounded-tl-xl" />
          <div className="absolute top-4 right-4 w-16 h-16 border-r-4 border-t-4 border-primary/20 rounded-tr-xl" />
          <div className="absolute bottom-4 left-4 w-16 h-16 border-l-4 border-b-4 border-primary/20 rounded-bl-xl" />
          <div className="absolute bottom-4 right-4 w-16 h-16 border-r-4 border-b-4 border-primary/20 rounded-br-xl" />

          {/* Header */}
          <div className="relative text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Heart className="w-8 h-8 text-primary" fill="currentColor" />
              <h2 className="font-display text-2xl font-bold text-foreground">LifeLine Kashmir</h2>
            </div>
            <p className="text-sm text-muted-foreground">Blood Donation Network</p>
          </div>

          {/* Badge */}
          <div className="relative flex justify-center mb-6">
            <div className={`px-6 py-3 rounded-full bg-gradient-to-r ${badge.color} shadow-lg`}>
              <span className="text-2xl mr-2">{badge.icon}</span>
              <span className="font-bold text-white text-lg drop-shadow">{badge.label}</span>
            </div>
          </div>

          {/* Certificate Text */}
          <div className="relative text-center space-y-4">
            <p className="text-muted-foreground italic">This is to certify that</p>
            
            <h3 className={`font-display text-3xl font-bold ${badge.textColor}`}>
              {donorName}
            </h3>

            <p className="text-muted-foreground">
              is a registered blood donor who has generously contributed to saving lives
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 my-6">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-sm">
                <Droplets className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-foreground">{bloodType}</p>
                <p className="text-xs text-muted-foreground">Blood Type</p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-sm">
                <Heart className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-foreground">{totalDonations}</p>
                <p className="text-xs text-muted-foreground">Donations</p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-sm">
                <Award className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-foreground">{livesImpacted}</p>
                <p className="text-xs text-muted-foreground">Lives Impacted</p>
              </div>
            </div>

            {/* Verified Badge */}
            {isVerified && (
              <div className="flex items-center justify-center gap-2 text-secondary">
                <Shield className="w-5 h-5" />
                <span className="font-medium">Verified Donor</span>
              </div>
            )}

            {/* Footer */}
            <div className="pt-6 border-t border-primary/10">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Member ID: {memberId}</span>
                <span>Issued: {format(new Date(), "MMMM dd, yyyy")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 mt-4">
          <Button onClick={handleDownload} className="w-full gap-2">
            <Download className="w-4 h-4" />
            Download Certificate
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => handleShare("facebook")}
            >
              <Facebook className="w-4 h-4 text-blue-600" />
              Facebook
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => handleShare("twitter")}
            >
              <Twitter className="w-4 h-4 text-sky-500" />
              Twitter
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => handleShare("linkedin")}
            >
              <Linkedin className="w-4 h-4 text-blue-700" />
              LinkedIn
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => handleShare("copy")}
            >
              {copied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Badge Display Component for Dashboard
export function DonorBadgeDisplay({ totalDonations }: { totalDonations: number }) {
  const badge = getBadge(totalDonations);
  const nextBadge = badges.find(b => b.minDonations > totalDonations);
  const donationsToNext = nextBadge ? nextBadge.minDonations - totalDonations : 0;

  return (
    <Card className="border-border/50">
      <CardContent className="pt-6">
        <div className="text-center">
          {/* Current Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${badge.color} shadow-lg mb-4`}>
            <span className="text-xl">{badge.icon}</span>
            <span className="font-bold text-white">{badge.label}</span>
          </div>

          {/* Progress to Next Badge */}
          {nextBadge && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                {donationsToNext} more donation{donationsToNext > 1 ? "s" : ""} to reach
              </p>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${nextBadge.color} opacity-50`}>
                <span className="text-sm">{nextBadge.icon}</span>
                <span className="text-sm font-medium text-white">{nextBadge.label}</span>
              </div>
            </div>
          )}

          {!nextBadge && (
            <p className="text-sm text-muted-foreground mt-2">
              🎉 You've reached the highest level!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
