import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = 'postgresql://postgres:EldltIoTaLEHrcuqJFOTWIpdvarCRkcn@interchange.proxy.rlwy.net:26312/railway';

const migrationSQL = `
-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS backer_badges CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS roadmap_steps CASCADE;
DROP TABLE IF EXISTS backers CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS faqs CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS social_links CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS media_items CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  avatar TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
  id VARCHAR(255) PRIMARY KEY,
  slug VARCHAR(255) UNIQUE,
  creator_id VARCHAR(255) REFERENCES users(id),
  title VARCHAR(500) NOT NULL,
  creator VARCHAR(255) NOT NULL,
  creator_bio TEXT,
  creator_avatar TEXT,
  tagline TEXT,
  description TEXT,
  problems TEXT,
  category VARCHAR(100),
  image_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  video_generation_state VARCHAR(50) DEFAULT 'none',
  goal DECIMAL(12, 2) DEFAULT 0,
  pledged DECIMAL(12, 2) DEFAULT 0,
  backers_count INTEGER DEFAULT 0,
  funding_velocity VARCHAR(50) DEFAULT 'stable',
  city VARCHAR(255),
  country VARCHAR(10),
  anticipation_score INTEGER DEFAULT 0,
  impact_score INTEGER DEFAULT 0,
  efficiency_score INTEGER DEFAULT 0,
  comment_summary_sentiment VARCHAR(100),
  comment_summary_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Media items
CREATE TABLE media_items (
  id SERIAL PRIMARY KEY,
  project_id VARCHAR(255) REFERENCES projects(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team members
CREATE TABLE team_members (
  id SERIAL PRIMARY KEY,
  project_id VARCHAR(255) REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255),
  avatar TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Social links
CREATE TABLE social_links (
  id SERIAL PRIMARY KEY,
  project_id VARCHAR(255) REFERENCES projects(id) ON DELETE CASCADE,
  platform VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rewards
CREATE TABLE rewards (
  id SERIAL PRIMARY KEY,
  project_id VARCHAR(255) REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  pledge_amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  is_founders_pass BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FAQs
CREATE TABLE faqs (
  id SERIAL PRIMARY KEY,
  project_id VARCHAR(255) REFERENCES projects(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  project_id VARCHAR(255) REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comments
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  project_id VARCHAR(255) REFERENCES projects(id) ON DELETE CASCADE,
  author VARCHAR(255) NOT NULL,
  avatar TEXT,
  text TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backers
CREATE TABLE backers (
  id SERIAL PRIMARY KEY,
  project_id VARCHAR(255) REFERENCES projects(id) ON DELETE CASCADE,
  user_id VARCHAR(255) REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  avatar TEXT,
  level VARCHAR(50),
  is_founder BOOLEAN DEFAULT FALSE,
  founders_pass_image TEXT,
  pledge_amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backer badges (many-to-many)
CREATE TABLE backer_badges (
  id SERIAL PRIMARY KEY,
  backer_id INTEGER REFERENCES backers(id) ON DELETE CASCADE,
  badge VARCHAR(255) NOT NULL
);

-- Favorites (many-to-many relationship)
CREATE TABLE favorites (
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  project_id VARCHAR(255) REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, project_id)
);

-- Roadmap steps
CREATE TABLE roadmap_steps (
  id SERIAL PRIMARY KEY,
  project_id VARCHAR(255) REFERENCES projects(id) ON DELETE CASCADE,
  milestone VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'planned',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_projects_creator_id ON projects(creator_id);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_is_featured ON projects(is_featured);
CREATE INDEX idx_media_items_project_id ON media_items(project_id);
CREATE INDEX idx_team_members_project_id ON team_members(project_id);
CREATE INDEX idx_social_links_project_id ON social_links(project_id);
CREATE INDEX idx_rewards_project_id ON rewards(project_id);
CREATE INDEX idx_faqs_project_id ON faqs(project_id);
CREATE INDEX idx_documents_project_id ON documents(project_id);
CREATE INDEX idx_comments_project_id ON comments(project_id);
CREATE INDEX idx_backers_project_id ON backers(project_id);
CREATE INDEX idx_roadmap_steps_project_id ON roadmap_steps(project_id);
`;

async function runMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');

    console.log('Running migration...');
    await client.query(migrationSQL);
    console.log('Migration completed successfully!');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\nCreated tables:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

runMigration()
  .then(() => {
    console.log('\n✅ All migrations completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
