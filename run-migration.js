const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_2xUOl6ajvhtR@ep-aged-queen-aul2x5sv.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

(async () => {
  try {
    await client.connect();
    console.log('✅ Connected to Neon database');
    
    // PostgreSQL-compatible schema
    const sql = `
      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        template_id VARCHAR(255) NOT NULL,
        template_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
        category VARCHAR(50) NOT NULL,
        title VARCHAR(255),
        description TEXT,
        content_data JSONB NOT NULL,
        content_snapshot TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_exported_at TIMESTAMP NULL,
        last_export_format VARCHAR(20),
        is_deleted BOOLEAN DEFAULT FALSE,
        is_archived BOOLEAN DEFAULT FALSE,
        version BIGINT DEFAULT 1
      );
      
      CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
      CREATE INDEX IF NOT EXISTS idx_documents_template_id ON documents(template_id);
      CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
    `;
    
    await client.query(sql);
    console.log('✅ Database migrations applied successfully');
    
    const result = await client.query("SELECT * FROM information_schema.tables WHERE table_name='documents'");
    if (result.rows.length > 0) {
      console.log('✅ documents table created');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
})();
