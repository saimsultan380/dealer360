"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Upload,
  X,
  User,
  Lock,
  Mail,
  Phone,
  Building2,
  Calendar,
  Shield,
  TrendingUp,
  Car,
  HandshakeIcon,
  Users,
  Wallet,
  FileText,
} from "lucide-react";
import {
  getCurrentProfile,
  updateProfile,
  updatePassword,
} from "@/lib/actions/settings";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import type { Profile, Organization } from "@/lib/types/database";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(6, "Password must be at least 6 characters"),
    confirm_password: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

interface ProfilePageContentProps {
  profile: Profile;
  organization: Organization | null;
}

export function ProfilePageContent({
  profile: initialProfile,
  organization,
}: ProfilePageContentProps) {
  const router = useRouter();
  const { profile: authProfile, setProfile } = useAuthStore();
  const [profile, setProfileState] = useState(initialProfile);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    initialProfile.avatar_url
  );
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalSales: 0,
    totalClients: 0,
    totalDeals: 0,
  });

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isSubmitting: isSubmittingProfile },
    reset: resetProfile,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: initialProfile.full_name,
      phone: initialProfile.phone || "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
    reset: resetPassword,
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  // Note: Phone formatting will be handled via react-hook-form directly

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch statistics
      const orgId = profile.organization_id;
      if (!orgId) {
        setStats({
          totalVehicles: 0,
          totalSales: 0,
          totalClients: 0,
          totalDeals: 0,
        });
        return;
      }

      const [vehiclesResult, salesResult, clientsResult, dealsResult] =
        await Promise.all([
          supabase
            .from("vehicles")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", orgId),
          supabase
            .from("sales")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", orgId),
          supabase
            .from("clients")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", orgId),
          supabase
            .from("deals")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", orgId),
        ]);

      setStats({
        totalVehicles: vehiclesResult.count || 0,
        totalSales: salesResult.count || 0,
        totalClients: clientsResult.count || 0,
        totalDeals: dealsResult.count || 0,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Unauthorized");
        setUploading(false);
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `profile-avatar-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("vehicles")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        setError("Failed to upload image");
        setUploading(false);
        return;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("vehicles").getPublicUrl(filePath);

      setAvatarUrl(publicUrl);

      // Update profile with new avatar URL
      const updateResult = await updateProfile({ avatar_url: publicUrl });
      if (updateResult.error) {
        setError(updateResult.error);
      } else {
        if (updateResult.data) {
          setProfileState(updateResult.data);
          setProfile(updateResult.data);
        }
        setSuccess("Avatar updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error("Error uploading avatar:", err);
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    const updateResult = await updateProfile({ avatar_url: "" });
    if (updateResult.error) {
      setError(updateResult.error);
    } else {
      setAvatarUrl(null);
      if (updateResult.data) {
        setProfileState(updateResult.data);
        setProfile(updateResult.data);
      }
      setSuccess("Avatar removed successfully");
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const onProfileSubmit = async (data: ProfileFormValues) => {
    setError(null);
    setSuccess(null);

    const updateData: any = {
      full_name: data.full_name,
    };
    if (data.phone) {
      updateData.phone = data.phone;
    }

    const result = await updateProfile(updateData);

    if (result.error) {
      setError(result.error);
    } else {
      if (result.data) {
        setProfileState(result.data);
        setProfile(result.data);
      }
      setSuccess("Profile updated successfully");
      setTimeout(() => setSuccess(null), 3000);
      router.refresh();
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setError(null);
    setSuccess(null);

    const result = await updatePassword(data);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess("Password updated successfully");
      setTimeout(() => setSuccess(null), 3000);
      resetPassword();
    }
  };

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg border border-green-500/20">
          {success}
        </div>
      )}

      {/* Profile Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={avatarUrl || undefined}
                alt={profile.full_name}
              />
              <AvatarFallback className="text-2xl">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">{profile.full_name}</CardTitle>
              <CardDescription className="mt-1 capitalize">
                {profile.role.replace("_", " ")}
              </CardDescription>
              {organization && (
                <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  {organization.name}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVehicles}</div>
            <p className="text-xs text-muted-foreground">Total in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">Total sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">Total clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals</CardTitle>
            <HandshakeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDeals}</div>
            <p className="text-xs text-muted-foreground">Total deals</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="password">
            <Lock className="mr-2 h-4 w-4" />
            Password
          </TabsTrigger>
          <TabsTrigger value="account">
            <Shield className="mr-2 h-4 w-4" />
            Account
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and profile picture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmitProfile(onProfileSubmit)}
                className="space-y-6"
              >
                {/* Avatar Upload Controls (no preview on profile page) */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                  <div className="space-y-2 w-full sm:w-auto text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Label htmlFor="avatar-upload" className="cursor-pointer">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          asChild
                        >
                          <span>
                            <Upload className="mr-2 h-4 w-4" />
                            {uploading ? "Uploading..." : "Upload Photo"}
                          </span>
                        </Button>
                      </Label>
                      <Input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                      {avatarUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removeAvatar}
                          disabled={uploading}
                          className="w-full sm:w-auto"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      JPG, PNG or GIF. Max size of 5MB.
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      {...registerProfile("full_name")}
                      placeholder="Enter your full name"
                      className="w-full"
                    />
                    {profileErrors.full_name && (
                      <p className="text-xs sm:text-sm text-destructive mt-1">
                        {profileErrors.full_name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      {...registerProfile("phone")}
                      placeholder="03XX-XXXXXXX"
                      className="w-full"
                    />
                    {profileErrors.phone && (
                      <p className="text-xs sm:text-sm text-destructive mt-1">
                        {profileErrors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={
                        authProfile?.id ? "Email managed by authentication" : ""
                      }
                      disabled
                      className="bg-muted w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Email cannot be changed here. Contact support if needed.
                    </p>
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={
                        profile.role
                          ? profile.role.replace("_", " ").toUpperCase()
                          : ""
                      }
                      disabled
                      className="bg-muted capitalize w-full"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmittingProfile}
                    className="w-full sm:w-auto"
                  >
                    {isSubmittingProfile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Tab */}
        <TabsContent value="password" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmitPassword(onPasswordSubmit)}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current Password *</Label>
                  <Input
                    id="current_password"
                    type="password"
                    {...registerPassword("current_password")}
                    placeholder="Enter current password"
                    className="w-full"
                  />
                  {passwordErrors.current_password && (
                    <p className="text-xs sm:text-sm text-destructive mt-1">
                      {passwordErrors.current_password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password *</Label>
                  <Input
                    id="new_password"
                    type="password"
                    {...registerPassword("new_password")}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full"
                  />
                  {passwordErrors.new_password && (
                    <p className="text-xs sm:text-sm text-destructive mt-1">
                      {passwordErrors.new_password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">
                    Confirm New Password *
                  </Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    {...registerPassword("confirm_password")}
                    placeholder="Confirm new password"
                    className="w-full"
                  />
                  {passwordErrors.confirm_password && (
                    <p className="text-xs sm:text-sm text-destructive mt-1">
                      {passwordErrors.confirm_password.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmittingPassword}
                    className="w-full sm:w-auto"
                  >
                    {isSubmittingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                View your account details and activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    value={
                      authProfile?.id
                        ? "Email managed by authentication"
                        : "N/A"
                    }
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <Input
                    value={profile.phone || "Not set"}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Role
                  </Label>
                  <Input
                    value={
                      profile.role
                        ? profile.role.replace("_", " ").toUpperCase()
                        : "N/A"
                    }
                    disabled
                    className="bg-muted capitalize"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Organization
                  </Label>
                  <Input
                    value={organization?.name || "Not assigned"}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Member Since
                  </Label>
                  <Input
                    value={
                      profile.created_at
                        ? new Date(profile.created_at).toLocaleDateString(
                            "en-PK",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : "N/A"
                    }
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Last Updated
                  </Label>
                  <Input
                    value={
                      profile.updated_at
                        ? new Date(profile.updated_at).toLocaleDateString(
                            "en-PK",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : "N/A"
                    }
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Account Status</Label>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      profile.is_active ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span className="text-sm">
                    {profile.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
