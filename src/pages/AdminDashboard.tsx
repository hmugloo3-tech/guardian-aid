import { Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin, useAdminStats, useVerifyDonor } from "@/hooks/useAdmin";
import { useAllDonors } from "@/hooks/useRealtimeDonors";
import { useEmergencyRequests, useUpdateEmergencyRequest } from "@/hooks/useEmergencyRequests";
import { useAdminReports, useUpdateReport, type ReportStatus } from "@/hooks/useReports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart,
  Users,
  AlertTriangle,
  Shield,
  Check,
  X,
  Loader2,
  LogOut,
  Activity,
  Clock,
  Droplets,
  Phone,
  MapPin,
  Flag,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function AdminDashboard() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: stats } = useAdminStats();
  const { data: donors, isLoading: donorsLoading } = useAllDonors();
  const { data: emergencies, isLoading: emergenciesLoading } = useEmergencyRequests();
  const { data: reports, isLoading: reportsLoading } = useAdminReports("pending");
  const verifyDonor = useVerifyDonor();
  const updateEmergency = useUpdateEmergencyRequest();
  const updateReport = useUpdateReport();
  const { toast } = useToast();
  const location = useLocation();
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const isLoading = authLoading || adminLoading;

  // Redirect if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect if not admin
  if (!adminLoading && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleVerifyDonor = async (donorId: string, verified: boolean) => {
    try {
      await verifyDonor.mutateAsync({ donorId, verified });
      toast({
        title: verified ? "Donor verified ✓" : "Donor rejected",
        description: verified
          ? "The donor is now visible in the public directory."
          : "The donor has been rejected.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const handleUpdateEmergencyStatus = async (
    id: string,
    status: "active" | "fulfilled" | "cancelled"
  ) => {
    try {
      await updateEmergency.mutateAsync({ id, status });
      toast({
        title: "Status updated",
        description: `Emergency request marked as ${status}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const handleUpdateReportStatus = async (id: string, status: ReportStatus) => {
    try {
      await updateReport.mutateAsync({ id, status, admin_notes: adminNotes[id] });
      toast({
        title: "Report updated",
        description: `Report marked as ${status}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingDonors = donors?.filter((d) => !d.is_verified) || [];
  const verifiedDonors = donors?.filter((d) => d.is_verified) || [];
  const activeEmergencies = emergencies?.filter((e) => e.status === "pending" || e.status === "active") || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" fill="currentColor" />
            </div>
            <div>
              <span className="font-display text-lg font-bold">LifeLine</span>
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                Admin
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                User Dashboard
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Donors</p>
                  <p className="text-3xl font-bold">{stats?.totalDonors || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Verification</p>
                  <p className="text-3xl font-bold text-warning">{stats?.pendingVerification || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Emergencies</p>
                  <p className="text-3xl font-bold text-primary">{stats?.activeEmergencies || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                  <p className="text-3xl font-bold">{stats?.totalEmergencies || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Pending</span>
              {pendingDonors.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-warning/20 text-warning rounded-full">
                  {pendingDonors.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="donors" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Donors</span>
            </TabsTrigger>
            <TabsTrigger value="emergencies" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Emergencies</span>
              {activeEmergencies.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                  {activeEmergencies.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <Flag className="w-4 h-4" />
              <span className="hidden sm:inline">Reports</span>
              {reports && reports.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-destructive/20 text-destructive rounded-full">
                  {reports.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Pending Verification Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Donor Verification</CardTitle>
                <CardDescription>
                  Review and verify new donor registrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {donorsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : pendingDonors.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Check className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No pending verifications</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingDonors.map((donor) => (
                      <div
                        key={donor.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                            {donor.blood_type}
                          </div>
                          <div>
                            <p className="font-medium">{donor.profiles.full_name}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              {donor.profiles.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {donor.profiles.phone}
                                </span>
                              )}
                              {donor.profiles.locations && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {donor.profiles.locations.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerifyDonor(donor.id, false)}
                            disabled={verifyDonor.isPending}
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </Button>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleVerifyDonor(donor.id, true)}
                            disabled={verifyDonor.isPending}
                          >
                            <Check className="w-4 h-4" />
                            Verify
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Donors Tab */}
          <TabsContent value="donors">
            <Card>
              <CardHeader>
                <CardTitle>Verified Donors</CardTitle>
                <CardDescription>
                  {verifiedDonors.length} verified donors in the network
                </CardDescription>
              </CardHeader>
              <CardContent>
                {donorsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : verifiedDonors.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No verified donors yet</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {verifiedDonors.map((donor) => (
                      <div
                        key={donor.id}
                        className="p-4 bg-muted/50 rounded-xl"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {donor.blood_type}
                          </div>
                          <div>
                            <p className="font-medium">{donor.profiles.full_name}</p>
                            <StatusIndicator
                              status={
                                donor.status === "available"
                                  ? "available"
                                  : donor.status === "available_later"
                                  ? "later"
                                  : "unavailable"
                              }
                            />
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {donor.profiles.phone && (
                            <p className="flex items-center gap-2">
                              <Phone className="w-3 h-3" />
                              {donor.profiles.phone}
                            </p>
                          )}
                          {donor.profiles.locations && (
                            <p className="flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              {donor.profiles.locations.name}
                            </p>
                          )}
                          <p className="flex items-center gap-2">
                            <Droplets className="w-3 h-3" />
                            {donor.total_donations} donations
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Emergencies Tab */}
          <TabsContent value="emergencies">
            <Card>
              <CardHeader>
                <CardTitle>Emergency Requests</CardTitle>
                <CardDescription>
                  Manage and respond to blood emergency requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {emergenciesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : emergencies?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No emergency requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {emergencies?.map((emergency) => (
                      <div
                        key={emergency.id}
                        className={`p-4 rounded-xl border-2 ${
                          emergency.status === "pending"
                            ? "border-warning bg-warning/5"
                            : emergency.status === "active"
                            ? "border-primary bg-primary/5"
                            : "border-border bg-muted/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                              {emergency.blood_type}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">
                                  {emergency.units_needed} unit(s) needed
                                </span>
                                <span
                                  className={`px-2 py-0.5 text-xs rounded-full ${
                                    emergency.urgency === "critical"
                                      ? "bg-primary/20 text-primary"
                                      : emergency.urgency === "urgent"
                                      ? "bg-warning/20 text-warning"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {emergency.urgency}
                                </span>
                                <span
                                  className={`px-2 py-0.5 text-xs rounded-full ${
                                    emergency.status === "pending"
                                      ? "bg-warning/20 text-warning"
                                      : emergency.status === "active"
                                      ? "bg-primary/20 text-primary"
                                      : emergency.status === "fulfilled"
                                      ? "bg-success/20 text-success"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {emergency.status}
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                {emergency.hospital_name && (
                                  <p>🏥 {emergency.hospital_name}</p>
                                )}
                                <p className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {emergency.contact_phone}
                                </p>
                                <p className="text-xs">
                                  {new Date(emergency.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          {(emergency.status === "pending" || emergency.status === "active") && (
                            <div className="flex flex-col gap-2">
                              {emergency.status === "pending" && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateEmergencyStatus(emergency.id, "active")
                                  }
                                >
                                  Activate
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() =>
                                  handleUpdateEmergencyStatus(emergency.id, "fulfilled")
                                }
                              >
                                <Check className="w-4 h-4" />
                                Fulfilled
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleUpdateEmergencyStatus(emergency.id, "cancelled")
                                }
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>
                        {emergency.notes && (
                          <p className="mt-3 text-sm text-muted-foreground border-t pt-3">
                            {emergency.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>User Reports</CardTitle>
                <CardDescription>
                  Review and moderate reported users and content
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : !reports || reports.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Flag className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No pending reports</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="p-4 rounded-xl border-2 border-destructive/20 bg-destructive/5"
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 text-xs rounded-full bg-destructive/20 text-destructive capitalize">
                                {report.report_type.replace("_", " ")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(report.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {report.description || "No description provided"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <Textarea
                            placeholder="Admin notes (optional)..."
                            value={adminNotes[report.id] || ""}
                            onChange={(e) => setAdminNotes(prev => ({
                              ...prev,
                              [report.id]: e.target.value
                            }))}
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handleUpdateReportStatus(report.id, "resolved")}
                              disabled={updateReport.isPending}
                            >
                              <Check className="w-4 h-4" />
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateReportStatus(report.id, "dismissed")}
                              disabled={updateReport.isPending}
                            >
                              <X className="w-4 h-4" />
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system-wide settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <h4 className="font-medium mb-2">Winter / Emergency Mode</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Activate high-contrast mode for better visibility during emergencies or low-light conditions.
                    </p>
                    <Button variant="outline">
                      <AlertTriangle className="w-4 h-4" />
                      Activate Emergency Mode
                    </Button>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-xl">
                    <h4 className="font-medium mb-2">Broadcast Alert</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Send a notification to all donors in a specific region.
                    </p>
                    <Button variant="outline">
                      <AlertTriangle className="w-4 h-4" />
                      Create Broadcast
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
