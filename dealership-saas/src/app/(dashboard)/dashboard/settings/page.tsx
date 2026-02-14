"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Lock,
  Building2,
  Bell,
  Palette,
  Users,
  SlidersHorizontal,
  FileText,
} from "lucide-react";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { PasswordSettings } from "@/components/settings/password-settings";
import { OrganizationSettings } from "@/components/settings/organization-settings";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { StaffSettings } from "@/components/settings/staff-settings";
import { DealershipModulesSettings } from "@/components/settings/dealership-modules-settings";
import { InvoiceSlipSettings } from "@/components/settings/invoice-settings";
import { useAuthStore } from "@/lib/store";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const { profile, organization } = useAuthStore();

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  }, []);

  const showStaffTab =
    profile?.role === "admin" ||
    profile?.role === "manager" ||
    profile?.role === "super_admin";
  // Modules config is organization-scoped; hide if user has no organization (common for super_admin).
  const showModulesTab = showStaffTab && !!organization?.id;

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 px-2 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Settings
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
          <TabsList className="inline-flex w-full min-w-max sm:grid sm:grid-cols-2 md:grid-cols-8 h-auto p-1 gap-1">
            <TabsTrigger
              value="profile"
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm flex-1 sm:flex-none"
            >
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger
              value="password"
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm flex-1 sm:flex-none"
            >
              <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span>Password</span>
            </TabsTrigger>
            <TabsTrigger
              value="organization"
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm flex-1 sm:flex-none"
            >
              <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden xs:inline">Organization</span>
              <span className="xs:hidden">Org</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm flex-1 sm:flex-none"
            >
              <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden xs:inline">Notifications</span>
              <span className="xs:hidden">Alerts</span>
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm flex-1 sm:flex-none"
            >
              <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span>Theme</span>
            </TabsTrigger>
            {showModulesTab && (
              <TabsTrigger
                value="modules"
                className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm flex-1 sm:flex-none"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden xs:inline">Modules</span>
                <span className="xs:hidden">Apps</span>
              </TabsTrigger>
            )}
            {showStaffTab && (
              <TabsTrigger
                value="staff"
                className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm flex-1 sm:flex-none"
              >
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>Staff</span>
              </TabsTrigger>
            )}
            {showModulesTab && (
              <TabsTrigger
                value="invoice"
                className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm flex-1 sm:flex-none"
              >
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden xs:inline">Invoice Slip</span>
                <span className="xs:hidden">Invoice</span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and profile picture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>
                Manage your organization information and branding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AppearanceSettings />
            </CardContent>
          </Card>
        </TabsContent>

        {showModulesTab && (
          <TabsContent value="modules" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dealership Configuration</CardTitle>
                <CardDescription>
                  Enable only the modules this dealership uses (Local / Japan
                  Import / Hybrid)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DealershipModulesSettings />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {showStaffTab && (
          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Staff & Roles</CardTitle>
                <CardDescription>
                  Create staff logins and assign roles for access control
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StaffSettings />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {showModulesTab && (
          <TabsContent value="invoice" className="space-y-6">
            <InvoiceSlipSettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
