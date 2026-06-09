-- Migration: 003_sales_promotion_data_entry.sql
-- Description: Adds tables for Sales Promotion / Modern Trade Price Proposal

CREATE TABLE IF NOT EXISTS public.sc_promotions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    promotion_no varchar(50),
    write_date date,
    customer varchar(255),
    branch_count varchar(50),
    promotion_name varchar(255),
    objective text,
    start_date date,
    end_date date,
    total_days integer,
    starting_cost numeric(15,2),
    
    -- Conditions
    is_new_item boolean DEFAULT false,
    no_entry_fee boolean DEFAULT false,
    entry_fee_amount numeric(15,2),
    media_fee_amount numeric(15,2),
    regular_point boolean DEFAULT false,
    promo_point boolean DEFAULT false,
    has_pretty boolean DEFAULT false,
    other_sales_point varchar(255),
    sell_out_no_return boolean DEFAULT false,
    sell_out_with_return boolean DEFAULT false,
    consignment boolean DEFAULT false,
    other_condition varchar(255),
    tss_fresh_cabinet boolean DEFAULT false,
    tgm_fresh_cabinet boolean DEFAULT false,
    pack_tss boolean DEFAULT false,
    pack_tgm boolean DEFAULT false,
    pack_hb boolean DEFAULT false,
    buy_1_get_1 boolean DEFAULT false,
    price_discount boolean DEFAULT false,
    compensate boolean DEFAULT false,
    has_giveaway boolean DEFAULT false,
    regular_discount_pct numeric(5,2),
    item_discount_pct numeric(5,2),
    other_discount_pct numeric(5,2),

    -- Workflow Status
    status varchar(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'revision_requested', 'cancelled')),

    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sc_promotion_lines (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    promotion_id uuid REFERENCES public.sc_promotions(id) ON DELETE CASCADE,
    seq_no integer,
    product_code varchar(50),
    product_name varchar(255),
    last_promo_no varchar(50),
    last_promo_period varchar(100),
    last_promo_price numeric(15,2),
    weight numeric(15,3),
    regular_selling_price numeric(15,2),
    regular_gp numeric(15,2),
    net_cost numeric(15,2),
    compensate_amount numeric(15,2),
    promo_selling_price numeric(15,2),
    promo_gp numeric(15,2),
    promo_net_cost numeric(15,2),
    last_month_sales numeric(15,2),
    sales_estimate numeric(15,2),
    remark text,

    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sc_promotion_approval_steps (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    promotion_id uuid REFERENCES public.sc_promotions(id) ON DELETE CASCADE,
    step_name varchar(100),
    approver_role varchar(100),
    status varchar(50) DEFAULT 'pending',
    
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sc_promotion_approval_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    promotion_id uuid REFERENCES public.sc_promotions(id) ON DELETE CASCADE,
    action varchar(50),
    action_by varchar(255),
    comment text,
    
    created_at timestamp with time zone DEFAULT now()
);
