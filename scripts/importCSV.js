import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = 'postgresql://postgres:EldltIoTaLEHrcuqJFOTWIpdvarCRkcn@interchange.proxy.rlwy.net:26312/railway';
const CSV_FILE_PATH = path.join(__dirname, '..', 'tpdb.csv');

// Helper functions from csvImport.ts
function parseJSONCell(raw, fallback) {
  if (!raw) return fallback;
  const attempts = [];
  const base = raw.trim();
  attempts.push(base);

  const noNewlines = base.replace(/\r\n|\r|\n/g, '');
  attempts.push(noNewlines);

  const straightQuotes = noNewlines
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'");
  attempts.push(straightQuotes);

  const normalizedBools = straightQuotes.replace(/\bTRUE\b/g, 'true').replace(/\bFALSE\b/g, 'false');
  attempts.push(normalizedBools);

  const unwrapped = normalizedBools.replace(/^"([\s\S]*)"$/,'$1');
  attempts.push(unwrapped);

  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      // Continue to next attempt
    }
  }

  return fallback;
}

function parseNumber(raw, def) {
  const n = Number(raw);
  return Number.isFinite(n) ? n : def;
}

function parseBoolean(raw, def = false) {
  if (!raw) return def;
  const s = raw.trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'y';
}

function sanitize(v) {
  if (!v) return v;
  let s = v.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  return s.trim();
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  const firstLine = text.split(/\r?\n/)[0] || '';
  const delimiter = (() => {
    const counts = [',', '\t', ';'].map(d => ({ d, c: (firstLine.match(new RegExp(`\\${d}`, 'g')) || []).length }));
    counts.sort((a, b) => b.c - a.c);
    return counts[0].c > 0 ? counts[0].d : ',';
  })();

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') { field += '"'; i += 1; }
      else { inQuotes = !inQuotes; }
    } else if (ch === delimiter && !inQuotes) {
      row.push(field.trim()); field = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (field.length || row.length) { row.push(field.trim()); rows.push(row); row = []; field = ''; }
    } else { field += ch; }
  }
  if (field.length || row.length) { row.push(field.trim()); rows.push(row); }

  return rows;
}

async function importData() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Reading CSV file...');
    const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');

    console.log('Parsing CSV...');
    const rows = parseCSV(csvContent);

    if (rows.length < 2) {
      console.log('No data to import');
      return;
    }

    const header = rows[0].map(h => h.replace(/^\uFEFF/, ''));
    const headerIndexByNameLower = new Map();
    header.forEach((h, i) => headerIndexByNameLower.set(h.trim().toLowerCase(), i));

    const idxi = (name) => headerIndexByNameLower.get(name.trim().toLowerCase()) ?? -1;
    const getAny = (names, cols) => {
      for (const n of names) {
        const i = idxi(n);
        if (i >= 0 && cols[i] && cols[i].trim().length) return cols[i];
      }
      return undefined;
    };

    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');

    console.log(`Processing ${rows.length - 1} projects...`);

    for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
      const cols = rows[rowIndex];
      const get = (name) => cols[idxi(name)];

      const projectId = get('id') || `proj-${rowIndex}`;
      const title = sanitize(get('title')) || 'Untitled';
      const creator = sanitize(get('creator')) || 'Unknown';

      console.log(`\nImporting project ${rowIndex}/${rows.length - 1}: ${title}`);

      // Check if user exists, if not create one
      const creatorId = creator.toLowerCase().replace(/\s+/g, '_');
      const userCheck = await client.query('SELECT id FROM users WHERE id = $1', [creatorId]);

      if (userCheck.rows.length === 0) {
        console.log(`  Creating user: ${creator}`);
        await client.query(
          'INSERT INTO users (id, name, avatar) VALUES ($1, $2, $3)',
          [creatorId, creator, sanitize(get('creatorAvatar')) || '']
        );
      }

      // Insert project
      console.log(`  Inserting project: ${projectId}`);
      await client.query(`
        INSERT INTO projects (
          id, slug, creator_id, title, creator, creator_bio, creator_avatar,
          tagline, description, problems, category, image_url, is_featured,
          video_generation_state, goal, pledged, backers_count, funding_velocity,
          city, country, anticipation_score, impact_score, efficiency_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          updated_at = CURRENT_TIMESTAMP
      `, [
        projectId,
        sanitize(getAny(['slug', 'permalink'], cols)),
        creatorId,
        title,
        creator,
        sanitize(get('creatorBio')) || '',
        sanitize(get('creatorAvatar')) || '',
        sanitize(get('tagline')) || '',
        sanitize(get('description')) || '',
        sanitize(getAny(['problems', 'problem', 'problemStatement'], cols)) || '',
        sanitize(get('category')) || 'General',
        sanitize(getAny(['imageUrl', 'imageURL', 'image', 'cover', 'coverImage'], cols)) || '',
        parseBoolean(getAny(['isFeatured', 'featured'], cols)),
        get('videoGenerationState') || 'none',
        parseNumber(get('goal'), 0),
        parseNumber(get('pledged'), 0),
        parseNumber(get('backers'), 0),
        get('fundingVelocity') || 'stable',
        get('city') || '',
        get('country') || '',
        parseNumber(get('anticipationScore'), 0),
        parseNumber(get('impactScore'), 0),
        parseNumber(get('efficiencyScore'), 0)
      ]);

      // Insert media items
      const mediaRaw = parseJSONCell(getAny(['mediaUrls', 'mediaURL', 'media'], cols), []);
      if (Array.isArray(mediaRaw) && mediaRaw.length > 0) {
        console.log(`  Inserting ${mediaRaw.length} media items`);
        for (let i = 0; i < mediaRaw.length; i++) {
          const media = mediaRaw[i];
          if (media.url && media.type) {
            await client.query(
              'INSERT INTO media_items (project_id, type, url, position) VALUES ($1, $2, $3, $4)',
              [projectId, media.type, sanitize(media.url), i]
            );
          }
        }
      }

      // Insert team members
      const team = parseJSONCell(get('team'), []);
      if (Array.isArray(team) && team.length > 0) {
        console.log(`  Inserting ${team.length} team members`);
        for (let i = 0; i < team.length; i++) {
          const member = team[i];
          if (member.name) {
            await client.query(
              'INSERT INTO team_members (project_id, name, role, avatar, position) VALUES ($1, $2, $3, $4, $5)',
              [projectId, member.name, member.role || '', member.avatar || '', i]
            );
          }
        }
      }

      // Insert social links
      const socialLinks = parseJSONCell(get('socialLinks'), []);
      if (Array.isArray(socialLinks) && socialLinks.length > 0) {
        console.log(`  Inserting ${socialLinks.length} social links`);
        for (const link of socialLinks) {
          if (link.platform && link.url) {
            await client.query(
              'INSERT INTO social_links (project_id, platform, url) VALUES ($1, $2, $3)',
              [projectId, link.platform, link.url]
            );
          }
        }
      }

      // Insert rewards
      const rewards = parseJSONCell(get('rewards'), []);
      if (Array.isArray(rewards) && rewards.length > 0) {
        console.log(`  Inserting ${rewards.length} rewards`);
        for (let i = 0; i < rewards.length; i++) {
          const reward = rewards[i];
          if (reward.title && reward.pledgeAmount !== undefined) {
            await client.query(
              'INSERT INTO rewards (project_id, title, pledge_amount, description, is_founders_pass, position) VALUES ($1, $2, $3, $4, $5, $6)',
              [projectId, reward.title, reward.pledgeAmount, reward.description || '', reward.isFoundersPass || false, i]
            );
          }
        }
      }

      // Insert FAQs
      const faq = parseJSONCell(get('faq'), []);
      if (Array.isArray(faq) && faq.length > 0) {
        console.log(`  Inserting ${faq.length} FAQs`);
        for (let i = 0; i < faq.length; i++) {
          const item = faq[i];
          if (item.question && item.answer) {
            await client.query(
              'INSERT INTO faqs (project_id, question, answer, position) VALUES ($1, $2, $3, $4)',
              [projectId, item.question, item.answer, i]
            );
          }
        }
      }

      // Insert documents
      const documents = parseJSONCell(getAny(['documents', 'docs'], cols), []);
      if (Array.isArray(documents) && documents.length > 0) {
        console.log(`  Inserting ${documents.length} documents`);
        for (const doc of documents) {
          if (doc.title && doc.url) {
            await client.query(
              'INSERT INTO documents (project_id, title, url) VALUES ($1, $2, $3)',
              [projectId, doc.title, doc.url]
            );
          }
        }
      }
    }

    console.log('\n✅ Data import completed successfully!');

    // Show summary
    const summary = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM projects) as projects,
        (SELECT COUNT(*) FROM media_items) as media,
        (SELECT COUNT(*) FROM team_members) as team,
        (SELECT COUNT(*) FROM social_links) as social,
        (SELECT COUNT(*) FROM rewards) as rewards,
        (SELECT COUNT(*) FROM faqs) as faqs,
        (SELECT COUNT(*) FROM documents) as documents
    `);

    console.log('\nImport Summary:');
    console.log(`  Projects: ${summary.rows[0].projects}`);
    console.log(`  Media Items: ${summary.rows[0].media}`);
    console.log(`  Team Members: ${summary.rows[0].team}`);
    console.log(`  Social Links: ${summary.rows[0].social}`);
    console.log(`  Rewards: ${summary.rows[0].rewards}`);
    console.log(`  FAQs: ${summary.rows[0].faqs}`);
    console.log(`  Documents: ${summary.rows[0].documents}`);

  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\nDatabase connection closed.');
  }
}

importData()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
