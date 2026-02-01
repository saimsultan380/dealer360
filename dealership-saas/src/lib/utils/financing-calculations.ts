// Client-side utility functions for EMI calculations
export function calculateEMI(
  principal: number,
  annualRate: number,
  months: number
): number {
  if (months === 0 || annualRate === 0) return principal / months;
  
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPower = Math.pow(1 + monthlyRate, months);
  const emi = (principal * monthlyRate * monthlyPower) / (monthlyPower - 1);
  
  return Math.round(emi * 100) / 100;
}

export function calculateTotalInterest(emiAmount: number, months: number, principal: number): number {
  return Math.round((emiAmount * months - principal) * 100) / 100;
}

export function calculateOutstandingBalance(
  originalLoan: number,
  emiAmount: number,
  paymentsMade: number
): number {
  return Math.max(0, Math.round((originalLoan - emiAmount * paymentsMade) * 100) / 100);
}
