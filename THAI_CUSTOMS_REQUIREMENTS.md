# Thai Customs Declaration Requirements — Detailed Research

*Research completed 2026-03-24 for LogiAI Customs app*

---

## 1. e-Customs (eBXML) System — Mandatory Fields

Thai Customs operates the **e-Customs** system using **ebXML** standards. Declarations are submitted via registered EDI/VAN providers (CAT Telecom, NTT, Loxley).

### What the app covers correctly
- Declaration type selection (Import/Export/EPZ)
- Core header: B/L, vessel, voyage, POL/POD, ETA, parties, invoice, FX, packages, freight, insurance, privilege
- Line items: HS code, description, qty, unit price, weights, origin, duty rate

### Missing mandatory eBXML header fields
| Field | Thai | Notes |
|-------|------|-------|
| Declaration Number | เลขที่ใบขน | Assigned by Customs upon acceptance |
| Customs Office Code | รหัสด่านศุลกากร | e.g., 0100=Bangkok, 0200=Laem Chabang, 0109=Suvarnabhumi |
| Assessment Request Type | ประเภทคำร้องตรวจ | Green/Yellow/Red line |
| Packing Type Code | - | UN/EDIFACT codes (CT/PL/DR/BG) |
| Broker License Number | เลขที่ใบอนุญาตตัวแทน | Separate from broker name |
| Declarant Name | ผู้ยื่นใบขน | Person who signs/submits |
| Warehouse Code | รหัสโรงพักสินค้า | Bonded warehouse/terminal |
| Release Port | ท่าที่ตรวจปล่อย | May differ from POD |
| Payment Method | - | Cash, Bank guarantee, e-Payment |
| Bank Code & Account | ธนาคาร/เลขที่บัญชี | For e-Payment |
| Master B/L vs House B/L | - | System distinguishes these |
| Manifest Number | เลขที่รายงาน/Manifest | Links to cargo manifest |
| Marks & Numbers | เครื่องหมายหีบห่อ | Shipping marks |

### Missing mandatory line-item fields
| Field | Thai | Notes |
|-------|------|-------|
| Statistical Code | รหัสสถิติ | HS + 3-digit suffix (separate field) |
| Tariff Sequence Number | ลำดับพิกัด | Line sequence per heading |
| Quantity Unit | หน่วย | Must use codes: KGM, LTR, PCE, MTR, SET |
| Second/Supplementary Qty | - | Required for certain HS codes |
| Country of Purchase | ประเทศที่ซื้อ | May differ from origin |
| Privilege code per item | - | Items may have different privileges |
| Permit per item | - | Specific permits per item |
| Anti-dumping duty rate | อากรตอบโต้การทุ่มตลาด | Separate from normal duty |
| Valuation adjustments | - | Commissions, royalties, etc. |

---

## 2. AHTN 2022 Tariff System

**Structure:**
- HS 6-digit: International (WCO)
- AHTN 8-digit: ASEAN regional
- Thai Statistical Code: AHTN 8-digit + 3-digit suffix = 11-digit (e.g., 85044090-001)

### What's missing
- **Multiple tariff rate types**: General/MFN, WTO Bound, FTA preferential rates per agreement
- **Specific duty rates**: Some tariffs are Baht/kg or Baht/liter, not percentage (the app only handles ad valorem)
- **Compound rates**: Ad valorem + specific, whichever is higher
- **Tariff Rate Quotas (TRQ)**: Lower in-quota, higher out-of-quota rates (agricultural products)

---

## 3. NSW (National Single Window) Integration

Thailand's NSW connects 36+ government agencies. The app needs:

### Permit agencies and codes
| Agency | Thai | Products |
|--------|------|----------|
| TISI | สมอ. | Controlled industrial products |
| FDA | อย. | Food, drugs, cosmetics, medical devices |
| NBTC | กสทช. | Telecom equipment |
| DOA | กรมวิชาการเกษตร | Plants, seeds, fertilizers, pesticides |
| DLD | กรมปศุสัตว์ | Livestock, animal feed |
| Excise | กรมสรรพสามิต | Excise-controlled items |
| DIW | กรมโรงงานอุตสาหกรรม | Hazardous substances |
| DIT | กรมการค้าภายใน | Controlled goods (sugar, rice) |

### What's missing
- **Multi-permit support** — one shipment may need 3-4 permits from different agencies
- **HS-to-permit auto-mapping** — certain HS codes trigger permit requirements
- **Permit status tracking** — NSW returns approval/rejection electronically

---

## 4. Customs Valuation Rules (WTO)

Thailand follows WTO Customs Valuation Agreement with 6 methods.

### Adjustments to add to CIF
**Must be added:**
- Selling commissions (not buying commissions)
- Packing costs
- Assists (tools, dies, molds supplied by buyer)
- Royalties/license fees
- Proceeds of resale accruing to seller

**Must be excluded:**
- Post-importation transport
- Construction after importation
- Customs duties and taxes

### What's missing
- Valuation method indicator (which of 6 methods used)
- Adjustment fields: royalties, assists, commissions
- Related party indicator
- Reference price warnings

---

## 5. Rules of Origin (ROO) for FTA Benefits

### CO forms per FTA
| FTA | CO Form | Key Rules |
|-----|---------|-----------|
| ATIGA (ASEAN) | Form D | 40% RVC or CTH |
| ACFTA (China) | Form E | 40% RVC or CTH |
| JTEPA (Japan) | Form JTEPA | Product-specific |
| TAFTA (Australia) | Form TAFTA | 40-50% RVC |
| AKFTA (Korea) | Form AK | 40% RVC or CTH |
| AIFTA (India) | Form AI | 35% RVC or CTSH |
| TNZFTA (NZ) | Form TNZCEP | Various |
| RCEP | Form RCEP | 40% RVC or CTH |

### What's missing
- **Missing FTAs**: AIFTA, ATIGA, TNZFTA, Thai-Chile, Thai-Peru
- **CO tracking fields**: form number, reference, issuing date, expiry
- **Origin criteria per line item**: WO/PE/RVC%/CTH
- **Self-certification support** (RCEP/ATIGA approved exporter)
- **Third-party invoice indicator**
- **Back-to-back CO indicator**

---

## 6. Bond/Guarantee Requirements

### Types
- General Guarantee (blanket bond)
- Specific Guarantee (per-shipment)
- Bank Guarantee
- Cash Deposit
- Surety Bond

### When required
- Release before final assessment
- Temporary importation
- Valuation/classification disputes
- Re-export goods under privilege
- BOI goods, transit goods

### What's missing
- No bond fields at all — need: type, number, amount, provider, expiry

---

## 7. Missing Declaration Types

The app only covers 3 types. Thailand has more:

| Form | Type | Description |
|------|------|-------------|
| กศก 99/1 | Import | **Covered** |
| กศก 101/1 | Export | **Covered** |
| EPZ Transfer | Zone transfer | **Covered** |
| กศก 99/2 | Temporary Import | 6-month limit, bond required |
| กศก 101/2 | Re-export | Links back to import declaration |
| กศก 102 | Transit | Goods passing through Thailand |
| กศก 103 | Bonded Warehouse | Duty suspended until withdrawal |
| กศก 211 | Duty Drawback | Refund of duties on exported products |

---

## 8. Anti-Dumping / Countervailing Duties

- Applied as **additional duty** on top of normal import duty
- Can be ad valorem or specific
- **Affects tax cascade**: VAT base = CIF + Duty + AD/CVD + Excise + Interior
- Active AD measures in Thailand: hot-rolled steel, H-beams, tinplate from China/Korea

### What's missing
- `adRate`, `adAmount` per line item
- `cvdRate`, `cvdAmount` per line item
- Modified tax cascade in calculations.js

---

## 9. Customs Act B.E. 2560 (2017) Key Provisions

| Section | Provision | App Impact |
|---------|-----------|------------|
| 20-21 | AEO program | Already has AEO field |
| 27 | Late payment surcharge 1.5%/month | Missing |
| 50-52 | Advance Ruling | Missing reference field |
| 52 | PCA within 5 years | Missing retention warning |
| 62 | Self-assessment | Current approach |
| 202 | Minimum 1 Baht duty | Missing rule |
| 243-244 | Penalties up to 4x duty | Information only |
| 12 | Weekly FX rates from Customs | Could auto-fetch |

---

## 10. BOI Privilege Details

### Sections with different customs treatment
| Section | For | Duty | VAT |
|---------|-----|------|-----|
| 28 | Machinery | Exempt | Exempt |
| 29 (for export) | Raw materials for re-export | Exempt | Exempt |
| 29 (for domestic) | Raw materials for domestic sale | Exempt | **Applies** |
| 30 | R&D materials | Exempt | Exempt |
| 31 | Export duty | Exempt | N/A |

### What's missing
- BOI promotion certificate number (separate field)
- Section reference (28/29/30/31)
- **VAT fix**: BOI Section 29 materials for domestic sale should charge VAT. Current blanket `vatMultiplier=0` is oversimplified.
- Machine vs raw material distinction
- Export requirement tracking

---

## 11. e-Payment Integration

### Missing fields
- Payment reference number
- Bank code
- Payment date/time
- Receipt number
- Payment status (pending/paid/confirmed)

---

## 12. Post-Clearance Audit (PCA)

### Records to retain (5 years)
- All declarations, invoices, packing lists, B/Ls
- Certificates of origin
- Insurance, payment records
- Purchase orders, contracts
- BOI/privilege documents

### What the app could add
- Document attachment/archive per declaration
- Edit audit trail
- Value consistency reports
- 5-year retention reminder
- PCA checklist per declaration

---

## Priority Ranking

### High Priority (compliance-critical)
1. Customs Office Code field
2. Anti-dumping/CVD fields + cascade fix
3. Missing FTAs (AIFTA, ATIGA, TNZFTA)
4. CO form tracking + origin criteria per line
5. Multi-permit support with agency codes
6. Master B/L vs House B/L
7. Manifest Number
8. BOI VAT fix (not always exempt)
9. Specific/compound duty rate support
10. Valuation adjustments (royalties, assists)

### Medium Priority
11. More declaration types (99/2, 101/2, 102, 103)
12. Warehouse/terminal code
13. Payment tracking
14. Bond/guarantee fields
15. Quantity unit codes per item
16. Country of purchase
17. Surcharge calculation (1.5%/month)

### Lower Priority
18. HS-to-permit auto-mapping
19. Duty drawback tracking
20. Advance ruling reference
21. PCA document checklist
22. Weekly FX auto-fetch
23. Minimum 1 Baht duty rule
