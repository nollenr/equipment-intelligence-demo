-- Permission bundles only. The password-bearing nextera_app login is provisioned
-- separately by scripts/provision-app-identity.sh.
CREATE ROLE IF NOT EXISTS nextera_app_read;
CREATE ROLE IF NOT EXISTS nextera_app_runtime;

GRANT nextera_app_read TO nextera_app_runtime;
GRANT CONNECT ON DATABASE nextera_demo TO nextera_app_read;
GRANT CONNECT ON DATABASE nextera_demo TO nextera_app_runtime;
