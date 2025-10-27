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

    // Check all tables
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('📋 All Tables:');
    tables.rows.forEach(row => console.log('  -', row.table_name));

    // Check for team_members table
    console.log('\n👥 Team Members Table:');
    const teamCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'team_members'
      );
    `);
    console.log('  Exists:', teamCheck.rows[0].exists);

    if (teamCheck.rows[0].exists) {
      const teamCount = await client.query('SELECT COUNT(*) FROM team_members');
      console.log('  Count:', teamCount.rows[0].count);

      const teamColumns = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'team_members'
        ORDER BY ordinal_position
      `);
      console.log('  Columns:');
      teamColumns.rows.forEach(col => console.log(`    - ${col.column_name} (${col.data_type})`));

      const teamSample = await client.query('SELECT * FROM team_members LIMIT 3');
      if (teamSample.rows.length > 0) {
        console.log('  Sample data:');
        teamSample.rows.forEach(row => console.log(`    - ${row.name} (${row.role}) - Project: ${row.project_id}`));
      }
    }

    // Check for social_links table
    console.log('\n🔗 Social Links Table:');
    const socialCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'social_links'
      );
    `);
    console.log('  Exists:', socialCheck.rows[0].exists);

    if (socialCheck.rows[0].exists) {
      const socialCount = await client.query('SELECT COUNT(*) FROM social_links');
      console.log('  Count:', socialCount.rows[0].count);

      const socialColumns = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'social_links'
        ORDER BY ordinal_position
      `);
      console.log('  Columns:');
      socialColumns.rows.forEach(col => console.log(`    - ${col.column_name} (${col.data_type})`));

      const socialSample = await client.query('SELECT * FROM social_links LIMIT 3');
      if (socialSample.rows.length > 0) {
        console.log('  Sample data:');
        socialSample.rows.forEach(row => console.log(`    - ${row.platform}: ${row.url} - Project: ${row.project_id}`));
      }
    }

    // Check for faqs table
    console.log('\n❓ FAQs Table:');
    const faqCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'faqs'
      );
    `);
    console.log('  Exists:', faqCheck.rows[0].exists);

    if (faqCheck.rows[0].exists) {
      const faqCount = await client.query('SELECT COUNT(*) FROM faqs');
      console.log('  Count:', faqCount.rows[0].count);

      const faqColumns = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'faqs'
        ORDER BY ordinal_position
      `);
      console.log('  Columns:');
      faqColumns.rows.forEach(col => console.log(`    - ${col.column_name} (${col.data_type})`));

      const faqSample = await client.query('SELECT * FROM faqs LIMIT 3');
      if (faqSample.rows.length > 0) {
        console.log('  Sample data:');
        faqSample.rows.forEach(row => console.log(`    - Q: ${row.question.substring(0, 50)}... - Project: ${row.project_id}`));
      }
    }

    // Check for roadmap table
    console.log('\n🗺️  Roadmap Table:');
    const roadmapCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'roadmap'
      );
    `);
    console.log('  Exists:', roadmapCheck.rows[0].exists);

    if (roadmapCheck.rows[0].exists) {
      const roadmapCount = await client.query('SELECT COUNT(*) FROM roadmap');
      console.log('  Count:', roadmapCount.rows[0].count);

      const roadmapColumns = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'roadmap'
        ORDER BY ordinal_position
      `);
      console.log('  Columns:');
      roadmapColumns.rows.forEach(col => console.log(`    - ${col.column_name} (${col.data_type})`));

      const roadmapSample = await client.query('SELECT * FROM roadmap LIMIT 3');
      if (roadmapSample.rows.length > 0) {
        console.log('  Sample data:');
        roadmapSample.rows.forEach(row => console.log(`    - ${row.title} (${row.date}) - Project: ${row.project_id}`));
      }
    }

    // Check for rewards table
    console.log('\n🎁 Rewards Table:');
    const rewardsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'rewards'
      );
    `);
    console.log('  Exists:', rewardsCheck.rows[0].exists);

    if (rewardsCheck.rows[0].exists) {
      const rewardsCount = await client.query('SELECT COUNT(*) FROM rewards');
      console.log('  Count:', rewardsCount.rows[0].count);

      const rewardsColumns = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'rewards'
        ORDER BY ordinal_position
      `);
      console.log('  Columns:');
      rewardsColumns.rows.forEach(col => console.log(`    - ${col.column_name} (${col.data_type})`));

      const rewardsSample = await client.query('SELECT * FROM rewards LIMIT 3');
      if (rewardsSample.rows.length > 0) {
        console.log('  Sample data:');
        rewardsSample.rows.forEach(row => console.log(`    - ${row.title} ($${row.pledge_amount}) - Project: ${row.project_id}`));
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

check();
