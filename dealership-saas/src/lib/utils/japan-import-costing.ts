export function calculateImportCosting(params: {
  jpy_to_pkr_rate: number;
  fob_price_jpy?: number | null;
  auction_fee_jpy?: number | null;
  inland_transport_jpy?: number | null;
  freight_pkr?: number | null;
  duty_pkr?: number | null;
  tax_pkr?: number | null;
  agent_fee_pkr?: number | null;
  port_charges_pkr?: number | null;
  repairs_pkr?: number | null;
  misc_pkr?: number | null;
  profit_margin_pkr?: number | null;
  profit_margin_percent?: number | null;
}) {
  const rate = params.jpy_to_pkr_rate || 0;
  const jpyCosts =
    (params.fob_price_jpy ?? 0) +
    (params.auction_fee_jpy ?? 0) +
    (params.inland_transport_jpy ?? 0);
  const jpyCostsPkr = jpyCosts * rate;

  const pkrCosts =
    (params.freight_pkr ?? 0) +
    (params.duty_pkr ?? 0) +
    (params.tax_pkr ?? 0) +
    (params.agent_fee_pkr ?? 0) +
    (params.port_charges_pkr ?? 0) +
    (params.repairs_pkr ?? 0) +
    (params.misc_pkr ?? 0);

  const landedCost = jpyCostsPkr + pkrCosts;

  const profitPkr =
    params.profit_margin_pkr !== null && params.profit_margin_pkr !== undefined
      ? params.profit_margin_pkr
      : params.profit_margin_percent
        ? (landedCost * params.profit_margin_percent) / 100
        : 0;

  const targetSalePrice = landedCost + profitPkr;

  return {
    jpyCosts,
    jpyCostsPkr,
    pkrCosts,
    landedCost,
    profitPkr,
    targetSalePrice,
  };
}

