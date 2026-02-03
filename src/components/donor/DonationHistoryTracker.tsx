import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  Heart, 
  Clock, 
  Droplets, 
  Apple, 
  Moon, 
  Dumbbell, 
  AlertCircle,
  CheckCircle2,
  Award
} from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { DonorCertificate, DonorBadgeDisplay } from "./DonorCertificate";

interface DonationHistoryTrackerProps {
  donorName: string;
  bloodType: string;
  lastDonationDate: string | null;
  nextEligibleDate: string | null;
  totalDonations: number;
  donationLockedUntil?: string | null;
  isVerified: boolean;
}

const healthTips = [
  {
    icon: Apple,
    title: "Eat Iron-Rich Foods",
    description: "Include spinach, lentils, red meat, and fortified cereals to rebuild iron stores.",
    color: "text-green-600"
  },
  {
    icon: Droplets,
    title: "Stay Hydrated",
    description: "Drink at least 8-10 glasses of water daily to help your body regenerate blood.",
    color: "text-blue-500"
  },
  {
    icon: Moon,
    title: "Get Adequate Rest",
    description: "Aim for 7-8 hours of sleep to support your body's recovery process.",
    color: "text-purple-500"
  },
  {
    icon: Dumbbell,
    title: "Light Exercise",
    description: "Wait 24 hours before strenuous activity. Light walking is fine.",
    color: "text-orange-500"
  }
];

export function DonationHistoryTracker({
  donorName,
  bloodType,
  lastDonationDate,
  nextEligibleDate,
  totalDonations,
  donationLockedUntil,
  isVerified
}: DonationHistoryTrackerProps) {
  const countdown = useMemo(() => {
    if (!nextEligibleDate) return null;
    
    const today = new Date();
    const eligibleDate = new Date(nextEligibleDate);
    const daysRemaining = differenceInDays(eligibleDate, today);
    
    return {
      daysRemaining: Math.max(0, daysRemaining),
      isEligible: daysRemaining <= 0,
      eligibleDate: eligibleDate,
      progress: Math.min(100, ((90 - Math.max(0, daysRemaining)) / 90) * 100)
    };
  }, [nextEligibleDate]);

  const getBadge = (donations: number) => {
    if (donations >= 25) return { level: "Platinum", color: "bg-gradient-to-r from-slate-300 to-slate-400", icon: "💎" };
    if (donations >= 10) return { level: "Gold", color: "bg-gradient-to-r from-yellow-400 to-amber-500", icon: "🥇" };
    if (donations >= 5) return { level: "Silver", color: "bg-gradient-to-r from-gray-300 to-gray-400", icon: "🥈" };
    if (donations >= 1) return { level: "Bronze", color: "bg-gradient-to-r from-orange-400 to-orange-600", icon: "🥉" };
    return { level: "New Donor", color: "bg-muted", icon: "🌟" };
  };

  const badge = getBadge(totalDonations);

  return (
    <div className="space-y-6">
      {/* Eligibility Countdown Card */}
      <Card className="border-border/50 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Next Donation Eligibility
              </CardTitle>
              <CardDescription>
                90-day recovery period tracker
              </CardDescription>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-sm font-semibold text-white ${badge.color}`}>
              {badge.icon} {badge.level}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {countdown ? (
            <div className="space-y-4">
              {countdown.isEligible ? (
                <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                  <div>
                    <p className="font-semibold text-success">You're Eligible to Donate!</p>
                    <p className="text-sm text-muted-foreground">
                      Your 90-day recovery period is complete. You can save lives again!
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-primary">{countdown.daysRemaining}</span>
                        <span className="text-xs text-muted-foreground">days left</span>
                      </div>
                      <div>
                        <p className="font-medium">Recovery in Progress</p>
                        <p className="text-sm text-muted-foreground">
                          Eligible on {format(countdown.eligibleDate, "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Recovery Progress</span>
                      <span className="font-medium">{Math.round(countdown.progress)}%</span>
                    </div>
                    <Progress value={countdown.progress} className="h-3" />
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
              <Heart className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium">Ready for Your First Donation!</p>
                <p className="text-sm text-muted-foreground">
                  You haven't donated yet. Your first donation could save up to 3 lives!
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Badge & Certificate Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <DonorBadgeDisplay totalDonations={totalDonations} />
        
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Award className="w-12 h-12 mx-auto text-primary" />
              <div>
                <h3 className="font-semibold">Your Achievement Certificate</h3>
                <p className="text-sm text-muted-foreground">
                  Download or share your donation certificate
                </p>
              </div>
              <DonorCertificate
                donorName={donorName}
                bloodType={bloodType}
                totalDonations={totalDonations}
                lastDonationDate={lastDonationDate}
                isVerified={isVerified}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Donation Stats Card */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Your Donation Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary/5 rounded-xl">
              <p className="text-3xl font-bold text-primary">{totalDonations}</p>
              <p className="text-xs text-muted-foreground">Total Donations</p>
            </div>
            <div className="text-center p-4 bg-secondary/10 rounded-xl">
              <p className="text-3xl font-bold text-secondary">{totalDonations * 3}</p>
              <p className="text-xs text-muted-foreground">Lives Impacted</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-xl">
              <p className="text-3xl font-bold">{totalDonations * 450}</p>
              <p className="text-xs text-muted-foreground">mL Donated</p>
            </div>
          </div>
          
          {lastDonationDate && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                Last donation: <span className="font-medium">{format(new Date(lastDonationDate), "MMMM dd, yyyy")}</span>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Tips Card */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Post-Donation Health Tips
          </CardTitle>
          <CardDescription>
            Follow these guidelines to recover quickly and stay healthy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {healthTips.map((tip, index) => (
              <div 
                key={index} 
                className="flex gap-3 p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className={`shrink-0 w-10 h-10 rounded-lg bg-background flex items-center justify-center ${tip.color}`}>
                  <tip.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">{tip.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Important Notice */}
          <div className="mt-4 flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-xl">
            <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-warning">Important Reminder</p>
              <p className="text-xs text-muted-foreground mt-1">
                If you feel dizzy, nauseous, or experience unusual symptoms after donation, 
                please contact your healthcare provider or call the blood bank immediately.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
