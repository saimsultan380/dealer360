"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Resolver, useForm } from "react-hook-form";
import { Save, Loader2, Edit, Plus } from "lucide-react";

import type {
  PlatformAuditLog,
  PlatformEmailTemplate,
  PlatformPublicSettings,
  PlatformSettings,
  PlatformSubscriptionPlan,
} from "@/lib/types/database";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ProfileSettings } from "@/components/settings/profile-settings";
import { PasswordSettings } from "@/components/settings/password-settings";

import {
  listPlatformAuditLogsAdmin,
  listPlatformEmailTemplatesAdmin,
  listPlatformSubscriptionPlansAdmin,
  updatePlatformEmailTemplateAdmin,
  updatePlatformPublicSettingsAdmin,
  updatePlatformSettingsAdmin,
  upsertPlatformSubscriptionPlanAdmin,
} from "@/lib/actions/admin-platform";

type Props = {
  platformPublic: PlatformPublicSettings | null;
  platformPrivate: PlatformSettings | null;
  templates: PlatformEmailTemplate[];
  plans: PlatformSubscriptionPlan[];
  auditLogs: PlatformAuditLog[];
};

const privateSettingsSchema = z.object({
  default_currency: z.string().min(1),
  default_country: z.string().min(1),
  default_timezone: z.string().min(1),
  session_timeout_minutes: z.coerce.number().int().min(5).max(1440),
  support_email: z.string().email().optional().or(z.literal("")),
});

type PrivateSettingsFormValues = z.infer<typeof privateSettingsSchema>;

const planSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2),
  name: z.string().min(2),
  price: z.coerce.number().min(0),
  currency: z.string().min(2),
  billing_period: z.enum(["monthly", "yearly"]),
  is_active: z.boolean(),
  max_users: z.coerce.number().int().min(0),
  max_vehicles: z.coerce.number().int().min(0),
});

type PlanFormValues = z.infer<typeof planSchema>;

export function AdminSettingsClient(props: Props) {
  const router = useRouter();

  const [publicSaving, setPublicSaving] = useState(false);
  const [publicError, setPublicError] = useState<string | null>(null);
  const [publicSuccess, setPublicSuccess] = useState<string | null>(null);

  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(
    props.platformPublic?.maintenance_mode ?? false
  );
  const [maintenanceMessage, setMaintenanceMessage] = useState<string>(
    props.platformPublic?.maintenance_message ?? ""
  );
  const [brandName, setBrandName] = useState<string>(
    props.platformPublic?.brand_name ?? ""
  );
  const [brandPrimary, setBrandPrimary] = useState<string>(
    props.platformPublic?.brand_primary_color ?? ""
  );
  const [brandSecondary, setBrandSecondary] = useState<string>(
    props.platformPublic?.brand_secondary_color ?? ""
  );

  const [templates, setTemplates] = useState<PlatformEmailTemplate[]>(
    props.templates ?? []
  );
  const [plans, setPlans] = useState<PlatformSubscriptionPlan[]>(
    props.plans ?? []
  );
  const [auditLogs, setAuditLogs] = useState<PlatformAuditLog[]>(
    props.auditLogs ?? []
  );

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<PlatformEmailTemplate | null>(null);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [templateSuccess, setTemplateSuccess] = useState<string | null>(null);

  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planSaving, setPlanSaving] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [planSuccess, setPlanSuccess] = useState<string | null>(null);

  const planDefaults = useMemo<PlanFormValues>(
    () => ({
      code: "",
      name: "",
      price: 0,
      currency: "PKR",
      billing_period: "monthly",
      is_active: true,
      max_users: 0,
      max_vehicles: 0,
    }),
    []
  );

  const privateForm = useForm<PrivateSettingsFormValues>({
    resolver: zodResolver(
      privateSettingsSchema
    ) as unknown as Resolver<PrivateSettingsFormValues>,
    defaultValues: {
      default_currency: props.platformPrivate?.default_currency ?? "PKR",
      default_country: props.platformPrivate?.default_country ?? "PK",
      default_timezone:
        props.platformPrivate?.default_timezone ?? "Asia/Karachi",
      session_timeout_minutes:
        props.platformPrivate?.session_timeout_minutes ?? 120,
      support_email: props.platformPrivate?.support_email ?? "",
    },
  });

  const planForm = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema) as unknown as Resolver<PlanFormValues>,
    defaultValues: planDefaults,
  });

  const refreshLists = async () => {
    const [t, p, a] = await Promise.all([
      listPlatformEmailTemplatesAdmin(),
      listPlatformSubscriptionPlansAdmin(),
      listPlatformAuditLogsAdmin({ limit: 50 }),
    ]);
    if (!t.error) setTemplates(t.data);
    if (!p.error) setPlans(p.data);
    if (!a.error) setAuditLogs(a.data);
  };

  const savePublic = async () => {
    setPublicSaving(true);
    setPublicError(null);
    setPublicSuccess(null);
    try {
      const result = await updatePlatformPublicSettingsAdmin({
        maintenance_mode: maintenanceMode,
        maintenance_message: maintenanceMessage || null,
        brand_name: brandName || null,
        brand_primary_color: brandPrimary || null,
        brand_secondary_color: brandSecondary || null,
      });
      if (result.error) {
        setPublicError(result.error);
      } else {
        setPublicSuccess("Platform public settings saved.");
        setTimeout(() => setPublicSuccess(null), 2500);
        router.refresh();
        await refreshLists();
      }
    } finally {
      setPublicSaving(false);
    }
  };

  const savePrivate = async (values: PrivateSettingsFormValues) => {
    const result = await updatePlatformSettingsAdmin({
      default_currency: values.default_currency,
      default_country: values.default_country,
      default_timezone: values.default_timezone,
      session_timeout_minutes: values.session_timeout_minutes,
      support_email: values.support_email || null,
    });
    if (result.error) {
      privateForm.setError("default_currency", { message: result.error });
      return;
    }
    router.refresh();
    await refreshLists();
  };

  const openTemplateEditor = (t: PlatformEmailTemplate) => {
    setEditingTemplate(t);
    setTemplateError(null);
    setTemplateSuccess(null);
    setTemplateDialogOpen(true);
  };

  const saveTemplate = async () => {
    if (!editingTemplate) return;
    setTemplateSaving(true);
    setTemplateError(null);
    setTemplateSuccess(null);
    try {
      const result = await updatePlatformEmailTemplateAdmin({
        id: editingTemplate.id,
        name: editingTemplate.name,
        subject: editingTemplate.subject,
        body: editingTemplate.body,
        is_enabled: editingTemplate.is_enabled,
      });
      if (result.error) {
        setTemplateError(result.error);
      } else {
        setTemplateSuccess("Template saved.");
        setTimeout(() => setTemplateSuccess(null), 2500);
        await refreshLists();
      }
    } finally {
      setTemplateSaving(false);
    }
  };

  const openCreatePlan = () => {
    planForm.reset(planDefaults);
    setPlanError(null);
    setPlanSuccess(null);
    setPlanDialogOpen(true);
  };

  const openEditPlan = (p: PlatformSubscriptionPlan) => {
    const limits = (p.limits ?? {}) as {
      max_users?: number;
      max_vehicles?: number;
    };
    planForm.reset({
      id: p.id,
      code: p.code,
      name: p.name,
      price: Number(p.price ?? 0),
      currency: p.currency ?? "PKR",
      billing_period: p.billing_period ?? "monthly",
      is_active: !!p.is_active,
      max_users: Number(limits?.max_users ?? 0),
      max_vehicles: Number(limits?.max_vehicles ?? 0),
    });
    setPlanError(null);
    setPlanSuccess(null);
    setPlanDialogOpen(true);
  };

  const savePlan = async (values: PlanFormValues) => {
    setPlanSaving(true);
    setPlanError(null);
    setPlanSuccess(null);
    try {
      const result = await upsertPlatformSubscriptionPlanAdmin({
        id: values.id,
        code: values.code,
        name: values.name,
        price: values.price,
        currency: values.currency,
        billing_period: values.billing_period,
        is_active: values.is_active,
        limits: {
          max_users: values.max_users,
          max_vehicles: values.max_vehicles,
        },
      });
      if (result.error) {
        setPlanError(result.error);
      } else {
        setPlanSuccess(values.id ? "Plan updated." : "Plan created.");
        setTimeout(() => setPlanSuccess(null), 2500);
        await refreshLists();
        setPlanDialogOpen(false);
      }
    } finally {
      setPlanSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-muted-foreground">
          Super admin profile and platform settings.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="w-full flex flex-wrap justify-start gap-1 h-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="platform">Platform</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Your super admin account details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Update your password and keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platform" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance & Branding</CardTitle>
              <CardDescription>
                Platform-wide public flags and branding.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {publicError && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {publicError}
                </div>
              )}
              {publicSuccess && (
                <div className="rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
                  {publicSuccess}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div className="space-y-1">
                  <div className="font-medium">Maintenance mode</div>
                  <div className="text-sm text-muted-foreground">
                    When enabled, non-super-admin users are redirected to the
                    maintenance page.
                  </div>
                </div>
                <Switch
                  checked={maintenanceMode}
                  onCheckedChange={setMaintenanceMode}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="maintenance_message">
                    Maintenance message
                  </Label>
                  <Textarea
                    id="maintenance_message"
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    placeholder="We’re performing scheduled maintenance. Please check back soon."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand_name">Brand name</Label>
                  <Input
                    id="brand_name"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand_primary">Primary color</Label>
                  <Input
                    id="brand_primary"
                    value={brandPrimary}
                    onChange={(e) => setBrandPrimary(e.target.value)}
                    placeholder="#0f172a"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand_secondary">Secondary color</Label>
                  <Input
                    id="brand_secondary"
                    value={brandSecondary}
                    onChange={(e) => setBrandSecondary(e.target.value)}
                    placeholder="#2563eb"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={savePublic} disabled={publicSaving}>
                  {publicSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Defaults</CardTitle>
              <CardDescription>
                Platform default settings for new tenants and policy defaults.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={privateForm.handleSubmit(savePrivate)}
                className="space-y-5"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="default_currency">Default currency</Label>
                    <Input
                      id="default_currency"
                      {...privateForm.register("default_currency")}
                      placeholder="PKR"
                    />
                    {privateForm.formState.errors.default_currency?.message && (
                      <p className="text-sm text-destructive">
                        {privateForm.formState.errors.default_currency.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="default_country">Default country</Label>
                    <Input
                      id="default_country"
                      {...privateForm.register("default_country")}
                      placeholder="PK"
                    />
                    {privateForm.formState.errors.default_country?.message && (
                      <p className="text-sm text-destructive">
                        {privateForm.formState.errors.default_country.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="default_timezone">Default timezone</Label>
                    <Input
                      id="default_timezone"
                      {...privateForm.register("default_timezone")}
                      placeholder="Asia/Karachi"
                    />
                    {privateForm.formState.errors.default_timezone?.message && (
                      <p className="text-sm text-destructive">
                        {privateForm.formState.errors.default_timezone.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="session_timeout_minutes">
                      Session timeout (minutes)
                    </Label>
                    <Input
                      id="session_timeout_minutes"
                      type="number"
                      {...privateForm.register("session_timeout_minutes")}
                    />
                    {privateForm.formState.errors.session_timeout_minutes
                      ?.message && (
                      <p className="text-sm text-destructive">
                        {
                          privateForm.formState.errors.session_timeout_minutes
                            .message
                        }
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="support_email">Support email</Label>
                    <Input
                      id="support_email"
                      {...privateForm.register("support_email")}
                      placeholder="support@example.com"
                    />
                    {privateForm.formState.errors.support_email?.message && (
                      <p className="text-sm text-destructive">
                        {privateForm.formState.errors.support_email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={privateForm.formState.isSubmitting}
                  >
                    {privateForm.formState.isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Email templates</CardTitle>
              <CardDescription>
                Edit subjects/bodies used by platform emails.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.template_key}
                      </TableCell>
                      <TableCell>
                        {t.is_enabled ? (
                          <Badge>Enabled</Badge>
                        ) : (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openTemplateEditor(t)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!templates.length && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">
                        No templates found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog
            open={templateDialogOpen}
            onOpenChange={setTemplateDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit template</DialogTitle>
                <DialogDescription>
                  Update the subject/body. Use variables like{" "}
                  <code>{"{{org_name}}"}</code>.
                </DialogDescription>
              </DialogHeader>

              {templateError && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {templateError}
                </div>
              )}
              {templateSuccess && (
                <div className="rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
                  {templateSuccess}
                </div>
              )}

              {editingTemplate && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <div className="font-medium">Enabled</div>
                      <div className="text-sm text-muted-foreground">
                        Disable to stop sending this email type.
                      </div>
                    </div>
                    <Switch
                      checked={editingTemplate.is_enabled}
                      onCheckedChange={(v) =>
                        setEditingTemplate((prev) =>
                          prev ? { ...prev, is_enabled: v } : prev
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={editingTemplate.name}
                      onChange={(e) =>
                        setEditingTemplate((prev) =>
                          prev ? { ...prev, name: e.target.value } : prev
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input
                      value={editingTemplate.subject}
                      onChange={(e) =>
                        setEditingTemplate((prev) =>
                          prev ? { ...prev, subject: e.target.value } : prev
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Body</Label>
                    <Textarea
                      value={editingTemplate.body}
                      onChange={(e) =>
                        setEditingTemplate((prev) =>
                          prev ? { ...prev, body: e.target.value } : prev
                        )
                      }
                      rows={10}
                    />
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  onClick={saveTemplate}
                  disabled={templateSaving || !editingTemplate}
                >
                  {templateSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="plans">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Subscription plans</CardTitle>
                <CardDescription>
                  Manage plan pricing and limits.
                </CardDescription>
              </div>
              <Button onClick={openCreatePlan}>
                <Plus className="mr-2 h-4 w-4" />
                Add plan
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.code}
                      </TableCell>
                      <TableCell>
                        {p.currency} {Number(p.price ?? 0)} / {p.billing_period}
                      </TableCell>
                      <TableCell>
                        {p.is_active ? (
                          <Badge>Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditPlan(p)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!plans.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        No plans found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {planForm.getValues("id") ? "Edit plan" : "Create plan"}
                </DialogTitle>
                <DialogDescription>
                  Pricing + limits are enforced by your business logic (UI
                  config here).
                </DialogDescription>
              </DialogHeader>

              {planError && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {planError}
                </div>
              )}
              {planSuccess && (
                <div className="rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
                  {planSuccess}
                </div>
              )}

              <form
                onSubmit={planForm.handleSubmit(savePlan)}
                className="space-y-4"
              >
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <div className="font-medium">Active</div>
                    <div className="text-sm text-muted-foreground">
                      Inactive plans can’t be selected for new orgs.
                    </div>
                  </div>
                  <Switch
                    checked={planForm.watch("is_active")}
                    onCheckedChange={(v) => planForm.setValue("is_active", v)}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Code</Label>
                    <Input {...planForm.register("code")} placeholder="basic" />
                    {planForm.formState.errors.code?.message && (
                      <p className="text-sm text-destructive">
                        {planForm.formState.errors.code.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input {...planForm.register("name")} placeholder="Basic" />
                    {planForm.formState.errors.name?.message && (
                      <p className="text-sm text-destructive">
                        {planForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Input
                      {...planForm.register("currency")}
                      placeholder="PKR"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Billing period</Label>
                    <Select
                      value={planForm.watch("billing_period")}
                      onValueChange={(v) =>
                        planForm.setValue(
                          "billing_period",
                          v as PlanFormValues["billing_period"],
                          {
                            shouldValidate: true,
                          }
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...planForm.register("price")}
                    />
                    {planForm.formState.errors.price?.message && (
                      <p className="text-sm text-destructive">
                        {planForm.formState.errors.price.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Max users</Label>
                    <Input type="number" {...planForm.register("max_users")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Max vehicles</Label>
                    <Input
                      type="number"
                      {...planForm.register("max_vehicles")}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={planSaving}>
                    {planSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit logs</CardTitle>
              <CardDescription>
                Latest platform-level configuration changes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Actor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(l.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">{l.action}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {l.entity_type ?? "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {l.actor_user_id ?? "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!auditLogs.length && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">
                        No audit logs yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={async () => {
                    await refreshLists();
                  }}
                >
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
