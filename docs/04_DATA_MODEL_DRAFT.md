# 04 — Data Model Draft

> Draft entity model for Phase 1+ implementation. Not enforced in mockup shell.

## Core Entities

### sales_order
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| order_no | text | Unique, e.g. SO-2026-001 |
| customer_id | uuid | FK → customer |
| order_date | date | |
| delivery_date | date | |
| status | enum | Draft, Confirmed, Partial Pick, Shipped, Closed |
| total_amount | decimal | |
| created_at | timestamptz | |

### sales_order_line
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | |
| sales_order_id | uuid | FK |
| sku | text | FK → product |
| qty_ordered | decimal | |
| qty_reserved | decimal | |
| qty_picked | decimal | |
| qty_shipped | decimal | |
| uom | text | |

### inventory_balance
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | |
| sku | text | |
| warehouse_id | uuid | |
| location_id | uuid | Nullable for warehouse-level |
| lot_no | text | |
| qty_on_hand | decimal | |
| qty_reserved | decimal | |
| qty_available | computed | on_hand - reserved |

### wms_task
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | |
| task_no | text | |
| task_type | enum | Receiving, Putaway, Transfer, Picking, Dispatch, Count, Adjustment |
| reference_no | text | PO, SO, or transfer ref |
| warehouse_id | uuid | |
| status | enum | Pending, Assigned, In Progress, Done |
| assigned_to | text | Team or user |
| due_date | date | |

### consignment_branch_stock
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | |
| branch_id | uuid | |
| sku | text | |
| qty_on_hand | decimal | |
| qty_sold | decimal | Period cumulative |
| qty_return_pending | decimal | |

### product (master)
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | |
| sku | text | Unique |
| product_name | text | |
| category | text | |
| base_uom | text | |
| barcode | text | |
| status | enum | Active, Inactive |

### customer (master)
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | |
| customer_code | text | |
| customer_name | text | |
| channel | text | |
| region | text | |
| credit_term_days | int | |

## Relationships (Summary)

```
customer 1──* sales_order 1──* sales_order_line
product 1──* sales_order_line
product 1──* inventory_balance
warehouse 1──* inventory_balance
warehouse 1──* wms_task
branch 1──* consignment_branch_stock
product 1──* consignment_branch_stock
```

## Mock File Mapping

| Mock File | Primary Entities |
|-----------|------------------|
| mockSalesOrders.js | sales_order (+ aggregated line stats) |
| mockInventory.js | inventory_balance |
| mockWms.js | wms_task |
| mockConsignment.js | consignment_branch_stock |
| mockMasterData.js | product, customer, branch, warehouse |

## Open Questions

1. Should lot/expiry be mandatory for all frozen SKUs?
2. Is reservation at warehouse level or location level?
3. How does Express ERP order number map to Supabase `order_no`?
4. Consignment sold qty — daily sync or real-time from branch POS?
