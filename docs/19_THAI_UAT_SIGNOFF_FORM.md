# ใบรับรองผลการทดสอบระบบ (UAT Sign-off Form)

**ชื่อโครงการ:** tss-supply-chain-golive
**วันที่ทดสอบ:** ___________________________
**ผู้ทดสอบ:** ___________________________
**แผนก:** ___________________________

## รายการ Module ที่ทดสอบ
- [ ] Executive Dashboard
- [ ] Sales
- [ ] Planning & Allocation
- [ ] Warehouse (Inventory Control & WMS Operations)
- [ ] Express Weight Write-back
- [ ] Consignment / Modern Trade
- [ ] Master Data
- [ ] Admin / Control

## เลขเอกสารจริงที่ใช้ทดสอบ
- **UAT Test Script:** `docs/17_THAI_UAT_TEST_SCRIPT.md`
- **UAT Issue Log:** `docs/18_THAI_UAT_ISSUE_LOG.md`

## ผลการทดสอบโดยรวม
- **ผ่าน (PASS):** _____ รายการ
- **ไม่ผ่าน (FAIL):** _____ รายการ
- **ทดสอบไม่ได้ (BLOCKED):** _____ รายการ

## รายการข้อจำกัดที่ยอมรับ (Accepted Limitations)
1. การเชื่อมต่อ Express Write-back ยังคงถูกปิดและจำลองการทำงานด้วย Local Storage (Design limitation)
2. สถานะ Reservation ปิดกั้นการสร้างเพื่อนำเข้าระบบโดยตรง (Governance pending)
3. ระบบจะทำงานใน Safe Mode (ไม่มีการบันทึกสต็อกหรือสร้าง PO/Production จริง)

## รายการปัญหาที่ยังเปิดอยู่ (Open Issues)
*(ระบุ Issue ID หากมี)*
- 
- 

## การตัดสินใจ (Decision)
- [ ] **GO:** ผ่านการทดสอบสมบูรณ์แบบ
- [ ] **GO WITH LIMITATION:** ผ่านการทดสอบโดยมีข้อจำกัดที่ยอมรับได้ 
- [ ] **HOLD:** ไม่ผ่านการทดสอบ ต้องหยุดแก้ไข

---

**ลายเซ็นผู้ทดสอบ:**

___________________________
(___________________________)
วันที่: _______________________


**ลายเซ็นผู้อนุมัติ:**

___________________________
(___________________________)
วันที่: _______________________
