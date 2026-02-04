import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditVehicleClient } from "./edit-vehicle-client";

function getMockVehicle(id: string): Record<string, unknown> | null {
  const mockVehicles: Record<string, Record<string, unknown>> = {
    "mock-vehicle-1": {
      id: "mock-vehicle-1",
      organization_id: "mock-org-1",
      make: "Toyota",
      model: "Corolla",
      variant: "XLI",
      year: 2023,
      color: "White",
      registration_number: "LHR-1234",
      engine_number: "ENG-001",
      chassis_number: "CHS-001",
      purchase_price: 2000000,
      selling_price: 2500000,
      minimum_price: 2300000,
      status: "available",
      condition: "used",
      mileage: 15000,
      fuel_type: "petrol",
      transmission: "automatic",
      description: "Well maintained Toyota Corolla.",
      vehicle_images: [
        {
          id: "mock-img-1",
          vehicle_id: "mock-vehicle-1",
          url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800",
          is_primary: true,
        },
      ],
    },
    "mock-vehicle-2": {
      id: "mock-vehicle-2",
      organization_id: "mock-org-1",
      make: "Honda",
      model: "Civic",
      variant: "RS",
      year: 2022,
      color: "Black",
      registration_number: "KHI-5678",
      engine_number: "ENG-002",
      chassis_number: "CHS-002",
      purchase_price: 2400000,
      selling_price: 3200000,
      minimum_price: 3000000,
      status: "reserved",
      condition: "used",
      mileage: 25000,
      fuel_type: "petrol",
      transmission: "automatic",
      description: "Honda Civic RS.",
      vehicle_images: [
        {
          id: "mock-img-2",
          vehicle_id: "mock-vehicle-2",
          url: "https://images.unsplash.com/photo-1606664515524-ed2f786a0ad6?w=800",
          is_primary: true,
        },
      ],
    },
  };
  return mockVehicles[id] ?? null;
}

/** All scalar fields the vehicle form expects for prefill */
function normalizeVehicleForForm(
  row: Record<string, unknown>
): Record<string, unknown> {
  const make = String(row.make ?? "").trim();
  const model = String(row.model ?? "").trim();
  const color = String(row.color ?? "").trim();
  const conditionRaw = String(row.condition ?? "used").toLowerCase();
  const condition = (["new", "used", "certified"] as const).includes(
    conditionRaw as any
  )
    ? conditionRaw
    : "used";
  const fuelRaw = String(row.fuel_type ?? "petrol").toLowerCase();
  const fuel_type = (
    ["petrol", "diesel", "hybrid", "electric", "cng"] as const
  ).includes(fuelRaw as any)
    ? fuelRaw
    : "petrol";
  const transmissionRaw = String(row.transmission ?? "automatic").toLowerCase();
  const transmission = (["manual", "automatic"] as const).includes(
    transmissionRaw as any
  )
    ? transmissionRaw
    : "automatic";
  const statusRaw = String(row.status ?? "available").toLowerCase();
  const status = (
    ["available", "reserved", "sold", "in_service"] as const
  ).includes(statusRaw as any)
    ? statusRaw
    : "available";
  return {
    id: row.id,
    make,
    model,
    variant: String(row.variant ?? "").trim(),
    year: Number(row.year ?? new Date().getFullYear()),
    color,
    mileage: Number(row.mileage ?? 0),
    fuel_type,
    transmission,
    engine_number: row.engine_number ?? "",
    chassis_number: row.chassis_number ?? "",
    registration_number: row.registration_number ?? "",
    purchase_price: row.purchase_price ?? undefined,
    selling_price: row.selling_price ?? 0,
    minimum_price: row.minimum_price ?? undefined,
    status,
    condition,
    description: row.description ?? "",
  };
}

/** Sort by display_order then is_primary so order matches DB */
function getOrderedImageUrls(
  vehicleImages:
    | { url?: string; display_order?: number; is_primary?: boolean }[]
    | undefined
): string[] {
  if (!Array.isArray(vehicleImages)) return [];
  const sorted = [...vehicleImages].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return (a.display_order ?? 0) - (b.display_order ?? 0);
  });
  return sorted.map((img) => img?.url).filter((u): u is string => Boolean(u));
}

function buildInitial(
  vehicle: Record<string, unknown>,
  metadata: Record<string, unknown> | null,
  imageUrls: string[],
  documents?: {
    buyerItems: { id: string; url: string }[];
    sellerItems: { id: string; url: string }[];
    chassisImage: { id: string; url: string } | null;
    vehicleDocs: { id: string; url: string; type: string; name: string }[];
  }
) {
  return {
    vehicle: normalizeVehicleForForm(vehicle),
    metadata,
    imageUrls,
    documents: documents ?? null,
  };
}

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isSupabaseConfigured =
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("your-project-id.supabase.co") &&
    supabaseUrl.startsWith("http");

  if (!isSupabaseConfigured) {
    const mockVehicle = getMockVehicle(id);
    if (!mockVehicle) {
      notFound();
    }
    const imageUrls = getOrderedImageUrls(
      mockVehicle.vehicle_images as
        | { url?: string; display_order?: number; is_primary?: boolean }[]
        | undefined
    );
    const initial = buildInitial(mockVehicle, null, imageUrls, {
      buyerItems: [],
      sellerItems: [],
      chassisImage: null,
      vehicleDocs: [],
    });
    const vehicleLabel = `${mockVehicle.year} ${mockVehicle.make} ${mockVehicle.model}`;
    return (
      <EditVehicleClient
        vehicleId={String(mockVehicle.id)}
        initial={initial}
        vehicleLabel={vehicleLabel}
      />
    );
  }

  const supabase = (await createClient()) as any;

  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .select("*, vehicle_images(*)")
    .eq("id", id)
    .single();

  if (error || !vehicle) {
    const mockVehicle = getMockVehicle(id);
    if (!mockVehicle) {
      notFound();
    }
    const imageUrls = getOrderedImageUrls(
      mockVehicle.vehicle_images as
        | { url?: string; display_order?: number; is_primary?: boolean }[]
        | undefined
    );
    const initial = buildInitial(mockVehicle, null, imageUrls, {
      buyerItems: [],
      sellerItems: [],
      chassisImage: null,
      vehicleDocs: [],
    });
    const vehicleLabel = `${mockVehicle.year} ${mockVehicle.make} ${mockVehicle.model}`;
    return (
      <EditVehicleClient
        vehicleId={String(mockVehicle.id)}
        initial={initial}
        vehicleLabel={vehicleLabel}
      />
    );
  }

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("entity_type", "vehicle")
    .eq("entity_id", id);

  const metadataDoc = (documents as any[] | null)?.find(
    (d: any) => d.file_name === "vehicle_metadata.json"
  );
  let metadata: Record<string, unknown> | null = null;
  if (metadataDoc?.file_url?.startsWith("data:application/json;base64,")) {
    const base64 = metadataDoc.file_url.split(",")[1] || "";
    try {
      const json = Buffer.from(base64, "base64").toString("utf-8");
      metadata = JSON.parse(json) as Record<string, unknown>;
    } catch {
      metadata = null;
    }
  }

  const imageUrls = getOrderedImageUrls(
    vehicle?.vehicle_images as
      | { url?: string; display_order?: number; is_primary?: boolean }[]
      | undefined
  );

  const docsArr = (documents ?? []) as any[];
  const buyerItems = docsArr
    .filter((d: any) => String(d.file_name || "").startsWith("buyer-"))
    .map((d: any) => ({ id: String(d.id), url: String(d.file_url) }))
    .filter((x: any) => x.id && x.url);
  const sellerItems = docsArr
    .filter((d: any) => String(d.file_name || "").startsWith("seller-"))
    .map((d: any) => ({ id: String(d.id), url: String(d.file_url) }))
    .filter((x: any) => x.id && x.url);
  const chassisDoc = docsArr.find((d: any) =>
    String(d.file_name || "").startsWith("chassis-")
  );
  const chassisImage =
    chassisDoc?.id && chassisDoc?.file_url
      ? { id: String(chassisDoc.id), url: String(chassisDoc.file_url) }
      : null;
  const vehicleDocs = docsArr
    .filter((d: any) => {
      if (d.id === metadataDoc?.id) return false;
      const name = String(d.file_name || "");
      if (
        name.startsWith("buyer-") ||
        name.startsWith("seller-") ||
        name.startsWith("chassis-")
      )
        return false;
      return true;
    })
    .map((d: any) => ({
      id: String(d.id),
      url: String(d.file_url),
      type: String(d.document_type || "other"),
      name: String(d.file_name || "Document"),
    }))
    .filter((x: any) => x.id && x.url);

  const initial = buildInitial(vehicle, metadata, imageUrls, {
    buyerItems,
    sellerItems,
    chassisImage,
    vehicleDocs,
  });
  const vehicleLabel = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  return (
    <EditVehicleClient
      vehicleId={vehicle.id}
      initial={initial}
      vehicleLabel={vehicleLabel}
    />
  );
}
