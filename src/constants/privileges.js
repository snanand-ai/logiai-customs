export const PRIVILEGES = [
  { code: "NONE", label: "No Privilege (Normal Rates)", dutyMultiplier: 1, vatMultiplier: 1 },
  { code: "FZ", label: "FZ — Free Zone (0% all)", dutyMultiplier: 0, vatMultiplier: 0 },
  { code: "ACFTA", label: "ACFTA — ASEAN-China FTA", dutyMultiplier: 0, vatMultiplier: 1 },
  { code: "JTEPA", label: "JTEPA — Japan-Thai EPA", dutyMultiplier: 0, vatMultiplier: 1 },
  { code: "TAFTA", label: "TAFTA — Thai-Australia FTA", dutyMultiplier: 0, vatMultiplier: 1 },
  { code: "AKFTA", label: "AKFTA — ASEAN-Korea FTA", dutyMultiplier: 0, vatMultiplier: 1 },
  { code: "AIFTA", label: "AIFTA — ASEAN-India FTA", dutyMultiplier: 0, vatMultiplier: 1 },
  { code: "ATIGA", label: "ATIGA — ASEAN Trade in Goods", dutyMultiplier: 0, vatMultiplier: 1 },
  { code: "TNZFTA", label: "TNZFTA — Thai-New Zealand CEP", dutyMultiplier: 0, vatMultiplier: 1 },
  { code: "RCEP", label: "RCEP — Regional Comprehensive", dutyMultiplier: 0, vatMultiplier: 1 },
  { code: "BOI_28", label: "BOI §28 — Machinery (0% all)", dutyMultiplier: 0, vatMultiplier: 0 },
  { code: "BOI_29_EXP", label: "BOI §29 — Materials for Export (0% all)", dutyMultiplier: 0, vatMultiplier: 0 },
  { code: "BOI_29_DOM", label: "BOI §29 — Materials for Domestic (0% duty, 7% VAT)", dutyMultiplier: 0, vatMultiplier: 1 },
  { code: "BOI_30", label: "BOI §30 — R&D Materials (0% all)", dutyMultiplier: 0, vatMultiplier: 0 },
  { code: "TAXINCEN", label: "Tax Incentive สุทธินำกลับ", dutyMultiplier: 0, vatMultiplier: 0 },
  { code: "EPZ", label: "EPZ — Export Processing Zone", dutyMultiplier: 0, vatMultiplier: 0 },
];

export const INCOTERMS = ["EXW", "FCA", "FAS", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"];
export const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CNY", "SGD", "AUD", "KRW", "THB", "INR", "NZD", "HKD", "TWD", "MYR", "IDR", "VND", "PHP"];

/** Declaration types matching Thai customs forms */
export const DECLARATION_TYPES = [
  { code: "IMPORT", label: "กศก 99/1 — Import Declaration", formNo: "กศก 99/1" },
  { code: "EXPORT", label: "กศก 101/1 — Export Declaration", formNo: "กศก 101/1" },
  { code: "EPZ", label: "โอนย้ายเข้าเขตปลอดอากร — EPZ Transfer", formNo: "โอนย้าย" },
  { code: "TEMP_IMPORT", label: "กศก 99/2 — Temporary Import", formNo: "กศก 99/2" },
  { code: "RE_EXPORT", label: "กศก 101/2 — Re-export", formNo: "กศก 101/2" },
  { code: "TRANSIT", label: "กศก 102 — Transit Declaration", formNo: "กศก 102" },
  { code: "BONDED", label: "กศก 103 — Bonded Warehouse", formNo: "กศก 103" },
];

/** Transport modes used in Thai customs declarations */
export const TRANSPORT_MODES = [
  { code: "SEA", label: "By Sea (เรือ)" },
  { code: "TRUCK", label: "By Truck (รถบรรทุก)" },
  { code: "AIR", label: "By Air (อากาศ)" },
  { code: "RAIL", label: "By Rail (รถไฟ)" },
  { code: "POST", label: "By Post (ไปรษณีย์)" },
];

/** Major Thai Customs offices */
export const CUSTOMS_OFFICES = [
  { code: "0100", label: "0100 — Bangkok Port (ท่าเรือกรุงเทพ)" },
  { code: "0200", label: "0200 — Laem Chabang (แหลมฉบัง)" },
  { code: "0109", label: "0109 — Suvarnabhumi Airport (สุวรรณภูมิ)" },
  { code: "0110", label: "0110 — Don Mueang Airport (ดอนเมือง)" },
  { code: "0300", label: "0300 — Chiang Mai (เชียงใหม่)" },
  { code: "0400", label: "0400 — Chiang Rai (เชียงราย)" },
  { code: "0500", label: "0500 — Songkhla (สงขลา)" },
  { code: "0600", label: "0600 — Nakhon Ratchasima (นครราชสีมา)" },
  { code: "0700", label: "0700 — Map Ta Phut (มาบตาพุด)" },
  { code: "0205", label: "0205 — Lat Krabang ICD (ลาดกระบัง)" },
  { code: "0401", label: "0401 — Chiang Saen (เชียงแสน)" },
  { code: "0501", label: "0501 — Sadao (สะเดา)" },
  { code: "0800", label: "0800 — Mukdahan (มุกดาหาร)" },
  { code: "0900", label: "0900 — Nong Khai (หนองคาย)" },
];

/** Certificate of Origin forms per FTA */
export const CO_FORMS = {
  ATIGA: { form: "Form D", issuer: "Ministry of Commerce" },
  ACFTA: { form: "Form E", issuer: "MOC / CCPIT (China)" },
  JTEPA: { form: "Form JTEPA", issuer: "MOC / Japan Customs" },
  TAFTA: { form: "Form TAFTA", issuer: "MOC" },
  AKFTA: { form: "Form AK", issuer: "MOC" },
  AIFTA: { form: "Form AI", issuer: "MOC" },
  TNZFTA: { form: "Form TNZCEP", issuer: "MOC" },
  RCEP: { form: "Form RCEP", issuer: "MOC" },
};

/** Origin criteria for Rules of Origin */
export const ORIGIN_CRITERIA = [
  { code: "WO", label: "WO — Wholly Obtained" },
  { code: "PE", label: "PE — Product Entirely Produced" },
  { code: "RVC40", label: "RVC 40% — Regional Value Content" },
  { code: "RVC35", label: "RVC 35% — Regional Value Content" },
  { code: "CTH", label: "CTH — Change in Tariff Heading" },
  { code: "CTSH", label: "CTSH — Change in Tariff Sub-heading" },
  { code: "SP", label: "SP — Product Specific Rules" },
];

/** Quantity unit codes (UN/EDIFACT) */
export const QUANTITY_UNITS = [
  { code: "KGM", label: "KGM — Kilograms" },
  { code: "PCE", label: "PCE — Pieces" },
  { code: "LTR", label: "LTR — Litres" },
  { code: "MTR", label: "MTR — Metres" },
  { code: "SET", label: "SET — Sets" },
  { code: "PRS", label: "PRS — Pairs" },
  { code: "MTK", label: "MTK — Square Metres" },
  { code: "MTQ", label: "MTQ — Cubic Metres" },
  { code: "GRM", label: "GRM — Grams" },
  { code: "TNE", label: "TNE — Metric Tons" },
  { code: "UNT", label: "UNT — Units" },
];

/** Permit/license issuing agencies (NSW) */
export const PERMIT_AGENCIES = [
  { code: "TISI", label: "TISI (สมอ.) — Industrial Standards" },
  { code: "FDA", label: "FDA (อย.) — Food & Drug" },
  { code: "NBTC", label: "NBTC (กสทช.) — Telecom Equipment" },
  { code: "DOA", label: "DOA (กรมวิชาการเกษตร) — Agriculture" },
  { code: "DLD", label: "DLD (กรมปศุสัตว์) — Livestock" },
  { code: "EXCISE", label: "Excise (กรมสรรพสามิต) — Excise Goods" },
  { code: "DIW", label: "DIW (กรมโรงงาน) — Hazardous Substances" },
  { code: "DIT", label: "DIT (กรมการค้าภายใน) — Controlled Goods" },
  { code: "RFD", label: "RFD (กรมป่าไม้) — Forestry / CITES" },
  { code: "BOT", label: "BOT (ธปท.) — Gold / Precious Metals" },
];

/** Payment methods for duty/tax */
export const PAYMENT_METHODS = [
  { code: "CASH", label: "Cash (เงินสด)" },
  { code: "BANK_GUARANTEE", label: "Bank Guarantee (หนังสือค้ำประกัน)" },
  { code: "E_PAYMENT", label: "e-Payment (ชำระทางอิเล็กทรอนิกส์)" },
  { code: "TRANSFER", label: "Bank Transfer (โอนเงิน)" },
];

/** Bond/guarantee types */
export const BOND_TYPES = [
  { code: "", label: "— No Bond —" },
  { code: "GENERAL", label: "General Guarantee (ค้ำประกันทั่วไป)" },
  { code: "SPECIFIC", label: "Specific Guarantee (ค้ำประกันเฉพาะราย)" },
  { code: "BANK", label: "Bank Guarantee (ค้ำประกันธนาคาร)" },
  { code: "CASH_DEPOSIT", label: "Cash Deposit (เงินสดวางประกัน)" },
  { code: "SURETY", label: "Surety Bond (ค้ำประกันบริษัทประกัน)" },
];

/** BOI sections with descriptions */
export const BOI_SECTIONS = [
  { code: "", label: "— Select —" },
  { code: "28", label: "§28 — Machinery Import" },
  { code: "29_EXP", label: "§29 — Raw Materials for Export" },
  { code: "29_DOM", label: "§29 — Raw Materials for Domestic" },
  { code: "30", label: "§30 — R&D Materials" },
  { code: "31", label: "§31 — Export Duty Exemption" },
];
