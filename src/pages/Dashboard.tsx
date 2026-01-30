import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useDonor } from "@/hooks/useDonor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Heart, LogOut, User, Droplets, MapPin, Phone, Calendar, Shield, Bell, Settings, Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: donor, isLoading: donorLoading } = useDonor();

  const isLoading = authLoading || profileLoading || donorLoading;

  // Redirect if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to donor registration if not a donor yet
  if (!donorLoading && !donor && user) {
    return <Navigate to="/register-donor" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statusMap: Record<string, "available" | "later" | "unavailable"> = {
    available: "available",
    available_later: "later",
    unavailable: "unavailable",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" fill="currentColor" />
            </div>
            <span className="font-display text-lg font-bold">LifeLine</span>
          </Link>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon-sm">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon-sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">
            Welcome, {profile?.full_name || "Donor"}! 👋
          </h1>
          <p className="text-muted-foreground">
            Manage your donor profile and respond to emergency requests
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Card - Donor Status */}
          <Card className="lg:col-span-2 border-border/50 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Donor Profile</CardTitle>
                  <CardDescription>Manage your availability and information</CardDescription>
                </div>
                {donor?.is_verified ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/10 text-secondary rounded-full text-sm font-medium">
                    <Shield className="w-4 h-4" />
                    Verified
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-warning/10 text-warning rounded-full text-sm font-medium">
                    <Shield className="w-4 h-4" />
                    Pending Verification
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Blood Type */}
                <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-xl">
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">{donor?.blood_type}</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Blood Type</p>
                    <p className="font-semibold">Group {donor?.blood_type}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                    <Droplets className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Status</p>
                    <StatusIndicator 
                      status={statusMap[donor?.status || "available"]} 
                      pulse={donor?.status === "available"}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="hero">
                  Update Availability
                </Button>
                <Button variant="outline">
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Your Impact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">Total Donations</span>
                <span className="text-2xl font-bold">{donor?.total_donations || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">Lives Saved</span>
                <span className="text-2xl font-bold text-primary">{(donor?.total_donations || 0) * 3}</span>
              </div>
              {donor?.last_donation_date && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Last Donation</p>
                    <p className="text-sm font-medium">
                      {new Date(donor.last_donation_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-4 h-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>+91 {profile.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>Kashmir</span>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Requests */}
          <Card className="lg:col-span-2 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                Recent Emergency Requests
              </CardTitle>
              <CardDescription>
                Matching requests for your blood type in your area
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No active emergency requests at the moment</p>
                <p className="text-sm">You'll be notified when someone needs your help</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
