"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, DollarSign } from "lucide-react";
import { createFinancingLoan } from "@/lib/actions/financing-loans";
import { calculateEMI } from "@/lib/utils/financing-calculations";
import { useRouter } from "next/navigation";

const financingSchema = z.object({
  financing_type: z.enum(["finance", "lease"]),
  principal_amount: z.number().positive("Principal amount must be positive"),
  down_payment: z.number().min(0, "Down payment cannot be negative"),
  annual_interest_rate: z
    .number()
    .min(0)
    .max(50, "Interest rate must be 0-50%"),
  loan_tenure_months: z
    .number()
    .int()
    .min(1)
    .max(360, "Tenure must be 1-360 months"),
  vehicle_id: z.string().min(1, "Please select a vehicle"),
  customer_id: z.string().optional(),
  sale_id: z.string().optional(),
  bank_name: z.string().optional(),
  bank_reference_number: z.string().optional(),
  contact_person: z.string().optional(),
  contact_number: z.string().optional(),
  terms_and_conditions: z.string().optional(),
  notes: z.string().optional(),
});

type FinancingFormData = z.infer<typeof financingSchema>;

interface FinancingFormProps {
  vehicles: Array<{ id: string; make: string; model: string; year: number }>;
  customers?: Array<{ id: string; name: string }>;
  initialData?: Partial<FinancingFormData>;
  onSubmit?: (data: FinancingFormData) => void;
}

export function FinancingForm({
  vehicles,
  customers = [],
  initialData,
  onSubmit,
}: FinancingFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculatedEMI, setCalculatedEMI] = useState<number | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<FinancingFormData>({
    resolver: zodResolver(financingSchema),
    defaultValues: initialData || {
      financing_type: "finance",
      annual_interest_rate: 12,
    },
  });

  const principal = watch("principal_amount");
  const downPayment = watch("down_payment");
  const rate = watch("annual_interest_rate");
  const months = watch("loan_tenure_months");

  // Calculate EMI whenever inputs change
  useEffect(() => {
    if (principal && months && rate !== undefined) {
      const loanAmount = principal - (downPayment || 0);
      if (loanAmount > 0) {
        const emi = calculateEMI(loanAmount, rate, months);
        setCalculatedEMI(emi);
      }
    }
  }, [principal, downPayment, rate, months]);

  const onFormSubmit = async (data: FinancingFormData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await createFinancingLoan(data);
      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/dashboard/financing/${result.data?.id}`);
      }
    } catch (err) {
      setError("Failed to create financing loan");
    } finally {
      setLoading(false);
    }
  };

  const loanAmount = principal ? principal - (downPayment || 0) : 0;
  const totalPayable = calculatedEMI ? calculatedEMI * months : 0;
  const totalInterest = totalPayable - loanAmount;

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Financing Type */}
        <Card>
          <CardHeader>
            <CardTitle>Financing Type</CardTitle>
            <CardDescription>Choose between finance or lease</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="financing_type">Type *</Label>
                <Select
                  defaultValue={initialData?.financing_type || "finance"}
                  onValueChange={(value) =>
                    setValue("financing_type", value as "finance" | "lease")
                  }
                >
                  <SelectTrigger id="financing_type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="lease">Lease</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle_id">Vehicle *</Label>
                <Select
                  onValueChange={(value) => setValue("vehicle_id", value)}
                >
                  <SelectTrigger id="vehicle_id" className="w-full">
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.year} {v.make} {v.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.vehicle_id && (
                  <p className="text-sm text-red-500">
                    {errors.vehicle_id.message}
                  </p>
                )}
              </div>
            </div>

            {customers.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="customer_id">Customer</Label>
                <Select
                  onValueChange={(value) => setValue("customer_id", value)}
                >
                  <SelectTrigger id="customer_id" className="w-full">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loan Amount Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Loan Amount Details
            </CardTitle>
            <CardDescription>
              Enter principal amount and down payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="principal_amount">
                  Principal Amount (PKR) *
                </Label>
                <Input
                  id="principal_amount"
                  type="number"
                  placeholder="2,500,000"
                  {...register("principal_amount", { valueAsNumber: true })}
                  className={errors.principal_amount ? "border-red-500" : ""}
                />
                {errors.principal_amount && (
                  <p className="text-sm text-red-500">
                    {errors.principal_amount.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="down_payment">Down Payment (PKR)</Label>
                <Input
                  id="down_payment"
                  type="number"
                  placeholder="500,000"
                  {...register("down_payment", { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Calculated Loan Amount */}
            {loanAmount > 0 && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
                <p className="text-sm text-muted-foreground">
                  Loan Amount:{" "}
                  <span className="font-semibold text-blue-700 dark:text-blue-300">
                    PKR {loanAmount.toLocaleString()}
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interest & Tenure */}
        <Card>
          <CardHeader>
            <CardTitle>Interest & Tenure</CardTitle>
            <CardDescription>
              Set interest rate and loan duration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="annual_interest_rate">
                  Annual Interest Rate (%) *
                </Label>
                <Input
                  id="annual_interest_rate"
                  type="number"
                  placeholder="12"
                  step="0.5"
                  {...register("annual_interest_rate", { valueAsNumber: true })}
                  className={
                    errors.annual_interest_rate ? "border-red-500" : ""
                  }
                />
                {errors.annual_interest_rate && (
                  <p className="text-sm text-red-500">
                    {errors.annual_interest_rate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="loan_tenure_months">Tenure (Months) *</Label>
                <Input
                  id="loan_tenure_months"
                  type="number"
                  placeholder="60"
                  {...register("loan_tenure_months", { valueAsNumber: true })}
                  className={errors.loan_tenure_months ? "border-red-500" : ""}
                />
                {errors.loan_tenure_months && (
                  <p className="text-sm text-red-500">
                    {errors.loan_tenure_months.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* EMI Calculation */}
        {calculatedEMI && (
          <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
            <CardHeader>
              <CardTitle className="text-green-900 dark:text-green-100">
                EMI Calculation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly EMI</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300 font-figures tabular-nums">
                    PKR {calculatedEMI.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Payable</p>
                  <p className="text-2xl font-bold font-figures tabular-nums">
                    PKR {totalPayable.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Interest
                  </p>
                  <p className="text-2xl font-bold font-figures tabular-nums">
                    PKR {totalInterest.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle>Bank/Lender Details</CardTitle>
            <CardDescription>Optional: Add lender information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank/Lender Name</Label>
                <Input
                  id="bank_name"
                  placeholder="HBL / UBL / Private Lender"
                  {...register("bank_name")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_reference_number">
                  Bank Reference Number
                </Label>
                <Input
                  id="bank_reference_number"
                  placeholder="HBL-2024-001234"
                  {...register("bank_reference_number")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  placeholder="Manager name"
                  {...register("contact_person")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_number">Contact Number</Label>
                <Input
                  id="contact_number"
                  placeholder="03001234567"
                  {...register("contact_number")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms & Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Terms, conditions, and notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="terms_and_conditions">Terms & Conditions</Label>
              <Textarea
                id="terms_and_conditions"
                placeholder="Enter terms and conditions..."
                rows={3}
                {...register("terms_and_conditions")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes..."
                rows={3}
                {...register("notes")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Creating..." : "Create Financing"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
