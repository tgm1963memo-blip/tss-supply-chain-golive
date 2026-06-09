# เอกสารทดสอบระบบ (UAT Test Script)

## วัตถุประสงค์การทดสอบ
เพื่อทดสอบการทำงานของระบบ tss-supply-chain-golive ในสถานการณ์จำลองการใช้งานจริง โดยมุ่งเน้นความถูกต้องของการแสดงผลข้อมูล การเชื่อมโยงหน้าจอ และการป้องกันการบันทึกข้อมูลที่ไม่พึงประสงค์ (Safe Mode) ก่อนขึ้นระบบจริง

## ขอบเขตการทดสอบ
- Executive Dashboard
- Sales
- Planning & Allocation
- Warehouse
- Express Weight Write-back (เฉพาะการแสดงผลใน Safe Mode)
- Consignment / Modern Trade
- Master Data
- Admin / Control

## ข้อจำกัดของรอบทดสอบ
- ระบบรันอยู่ใน Safe Mode เป็นหลัก
- ข้อมูลเป็นการดึงจากระบบฐานข้อมูล (Supabase) แบบอ่านอย่างเดียว (Read-only) ยกเว้นมีกำหนดเป็นอื่น
- หน้าจอ Express Weight เป็นการแสดงผลแบบ DESIGN ONLY / SAFE MODE

## สิ่งที่ยังปิดไว้ในระบบ
- การบันทึกกลับ (Write-back) ไปยัง Express DBF
- การตัดสต็อกจริง (Stock Posting)
- การสร้างใบสั่งผลิต (Production Order Creation)
- การสร้างใบสั่งซื้อ (PO Creation)

## รายชื่อผู้ทดสอบ
- [ระบุชื่อผู้ทดสอบ]
- [ระบุชื่อผู้ทดสอบ]

## วันที่ทดสอบ
[ระบุวันที่]

## Environment ที่ใช้ทดสอบ
- **URL:** [ระบุ URL]
- **Database:** Supabase (Read-only / Safe Mode)

---

## ขั้นตอนการทดสอบราย Module

### 1. Executive Dashboard
| ลำดับ | หน้าจอ / Function | Expected Result | Actual Result | PASS / FAIL / BLOCKED | หมายเหตุ |
|---|---|---|---|---|---|
| 1.1 | Management Dashboard | แสดงผลภาพรวมผู้บริหารได้ถูกต้อง | | | |
| 1.2 | Sales Overview | แสดงภาพรวมยอดขาย | | | |
| 1.3 | Stock Overview | แสดงภาพรวมสต็อก | | | |
| 1.4 | Shortage Overview | แสดงรายการสินค้าขาด | | | |
| 1.5 | Order Fulfillment | แสดงสถานะการเติมเต็มคำสั่งซื้อ | | | |
| 1.6 | CONSI Overview | แสดงภาพรวมฝากขาย | | | |

### 2. Sales
| ลำดับ | หน้าจอ / Function | Expected Result | Actual Result | PASS / FAIL / BLOCKED | หมายเหตุ |
|---|---|---|---|---|---|
| 2.1 | Sales Order | แสดงรายการใบสั่งขาย | | | |
| 2.2 | Sales Order Detail | แสดงรายละเอียดใบสั่งขาย | | | |
| 2.3 | Sales Forecast | แสดงข้อมูลคาดการณ์ยอดขาย | | | |
| 2.4 | Sales Overview | แสดงภาพรวมการขาย | | | |
| 2.5 | Return / CN | แสดงรายการรับคืน / ลดหนี้ | | | |
| 2.6 | Customer Registration | แสดงหน้าลงทะเบียนลูกค้าใหม่ | | | |
| 2.7 | Customer Map | แสดงแผนที่ลูกค้า | | | |
| 2.8 | Sample & Consumable | แสดงรายการสินค้าตัวอย่างและวัสดุสิ้นเปลือง | | | |

### 3. Planning & Allocation
| ลำดับ | หน้าจอ / Function | Expected Result | Actual Result | PASS / FAIL / BLOCKED | หมายเหตุ |
|---|---|---|---|---|---|
| 3.1 | Demand Planning | แสดงแผนความต้องการสินค้า | | | |
| 3.2 | Stock & Planning | แสดงสต็อกและการวางแผน | | | |
| 3.3 | ATP Workbench | แสดง ATP (Available to Promise) | | | |
| 3.4 | Reservation Workbench | แสดงสถานะการจอง (ยืนยันว่า Release ถูกปิดใช้งาน และมี governance note) | | | |
| 3.5 | Shortage Review | แสดงทบทวนสินค้าขาด | | | |
| 3.6 | Reservation Summary | แสดงสรุปการจองสินค้า | | | |
| 3.7 | Production / Purchase Suggestion | แสดงการแนะนำสั่งผลิต/สั่งซื้อ (ต้องขึ้นเตือน SUGGESTION ONLY ไม่มีปุ่มสร้าง PO/Production) | | | |

### 4. Warehouse (Inventory Control & WMS Operations)
| ลำดับ | หน้าจอ / Function | Expected Result | Actual Result | PASS / FAIL / BLOCKED | หมายเหตุ |
|---|---|---|---|---|---|
| 4.1 | Stock Balance | แสดงยอดสต็อกคงเหลือ | | | |
| 4.2 | Available Stock | แสดงสต็อกที่พร้อมขาย | | | |
| 4.3 | Stock Movement | แสดงความเคลื่อนไหวสต็อก | | | |
| 4.4 | Inventory Ledger | แสดงบัญชีสต็อก | | | |
| 4.5 | Stock Adjustment | หน้าปรับปรุงสต็อก (ตรวจสอบว่าอยู่ใน Read-only/Preview/Safe Mode และไม่มีการโพสต์จริง) | | | |
| 4.6 | Cycle Count | ตรวจนับสต็อก (ตรวจสอบว่าอยู่ใน Read-only/Preview/Safe Mode และไม่มีการโพสต์จริง) | | | |
| 4.7 | Lot / Expiry Control | ควบคุม Lot และวันหมดอายุ | | | |
| 4.8 | WMS Dashboard | แสดงแดชบอร์ดคลังสินค้า | | | |
| 4.9 | Receiving | แสดงหน้าการรับสินค้า | | | |
| 4.10 | Putaway | แสดงหน้าการจัดเก็บสินค้า | | | |
| 4.11 | Transfer | แสดงหน้าการโอนย้าย | | | |
| 4.12 | Picking & Packing | แสดงหน้าการหยิบและบรรจุ | | | |
| 4.13 | Dispatch / Goods Issue | แสดงหน้าการจ่ายสินค้า | | | |
| 4.14 | Scan Center | แสดงศูนย์สแกนบาร์โค้ด | | | |
| 4.15 | Handheld Operations | แสดงผลบนหน้าจอมือถือ (ไม่พัง) | | | |

### 5. Express Weight Write-back
| ลำดับ | หน้าจอ / Function | Expected Result | Actual Result | PASS / FAIL / BLOCKED | หมายเหตุ |
|---|---|---|---|---|---|
| 5.1 | Weight Capture | แสดง DESIGN ONLY / SAFE MODE และเป็น localStorage-only | | | |
| 5.2 | Weight Review | แสดง DESIGN ONLY / SAFE MODE และเป็น localStorage-only | | | |
| 5.3 | Express Weight Queue | แสดง DESIGN ONLY / SAFE MODE และเป็น localStorage-only ไม่มี Sync ลับ | | | |
| 5.4 | Express Weight Sync Log | แสดง DESIGN ONLY / SAFE MODE และเป็น localStorage-only | | | |
| 5.5 | Weight Error / Retry | กด Retry ไม่มีการต่อเข้าระบบ Express จริง (Local Storage) | | | |

### 6. Consignment / Modern Trade
| ลำดับ | หน้าจอ / Function | Expected Result | Actual Result | PASS / FAIL / BLOCKED | หมายเหตุ |
|---|---|---|---|---|---|
| 6.1 | CONSI Dashboard | แสดงภาพรวม Consignment | | | |
| 6.2 | Consignment SO | แสดงใบสั่งขายฝากขาย | | | |
| 6.3 | Branch Stock | แสดงสต็อกสาขา | | | |
| 6.4 | Consignment Movement | แสดงความเคลื่อนไหวฝากขาย | | | |
| 6.5 | Sell-out Record | แสดงบันทึกยอดขายออก | | | |
| 6.6 | Return from Branch | แสดงรับคืนจากสาขา | | | |
| 6.7 | CONSI Return / CN | แสดงรับคืนฝากขาย / ลดหนี้ | | | |

### 7. Master Data
| ลำดับ | หน้าจอ / Function | Expected Result | Actual Result | PASS / FAIL / BLOCKED | หมายเหตุ |
|---|---|---|---|---|---|
| 7.1 | Product Master | แสดงข้อมูลหลักสินค้า | | | |
| 7.2 | SKU Settings | แสดงตั้งค่า SKU | | | |
| 7.3 | SKU Alias | แสดงนามแฝง SKU | | | |
| 7.4 | UOM Conversion | แสดงการแปลงหน่วย | | | |
| 7.5 | Customer Master | แสดงข้อมูลลูกค้า | | | |
| 7.6 | Customer Branch | แสดงสาขาลูกค้า | | | |
| 7.7 | Warehouse Master | แสดงข้อมูลคลังสินค้า | | | |
| 7.8 | Location Master | แสดงข้อมูล Location | | | |
| 7.9 | Room / Company | แสดงข้อมูลห้องและบริษัท | | | |

### 8. Admin / Control
| ลำดับ | หน้าจอ / Function | Expected Result | Actual Result | PASS / FAIL / BLOCKED | หมายเหตุ |
|---|---|---|---|---|---|
| 8.1 | System Control | แสดงสถานะระบบ และมีปุ่ม Health Check | | | |
| 8.2 | Supabase Health Check | ตรวจสอบการเชื่อมต่อ Supabase ทำงานได้ | | | |
| 8.3 | UAT Status | แสดงสถานะ UAT อย่างถูกต้อง | | | |
| 8.4 | Decision Register links | มีลิงก์ไปยังเอกสารการตัดสินใจ | | | |

---

## การทดสอบด้วยข้อมูลจริงจาก Express

**เงื่อนไข:** ต้องรัน Express read-only sync ตาม `docs/20_EXPRESS_READONLY_SYNC_SETUP.md` และตรวจสอบข้อมูลตาม `docs/21_EXPRESS_SYNC_UAT_VALIDATION.md` ก่อนทำรายการด้านล่าง

**Room code:** TSS (ค่าเริ่มต้น)

| ลำดับ | หัวข้อทดสอบ | Expected Result | Actual Result | PASS / FAIL / BLOCKED | หมายเหตุ |
|---|---|---|---|---|---|
| E.1 | Sync ข้อมูล Express → Supabase | รัน sync ครบ STMAS, ARMAS, STLOC, OESO, OESOIT, ARTRN สำเร็จ และ System Control แสดงจำนวนแถว > 0 | | | |
| E.2 | Product Master (STMAS) | หน้า Product Master แสดงรหัส/ชื่อสินค้าจาก Express ตรงกับตัวอย่างใน DBF | | | |
| E.3 | Customer Master (ARMAS) | หน้า Customer Master แสดงรหัส/ชื่อลูกค้าจาก Express | | | |
| E.4 | Stock Balance (STLOC) | หน้า Stock Balance แสดงยอดคงเหลือจาก Express (ตรวจสอบ SKU ตัวอย่าง 1–2 รายการ) | | | |
| E.5 | Sales Order (OESO + OESOIT) | รายการใบสั่งขายและรายละเอียดบรรทัดแสดงเลขที่เอกสารและจำนวนจาก Express | | | |
| E.6 | ตรวจสอบ Read-only / Safe Mode | ไม่มีการบันทึกกลับ Express, ไม่มี stock posting, Express Weight ยังเป็น DESIGN ONLY | | | |
| E.7 | Failed records / Sync status | `sync_failed_records` = 0 หรือมีเหตุผลที่ยอมรับได้ และ Express Sync Status บน System Control ตรงกับ SQL | | | |

**หมายเหตุ:** รายการ E.1–E.7 ต้องผ่านก่อน Sign-off ด้านล่าง (หรือมี BLOCKED ที่บันทึกใน `docs/18_THAI_UAT_ISSUE_LOG.md`)

---

## การทดสอบหลังเปิด Auto Sync

**เงื่อนไข:** ติดตั้ง Windows Task Scheduler ตาม `docs/22_AUTOMATED_EXPRESS_SYNC_AGENT.md` และรอให้ agent รันอย่างน้อย 1 รอบ (active rolling + read model refresh)

| ลำดับ | หัวข้อทดสอบ | Expected Result | Actual Result | PASS / FAIL / BLOCKED | หมายเหตุ |
|---|---|---|---|---|---|
| F.1 | ตรวจ Last Sync Time | System Control → Automated Sync Agent แสดง Last active rolling sync / Last master sync เป็นวันที่ล่าสุด (ไม่เป็น —) | | | |
| F.2 | ตรวจ SO ใหม่เข้า Supabase | สร้าง/แก้ไข SO ใน Express (room TSS) แล้วรอ rolling sync — หน้า Sales Order แสดงเอกสารใหม่ภายใน ~15–30 นาที | | | |
| F.3 | ตรวจ Stock update | แก้ยอด STLOC ใน Express แล้วรอ sync — Stock Balance / Available Stock อัปเดตตามข้อมูลล่าสุด | | | |
| F.4 | ตรวจ Dashboard update | Management Dashboard / Sales Overview / Stock Overview สะท้อนข้อมูลหลัง sync (อ่านจาก view/summary ไม่โหลด raw table ใหญ่) | | | |
| F.5 | ตรวจว่า Express Write-back ยัง Disabled | System Control แสดง Express write-back disabled = Yes, Safe Mode ยังทำงาน, ไม่มีการเขียนกลับ DBF | | | |
| F.6 | ตรวจ Log / Failed records | `scripts/express-readonly-sync/logs/` ไม่มี error ซ้ำ และ failed records = 0 หรือมีเหตุผลที่ยอมรับได้ | | | |

**คำสั่งตรวจสอบ (IT):**
```bat
cd scripts\express-readonly-sync
.venv\Scripts\python.exe sync_status_check.py
```

---

## Sign-off

ผู้ทดสอบ: ___________________________
วันที่: ___________________________

ผู้รับรอง: ___________________________
วันที่: ___________________________
