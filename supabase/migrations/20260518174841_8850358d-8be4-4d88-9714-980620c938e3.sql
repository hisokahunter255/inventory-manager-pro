
CREATE TABLE public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  barcode text UNIQUE,
  current_sale_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stock_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  quantity_added integer NOT NULL CHECK (quantity_added > 0),
  quantity_remaining integer NOT NULL CHECK (quantity_remaining >= 0),
  cost_price numeric NOT NULL,
  sale_price numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_batches_item_created ON public.stock_batches(item_id, created_at);

CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  batch_id uuid REFERENCES public.stock_batches(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  sale_price numeric NOT NULL,
  cost_price numeric NOT NULL,
  profit numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sales_created ON public.sales(created_at DESC);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_items" ON public.items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_batches" ON public.stock_batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_sales" ON public.sales FOR ALL USING (true) WITH CHECK (true);

-- FIFO sale function: records sale using oldest batches first
CREATE OR REPLACE FUNCTION public.record_sale(p_item_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining integer := p_quantity;
  v_batch record;
  v_take integer;
  v_item_name text;
BEGIN
  SELECT name INTO v_item_name FROM public.items WHERE id = p_item_id;
  IF v_item_name IS NULL THEN RAISE EXCEPTION 'Item not found'; END IF;

  FOR v_batch IN
    SELECT * FROM public.stock_batches
    WHERE item_id = p_item_id AND quantity_remaining > 0
    ORDER BY created_at ASC
  LOOP
    EXIT WHEN v_remaining <= 0;
    v_take := LEAST(v_remaining, v_batch.quantity_remaining);

    UPDATE public.stock_batches
      SET quantity_remaining = quantity_remaining - v_take
      WHERE id = v_batch.id;

    INSERT INTO public.sales (item_id, batch_id, item_name, quantity, sale_price, cost_price, profit)
    VALUES (
      p_item_id, v_batch.id, v_item_name, v_take,
      v_batch.sale_price, v_batch.cost_price,
      (v_batch.sale_price - v_batch.cost_price) * v_take
    );

    v_remaining := v_remaining - v_take;
  END LOOP;

  IF v_remaining > 0 THEN
    RAISE EXCEPTION 'Insufficient stock: short by %', v_remaining;
  END IF;
END;
$$;
