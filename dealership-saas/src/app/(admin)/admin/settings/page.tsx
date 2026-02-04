import { AdminSettingsClient } from "@/components/admin/admin-settings-client";
import {
  getPlatformPublicSettingsAdmin,
  getPlatformSettingsAdmin,
  listPlatformAuditLogsAdmin,
  listPlatformEmailTemplatesAdmin,
  listPlatformSubscriptionPlansAdmin,
} from "@/lib/actions/admin-platform";

export default async function AdminSettingsPage() {
  const [platformPublic, platformPrivate, templates, plans, audit] =
    await Promise.all([
      getPlatformPublicSettingsAdmin(),
      getPlatformSettingsAdmin(),
      listPlatformEmailTemplatesAdmin(),
      listPlatformSubscriptionPlansAdmin(),
      listPlatformAuditLogsAdmin({ limit: 50 }),
    ]);

  return (
    <AdminSettingsClient
      platformPublic={platformPublic.data}
      platformPrivate={platformPrivate.data}
      templates={templates.data}
      plans={plans.data}
      auditLogs={audit.data}
    />
  );
}
