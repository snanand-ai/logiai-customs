import { PRIVILEGES } from "../constants/privileges";

/**
 * Calculate CIF/FOB, duty, excise, interior tax, VAT, and total tax for each line item.
 *
 * Supports 3 declaration types:
 * - IMPORT: CIF valuation → 4-tier tax cascade (duty → excise → interior → VAT)
 * - EXPORT: FOB valuation in THB, all duties = 0/FREE
 * - EPZ: Zone-to-zone transfer, all duties = 0
 *
 * The 4-tier Thai customs tax cascade for imports:
 * 1. Import Duty (อากรขาเข้า) = CIF × duty rate
 * 2. Excise Tax (ภาษีสรรพสามิต) = (CIF + duty) × excise rate
 * 3. Interior Tax (ภาษีเพื่อมหาดไทย) = excise × 10%
 * 4. VAT (ภาษีมูลค่าเพิ่ม) = (CIF + duty + excise + interior) × 7%
 *
 * @param {Array} items - Line items array
 * @param {Object} header - Shipment header with fx, freight, insurance, priv, declarationType
 * @returns {{ details: Array, totals: Object }}
 */
export function calculateDeclaration(items, header) {
  const privilege = PRIVILEGES.find((p) => p.code === header.priv) || PRIVILEGES[0];
  const declType = header.declarationType || "IMPORT";
  const isExport = declType === "EXPORT";
  const isEpz = declType === "EPZ";
  const fx = parseFloat(header.fx) || 1;
  const totalInvoiceValue = items.reduce((sum, i) => sum + i.qty * i.up, 0);
  const totalFreight = parseFloat(header.freight) || 0;
  // Auto-calculate insurance at 0.3% if not provided (import only)
  const totalInsurance = isExport
    ? 0
    : parseFloat(header.insurance) || totalInvoiceValue * 0.003;

  const details = items.map((item, idx) => {
    const amount = item.qty * item.up;

    // --- Valuation ---
    let valuationTHB;
    if (isExport) {
      // Export: FOB in THB (FX is typically 1.0 for THB-denominated exports)
      valuationTHB = amount * fx;
    } else {
      // Import / EPZ: CIF valuation
      const freightAlloc = totalInvoiceValue > 0 ? (amount / totalInvoiceValue) * totalFreight : 0;
      const insuranceAlloc = totalInvoiceValue > 0 ? (amount / totalInvoiceValue) * totalInsurance : 0;
      const cifInCurrency = amount + freightAlloc + insuranceAlloc;
      valuationTHB = cifInCurrency * fx;
      // Store allocations for display
      item._freightAlloc = freightAlloc;
      item._insuranceAlloc = insuranceAlloc;
      item._cifInCurrency = cifInCurrency;
    }

    // --- Tax Cascade (imports only; exports & EPZ = all zero) ---
    const normalDutyRate = parseFloat(item.duty) || 0;
    let appliedDutyRate, dutyAmount, exciseRate, exciseAmount, interiorAmount, vatBase, vatAmount, totalTax;

    if (isExport || isEpz) {
      // Export & EPZ: no taxes
      appliedDutyRate = 0;
      dutyAmount = 0;
      exciseRate = 0;
      exciseAmount = 0;
      interiorAmount = 0;
      vatBase = 0;
      vatAmount = 0;
      totalTax = 0;
    } else {
      // Import: 4-tier cascade
      appliedDutyRate = normalDutyRate * privilege.dutyMultiplier;
      dutyAmount = valuationTHB * (appliedDutyRate / 100);

      // Excise tax (ภาษีสรรพสามิต) — per-item rate, common for batteries, alcohol, etc.
      exciseRate = parseFloat(item.exciseRate) || 0;
      const exciseBase = valuationTHB + dutyAmount;
      exciseAmount = exciseBase * (exciseRate / 100);

      // Interior tax (ภาษีเพื่อมหาดไทย) = 10% of excise
      interiorAmount = exciseAmount * 0.10;

      // VAT = 7% of (CIF + duty + excise + interior)
      vatBase = valuationTHB + dutyAmount + exciseAmount + interiorAmount;
      vatAmount = vatBase * 0.07 * privilege.vatMultiplier;

      totalTax = dutyAmount + exciseAmount + interiorAmount + vatAmount;
    }

    return {
      ...item,
      lineNo: idx + 1,
      amount,
      freightAlloc: item._freightAlloc || 0,
      insuranceAlloc: item._insuranceAlloc || 0,
      cifInCurrency: item._cifInCurrency || amount,
      cifTHB: valuationTHB,
      normalDutyRate,
      appliedDutyRate,
      dutyAmount,
      exciseRate,
      exciseAmount,
      interiorAmount,
      vatBase,
      vatAmount,
      totalTax,
    };
  });

  // Clean up temp props
  items.forEach((item) => {
    delete item._freightAlloc;
    delete item._insuranceAlloc;
    delete item._cifInCurrency;
  });

  const totals = {
    cif: details.reduce((s, i) => s + i.cifTHB, 0),
    duty: details.reduce((s, i) => s + i.dutyAmount, 0),
    excise: details.reduce((s, i) => s + i.exciseAmount, 0),
    interior: details.reduce((s, i) => s + i.interiorAmount, 0),
    vat: details.reduce((s, i) => s + i.vatAmount, 0),
    tax: details.reduce((s, i) => s + i.totalTax, 0),
    invoiceValue: totalInvoiceValue,
  };

  // Normal rates (for savings calculation)
  if (!isExport && !isEpz) {
    totals.normalDuty = details.reduce((s, i) => s + i.cifTHB * (i.normalDutyRate / 100), 0);
    const normalExcise = details.reduce((s, i) => {
      const d = i.cifTHB * (i.normalDutyRate / 100);
      return s + (i.cifTHB + d) * ((parseFloat(i.exciseRate) || 0) / 100);
    }, 0);
    const normalInterior = normalExcise * 0.10;
    totals.normalVat = details.reduce((s, i) => {
      const d = i.cifTHB * (i.normalDutyRate / 100);
      const e = (i.cifTHB + d) * ((parseFloat(i.exciseRate) || 0) / 100);
      const it = e * 0.10;
      return s + (i.cifTHB + d + e + it) * 0.07;
    }, 0);
    totals.normalTax = totals.normalDuty + normalExcise + normalInterior + totals.normalVat;
    totals.savings = totals.normalTax - totals.tax;
  } else {
    totals.normalDuty = 0;
    totals.normalVat = 0;
    totals.normalTax = 0;
    totals.savings = 0;
  }

  return { details, totals, privilege, declType };
}
