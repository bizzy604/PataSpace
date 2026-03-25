CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '');
$$;

CREATE OR REPLACE FUNCTION app.current_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_role', true), '');
$$;

CREATE OR REPLACE FUNCTION app.access_mode()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(NULLIF(current_setting('app.access_mode', true), ''), 'internal');
$$;

CREATE OR REPLACE FUNCTION app.is_internal()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT app.access_mode() = 'internal';
$$;

CREATE OR REPLACE FUNCTION app.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT app.access_mode() = 'admin' OR app.current_role() = 'ADMIN';
$$;

CREATE OR REPLACE FUNCTION app.is_privileged()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT app.is_internal() OR app.is_admin();
$$;

CREATE OR REPLACE FUNCTION app.set_rls_context(
  context_user_id TEXT,
  context_role TEXT,
  context_access_mode TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('app.current_user_id', COALESCE(context_user_id, ''), true);
  PERFORM set_config('app.current_role', COALESCE(context_role, ''), true);
  PERFORM set_config('app.access_mode', COALESCE(context_access_mode, 'internal'), true);
END;
$$;

CREATE OR REPLACE FUNCTION app.can_access_user(target_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT app.is_privileged() OR target_user_id = app.current_user_id();
$$;

CREATE OR REPLACE FUNCTION app.can_read_listing(
  owner_user_id TEXT,
  listing_status TEXT,
  is_approved BOOLEAN,
  is_deleted BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT
    app.is_privileged()
    OR owner_user_id = app.current_user_id()
    OR (listing_status = 'ACTIVE' AND is_approved = TRUE AND is_deleted = FALSE);
$$;

CREATE OR REPLACE FUNCTION app.can_access_listing_assets(target_listing_id TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM "listings"
    WHERE "listings"."id" = target_listing_id
      AND app.can_read_listing(
        "listings"."userId",
        "listings"."status"::TEXT,
        "listings"."isApproved",
        "listings"."isDeleted"
      )
  );
$$;

CREATE OR REPLACE FUNCTION app.can_access_unlock(target_buyer_id TEXT, target_listing_id TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT
    app.is_privileged()
    OR target_buyer_id = app.current_user_id()
    OR EXISTS (
      SELECT 1
      FROM "listings"
      WHERE "listings"."id" = target_listing_id
        AND "listings"."userId" = app.current_user_id()
    );
$$;

CREATE OR REPLACE FUNCTION app.can_access_participant_unlock(target_unlock_id TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM "unlocks"
    WHERE "unlocks"."id" = target_unlock_id
      AND app.can_access_unlock("unlocks"."buyerId", "unlocks"."listingId")
  );
$$;

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;

ALTER TABLE "refresh_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "refresh_tokens" FORCE ROW LEVEL SECURITY;

ALTER TABLE "otp_codes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "otp_codes" FORCE ROW LEVEL SECURITY;

ALTER TABLE "credits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "credits" FORCE ROW LEVEL SECURITY;

ALTER TABLE "credit_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "credit_transactions" FORCE ROW LEVEL SECURITY;

ALTER TABLE "listings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "listings" FORCE ROW LEVEL SECURITY;

ALTER TABLE "listing_photos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "listing_photos" FORCE ROW LEVEL SECURITY;

ALTER TABLE "uploaded_assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "uploaded_assets" FORCE ROW LEVEL SECURITY;

ALTER TABLE "unlocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "unlocks" FORCE ROW LEVEL SECURITY;

ALTER TABLE "confirmations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "confirmations" FORCE ROW LEVEL SECURITY;

ALTER TABLE "commissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "commissions" FORCE ROW LEVEL SECURITY;

ALTER TABLE "disputes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "disputes" FORCE ROW LEVEL SECURITY;

ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" FORCE ROW LEVEL SECURITY;

ALTER TABLE "system_config" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "system_config" FORCE ROW LEVEL SECURITY;

CREATE POLICY users_select_policy
ON "users"
FOR SELECT
USING (app.can_access_user("id"));

CREATE POLICY users_insert_policy
ON "users"
FOR INSERT
WITH CHECK (app.is_privileged() OR "id" = app.current_user_id());

CREATE POLICY users_update_policy
ON "users"
FOR UPDATE
USING (app.can_access_user("id"))
WITH CHECK (app.is_privileged() OR "id" = app.current_user_id());

CREATE POLICY users_delete_policy
ON "users"
FOR DELETE
USING (app.is_privileged() OR "id" = app.current_user_id());

CREATE POLICY refresh_tokens_select_policy
ON "refresh_tokens"
FOR SELECT
USING (app.is_privileged() OR "userId" = app.current_user_id());

CREATE POLICY refresh_tokens_insert_policy
ON "refresh_tokens"
FOR INSERT
WITH CHECK (app.is_privileged() OR "userId" = app.current_user_id());

CREATE POLICY refresh_tokens_update_policy
ON "refresh_tokens"
FOR UPDATE
USING (app.is_privileged() OR "userId" = app.current_user_id())
WITH CHECK (app.is_privileged() OR "userId" = app.current_user_id());

CREATE POLICY refresh_tokens_delete_policy
ON "refresh_tokens"
FOR DELETE
USING (app.is_privileged() OR "userId" = app.current_user_id());

CREATE POLICY otp_codes_all_policy
ON "otp_codes"
FOR ALL
USING (app.is_privileged())
WITH CHECK (app.is_privileged());

CREATE POLICY credits_select_policy
ON "credits"
FOR SELECT
USING (app.is_privileged() OR "userId" = app.current_user_id());

CREATE POLICY credits_insert_policy
ON "credits"
FOR INSERT
WITH CHECK (app.is_privileged() OR "userId" = app.current_user_id());

CREATE POLICY credits_update_policy
ON "credits"
FOR UPDATE
USING (app.is_privileged() OR "userId" = app.current_user_id())
WITH CHECK (app.is_privileged() OR "userId" = app.current_user_id());

CREATE POLICY credits_delete_policy
ON "credits"
FOR DELETE
USING (app.is_privileged() OR "userId" = app.current_user_id());

CREATE POLICY credit_transactions_select_policy
ON "credit_transactions"
FOR SELECT
USING (app.is_privileged() OR "userId" = app.current_user_id());

CREATE POLICY credit_transactions_insert_policy
ON "credit_transactions"
FOR INSERT
WITH CHECK (app.is_privileged() OR "userId" = app.current_user_id());

CREATE POLICY credit_transactions_update_policy
ON "credit_transactions"
FOR UPDATE
USING (app.is_privileged() OR "userId" = app.current_user_id())
WITH CHECK (app.is_privileged() OR "userId" = app.current_user_id());

CREATE POLICY credit_transactions_delete_policy
ON "credit_transactions"
FOR DELETE
USING (app.is_privileged() OR "userId" = app.current_user_id());

CREATE POLICY listings_select_policy
ON "listings"
FOR SELECT
USING (
  app.can_read_listing(
    "userId",
    "status"::TEXT,
    "isApproved",
    "isDeleted"
  )
);

CREATE POLICY listings_insert_policy
ON "listings"
FOR INSERT
WITH CHECK (app.is_privileged() OR "userId" = app.current_user_id());

CREATE POLICY listings_update_policy
ON "listings"
FOR UPDATE
USING (app.is_privileged() OR "userId" = app.current_user_id())
WITH CHECK (app.is_privileged() OR "userId" = app.current_user_id());

CREATE POLICY listings_delete_policy
ON "listings"
FOR DELETE
USING (app.is_privileged() OR "userId" = app.current_user_id());

CREATE POLICY listing_photos_select_policy
ON "listing_photos"
FOR SELECT
USING (app.can_access_listing_assets("listingId"));

CREATE POLICY listing_photos_insert_policy
ON "listing_photos"
FOR INSERT
WITH CHECK (
  app.is_privileged()
  OR EXISTS (
    SELECT 1
    FROM "listings"
    WHERE "listings"."id" = "listing_photos"."listingId"
      AND "listings"."userId" = app.current_user_id()
  )
);

CREATE POLICY listing_photos_update_policy
ON "listing_photos"
FOR UPDATE
USING (
  app.is_privileged()
  OR EXISTS (
    SELECT 1
    FROM "listings"
    WHERE "listings"."id" = "listing_photos"."listingId"
      AND "listings"."userId" = app.current_user_id()
  )
)
WITH CHECK (
  app.is_privileged()
  OR EXISTS (
    SELECT 1
    FROM "listings"
    WHERE "listings"."id" = "listing_photos"."listingId"
      AND "listings"."userId" = app.current_user_id()
  )
);

CREATE POLICY listing_photos_delete_policy
ON "listing_photos"
FOR DELETE
USING (
  app.is_privileged()
  OR EXISTS (
    SELECT 1
    FROM "listings"
    WHERE "listings"."id" = "listing_photos"."listingId"
      AND "listings"."userId" = app.current_user_id()
  )
);

CREATE POLICY uploaded_assets_select_policy
ON "uploaded_assets"
FOR SELECT
USING (app.is_privileged() OR "userId" = app.current_user_id());

CREATE POLICY uploaded_assets_insert_policy
ON "uploaded_assets"
FOR INSERT
WITH CHECK (app.is_privileged() OR "userId" = app.current_user_id());

CREATE POLICY uploaded_assets_update_policy
ON "uploaded_assets"
FOR UPDATE
USING (app.is_privileged() OR "userId" = app.current_user_id())
WITH CHECK (app.is_privileged() OR "userId" = app.current_user_id());

CREATE POLICY uploaded_assets_delete_policy
ON "uploaded_assets"
FOR DELETE
USING (app.is_privileged() OR "userId" = app.current_user_id());

CREATE POLICY unlocks_select_policy
ON "unlocks"
FOR SELECT
USING (app.can_access_unlock("buyerId", "listingId"));

CREATE POLICY unlocks_insert_policy
ON "unlocks"
FOR INSERT
WITH CHECK (app.can_access_unlock("buyerId", "listingId"));

CREATE POLICY unlocks_update_policy
ON "unlocks"
FOR UPDATE
USING (app.can_access_unlock("buyerId", "listingId"))
WITH CHECK (app.can_access_unlock("buyerId", "listingId"));

CREATE POLICY unlocks_delete_policy
ON "unlocks"
FOR DELETE
USING (app.can_access_unlock("buyerId", "listingId"));

CREATE POLICY confirmations_select_policy
ON "confirmations"
FOR SELECT
USING (app.can_access_participant_unlock("unlockId"));

CREATE POLICY confirmations_insert_policy
ON "confirmations"
FOR INSERT
WITH CHECK (app.can_access_participant_unlock("unlockId"));

CREATE POLICY confirmations_update_policy
ON "confirmations"
FOR UPDATE
USING (app.can_access_participant_unlock("unlockId"))
WITH CHECK (app.can_access_participant_unlock("unlockId"));

CREATE POLICY confirmations_delete_policy
ON "confirmations"
FOR DELETE
USING (app.can_access_participant_unlock("unlockId"));

CREATE POLICY commissions_select_policy
ON "commissions"
FOR SELECT
USING (
  app.is_privileged()
  OR "outgoingTenantId" = app.current_user_id()
  OR app.can_access_participant_unlock("unlockId")
);

CREATE POLICY commissions_insert_policy
ON "commissions"
FOR INSERT
WITH CHECK (
  app.is_privileged()
  OR "outgoingTenantId" = app.current_user_id()
  OR app.can_access_participant_unlock("unlockId")
);

CREATE POLICY commissions_update_policy
ON "commissions"
FOR UPDATE
USING (
  app.is_privileged()
  OR "outgoingTenantId" = app.current_user_id()
  OR app.can_access_participant_unlock("unlockId")
)
WITH CHECK (
  app.is_privileged()
  OR "outgoingTenantId" = app.current_user_id()
  OR app.can_access_participant_unlock("unlockId")
);

CREATE POLICY commissions_delete_policy
ON "commissions"
FOR DELETE
USING (
  app.is_privileged()
  OR "outgoingTenantId" = app.current_user_id()
  OR app.can_access_participant_unlock("unlockId")
);

CREATE POLICY disputes_select_policy
ON "disputes"
FOR SELECT
USING (app.can_access_participant_unlock("unlockId"));

CREATE POLICY disputes_insert_policy
ON "disputes"
FOR INSERT
WITH CHECK (app.can_access_participant_unlock("unlockId"));

CREATE POLICY disputes_update_policy
ON "disputes"
FOR UPDATE
USING (app.can_access_participant_unlock("unlockId"))
WITH CHECK (app.can_access_participant_unlock("unlockId"));

CREATE POLICY disputes_delete_policy
ON "disputes"
FOR DELETE
USING (app.can_access_participant_unlock("unlockId"));

CREATE POLICY audit_logs_select_policy
ON "audit_logs"
FOR SELECT
USING (app.is_privileged() OR ("userId" IS NOT NULL AND "userId" = app.current_user_id()));

CREATE POLICY audit_logs_insert_policy
ON "audit_logs"
FOR INSERT
WITH CHECK (app.is_privileged() OR ("userId" IS NOT NULL AND "userId" = app.current_user_id()));

CREATE POLICY audit_logs_update_policy
ON "audit_logs"
FOR UPDATE
USING (app.is_privileged() OR ("userId" IS NOT NULL AND "userId" = app.current_user_id()))
WITH CHECK (app.is_privileged() OR ("userId" IS NOT NULL AND "userId" = app.current_user_id()));

CREATE POLICY audit_logs_delete_policy
ON "audit_logs"
FOR DELETE
USING (app.is_privileged() OR ("userId" IS NOT NULL AND "userId" = app.current_user_id()));

CREATE POLICY system_config_all_policy
ON "system_config"
FOR ALL
USING (app.is_privileged())
WITH CHECK (app.is_privileged());
