import { PRIVILEGES } from "../constants/privileges";

/**
 * Calculate CIF, duty, VAT, and tax for each line item.
 *
 * @param {Array} items - Line items array
 * @param {Object} header - Shipment header with fx, freight, insurance, priv
 * @returns {{ details: Array, totals: Object }}
 */
export function calculateDeclaration(items, header) {
  const privilege = PRIVILEGES.find((p) => p.code === header.priv) || PRIVILEGES[0];
  const fx = parseFloat(header.fx) || 1;
  const totalInvoiceValue = items.reduce((sum, i) => sum + i.qty * i.up, 0);
  const totalFreight = parseFloat(header.freight) || 0;
  // Auto-calculate insurance at 0.3% if not provided
  const totalInsurance = parseFloat(header.insurance) || totalInvoiceValue * 0.003;

  const details = items.map((item, idx) => {
    const amount = item.qty * item.up;
    const freightAlloc = totalInvoiceValue > 0 ? (amount / totalInvoiceValue) * totalFreight : 0;
    const insuranceAlloc = totalInvoiceValue > 0 ? (amount / totalInvoiceValue) * totalInsurance : 0;
    const cifInCurrency = amount + freightAlloc + insuranceAlloc;
    const cifTHB = cifInCurrency * fx;

    const normalDutyRate = parseFloat(item.duty) || 0;
    const appliedDutyRate = normalDutyRate * privilege.dutyMultiplier;
    const dutyAmount = cifTHB * (appliedDutyRate / 100);
    const vatBase = cifTHB + dutyAmount;
    const vatAmount = vatBase * 0.07 * privilege.vatMultiplier;
    const totalTax = dutyAmount + vatAmount;

    return {
      ...item,
      lineNo: idx + 1,
      amount,
      freightAlloc,
      insuranceAlloc,
      cifInCurrency,
      cifTHB,
      normalDutyRate,
      appliedDutyRate,
      dutyAmount,
      vatBase,
      vatAmount,
      totalTax,
    };
  });

  const totals = {
    cif: details.reduce((s, i) => s + i.cifTHB, 0),
    duty: details.reduce((s, i) => s + i.dutyAmount, 0),
    vat: details.reduce((s, i) => s + i.vatAmount, 0),
    tax: details.reduce((s, i) => s + i.totalTax, 0),
    invoiceValue: totalInvoiceValue,
  };

  // Normal rates (for savings calculation)
  totals.normalDuty = details.reduce((s, i) => s + i.cifTHB * (i.normalDutyRate / 100), 0);
  totals.normalVat = details.reduce(
    (s, i) => s + (i.cifTHB + i.cifTHB * (i.normalDutyRate / 100)) * 0.07,
    0
  );
  totals.savings = totals.normalDuty + totals.normalVat - totals.tax;

  return { details, totals, privilege };
}
