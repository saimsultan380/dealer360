"use server";

import { createClient } from "@/lib/supabase/server";

export type SearchCategory =
  | "all"
  | "vehicles"
  | "deals"
  | "clients"
  | "investors"
  | "leads"
  | "cash_flow"
  | "financing";

export interface SearchResult {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle: string;
  meta?: string;
  link: string;
  icon: string; // icon identifier for the client
}

export async function globalSearch(
  query: string,
  category: SearchCategory = "all",
  limit: number = 8
): Promise<{ results: SearchResult[]; error: string | null }> {
  if (!query || query.trim().length < 2) {
    return { results: [], error: null };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { results: [], error: "Not authenticated" };

  const { data: profileData } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const profile = profileData as { organization_id: string | null } | null;

  if (!profile?.organization_id) {
    return { results: [], error: "No organization found" };
  }

  const orgId = profile.organization_id;
  const q = query.trim().toLowerCase();
  const ilike = `%${q}%`;
  const results: SearchResult[] = [];

  const searches: Promise<void>[] = [];

  // Helper: Supabase .or() with ilike returns untyped rows, so we use `as any[]`
  // to avoid TS inference issues while keeping the runtime correct.

  // -- Vehicles --
  if (category === "all" || category === "vehicles") {
    searches.push(
      (async () => {
        const { data } = await supabase
          .from("vehicles")
          .select(
            "id, make, model, variant, year, color, status, registration_number, selling_price"
          )
          .eq("organization_id", orgId)
          .or(
            `make.ilike.${ilike},model.ilike.${ilike},variant.ilike.${ilike},registration_number.ilike.${ilike},color.ilike.${ilike}`
          )
          .limit(limit) as { data: Record<string, unknown>[] | null };

        if (data) {
          for (const v of data) {
            results.push({
              id: String(v.id),
              category: "vehicles",
              title: `${v.year} ${v.make} ${v.model}${v.variant ? ` ${v.variant}` : ""}`,
              subtitle: `${String(v.status || "N/A").toUpperCase()} ${v.color ? `• ${v.color}` : ""} ${v.registration_number ? `• ${v.registration_number}` : ""}`,
              meta: v.selling_price
                ? `PKR ${Number(v.selling_price).toLocaleString()}`
                : undefined,
              link: `/dashboard/inventory/${v.id}`,
              icon: "car",
            });
          }
        }
      })()
    );
  }

  // -- Deals --
  if (category === "all" || category === "deals") {
    searches.push(
      (async () => {
        const { data } = await supabase
          .from("deals")
          .select(
            "id, customer_name, customer_phone, sale_price, status, deal_date"
          )
          .eq("organization_id", orgId)
          .or(
            `customer_name.ilike.${ilike},customer_phone.ilike.${ilike},customer_cnic.ilike.${ilike}`
          )
          .limit(limit) as { data: Record<string, unknown>[] | null };

        if (data) {
          for (const d of data) {
            results.push({
              id: String(d.id),
              category: "deals",
              title: String(d.customer_name),
              subtitle: `${String(d.status || "N/A").toUpperCase()} • ${d.deal_date ? new Date(String(d.deal_date)).toLocaleDateString() : ""}`,
              meta: d.sale_price
                ? `PKR ${Number(d.sale_price).toLocaleString()}`
                : undefined,
              link: `/dashboard/deals/${d.id}`,
              icon: "handshake",
            });
          }
        }
      })()
    );
  }

  // -- Clients --
  if (category === "all" || category === "clients") {
    searches.push(
      (async () => {
        const { data } = await supabase
          .from("clients")
          .select("id, name, phone, email, cnic, status")
          .eq("organization_id", orgId)
          .or(
            `name.ilike.${ilike},phone.ilike.${ilike},email.ilike.${ilike},cnic.ilike.${ilike}`
          )
          .limit(limit) as { data: Record<string, unknown>[] | null };

        if (data) {
          for (const c of data) {
            results.push({
              id: String(c.id),
              category: "clients",
              title: String(c.name),
              subtitle: `${String(c.status || "N/A").toUpperCase()} ${c.phone ? `• ${c.phone}` : ""} ${c.email ? `• ${c.email}` : ""}`,
              link: `/dashboard/clients/${c.id}`,
              icon: "user",
            });
          }
        }
      })()
    );
  }

  // -- Investors --
  if (category === "all" || category === "investors") {
    searches.push(
      (async () => {
        const { data } = await supabase
          .from("investors")
          .select("id, name, phone, email, cnic, status")
          .eq("organization_id", orgId)
          .or(
            `name.ilike.${ilike},phone.ilike.${ilike},email.ilike.${ilike},cnic.ilike.${ilike}`
          )
          .limit(limit) as { data: Record<string, unknown>[] | null };

        if (data) {
          for (const i of data) {
            results.push({
              id: String(i.id),
              category: "investors",
              title: String(i.name),
              subtitle: `${String(i.status || "N/A").toUpperCase()} ${i.phone ? `• ${i.phone}` : ""}`,
              link: `/dashboard/investors/${i.id}`,
              icon: "building",
            });
          }
        }
      })()
    );
  }

  // -- Leads --
  if (category === "all" || category === "leads") {
    searches.push(
      (async () => {
        const { data } = await supabase
          .from("leads")
          .select(
            "id, customer_name, customer_phone, customer_email, source, status, priority"
          )
          .eq("organization_id", orgId)
          .or(
            `customer_name.ilike.${ilike},customer_phone.ilike.${ilike},customer_email.ilike.${ilike}`
          )
          .limit(limit) as { data: Record<string, unknown>[] | null };

        if (data) {
          for (const l of data) {
            results.push({
              id: String(l.id),
              category: "leads",
              title: String(l.customer_name),
              subtitle: `${String(l.status || "N/A").toUpperCase()} • ${String(l.priority || "").toUpperCase()} ${l.source ? `• ${l.source}` : ""}`,
              link: `/dashboard/leads/${l.id}`,
              icon: "users",
            });
          }
        }
      })()
    );
  }

  // -- Cash Flow --
  if (category === "all" || category === "cash_flow") {
    searches.push(
      (async () => {
        const { data } = await supabase
          .from("cash_transactions")
          .select(
            "id, description, amount, transaction_type, status, reference_number, transaction_date"
          )
          .eq("organization_id", orgId)
          .or(
            `description.ilike.${ilike},reference_number.ilike.${ilike}`
          )
          .limit(limit) as { data: Record<string, unknown>[] | null };

        if (data) {
          for (const ct of data) {
            results.push({
              id: String(ct.id),
              category: "cash_flow",
              title: String(ct.description || "Transaction"),
              subtitle: `${String(ct.transaction_type || "").replace("_", " ").toUpperCase()} • ${String(ct.status || "").toUpperCase()} • ${ct.transaction_date ? new Date(String(ct.transaction_date)).toLocaleDateString() : ""}`,
              meta: ct.amount
                ? `PKR ${Number(ct.amount).toLocaleString()}`
                : undefined,
              link: `/dashboard/cash-flow/${ct.id}`,
              icon: "wallet",
            });
          }
        }
      })()
    );
  }

  // -- Financing --
  if (category === "all" || category === "financing") {
    searches.push(
      (async () => {
        const { data } = await supabase
          .from("financing_loans")
          .select(
            "id, bank_name, bank_reference_number, contact_person, principal_amount, status"
          )
          .eq("organization_id", orgId)
          .or(
            `bank_name.ilike.${ilike},bank_reference_number.ilike.${ilike},contact_person.ilike.${ilike}`
          )
          .limit(limit) as { data: Record<string, unknown>[] | null };

        if (data) {
          for (const f of data) {
            results.push({
              id: String(f.id),
              category: "financing",
              title: String(f.bank_name || "Financing Agreement"),
              subtitle: `${String(f.status || "N/A").toUpperCase()} ${f.contact_person ? `• ${f.contact_person}` : ""} ${f.bank_reference_number ? `• Ref: ${f.bank_reference_number}` : ""}`,
              meta: f.principal_amount
                ? `PKR ${Number(f.principal_amount).toLocaleString()}`
                : undefined,
              link: `/dashboard/financing/${f.id}`,
              icon: "landmark",
            });
          }
        }
      })()
    );
  }

  await Promise.all(searches);

  return { results, error: null };
}
