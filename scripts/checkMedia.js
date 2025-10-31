import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://postgres:bYcltjuZgaVjmflUUTwPqSWBKlnFYhRW@interchange.proxy.rlwy.net:35832/railway',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check recent projects with media
    const projectsWithMedia = await client.query(`
      SELECT
        p.id,
        p.title,
        p.creator,
        p.image_url,
        COUNT(m.id) as media_count,
        p.created_at,
        p.updated_at
      FROM projects p
      LEFT JOIN media_items m ON p.id = m.project_id
      GROUP BY p.id, p.title, p.creator, p.image_url, p.created_at, p.updated_at
      ORDER BY p.updated_at DESC
      LIMIT 5
    `);

    console.log('📦 Recent projects (sorted by last update):');
    projectsWithMedia.rows.forEach(p => {
      console.log(`\n  ${p.id}: ${p.title}`);
      console.log(`    Creator: ${p.creator}`);
      console.log(`    Main image: ${p.image_url ? p.image_url.substring(0, 60) + '...' : 'none'}`);
      console.log(`    Media items: ${p.media_count}`);
      console.log(`    Last updated: ${p.updated_at}`);
    });

    // Get all media items for the most recent project
    const recentProject = projectsWithMedia.rows[0];
    if (recentProject && recentProject.media_count > 0) {
      console.log(`\n\n🖼️  Media items for "${recentProject.title}" (${recentProject.id}):`);

      const mediaItems = await client.query(`
        SELECT id, type, url, position, created_at
        FROM media_items
        WHERE project_id = $1
        ORDER BY position
      `, [recentProject.id]);

      mediaItems.rows.forEach((m, idx) => {
        console.log(`\n  ${idx + 1}. ${m.type.toUpperCase()} (position: ${m.position})`);
        console.log(`     URL: ${m.url}`);
        console.log(`     Created: ${m.created_at}`);
      });
    }

    // Show structure example
    console.log('\n\n📊 How media is stored in database:');
    console.log('  Table: media_items');
    console.log('  Columns:');
    console.log('    - id: SERIAL PRIMARY KEY');
    console.log('    - project_id: VARCHAR(255) (links to projects.id)');
    console.log('    - type: VARCHAR(50) ("image" or "video")');
    console.log('    - url: TEXT (Cloudinary URL like https://res.cloudinary.com/...)');
    console.log('    - position: INTEGER (order in gallery: 0, 1, 2, ...)');
    console.log('    - created_at: TIMESTAMP');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

check();
