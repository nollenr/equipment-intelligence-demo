-- Keep runtime identities from creating untracked objects outside the nextera schema.
-- This affects only the public schema in nextera_demo.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
