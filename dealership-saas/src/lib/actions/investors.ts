"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Investor, InvestmentTransaction } from "@/lib/types/database";

export interface InvestorWithBalance extends Investor {
  balance: number;
  total_invested: number;
  total_withdrawn: number;
}

export interface InvestorFormData {
  name: string;
  email?: string;
  phone: string;
  cnic?: string;
  address?: string;
  avatar_url?: string;
  status?: "active" | "inactive" | "closed";
  notes?: string;
}

export interface InvestmentTransactionFormData {
  investor_id: string;
  transaction_type: "investment" | "withdrawal";
  amount: number;
  currency?: string;
  payment_method?:
    | "cash"
    | "bank_transfer"
    | "easypaisa"
    | "jazzcash"
    | "cheque";
  transaction_reference?: string;
  transaction_date: string;
  status?: "pending" | "completed" | "cancelled";
  notes?: string;
}

export async function getInvestors(): Promise<{
  data: InvestorWithBalance[] | null;
  error: string | null;
}> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      supabaseUrl.includes("your-project-id.supabase.co")
    ) {
      // Return mock data for development
      const mockInvestors: InvestorWithBalance[] = [
        {
          id: "mock-1",
          organization_id: "mock-org",
          name: "Ahmed Khan",
          email: "ahmed@example.com",
          phone: "+92 300 1234567",
          cnic: "35201-1234567-1",
          address: "Lahore, Pakistan",
          avatar_url: null,
          status: "active",
          notes: "Regular investor",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          balance: 500000,
          total_invested: 1000000,
          total_withdrawn: 500000,
        },
      ];

      return {
        data: mockInvestors,
        error: null,
      };
    }

    const supabase = (await createClient()) as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Return empty state so UI can render without hard error
      return { data: [], error: null };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      // Return empty state so UI can render without hard error
      return { data: [], error: null };
    }

    // Fetch investors
    const { data: investors, error: investorsError } = await supabase
      .from("investors")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    if (investorsError) {
      console.error("Error fetching investors:", investorsError);
      return { data: null, error: investorsError.message };
    }

    // Calculate balances for each investor
    const investorsWithBalance: InvestorWithBalance[] = await Promise.all(
      (investors || []).map(async (investor: any) => {
        // Get all transactions for this investor
        const { data: transactions } = await supabase
          .from("investment_transactions")
          .select("transaction_type, amount, status")
          .eq("investor_id", investor.id)
          .eq("status", "completed");

        let total_invested = 0;
        let total_withdrawn = 0;

        (transactions || []).forEach((tx: any) => {
          if (tx.transaction_type === "investment") {
            total_invested += parseFloat(tx.amount || "0");
          } else if (tx.transaction_type === "withdrawal") {
            total_withdrawn += parseFloat(tx.amount || "0");
          }
        });

        const balance = total_invested - total_withdrawn;

        return {
          ...investor,
          balance,
          total_invested,
          total_withdrawn,
        };
      })
    );

    return {
      data: investorsWithBalance,
      error: null,
    };
  } catch (err) {
    console.error("Error in getInvestors:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to fetch investors.",
    };
  }
}

export async function getInvestorById(
  id: string
): Promise<{ data: InvestorWithBalance | null; error: string | null }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      supabaseUrl.includes("your-project-id.supabase.co")
    ) {
      // Return mock data for development
      const mockInvestor: InvestorWithBalance = {
        id: id,
        organization_id: "mock-org",
        name: "Ahmed Khan",
        email: "ahmed@example.com",
        phone: "+92 300 1234567",
        cnic: "35201-1234567-1",
        address: "Lahore, Pakistan",
        avatar_url: null,
        status: "active",
        notes: "Regular investor",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        balance: 500000,
        total_invested: 1000000,
        total_withdrawn: 500000,
      };

      return {
        data: mockInvestor,
        error: null,
      };
    }

    const supabase = (await createClient()) as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: "Unauthorized" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return { data: null, error: "No organization found" };
    }

    // Fetch investor
    const { data: investor, error: investorError } = await supabase
      .from("investors")
      .select("*")
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (investorError || !investor) {
      return { data: null, error: "Investor not found" };
    }

    // Calculate balance
    const { data: transactions } = await supabase
      .from("investment_transactions")
      .select("transaction_type, amount, status")
      .eq("investor_id", id)
      .eq("status", "completed");

    let total_invested = 0;
    let total_withdrawn = 0;

    (transactions || []).forEach((tx: any) => {
      if (tx.transaction_type === "investment") {
        total_invested += parseFloat(tx.amount || "0");
      } else if (tx.transaction_type === "withdrawal") {
        total_withdrawn += parseFloat(tx.amount || "0");
      }
    });

    const balance = total_invested - total_withdrawn;

    return {
      data: {
        ...investor,
        balance,
        total_invested,
        total_withdrawn,
      },
      error: null,
    };
  } catch (err) {
    console.error("Error in getInvestorById:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to fetch investor.",
    };
  }
}

export async function createInvestor(
  data: InvestorFormData
): Promise<{ data: Investor | null; error: string | null }> {
  try {
    const supabase = (await createClient()) as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: "Unauthorized" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return { data: null, error: "No organization found" };
    }

    const { data: investor, error: investorError } = await supabase
      .from("investors")
      .insert({
        organization_id: profile.organization_id,
        name: data.name,
        email: data.email || null,
        phone: data.phone,
        cnic: data.cnic || null,
        address: data.address || null,
        avatar_url: data.avatar_url || null,
        status: data.status || "active",
        notes: data.notes || null,
      })
      .select()
      .single();

    if (investorError) {
      console.error("Error creating investor:", investorError);
      return { data: null, error: investorError.message };
    }

    revalidatePath("/dashboard/investors");
    return { data: investor, error: null };
  } catch (err) {
    console.error("Error in createInvestor:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to create investor.",
    };
  }
}

export async function updateInvestor(
  id: string,
  data: Partial<InvestorFormData>
): Promise<{ data: Investor | null; error: string | null }> {
  try {
    const supabase = (await createClient()) as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: "Unauthorized" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return { data: null, error: "No organization found" };
    }

    const { data: investor, error: investorError } = await supabase
      .from("investors")
      .update({
        ...data,
      })
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .select()
      .single();

    if (investorError) {
      console.error("Error updating investor:", investorError);
      return { data: null, error: investorError.message };
    }

    revalidatePath("/dashboard/investors");
    revalidatePath(`/dashboard/investors/${id}`);
    return { data: investor, error: null };
  } catch (err) {
    console.error("Error in updateInvestor:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to update investor.",
    };
  }
}

export async function deleteInvestor(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = (await createClient()) as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return { success: false, error: "No organization found" };
    }

    const { error } = await supabase
      .from("investors")
      .delete()
      .eq("id", id)
      .eq("organization_id", profile.organization_id);

    if (error) {
      console.error("Error deleting investor:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/investors");
    return { success: true, error: null };
  } catch (err) {
    console.error("Error in deleteInvestor:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete investor.",
    };
  }
}

export async function getInvestorTransactions(
  investorId: string
): Promise<{ data: InvestmentTransaction[] | null; error: string | null }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      supabaseUrl.includes("your-project-id.supabase.co")
    ) {
      // Return mock data for development
      const mockTransactions: InvestmentTransaction[] = [
        {
          id: "mock-tx-1",
          organization_id: "mock-org",
          investor_id: investorId,
          transaction_type: "investment",
          amount: 1000000,
          currency: "PKR",
          payment_method: "bank_transfer",
          transaction_reference: "TXN-001",
          transaction_date: new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          status: "completed",
          notes: "Initial investment",
          created_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "mock-tx-2",
          organization_id: "mock-org",
          investor_id: investorId,
          transaction_type: "withdrawal",
          amount: 500000,
          currency: "PKR",
          payment_method: "cash",
          transaction_reference: "WD-001",
          transaction_date: new Date(
            Date.now() - 10 * 24 * 60 * 60 * 1000
          ).toISOString(),
          status: "completed",
          notes: "Partial withdrawal",
          created_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      return {
        data: mockTransactions,
        error: null,
      };
    }

    const supabase = (await createClient()) as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: "Unauthorized" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return { data: null, error: "No organization found" };
    }

    const { data: transactions, error: transactionsError } = await supabase
      .from("investment_transactions")
      .select("*")
      .eq("investor_id", investorId)
      .eq("organization_id", profile.organization_id)
      .order("transaction_date", { ascending: false });

    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError);
      return { data: null, error: transactionsError.message };
    }

    return { data: transactions || [], error: null };
  } catch (err) {
    console.error("Error in getInvestorTransactions:", err);
    return {
      data: null,
      error:
        err instanceof Error ? err.message : "Failed to fetch transactions.",
    };
  }
}

export async function createInvestmentTransaction(
  data: InvestmentTransactionFormData
): Promise<{ data: InvestmentTransaction | null; error: string | null }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      supabaseUrl.includes("your-project-id.supabase.co")
    ) {
      // Return mock data for development
      const mockTransaction: InvestmentTransaction = {
        id: `mock-tx-${Date.now()}`,
        organization_id: "mock-org",
        investor_id: data.investor_id,
        transaction_type: data.transaction_type,
        amount: data.amount,
        currency: data.currency || "PKR",
        payment_method: data.payment_method || null,
        transaction_reference: data.transaction_reference || null,
        transaction_date: data.transaction_date,
        status: data.status || "completed",
        notes: data.notes || null,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.warn(
        "⚠️ Supabase not configured. Transaction creation is simulated."
      );
      return {
        data: mockTransaction,
        error: null,
      };
    }

    const supabase = (await createClient()) as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: "Unauthorized" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return { data: null, error: "No organization found" };
    }

    // Verify investor belongs to organization
    const { data: investor } = await supabase
      .from("investors")
      .select("id")
      .eq("id", data.investor_id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (!investor) {
      return { data: null, error: "Investor not found" };
    }

    // For withdrawals, check if balance is sufficient
    if (data.transaction_type === "withdrawal") {
      const { data: investorData } = await getInvestorById(data.investor_id);
      if (investorData && investorData.balance < data.amount) {
        return { data: null, error: "Insufficient balance for withdrawal" };
      }
    }

    const { data: transaction, error: transactionError } = await supabase
      .from("investment_transactions")
      .insert({
        organization_id: profile.organization_id,
        investor_id: data.investor_id,
        transaction_type: data.transaction_type,
        amount: data.amount,
        currency: data.currency || "PKR",
        payment_method: data.payment_method || null,
        transaction_reference: data.transaction_reference || null,
        transaction_date: data.transaction_date,
        status: data.status || "completed",
        notes: data.notes || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
      return { data: null, error: transactionError.message };
    }

    revalidatePath("/dashboard/investors");
    revalidatePath(`/dashboard/investors/${data.investor_id}`);
    return { data: transaction, error: null };
  } catch (err) {
    console.error("Error in createInvestmentTransaction:", err);
    return {
      data: null,
      error:
        err instanceof Error ? err.message : "Failed to create transaction.",
    };
  }
}
