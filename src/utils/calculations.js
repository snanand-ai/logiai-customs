import { PRIVILEGES } from "../constants/privileges";

/**
 * Calculate CIF/FOB, duty, AD/CVD, excise, interior tax, VAT, and total tax.
 *
 * Supports declaration types:
 * - IMPORT: CIF valuation → 5-tier tax cascade (duty + AD/CVD → excise → interior → VAT)
 * - EXPORT: FOB valuation in THB, all duties = 0/FREE
 * - EPZ / TEMP_IMPORT / RE_EXPORT / TRANSIT / BONDED: zone/special, all duties = 0
 *
 * The Thai customs tax cascade for imports:
 * 1. Import Duty (อากรขาเข้า) = CIF × duty rate × privilege multiplier
 * 2. Anti-dumping Duty (อากรตอบโต้การทุ่มตลาด) = CIF × AD rate
 * 3. Countervailing Duty (อากรตอบโต้การอุดหนุน) = CIF × CVD rate
 * 4. Excise Tax (ภาษีสรรพสามิต) = (CIF + duty + AD + CVD) × excise rate
 * 5. Interior Tax (ภาษีเพื่อมหาดไทย) = excise × 10%
 * 6. VAT (ภาษีมูลค่าเพิ่ม) = (CIF + duty + AD + CVD + excise + interior) × 7%
 *
 * Minimum duty rule: if calculated duty > 0 and < 1, round up to 1 Baht.
 */
export function calculateDeclaration(items, header) {
  const privilege = PRIVILEGES.find((p) => p.code === header.priv) || PRIVILEGES[0];
  const declType = header.declarationType || "IMPORT";
  const isExport = declType === "EXPORT";
  const isZeroDuty = ["EPZ", "TRANSIT", "BONDED"].includes(declType);
  const isTempImport = declType === "TEMP_IMPORT";
  const isReExport = declType === "RE_EXPORT";
  const fx = parseFloat(header.fx) || 1;
  const totalInvoiceValue = items.reduce((sum, i) => sum + i.qty * i.up, 0);
  const totalFreight = parseFloat(header.freight) || 0;
  const totalInsurance = isExport
    ? 0
    : parseFloat(header.insurance) || totalInvoiceValue * 0.003;

  // Valuation adjustments (added to CIF per WTO rules)
  const royalties = parseFloat(header.royalties) || 0;
  const assists = parseFloat(header.assists) || 0;
  const sellingCommission = parseFloat(header.sellingCommission) || 0;
  const totalAdjustments = royalties + assists + sellingCommission;

  const details = items.map((item, idx) => {
    const amount = item.qty * item.up;

    // --- Valuation ---
    let valuationTHB;
    let freightAlloc = 0, insuranceAlloc = 0, adjustAlloc = 0, cifInCurrency = amount;

    if (isExport || isReExport) {
      valuationTHB = amount * fx;
    } else {
      freightAlloc = totalInvoiceValue > 0 ? (amount / totalInvoiceValue) * totalFreight : 0;
      insuranceAlloc = totalInvoiceValue > 0 ? (amount / totalInvoiceValue) * totalInsurance : 0;
      adjustAlloc = totalInvoiceValue > 0 ? (amount / totalInvoiceValue) * totalAdjustments : 0;
      cifInCurrency = amount + freightAlloc + insuranceAlloc + adjustAlloc;
      valuationTHB = cifInCurrency * fx;
    }

    // --- Tax Cascade ---
    const normalDutyRate = parseFloat(item.duty) || 0;
    const adRate = parseFloat(item.adRate) || 0;
    const cvdRate = parseFloat(item.cvdRate) || 0;
    let appliedDutyRate, dutyAmount, adAmount, cvdAmount;
    let exciseRate, exciseAmount, interiorAmount, vatBase, vatAmount, totalTax;

    if (isExport || isReExport || isZeroDuty) {
      appliedDutyRate = 0;
      dutyAmount = 0;
      adAmount = 0;
      cvdAmount = 0;
      exciseRate = 0;
      exciseAmount = 0;
      interiorAmount = 0;
      vatBase = 0;
      vatAmount = 0;
      totalTax = 0;
    } else {
      // 1. Import Duty
      appliedDutyRate = normalDutyRate * privilege.dutyMultiplier;
      dutyAmount = valuationTHB * (appliedDutyRate / 100);

      // Minimum 1 Baht rule
      if (dutyAmount > 0 && dutyAmount < 1) dutyAmount = 1;

      // 2. Anti-dumping Duty (not reduced by privilege)
      adAmount = valuationTHB * (adRate / 100);

      // 3. Countervailing Duty (not reduced by privilege)
      cvdAmount = valuationTHB * (cvdRate / 100);

      // For temp import: duties are calculated but bonded (stored for reference)
      if (isTempImport) {
        // Temp import: duty is calculated for bond amount but not actually payable
        // We still show the amounts for bond calculation purposes
      }

      // 4. Excise Tax
      exciseRate = parseFloat(item.exciseRate) || 0;
      const exciseBase = valuationTHB + dutyAmount + adAmount + cvdAmount;
      exciseAmount = exciseBase * (exciseRate / 100);

      // 5. Interior Tax = 10% of excise
      interiorAmount = exciseAmount * 0.10;

      // 6. VAT = 7% of (CIF + all duties + excise + interior)
      vatBase = valuationTHB + dutyAmount + adAmount + cvdAmount + exciseAmount + interiorAmount;
      vatAmount = vatBase * 0.07 * privilege.vatMultiplier;

      totalTax = dutyAmount + adAmount + cvdAmount + exciseAmount + interiorAmount + vatAmount;
    }

    return {
      ...item,
      lineNo: idx + 1,
      amount,
      freightAlloc,
      insuranceAlloc,
      adjustAlloc,
      cifInCurrency,
      cifTHB: valuationTHB,
      normalDutyRate,
      appliedDutyRate,
      dutyAmount,
      adRate,
      adAmount,
      cvdRate,
      cvdAmount,
      exciseRate,
      exciseAmount,
      interiorAmount,
      vatBase,
      vatAmount,
      totalTax,
    };
  });

  const totals = {
    cif: details.reduce((s, i) => s + i.cifTHB, 0),
    duty: details.reduce((s, i) => s + i.dutyAmount, 0),
    ad: details.reduce((s, i) => s + i.adAmount, 0),
    cvd: details.reduce((s, i) => s + i.cvdAmount, 0),
    excise: details.reduce((s, i) => s + i.exciseAmount, 0),
    interior: details.reduce((s, i) => s + i.interiorAmount, 0),
    vat: details.reduce((s, i) => s + i.vatAmount, 0),
    tax: details.reduce((s, i) => s + i.totalTax, 0),
    invoiceValue: totalInvoiceValue,
    adjustments: totalAdjustments,
  };

  // Normal rates for savings calculation
  if (!isExport && !isReExport && !isZeroDuty) {
    totals.normalDuty = details.reduce((s, i) => s + i.cifTHB * (i.normalDutyRate / 100), 0);
    const normalExcise = details.reduce((s, i) => {
      const d = i.cifTHB * (i.normalDutyRate / 100);
      const ad = i.cifTHB * ((parseFloat(i.adRate) || 0) / 100);
      const cvd = i.cifTHB * ((parseFloat(i.cvdRate) || 0) / 100);
      return s + (i.cifTHB + d + ad + cvd) * ((parseFloat(i.exciseRate) || 0) / 100);
    }, 0);
    const normalInterior = normalExcise * 0.10;
    totals.normalVat = details.reduce((s, i) => {
      const d = i.cifTHB * (i.normalDutyRate / 100);
      const ad = i.cifTHB * ((parseFloat(i.adRate) || 0) / 100);
      const cvd = i.cifTHB * ((parseFloat(i.cvdRate) || 0) / 100);
      const e = (i.cifTHB + d + ad + cvd) * ((parseFloat(i.exciseRate) || 0) / 100);
      const it = e * 0.10;
      return s + (i.cifTHB + d + ad + cvd + e + it) * 0.07;
    }, 0);
    totals.normalTax = totals.normalDuty + totals.ad + totals.cvd + normalExcise + normalInterior + totals.normalVat;
    totals.savings = totals.normalTax - totals.tax;
  } else {
    totals.normalDuty = 0;
    totals.normalVat = 0;
    totals.normalTax = 0;
    totals.savings = 0;
  }

  return { details, totals, privilege, declType };
}
