-- 017_kitchen_recipe_costing.sql
-- Costeo de recetas para organizaciones tipo `kitchen`:
--   1) inventory_items: precio + cantidad por paquete (para derivar cost_per_unit).
--   2) products: porciones (rinde) + costos de mano de obra / embalaje / otros
--      + margen de ganancia objetivo. cost_estimate pasa a usarse como snapshot
--      del costo total calculado de la receta.
--   3) recipe_ingredients: sub-recetas anidadas (una línea es un ingrediente de
--      inventario XOR una sub-receta / producto).
-- RLS: las columnas nuevas heredan las políticas existentes (scope por
-- organization_id vía get_user_org_ids()); no se requieren políticas nuevas.

begin;

-- 1. inventory_items ---------------------------------------------------------
alter table public.inventory_items
  add column if not exists package_price    numeric,
  add column if not exists package_quantity numeric;

comment on column public.inventory_items.package_price    is 'Precio total del paquete de compra (opcional; deriva cost_per_unit).';
comment on column public.inventory_items.package_quantity is 'Cantidad por paquete en la unidad de `unit` (opcional; deriva cost_per_unit).';

-- 2. products ----------------------------------------------------------------
alter table public.products
  add column if not exists portions       numeric not null default 1,
  add column if not exists labor_cost     numeric not null default 0,
  add column if not exists packaging_cost numeric not null default 0,
  add column if not exists other_costs    numeric not null default 0,
  add column if not exists target_margin  numeric not null default 0;

comment on column public.products.portions       is 'Rinde: nº de porciones/unidades que produce la receta.';
comment on column public.products.labor_cost     is 'Mano de obra imputada a la receta.';
comment on column public.products.packaging_cost is 'Embalaje / empaque / etiquetas de la receta.';
comment on column public.products.other_costs    is 'Otros costos de la receta.';
comment on column public.products.target_margin  is 'Margen de ganancia objetivo (%) sobre el precio de venta.';

-- 3. recipe_ingredients ------------------------------------------------------
-- Nueva referencia opcional a una sub-receta (otro producto).
alter table public.recipe_ingredients
  add column if not exists sub_recipe_product_id uuid
    references public.products(id) on delete cascade;

-- Una línea puede ser ingrediente de inventario o sub-receta, ya no ambos NOT NULL.
alter table public.recipe_ingredients
  alter column inventory_item_id drop not null;

-- Exactamente uno de los dos: ingrediente de inventario XOR sub-receta.
alter table public.recipe_ingredients
  drop constraint if exists recipe_ingredients_source_chk;
alter table public.recipe_ingredients
  add constraint recipe_ingredients_source_chk
  check ((inventory_item_id is not null) <> (sub_recipe_product_id is not null));

-- Una receta no puede ser sub-receta de sí misma (los ciclos más profundos se
-- controlan en la capa de aplicación con un set de visitados + límite de profundidad).
alter table public.recipe_ingredients
  drop constraint if exists recipe_ingredients_no_self_chk;
alter table public.recipe_ingredients
  add constraint recipe_ingredients_no_self_chk
  check (sub_recipe_product_id is null or sub_recipe_product_id <> product_id);

-- Evitar duplicar la misma sub-receta dentro de una receta.
-- (El unique existente sobre (product_id, inventory_item_id) se mantiene: los
-- NULL se consideran distintos en Postgres, por lo que no bloquea sub-recetas.)
create unique index if not exists recipe_ingredients_unique_subrecipe
  on public.recipe_ingredients (product_id, sub_recipe_product_id)
  where sub_recipe_product_id is not null;

commit;
