-- Permission bundle only. The password-bearing worker login is provisioned
-- separately by scripts/provision-embedding-worker-identity.sh.
CREATE ROLE IF NOT EXISTS nextera_embedding_worker;

GRANT CONNECT ON DATABASE nextera_demo TO nextera_embedding_worker;
