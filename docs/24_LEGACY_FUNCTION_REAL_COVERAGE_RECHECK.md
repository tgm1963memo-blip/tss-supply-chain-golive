# Legacy Function Real Coverage Recheck

## Audit of Legacy Navigation vs Current Routes

| Legacy Menu ID / Label | Legacy Group | Current Route in App | Has UI Content? | Placeholder? | Action Required |
| --- | --- | --- | --- | --- | --- |
| `dash` (Dashboard) | All | `/dashboard` | Yes | No | (Done) |
| `mysales` (ยอดขายของฉัน / Sales Overview) | Sales, Manager | `/sales/overview` | No | Yes | Build UI structure |
| `forecast` (Sales Forecast / Forecast ทั้งหมด) | Sales, Planning | `/sales/forecast` | No | Yes | Build UI structure |
| `custmap` (สรุปยอดขาย / Customer Map) | Sales, Planning, Mgr | `/sales/customer-map` | No | Yes | Build UI structure |
| `custreg` (ข้อมูลลูกค้า) | Sales, Mgr | `/master/customers` | No | Yes | Build UI structure |
| `sample` (ของตัวอย่าง) | All | `/sales/samples` | No | Yes | Build UI structure |
| `planstock` (Stock & Planning) | Planning, Mgr | `/planning/atp` | No | Yes | Build UI structure |
| `po` (Production Planning / PO จอง Stock) | Planning, WMS, Mgr | `/planning/production` | No | Yes | Build UI structure |
| `planbook` (จองสินค้า PO/SO) | Planning, Mgr | `/sales/orders` | No | Yes | Build UI structure |
| `booksummary` (สรุปการจอง) | Planning, Mgr | `/sales/orders/summary` | No | Yes | Build UI structure |
| `prodplan` (สั่งยอดผลิต) | Planning | `/planning/production/new` | No | Yes | Build UI structure |
| `prodsummary` (เปรียบเทียบผลิต) | Planning, Mgr | `/planning/production/summary` | No | Yes | Build UI structure |
| `skuadmin` (SKU Settings) | Planning | `/master/products` | No | Yes | Build UI structure |
| `groups` (จัดการกลุ่ม) | Planning, Mgr | `/master/groups` | No | Yes | Build UI structure |
| `wms` (WMS System) | Warehouse | `/wms/dashboard` | No | Yes | Build UI structure |
| `consi` (ฝากขาย CONSI) | Manager | `/consi/dashboard` | No | Yes | Build UI structure |
| `reports` (Reports) | Manager | `/reports` | No | Yes | Build UI structure |

### Recently Added Legacy Features
| Feature | Legacy System | Current Route | Has UI Content? | Placeholder? | Action Taken |
| --- | --- | --- | --- | --- | --- |
| `promotions` (เคาะราคาห้าง) | Excel form | `/sales/promotions` | Yes | No | Completely rebuilt into an interactive 8-section form with workflow. |

## Next Steps
All items marked as **"Placeholder? = Yes"** will be iteratively updated to include:
1. `PageHeader` with relevant Safe Mode/Read Only badges.
2. Filter/Search `Toolbar` component.
3. Summary/KPI cards where relevant.
4. `TablePanel` with an actual HTML table containing representative columns (even if empty).
5. Safe empty states inside the table, rather than a full-page alert.
