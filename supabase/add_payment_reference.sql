-- Add payment_reference to sales table
do $$
begin
  if not exists (select from information_schema.columns where table_name='sales' and column_name='payment_reference') then
    alter table sales add column payment_reference text;
  end if;
end $$;
