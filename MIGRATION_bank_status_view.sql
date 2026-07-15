-- The dashboard used to read retailer_accounts directly and gate on
-- `plaid_access_token` being non-null - which meant shipping the raw Plaid token
-- to the browser just to render "Bank Connected". retailer_accounts is now
-- locked to service-role only, so expose just the safe fields through a view.
--
-- security_invoker = off: the view runs as its owner and bypasses RLS on the
-- underlying table. The WHERE clause is the security boundary - my_retailer_ids()
-- resolves auth.uid() from the caller's JWT, so a user only ever sees their own.
-- The token is never selected.

create or replace view public.retailer_bank_status
with (security_invoker = off) as
select
  ra.retailer_id,
  ra.institution_name,
  ra.account_name,
  ra.account_mask,
  ra.linked_at,
  (ra.plaid_access_token is not null) as is_connected
from public.retailer_accounts ra
where ra.retailer_id in (select public.my_retailer_ids());

revoke all on public.retailer_bank_status from anon, public;
grant select on public.retailer_bank_status to authenticated;
