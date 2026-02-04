"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { VehicleFormData } from "@/lib/types/vehicle";
import { findOrCreateClient, createClientTransaction } from "./clients";

export async function getVehicles({
  query = "",
  status = "all",
  page = 1,
  limit = 10,
}: {
  query?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Check if Supabase is configured
    const isSupabaseConfigured =
      supabaseUrl &&
      supabaseAnonKey &&
      !supabaseUrl.includes("your-project-id.supabase.co") &&
      supabaseUrl.startsWith("http");

    if (!isSupabaseConfigured) {
      // Return mock data for development when Supabase is not configured
      const mockVehicles = [
        {
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
          description:
            "Well maintained Toyota Corolla in excellent condition. Mock data for testing.",
          added_by: "mock-user-1",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          vehicle_images: [
            {
              id: "mock-img-1",
              vehicle_id: "mock-vehicle-1",
              url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400",
              is_primary: true,
              created_at: new Date().toISOString(),
            },
          ],
        },
        {
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
          description:
            "Honda Civic RS with premium features. Mock data for testing.",
          added_by: "mock-user-1",
          created_at: new Date(
            Date.now() - 5 * 24 * 60 * 60 * 1000
          ).toISOString(),
          updated_at: new Date(
            Date.now() - 5 * 24 * 60 * 60 * 1000
          ).toISOString(),
          vehicle_images: [
            {
              id: "mock-img-2",
              vehicle_id: "mock-vehicle-2",
              url: "https://images.unsplash.com/photo-1606664515524-ed2f786a0ad6?w=400",
              is_primary: true,
              created_at: new Date().toISOString(),
            },
          ],
        },
        {
          id: "mock-vehicle-3",
          organization_id: "mock-org-1",
          make: "Suzuki",
          model: "Alto",
          variant: "VXR",
          year: 2024,
          color: "Silver",
          registration_number: "ISB-9012",
          engine_number: "ENG-003",
          chassis_number: "CHS-003",
          purchase_price: 1200000,
          selling_price: 1500000,
          minimum_price: 1400000,
          status: "available",
          condition: "new",
          mileage: 5000,
          fuel_type: "petrol",
          transmission: "manual",
          description: "Brand new Suzuki Alto VXR. Mock data for testing.",
          added_by: "mock-user-1",
          created_at: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000
          ).toISOString(),
          updated_at: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000
          ).toISOString(),
          vehicle_images: [
            {
              id: "mock-img-3",
              vehicle_id: "mock-vehicle-3",
              url: "https://images.unsplash.com/photo-1606664515524-ed2f786a0ad6?w=400",
              is_primary: true,
              created_at: new Date().toISOString(),
            },
          ],
        },
        {
          id: "mock-vehicle-4",
          organization_id: "mock-org-1",
          make: "Toyota",
          model: "Camry",
          variant: "Hybrid",
          year: 2023,
          color: "Blue",
          registration_number: "LHR-3456",
          engine_number: "ENG-004",
          chassis_number: "CHS-004",
          purchase_price: 4500000,
          selling_price: 5500000,
          minimum_price: 5200000,
          status: "sold",
          condition: "used",
          mileage: 18000,
          fuel_type: "hybrid",
          transmission: "automatic",
          description:
            "Toyota Camry Hybrid - recently sold. Mock data for testing.",
          added_by: "mock-user-1",
          created_at: new Date(
            Date.now() - 10 * 24 * 60 * 60 * 1000
          ).toISOString(),
          updated_at: new Date(
            Date.now() - 1 * 24 * 60 * 60 * 1000
          ).toISOString(),
          vehicle_images: [
            {
              id: "mock-img-4",
              vehicle_id: "mock-vehicle-4",
              url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400",
              is_primary: true,
              created_at: new Date().toISOString(),
            },
          ],
        },
        {
          id: "mock-vehicle-5",
          organization_id: "mock-org-1",
          make: "Honda",
          model: "City",
          variant: "Aspire",
          year: 2023,
          color: "Red",
          registration_number: "KHI-7890",
          engine_number: "ENG-005",
          chassis_number: "CHS-005",
          purchase_price: 2200000,
          selling_price: 2800000,
          minimum_price: 2600000,
          status: "in_service",
          condition: "used",
          mileage: 20000,
          fuel_type: "petrol",
          transmission: "automatic",
          description:
            "Honda City Aspire currently in service. Mock data for testing.",
          added_by: "mock-user-1",
          created_at: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          updated_at: new Date(
            Date.now() - 1 * 24 * 60 * 60 * 1000
          ).toISOString(),
          vehicle_images: [
            {
              id: "mock-img-5",
              vehicle_id: "mock-vehicle-5",
              url: "https://images.unsplash.com/photo-1606664515524-ed2f786a0ad6?w=400",
              is_primary: true,
              created_at: new Date().toISOString(),
            },
          ],
        },
      ];

      // Apply filters to mock data
      let filteredVehicles = [...mockVehicles];

      // Filter by status
      if (status !== "all") {
        filteredVehicles = filteredVehicles.filter((v) => v.status === status);
      }

      // Filter by search query
      if (query) {
        const searchLower = query.toLowerCase();
        filteredVehicles = filteredVehicles.filter(
          (v) =>
            v.make.toLowerCase().includes(searchLower) ||
            v.model.toLowerCase().includes(searchLower) ||
            (v.registration_number &&
              v.registration_number.toLowerCase().includes(searchLower))
        );
      }

      // Apply pagination
      const total = filteredVehicles.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex);

      console.warn(
        "⚠️ Supabase is not configured. Using mock data for development.\n" +
          "To configure Supabase:\n" +
          "1. Create a .env.local file in the root directory\n" +
          "2. Add your Supabase credentials:\n" +
          "   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co\n" +
          "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\n" +
          "3. Restart your development server"
      );

      return {
        data: paginatedVehicles as any[],
        metadata: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        error: null,
      };
    }

    const supabase = await createClient();

    // First, check if the vehicles table exists by trying a simple query
    const { error: tableCheckError } = await supabase
      .from("vehicles")
      .select("id")
      .limit(1);

    if (tableCheckError) {
      // Table might not exist or RLS is blocking
      const errorMsg = tableCheckError.message || "Unknown error";
      console.error("Table check error:", {
        message: errorMsg,
        code: tableCheckError.code,
        details: tableCheckError.details,
        hint: tableCheckError.hint,
      });

      if (
        errorMsg.includes("relation") &&
        errorMsg.includes("does not exist")
      ) {
        return {
          data: [],
          metadata: { total: 0, page, limit, totalPages: 0 },
          error:
            "Vehicles table does not exist. Please run the SUPABASE_QUICK_SETUP.sql script in your Supabase SQL Editor.",
        };
      }

      if (
        errorMsg.includes("permission denied") ||
        errorMsg.includes("policy")
      ) {
        return {
          data: [],
          metadata: { total: 0, page, limit, totalPages: 0 },
          error:
            "Permission denied. Please check Row Level Security policies. Make sure you have run the RLS policies from SUPABASE_QUICK_SETUP.sql",
        };
      }
    }

    const offset = (page - 1) * limit;

    let dbQuery = supabase
      .from("vehicles")
      .select("*, vehicle_images(*)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== "all") {
      dbQuery = dbQuery.eq("status", status);
    }

    if (query) {
      // Use proper PostgREST filter syntax for .or() with ilike
      // Format: column.ilike.%pattern%, column2.ilike.%pattern%
      const searchPattern = `%${query}%`;
      // Escape special characters in query to prevent SQL injection
      const escapedPattern = searchPattern.replace(/'/g, "''");
      dbQuery = dbQuery.or(
        `make.ilike.${escapedPattern}, model.ilike.${escapedPattern}, registration_number.ilike.${escapedPattern}`
      );
    }

    const { data, error, count } = await dbQuery;

    if (error) {
      // Don't hard-crash the whole page; return empty data + message.
      console.error("Error fetching vehicles:", {
        message: error?.message || "Unknown error",
        details: error?.details || "No details available",
        hint: error?.hint || "No hint available",
        code: error?.code || "No error code",
        fullError: error,
      });

      // Check for common errors
      const errorMessage = error?.message || "Failed to fetch vehicles.";
      let userFriendlyMessage = errorMessage;

      if (
        errorMessage.includes("relation") &&
        errorMessage.includes("does not exist")
      ) {
        userFriendlyMessage =
          "Vehicles table does not exist. Please run the database setup SQL script.";
      } else if (
        errorMessage.includes("permission denied") ||
        errorMessage.includes("RLS")
      ) {
        userFriendlyMessage =
          "Permission denied. Please check Row Level Security policies.";
      } else if (errorMessage.includes("JWT")) {
        userFriendlyMessage =
          "Authentication error. Please check your Supabase configuration.";
      }

      return {
        data: [],
        metadata: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
        error: userFriendlyMessage,
      };
    }

    return {
      data: data || [],
      metadata: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  } catch (err) {
    // Catch network/DNS errors (e.g. ENOTFOUND) and return safe empty state.
    console.error("Error in getVehicles:", err);
    return {
      data: [],
      metadata: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
      error:
        err instanceof Error
          ? err.message
          : "Failed to fetch vehicles due to an unexpected error.",
    };
  }
}

export async function createVehicle(
  data: VehicleFormData,
  imageUrls: string[],
  party?: {
    buyerDocumentIds?: string[];
    sellerDocumentIds?: string[];
    chassisImageId?: string | null;
    accessories?: string[];
    vehicleDocumentIds?: string[];
    paymentDetails?: {
      method?: string;
      downPayment?: number | null;
      remainingAmount?: number | null;
      paymentDate?: string | null;
    };
    sellerDetails?: {
      name?: string;
      phone?: string;
      cnic?: string;
      address?: string;
      avatar_url?: string;
      party_type?: "client" | "investor";
      investor_id?: string;
    };
    buyerDetails?: {
      name?: string;
      phone?: string;
      cnic?: string;
      address?: string;
      avatar_url?: string;
      party_type?: "client" | "investor";
      investor_id?: string;
    };
    commissionDetails?: {
      amount?: number | null;
      percentage?: number | null;
      salespersonId?: string | null;
    };
    insuranceDetails?: {
      company?: string | null;
      policyNumber?: string | null;
      expiryDate?: string | null;
      amount?: number | null;
    };
    taxRegistrationDetails?: {
      roadTaxStatus?: string | null;
      roadTaxExpiryDate?: string | null;
      fitnessCertificateNumber?: string | null;
      fitnessExpiryDate?: string | null;
    };
    ownershipDetails?: {
      previousOwnerName?: string | null;
      previousOwnerPhone?: string | null;
      transferDate?: string | null;
    };
    warrantyServiceDetails?: {
      warrantyType?: string | null;
      warrantyExpiryDate?: string | null;
      warrantyDetails?: string | null;
      lastServiceDate?: string | null;
      lastServiceMileage?: number | null;
      serviceHistory?: string | null;
    };
    additionalNotes?: string | null;
  }
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check if Supabase is configured
  const isSupabaseConfigured =
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("your-project-id.supabase.co") &&
    supabaseUrl.startsWith("http");

  if (!isSupabaseConfigured) {
    // In development mode without Supabase, just redirect
    console.warn(
      "⚠️ Supabase not configured. Create vehicle action is simulated."
    );
    revalidatePath("/dashboard/inventory");
    redirect("/dashboard/inventory");
    return;
  }

  // NOTE: Supabase generated types are not fully wired up yet in this repo.
  // Cast to avoid blocking builds with `never` table inference.
  const supabase = (await createClient()) as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // get organization id
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) throw new Error("No organization found");

  // Insert vehicle
  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .insert({
      ...data,
      organization_id: profile.organization_id,
      added_by: user.id,
    })
    .select()
    .single();

  if (vehicleError) {
    console.error("Error creating vehicle:", vehicleError);
    throw new Error("Failed to create vehicle");
  }

  // Link images if any
  if (imageUrls.length > 0) {
    const rows = imageUrls.filter(Boolean).map((url, i) => ({
      organization_id: profile.organization_id,
      vehicle_id: vehicle.id,
      url,
      is_primary: i === 0,
      display_order: i,
    }));

    const { error: imagesError } = await (supabase as any)
      .from("vehicle_images")
      .insert(rows);
    if (imagesError) console.error("Error saving vehicle images:", imagesError);
  }

  const buyerDocumentIds = party?.buyerDocumentIds ?? [];
  const sellerDocumentIds = party?.sellerDocumentIds ?? [];
  const chassisImageId = party?.chassisImageId;
  const vehicleDocumentIds = party?.vehicleDocumentIds ?? [];
  const allDocIds = [
    ...buyerDocumentIds,
    ...sellerDocumentIds,
    chassisImageId,
    ...vehicleDocumentIds,
  ].filter(Boolean);

  // Link buyer/seller/chassis/vehicle documents if any (uploaded client-side with a placeholder entity_id)
  if (allDocIds.length > 0) {
    const { error: docsError } = await supabase
      .from("documents")
      .update({ entity_id: vehicle.id, entity_type: "vehicle" } as never)
      .in("id", allDocIds);

    if (docsError) console.error("Error linking documents:", docsError);
  }

  // Store additional metadata in documents table with special document_type
  // We'll use 'other' type with metadata in file_name or create a vehicle_metadata entry
  const metadata = {
    accessories: party?.accessories || [],
    paymentDetails: party?.paymentDetails || null,
    sellerDetails: party?.sellerDetails || null,
    buyerDetails: party?.buyerDetails || null,
    witnessDetails: (party as any)?.witnessDetails ?? null,
    commissionDetails: party?.commissionDetails || null,
    insuranceDetails: party?.insuranceDetails || null,
    taxRegistrationDetails: party?.taxRegistrationDetails || null,
    ownershipDetails: party?.ownershipDetails || null,
    warrantyServiceDetails: party?.warrantyServiceDetails || null,
    additionalNotes: party?.additionalNotes || null,
    importYear: (party as any)?.importYear ?? null,
    documentsAccessoriesDetails:
      (party as any)?.documentsAccessoriesDetails ?? null,
  };

  // Store metadata as a special document entry
  if (
    Object.keys(metadata).some((key) => {
      const value = (metadata as any)[key];
      return (
        value && (Array.isArray(value) ? value.length > 0 : value !== null)
      );
    })
  ) {
    try {
      await (supabase as any).from("documents").insert({
        organization_id: profile.organization_id,
        entity_type: "vehicle",
        entity_id: vehicle.id,
        document_type: "other",
        file_name: "vehicle_metadata.json",
        file_url: `data:application/json;base64,${Buffer.from(
          JSON.stringify(metadata)
        ).toString("base64")}`,
        uploaded_by: user.id,
      });
    } catch (e) {
      console.error("Error storing vehicle metadata:", e);
    }
  }

  // Automatically create clients for buyer and seller if details are provided
  try {
    // Create/Find buyer client
    if (
      party?.buyerDetails?.name &&
      party?.buyerDetails?.phone &&
      party?.buyerDetails?.party_type !== "investor"
    ) {
      try {
        const buyerResult = await findOrCreateClient(
          {
            name: party.buyerDetails.name,
            phone: party.buyerDetails.phone,
            cnic: party.buyerDetails.cnic,
            address: party.buyerDetails.address,
            avatar_url: party.buyerDetails.avatar_url,
          },
          profile.organization_id,
          supabase
        );

        if (buyerResult.data) {
          // Create client transaction if payment details exist
          if (
            party.paymentDetails &&
            (party.paymentDetails.downPayment || data.selling_price)
          ) {
            const totalAmount =
              parseFloat(data.selling_price?.toString() || "0") ||
              parseFloat(data.purchase_price?.toString() || "0");
            const paidAmount = party.paymentDetails.downPayment || 0;
            const remainingDue = totalAmount > 0 ? totalAmount - paidAmount : 0;

            if (totalAmount > 0) {
              try {
                await createClientTransaction({
                  client_id: buyerResult.data.id,
                  transaction_type: "purchase",
                  amount: totalAmount,
                  currency: "PKR",
                  payment_method: party.paymentDetails.method as any,
                  transaction_date:
                    party.paymentDetails.paymentDate ||
                    new Date().toISOString(),
                  status: "completed",
                  total_amount: totalAmount,
                  paid_amount: paidAmount,
                  remaining_due: remainingDue > 0 ? remainingDue : 0,
                  vehicle_id: vehicle.id,
                  vehicle_make: data.make,
                  vehicle_model: data.model,
                  vehicle_year: data.year,
                  notes: `Vehicle purchase: ${data.make} ${data.model} ${data.year}`,
                });
              } catch (txError) {
                console.error("Error creating buyer transaction:", txError);
                // Don't fail vehicle creation if transaction creation fails
              }
            }
          }
        }
      } catch (buyerError) {
        console.error("Error creating buyer client:", buyerError);
        // Don't fail vehicle creation if client creation fails
      }
    }

    // Create/Find seller client
    if (
      party?.sellerDetails?.name &&
      party?.sellerDetails?.phone &&
      party?.sellerDetails?.party_type !== "investor"
    ) {
      try {
        const sellerResult = await findOrCreateClient(
          {
            name: party.sellerDetails.name,
            phone: party.sellerDetails.phone,
            cnic: party.sellerDetails.cnic,
            address: party.sellerDetails.address,
            avatar_url: party.sellerDetails.avatar_url,
          },
          profile.organization_id,
          supabase
        );

        if (sellerResult.data && data.purchase_price) {
          // Create client transaction for sale (if vehicle was purchased from seller)
          try {
            await createClientTransaction({
              client_id: sellerResult.data.id,
              transaction_type: "sale",
              amount: parseFloat(data.purchase_price.toString()),
              currency: "PKR",
              payment_method: "cash", // Default, can be updated
              transaction_date: new Date().toISOString(),
              status: "completed",
              total_amount: parseFloat(data.purchase_price.toString()),
              paid_amount: parseFloat(data.purchase_price.toString()),
              remaining_due: 0,
              vehicle_id: vehicle.id,
              vehicle_make: data.make,
              vehicle_model: data.model,
              vehicle_year: data.year,
              notes: `Vehicle sale: ${data.make} ${data.model} ${data.year}`,
            });
          } catch (txError) {
            console.error("Error creating seller transaction:", txError);
            // Don't fail vehicle creation if transaction creation fails
          }
        }
      } catch (sellerError) {
        console.error("Error creating seller client:", sellerError);
        // Don't fail vehicle creation if client creation fails
      }
    }
  } catch (clientError) {
    console.error("Error in auto-creating clients:", clientError);
    // Don't fail vehicle creation if client creation fails
  }

  // Investor integration (best-effort): if seller/buyer is investor, record investment/cash transactions.
  try {
    if (
      party?.sellerDetails?.party_type === "investor" &&
      party.sellerDetails.investor_id &&
      data.purchase_price
    ) {
      // Paying an investor for vehicle purchase == withdrawal
      try {
        await (supabase as any).from("investment_transactions").insert({
          organization_id: profile.organization_id,
          investor_id: party.sellerDetails.investor_id,
          transaction_type: "withdrawal",
          amount: parseFloat(data.purchase_price.toString()),
          currency: "PKR",
          payment_method: "cash",
          transaction_reference: `VEH-${vehicle.id}`,
          transaction_date: new Date().toISOString(),
          status: "completed",
          notes: `Vehicle purchase from investor: ${data.make} ${data.model} ${data.year} (vehicle=${vehicle.id})`,
          created_by: user.id,
        });
      } catch (e) {
        console.error(
          "Error creating investor withdrawal for vehicle purchase:",
          e
        );
      }

      try {
        await (supabase as any).from("cash_transactions").insert({
          organization_id: profile.organization_id,
          transaction_type: "cash_out",
          amount: parseFloat(data.purchase_price.toString()),
          currency: "PKR",
          payment_method: "cash",
          description: `Vehicle purchase from investor (${
            party.sellerDetails.name || "Investor"
          })`,
          reference_number: `VEH-${vehicle.id}`,
          transaction_date: new Date().toISOString().slice(0, 10),
          related_entity_type: "investor",
          related_entity_id: party.sellerDetails.investor_id,
          status: "completed",
          notes: `vehicle=${vehicle.id}`,
          created_by: user.id,
        });
      } catch (e) {
        console.error(
          "Error creating cash transaction for investor vehicle purchase:",
          e
        );
      }

      // Sync investor avatar when provided from party docs
      if (party.sellerDetails.avatar_url) {
        try {
          await (supabase as any)
            .from("investors")
            .update({ avatar_url: party.sellerDetails.avatar_url })
            .eq("id", party.sellerDetails.investor_id)
            .eq("organization_id", profile.organization_id);
        } catch (e) {
          console.error("Error updating investor avatar (seller):", e);
        }
      }
    }

    if (
      party?.buyerDetails?.party_type === "investor" &&
      party.buyerDetails.investor_id &&
      data.selling_price
    ) {
      // Vehicle sold to investor (record money coming from investor) - treat as investment
      const amount =
        party.paymentDetails?.downPayment ??
        parseFloat(data.selling_price.toString());
      try {
        await (supabase as any).from("investment_transactions").insert({
          organization_id: profile.organization_id,
          investor_id: party.buyerDetails.investor_id,
          transaction_type: "investment",
          amount,
          currency: "PKR",
          payment_method: party.paymentDetails?.method || "cash",
          transaction_reference: `VEH-${vehicle.id}`,
          transaction_date:
            party.paymentDetails?.paymentDate || new Date().toISOString(),
          status: "completed",
          notes: `Vehicle sale to investor: ${data.make} ${data.model} ${data.year} (vehicle=${vehicle.id})`,
          created_by: user.id,
        });
      } catch (e) {
        console.error(
          "Error creating investor investment for vehicle sale:",
          e
        );
      }

      try {
        await (supabase as any).from("cash_transactions").insert({
          organization_id: profile.organization_id,
          transaction_type: "cash_in",
          amount,
          currency: "PKR",
          payment_method: party.paymentDetails?.method || "cash",
          description: `Vehicle sale to investor (${
            party.buyerDetails.name || "Investor"
          })`,
          reference_number: `VEH-${vehicle.id}`,
          transaction_date: (
            party.paymentDetails?.paymentDate || new Date().toISOString()
          ).slice(0, 10),
          related_entity_type: "investor",
          related_entity_id: party.buyerDetails.investor_id,
          status: "completed",
          notes: `vehicle=${vehicle.id}`,
          created_by: user.id,
        });
      } catch (e) {
        console.error(
          "Error creating cash transaction for investor vehicle sale:",
          e
        );
      }

      // Sync investor avatar when provided from party docs
      if (party.buyerDetails.avatar_url) {
        try {
          await (supabase as any)
            .from("investors")
            .update({ avatar_url: party.buyerDetails.avatar_url })
            .eq("id", party.buyerDetails.investor_id)
            .eq("organization_id", profile.organization_id);
        } catch (e) {
          console.error("Error updating investor avatar (buyer):", e);
        }
      }
    }
  } catch (e) {
    console.error("Error in investor integration for inventory:", e);
  }

  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/investors");
  redirect("/dashboard/inventory");
}

export async function updateVehicle(
  vehicleId: string,
  data: VehicleFormData,
  imageUrls: string[],
  party?: {
    buyerDocumentIds?: string[];
    sellerDocumentIds?: string[];
    chassisImageId?: string | null;
    accessories?: string[];
    vehicleDocumentIds?: string[];
    paymentDetails?: {
      method?: string;
      downPayment?: number | null;
      remainingAmount?: number | null;
      paymentDate?: string | null;
    };
    sellerDetails?: any;
    buyerDetails?: any;
    commissionDetails?: any;
    insuranceDetails?: any;
    taxRegistrationDetails?: any;
    ownershipDetails?: any;
    warrantyServiceDetails?: any;
    additionalNotes?: string | null;
  }
) {
  const supabase = (await createClient()) as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile?.organization_id) throw new Error("No organization found");

  const { error: updateError } = await supabase
    .from("vehicles")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    } as any)
    .eq("id", vehicleId)
    .eq("organization_id", profile.organization_id);

  if (updateError) {
    console.error("Error updating vehicle:", updateError);
    throw new Error(updateError.message);
  }

  // Replace vehicle images (simple + reliable)
  await (supabase as any)
    .from("vehicle_images")
    .delete()
    .eq("vehicle_id", vehicleId)
    .eq("organization_id", profile.organization_id);
  if (imageUrls.length > 0) {
    const rows = imageUrls.filter(Boolean).map((url, i) => ({
      organization_id: profile.organization_id,
      vehicle_id: vehicleId,
      url,
      is_primary: i === 0,
      display_order: i,
    }));
    const { error: imgErr } = await (supabase as any)
      .from("vehicle_images")
      .insert(rows);
    if (imgErr) console.error("Error saving vehicle images:", imgErr);
  }

  const buyerDocumentIds = party?.buyerDocumentIds ?? [];
  const sellerDocumentIds = party?.sellerDocumentIds ?? [];
  const chassisImageId = party?.chassisImageId;
  const vehicleDocumentIds = party?.vehicleDocumentIds ?? [];
  const allDocIds = [
    ...buyerDocumentIds,
    ...sellerDocumentIds,
    chassisImageId,
    ...vehicleDocumentIds,
  ].filter(Boolean);
  if (allDocIds.length > 0) {
    await (supabase as any)
      .from("documents")
      .update({ entity_id: vehicleId, entity_type: "vehicle" } as never)
      .in("id", allDocIds);
  }

  // Update (or create) metadata doc
  const metadata = {
    accessories: party?.accessories || [],
    paymentDetails: party?.paymentDetails || null,
    sellerDetails: party?.sellerDetails || null,
    buyerDetails: party?.buyerDetails || null,
    witnessDetails: (party as any)?.witnessDetails ?? null,
    commissionDetails: party?.commissionDetails || null,
    insuranceDetails: party?.insuranceDetails || null,
    taxRegistrationDetails: party?.taxRegistrationDetails || null,
    ownershipDetails: party?.ownershipDetails || null,
    warrantyServiceDetails: party?.warrantyServiceDetails || null,
    additionalNotes: party?.additionalNotes || null,
    importYear: (party as any)?.importYear ?? null,
    documentsAccessoriesDetails:
      (party as any)?.documentsAccessoriesDetails ?? null,
  };

  const metadataUrl = `data:application/json;base64,${Buffer.from(
    JSON.stringify(metadata)
  ).toString("base64")}`;
  const { data: existingMeta } = await (supabase as any)
    .from("documents")
    .select("id")
    .eq("entity_type", "vehicle")
    .eq("entity_id", vehicleId)
    .eq("file_name", "vehicle_metadata.json")
    .maybeSingle();

  if (existingMeta?.id) {
    await (supabase as any)
      .from("documents")
      .update({ file_url: metadataUrl } as any)
      .eq("id", existingMeta.id);
  } else {
    await (supabase as any).from("documents").insert({
      organization_id: profile.organization_id,
      entity_type: "vehicle",
      entity_id: vehicleId,
      document_type: "other",
      file_name: "vehicle_metadata.json",
      file_url: metadataUrl,
      uploaded_by: user.id,
    });
  }

  revalidatePath("/dashboard/inventory");
  revalidatePath(`/dashboard/inventory/${vehicleId}`);
  redirect(`/dashboard/inventory/${vehicleId}`);
}

export async function deleteVehicle(id: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check if Supabase is configured
  const isSupabaseConfigured =
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("your-project-id.supabase.co") &&
    supabaseUrl.startsWith("http");

  if (!isSupabaseConfigured) {
    // In development mode without Supabase, just return success
    console.warn("⚠️ Supabase not configured. Delete action is simulated.");
    revalidatePath("/dashboard/inventory");
    return;
  }

  // NOTE: Supabase generated types are not fully wired up yet in this repo.
  // Cast to avoid blocking builds with `never` table inference.
  const supabase = (await createClient()) as any;

  const { error } = await supabase.from("vehicles").delete().eq("id", id);

  if (error) {
    console.error("Error deleting vehicle:", error);
    throw new Error("Failed to delete vehicle");
  }

  revalidatePath("/dashboard/inventory");
}
