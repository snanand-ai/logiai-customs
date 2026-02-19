export const PRIVILEGES = [
  { code: "NONE", label: "No Privilege (Normal Rates)", dutyMultiplier: 1, vatMultiplier: 1 },
  { code: "FZ", label: "FZ — Free Zone (0% all)", dutyMultiplier: 0, vatMultiplier: 0 },
  { code: "ACFTA", label: "ACFTA — ASEAN-China FTA", dutyMultiplier: 0, vatMultiplier: 1 },
  { code: "JTEPA", label: "JTEPA — Japan-Thai EPA", dutyMultiplier: 0, vatMultiplier: 1 },
  { code: "TAFTA", label: "TAFTA — Thai-Australia FTA", dutyMultiplier: 0, vatMultiplier: 1 },
  { code: "AKFTA", label: "AKFTA — ASEAN-Korea FTA", dutyMultiplier: 0, vatMultiplier: 1 },
  { code: "BOI", label: "BOI — Board of Investment", dutyMultiplier: 0, vatMultiplier: 0 },
  { code: "RCEP", label: "RCEP — Regional Comprehensive", dutyMultiplier: 0, vatMultiplier: 1 },
];

export const INCOTERMS = ["EXW", "FCA", "FAS", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"];
export const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CNY", "SGD", "AUD", "KRW"];
