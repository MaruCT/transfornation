import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://postgres:bYcltjuZgaVjmflUUTwPqSWBKlnFYhRW@interchange.proxy.rlwy.net:35832/railway',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check tables
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📋 Tables:');
    tables.rows.forEach(row => console.log('  -', row.table_name));

    // Check projects count
    const projectsCount = await client.query('SELECT COUNT(*) FROM projects');
    console.log('\n📊 Projects count:', projectsCount.rows[0].count);

    // Get first 5 projects
    const projects = await client.query('SELECT id, title, creator, image_url FROM projects LIMIT 5');
    console.log('\n📦 Sample projects:');
    projects.rows.forEach(p => console.log(`  - ${p.id}: ${p.title} (by ${p.creator})`));

    // Check media count
    const mediaCount = await client.query('SELECT COUNT(*) FROM media_items');
    console.log('\n🖼️  Media items count:', mediaCount.rows[0].count);

    // Check if any media linked to projects
    const mediaWithProjects = await client.query(`
      SELECT m.project_id, m.type, m.url, p.title
      FROM media_items m
      JOIN projects p ON m.project_id = p.id
      LIMIT 3
    `);
    console.log('\n🔗 Sample media items:');
    mediaWithProjects.rows.forEach(m => console.log(`  - ${m.project_id} (${m.title}): ${m.type} - ${m.url.substring(0, 50)}...`));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

check();
