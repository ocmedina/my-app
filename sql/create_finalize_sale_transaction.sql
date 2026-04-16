-- Atomic sale finalization: sale + items + stock + customer debt + payments + optional supplier payment
create or replace function public.finalize_sale_transaction(
  p_customer_id uuid,
  p_profile_id uuid,
  p_total_amount numeric,
  p_payment_method text,
  p_amount_paid numeric,
  p_created_at timestamptz,
  p_items jsonb,
  p_use_mixed_payment boolean default false,
  p_payment_methods jsonb default '[]'::jsonb,
  p_pay_to_supplier boolean default false,
  p_selected_supplier_id uuid default null,
  p_customer_full_name text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_sale_id uuid;
  v_debt_generated numeric := coalesce(p_total_amount, 0) - coalesce(p_amount_paid, 0);
  v_new_customer_debt numeric;
  v_new_supplier_debt numeric;
  v_item record;
  v_payment record;
  v_product_name text;
  v_product_sku text;
  v_current_stock integer;
begin
  if auth.uid() is null then
    raise exception 'Usuario no autenticado';
  end if;

  if p_profile_id is null or auth.uid() <> p_profile_id then
    raise exception 'Perfil invalido para registrar la venta';
  end if;

  if p_customer_id is null then
    raise exception 'Cliente requerido';
  end if;

  if p_items is null
    or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) = 0 then
    raise exception 'La venta debe tener al menos un item';
  end if;

  insert into public.sales (
    customer_id,
    profile_id,
    total_amount,
    payment_method,
    amount_paid,
    amount_pending,
    created_at
  )
  values (
    p_customer_id,
    p_profile_id,
    coalesce(p_total_amount, 0),
    p_payment_method,
    coalesce(p_amount_paid, 0),
    v_debt_generated,
    coalesce(p_created_at, now())
  )
  returning id into v_sale_id;

  for v_item in
    select *
    from jsonb_to_recordset(p_items) as t(
      product_id uuid,
      quantity integer,
      price numeric
    )
  loop
    if v_item.product_id is null or coalesce(v_item.quantity, 0) <= 0 then
      raise exception 'Item invalido en la venta';
    end if;

    insert into public.sale_items (
      sale_id,
      product_id,
      quantity,
      price
    )
    values (
      v_sale_id,
      v_item.product_id,
      v_item.quantity,
      coalesce(v_item.price, 0)
    );

    select name, sku, stock
      into v_product_name, v_product_sku, v_current_stock
    from public.products
    where id = v_item.product_id
    for update;

    if not found then
      raise exception 'Producto no encontrado: %', v_item.product_id;
    end if;

    if not (
      coalesce(lower(v_product_name), '') like '%alimento suelto%'
      or coalesce(lower(v_product_name), '') like '%alimento a granel%'
      or upper(coalesce(v_product_sku, '')) in ('SUELTO', 'GRANEL')
    ) then
      if coalesce(v_current_stock, 0) < v_item.quantity then
        raise exception 'Stock insuficiente para % (stock actual: %, requerido: %)',
          coalesce(v_product_name, v_item.product_id::text),
          coalesce(v_current_stock, 0),
          v_item.quantity;
      end if;

      update public.products
      set stock = stock - v_item.quantity
      where id = v_item.product_id;
    end if;
  end loop;

  update public.customers
  set debt = coalesce(debt, 0) + v_debt_generated
  where id = p_customer_id
  returning debt into v_new_customer_debt;

  if not found then
    raise exception 'Cliente no encontrado: %', p_customer_id;
  end if;

  if v_debt_generated > 0 then
    insert into public.payments (
      customer_id,
      sale_id,
      type,
      amount,
      payment_method,
      comment,
      created_at
    )
    values (
      p_customer_id,
      v_sale_id,
      'compra',
      v_debt_generated,
      p_payment_method,
      case
        when coalesce(p_use_mixed_payment, false) then 'Venta parcial - pagos mixtos'
        when coalesce(p_payment_method, '') = 'cuenta_corriente' then 'Venta a credito'
        else 'Venta parcial'
      end,
      coalesce(p_created_at, now())
    );
  end if;

  if coalesce(p_amount_paid, 0) > 0 then
    if coalesce(p_use_mixed_payment, false) then
      for v_payment in
        select *
        from jsonb_to_recordset(coalesce(p_payment_methods, '[]'::jsonb)) as t(
          method text,
          amount numeric
        )
      loop
        if coalesce(v_payment.amount, 0) > 0 then
          insert into public.payments (
            customer_id,
            sale_id,
            type,
            amount,
            payment_method,
            comment,
            created_at
          )
          values (
            p_customer_id,
            v_sale_id,
            'pago',
            v_payment.amount,
            v_payment.method,
            format('Pago con %s', coalesce(nullif(v_payment.method, ''), 'metodo no especificado')),
            coalesce(p_created_at, now())
          );
        end if;
      end loop;
    else
      insert into public.payments (
        customer_id,
        sale_id,
        type,
        amount,
        payment_method,
        comment,
        created_at
      )
      values (
        p_customer_id,
        v_sale_id,
        'pago',
        coalesce(p_amount_paid, 0),
        p_payment_method,
        format('Pago con %s', coalesce(nullif(p_payment_method, ''), 'metodo no especificado')),
        coalesce(p_created_at, now())
      );
    end if;
  end if;

  if coalesce(p_pay_to_supplier, false)
     and p_selected_supplier_id is not null
     and coalesce(p_amount_paid, 0) > 0 then

    update public.suppliers
    set debt = coalesce(debt, 0) - coalesce(p_amount_paid, 0)
    where id = p_selected_supplier_id
    returning debt into v_new_supplier_debt;

    if not found then
      raise exception 'Proveedor no encontrado: %', p_selected_supplier_id;
    end if;

    insert into public.supplier_payments (
      supplier_id,
      amount,
      payment_method,
      notes,
      created_at
    )
    values (
      p_selected_supplier_id,
      coalesce(p_amount_paid, 0),
      coalesce(nullif(p_payment_method, ''), 'efectivo'),
      format(
        'Pago directo de venta %s - Cliente: %s',
        left(v_sale_id::text, 8),
        coalesce(p_customer_full_name, 'N/A')
      ),
      coalesce(p_created_at, now())
    );
  end if;

  return jsonb_build_object(
    'sale_id', v_sale_id,
    'debt_generated', v_debt_generated,
    'new_customer_debt', v_new_customer_debt,
    'new_supplier_debt', v_new_supplier_debt
  );
end;
$$;

grant execute on function public.finalize_sale_transaction(
  uuid,
  uuid,
  numeric,
  text,
  numeric,
  timestamptz,
  jsonb,
  boolean,
  jsonb,
  boolean,
  uuid,
  text
) to authenticated;
