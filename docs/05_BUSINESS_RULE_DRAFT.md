# 05 — Business Rule Draft

> Draft rules for Phase 1+. Mockup shell does not enforce these rules.

## Sales & Reservation

| ID | Rule | Priority |
|----|------|----------|
| BR-S01 | Sales order must be Confirmed before reservation | High |
| BR-S02 | Reservation cannot exceed available-to-promise (ATP) | High |
| BR-S03 | Partial reservation allowed; shortage flagged automatically | High |
| BR-S04 | Return/CN must reference original sales order line | High |
| BR-S05 | Credit note qty cannot exceed shipped qty | Medium |

## Inventory

| ID | Rule | Priority |
|----|------|----------|
| BR-I01 | Available = On Hand − Reserved (per SKU/warehouse/lot) | High |
| BR-I02 | Negative on-hand not permitted except approved adjustment | High |
| BR-I03 | All movements write to inventory ledger | High |
| BR-I04 | Lot tracking mandatory for frozen and chilled categories | High |
| BR-I05 | UOM conversion must use master conversion table | Medium |

## WMS

| ID | Rule | Priority |
|----|------|----------|
| BR-W01 | Receiving must match PO qty within tolerance (±2%) | Medium |
| BR-W02 | Putaway location must match product storage type (cold/dry) | High |
| BR-W03 | Pick task cannot release more than reserved qty | High |
| BR-W04 | Dispatch requires pick confirmation complete | High |
| BR-W05 | Stock adjustment requires supervisor approval > 100 KG | Medium |
| BR-W06 | Cycle count variance > 5% triggers recount | Low |

## Consignment

| ID | Rule | Priority |
|----|------|----------|
| BR-C01 | Branch replenishment SO deducts from DC on dispatch | High |
| BR-C02 | Consignment sold qty reported weekly minimum | Medium |
| BR-C03 | Return CN reduces branch on-hand on approval | High |
| BR-C04 | Low stock alert when branch qty < reorder point | Medium |

## Sample / Consumable

| ID | Rule | Priority |
|----|------|----------|
| BR-X01 | Sample request requires manager approval | Medium |
| BR-X02 | Monthly sample budget cap per department | Low |
| BR-X03 | Consumable issue deducts from designated warehouse | Medium |

## Integration

| ID | Rule | Priority |
|----|------|----------|
| BR-INT01 | Express ERP remains system of record for financial docs | High |
| BR-INT02 | Supabase holds operational inventory truth for WMS | High |
| BR-INT03 | Sync failures must surface in Sync Monitor within 5 min | Medium |
| BR-INT04 | No direct browser write to Express — use API gateway | High |

## Mockup Phase Exemptions

During Phase 0, **none** of the above rules are enforced. Pages display illustrative data only.
