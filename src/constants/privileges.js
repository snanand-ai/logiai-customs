export const PRIVILEGES = [
  { code: "NONE", label: "No Privilege (Normal Rates)", dutyMultiplier: 1, vatMultiplier: 1 },
  { code: "FZ", label: "FZ — Free Zone (0% all)", dutyMultiplier: 0, vatMultiplier: 0 },
  { code: "ACFTA", label: "ACFTA — ASEAN-China FTA", dutyMultiplier: 0, vatMultiplier: 1 },
  { code: "JTEPA", label: "JTEPA — Japan-Thai EPA", dutyMultiplier: 0, vatMultiplier: 1 },
  { code: "TAFTA", label: "TAFTA — Thai-Australia FTA", dutyMultiplier: 0, vatMultiplier: 1 },
  { code: "AKFTA", label: "AKFTA — ASEAN-Korea FTA", dutyMultiplier: 0, vatMultiplier: 1 },
  { code: "BOI", label: "BOI — Board of Investment", dutyMultiplier: 0, vatMultiplier: 0 },
  { code: "RCEP", label: "RCEP — Regional Comprehensive", dutyMultiplier: 0, vatMultiplier: 1 },
  { code: "TAXINCEN", label: "Tax Incentive สุทธินำกลับ", dutyMultiplier: 0, vatMultiplier: 0 },
  { code: "EPZ", label: "EPZ — Export Processing Zone", dutyMultiplier: 0, vatMultiplier: 0 },
];

export const INCOTERMS = ["EXW", "FCA", "FAS", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"];
export const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CNY", "SGD", "AUD", "KRW", "THB"];

/** Declaration types matching Thai customs forms */
export const DECLARATION_TYPES = [
  { code: "IMPORT", label: "กศก 99/1 — Import Declaration", formNo: "กศก 99/1" },
  { code: "EXPORT", label: "กศก 101/1 — Export Declaration", formNo: "กศก 101/1" },
  { code: "EPZ", label: "โอนย้ายเข้าเขตปลอดอากร — EPZ Transfer", formNo: "โอนย้าย" },
];

/** Transport modes used in Thai customs declarations */
export const TRANSPORT_MODES = [
  { code: "SEA", label: "By Sea (เรือ)" },
  { code: "TRUCK", label: "By Truck (รถบรรทุก)" },
  { code: "AIR", label: "By Air (อากาศ)" },
  { code: "RAIL", label: "By Rail (รถไฟ)" },
  { code: "POST", label: "By Post (ไปรษณีย์)" },
];
