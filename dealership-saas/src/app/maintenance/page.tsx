import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function MaintenancePage() {
  let brandName = "Platform";
  let message =
    "We’re performing scheduled maintenance. Please check back soon.";

  try {
    // NOTE: Supabase generated types are not fully wired up in this repo yet.
    // Cast to avoid `never` inference for select strings.
    const supabase = (await createClient()) as any;
    const { data } = await supabase
      .from("platform_public_settings")
      .select("brand_name, maintenance_message")
      .eq("id", 1)
      .maybeSingle();

    if (data?.brand_name) brandName = data.brand_name;
    if (data?.maintenance_message) message = data.maintenance_message;
  } catch {
    // ignore (migration might not be applied yet)
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Maintenance</CardTitle>
          <CardDescription>
            {brandName} is temporarily unavailable.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">
          {message}
        </CardContent>
      </Card>
    </div>
  );
}
