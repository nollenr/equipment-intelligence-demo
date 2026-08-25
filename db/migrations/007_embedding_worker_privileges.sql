GRANT USAGE ON SCHEMA nextera TO nextera_embedding_worker;

GRANT SELECT ON TABLE
  nextera.demo_principals,
  nextera.retrieval_scopes,
  nextera.retrieval_scope_permissions,
  nextera.documents,
  nextera.document_versions,
  nextera.document_chunks
TO nextera_embedding_worker;

GRANT UPDATE ON TABLE nextera.document_chunks TO nextera_embedding_worker;
