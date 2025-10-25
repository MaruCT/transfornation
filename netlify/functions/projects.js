import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { httpMethod, path, queryStringParameters } = event;

    // GET /api/projects - Get all projects
    if (httpMethod === 'GET' && !path.includes('/projects/')) {
      const { category, featured } = queryStringParameters || {};

      let query = `
        SELECT
          p.*,
          COALESCE(
            json_agg(
              jsonb_build_object(
                'type', m.type,
                'url', m.url
              ) ORDER BY m.position
            ) FILTER (WHERE m.id IS NOT NULL),
            '[]'
          ) as media,
          COALESCE(
            json_agg(
              jsonb_build_object(
                'name', tm.name,
                'role', tm.role,
                'avatar', tm.avatar
              ) ORDER BY tm.position
            ) FILTER (WHERE tm.id IS NOT NULL),
            '[]'
          ) as team,
          COALESCE(
            json_agg(
              jsonb_build_object(
                'platform', sl.platform,
                'url', sl.url
              )
            ) FILTER (WHERE sl.id IS NOT NULL),
            '[]'
          ) as "socialLinks",
          COALESCE(
            json_agg(
              jsonb_build_object(
                'title', r.title,
                'pledgeAmount', r.pledge_amount,
                'description', r.description,
                'isFoundersPass', r.is_founders_pass
              ) ORDER BY r.position
            ) FILTER (WHERE r.id IS NOT NULL),
            '[]'
          ) as rewards,
          COALESCE(
            json_agg(
              jsonb_build_object(
                'question', f.question,
                'answer', f.answer
              ) ORDER BY f.position
            ) FILTER (WHERE f.id IS NOT NULL),
            '[]'
          ) as faq,
          COALESCE(
            json_agg(
              jsonb_build_object(
                'title', d.title,
                'url', d.url
              )
            ) FILTER (WHERE d.id IS NOT NULL),
            '[]'
          ) as documents
        FROM projects p
        LEFT JOIN media_items m ON p.id = m.project_id
        LEFT JOIN team_members tm ON p.id = tm.project_id
        LEFT JOIN social_links sl ON p.id = sl.project_id
        LEFT JOIN rewards r ON p.id = r.project_id
        LEFT JOIN faqs f ON p.id = f.project_id
        LEFT JOIN documents d ON p.id = d.project_id
      `;

      const conditions = [];
      const params = [];
      let paramCount = 1;

      if (category) {
        conditions.push(`p.category = $${paramCount}`);
        params.push(category);
        paramCount++;
      }

      if (featured === 'true') {
        conditions.push(`p.is_featured = true`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' GROUP BY p.id ORDER BY p.created_at DESC';

      const result = await pool.query(query, params);

      // Transform to camelCase
      const projects = result.rows.map(project => ({
        id: project.id,
        slug: project.slug,
        creatorId: project.creator_id,
        title: project.title,
        creator: project.creator,
        creatorBio: project.creator_bio,
        creatorAvatar: project.creator_avatar,
        tagline: project.tagline,
        description: project.description,
        problems: project.problems,
        category: project.category,
        imageUrl: project.image_url,
        isFeatured: project.is_featured,
        media: project.media,
        team: project.team,
        socialLinks: project.socialLinks,
        videoGenerationState: project.video_generation_state,
        goal: parseFloat(project.goal),
        pledged: parseFloat(project.pledged),
        backers: project.backers_count,
        fundingVelocity: project.funding_velocity,
        faq: project.faq,
        rewards: project.rewards,
        city: project.city,
        country: project.country,
        anticipationScore: project.anticipation_score,
        impactScore: project.impact_score,
        efficiencyScore: project.efficiency_score,
        documents: project.documents.length > 0 ? project.documents : undefined,
        comments: [],
        commentSummary: {
          sentiment: 'Positive',
          summary: 'The community is excited about this project and its potential impact.'
        },
        roadmap: [],
        backersList: [],
        favoritedBy: []
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(projects)
      };
    }

    // GET /api/projects/:id - Get single project
    if (httpMethod === 'GET' && path.includes('/projects/')) {
      const id = path.split('/projects/')[1];

      const query = `
        SELECT
          p.*,
          COALESCE(
            json_agg(
              jsonb_build_object(
                'type', m.type,
                'url', m.url
              ) ORDER BY m.position
            ) FILTER (WHERE m.id IS NOT NULL),
            '[]'
          ) as media,
          COALESCE(
            json_agg(
              jsonb_build_object(
                'name', tm.name,
                'role', tm.role,
                'avatar', tm.avatar
              ) ORDER BY tm.position
            ) FILTER (WHERE tm.id IS NOT NULL),
            '[]'
          ) as team,
          COALESCE(
            json_agg(
              jsonb_build_object(
                'platform', sl.platform,
                'url', sl.url
              )
            ) FILTER (WHERE sl.id IS NOT NULL),
            '[]'
          ) as "socialLinks",
          COALESCE(
            json_agg(
              jsonb_build_object(
                'title', r.title,
                'pledgeAmount', r.pledge_amount,
                'description', r.description,
                'isFoundersPass', r.is_founders_pass
              ) ORDER BY r.position
            ) FILTER (WHERE r.id IS NOT NULL),
            '[]'
          ) as rewards,
          COALESCE(
            json_agg(
              jsonb_build_object(
                'question', f.question,
                'answer', f.answer
              ) ORDER BY f.position
            ) FILTER (WHERE f.id IS NOT NULL),
            '[]'
          ) as faq,
          COALESCE(
            json_agg(
              jsonb_build_object(
                'title', d.title,
                'url', d.url
              )
            ) FILTER (WHERE d.id IS NOT NULL),
            '[]'
          ) as documents,
          COALESCE(
            json_agg(
              jsonb_build_object(
                'author', c.author,
                'avatar', c.avatar,
                'text', c.text,
                'date', c.created_at,
                'type', c.type
              ) ORDER BY c.created_at DESC
            ) FILTER (WHERE c.id IS NOT NULL),
            '[]'
          ) as comments
        FROM projects p
        LEFT JOIN media_items m ON p.id = m.project_id
        LEFT JOIN team_members tm ON p.id = tm.project_id
        LEFT JOIN social_links sl ON p.id = sl.project_id
        LEFT JOIN rewards r ON p.id = r.project_id
        LEFT JOIN faqs f ON p.id = f.project_id
        LEFT JOIN documents d ON p.id = d.project_id
        LEFT JOIN comments c ON p.id = c.project_id
        WHERE p.id = $1 OR p.slug = $1
        GROUP BY p.id
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Project not found' })
        };
      }

      const project = result.rows[0];

      const transformedProject = {
        id: project.id,
        slug: project.slug,
        creatorId: project.creator_id,
        title: project.title,
        creator: project.creator,
        creatorBio: project.creator_bio,
        creatorAvatar: project.creator_avatar,
        tagline: project.tagline,
        description: project.description,
        problems: project.problems,
        category: project.category,
        imageUrl: project.image_url,
        isFeatured: project.is_featured,
        media: project.media,
        team: project.team,
        socialLinks: project.socialLinks,
        videoGenerationState: project.video_generation_state,
        goal: parseFloat(project.goal),
        pledged: parseFloat(project.pledged),
        backers: project.backers_count,
        fundingVelocity: project.funding_velocity,
        faq: project.faq,
        rewards: project.rewards,
        comments: project.comments,
        city: project.city,
        country: project.country,
        anticipationScore: project.anticipation_score,
        impactScore: project.impact_score,
        efficiencyScore: project.efficiency_score,
        documents: project.documents.length > 0 ? project.documents : undefined,
        commentSummary: {
          sentiment: 'Positive',
          summary: 'The community is excited about this project and its potential impact.'
        },
        roadmap: [],
        backersList: [],
        favoritedBy: []
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(transformedProject)
      };
    }

    // POST /api/projects - Create project
    if (httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        const projectId = data.id || `proj-${Date.now()}`;
        const creatorId = (data.creator || 'Unknown').toLowerCase().replace(/\s+/g, '_');

        // Insert or update user
        await client.query(`
          INSERT INTO users (id, name, avatar)
          VALUES ($1, $2, $3)
          ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
        `, [creatorId, data.creator || 'Unknown', data.creatorAvatar || '']);

        // Insert project
        await client.query(`
          INSERT INTO projects (
            id, creator_id, title, creator, creator_bio, creator_avatar, tagline,
            description, problems, category, image_url, goal, pledged, backers_count,
            funding_velocity, city, country, anticipation_score, impact_score, efficiency_score
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        `, [
          projectId, creatorId, data.title, data.creator, data.creatorBio, data.creatorAvatar,
          data.tagline, data.description, data.problems, data.category, data.imageUrl,
          data.goal, data.pledged || 0, data.backers || 0, data.fundingVelocity || 'stable',
          data.city, data.country, data.anticipationScore || 75, data.impactScore || 75, data.efficiencyScore || 75
        ]);

        await client.query('COMMIT');

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ id: projectId, message: 'Project created successfully' })
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    // PUT /api/projects/:id - Update project
    if (httpMethod === 'PUT' && path.includes('/projects/')) {
      const id = path.split('/projects/')[1];
      const data = JSON.parse(event.body);

      await pool.query(`
        UPDATE projects SET
          title = $1, creator = $2, creator_bio = $3, creator_avatar = $4, tagline = $5,
          description = $6, problems = $7, category = $8, image_url = $9, goal = $10,
          pledged = $11, backers_count = $12, city = $13, country = $14,
          anticipation_score = $15, impact_score = $16, efficiency_score = $17,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $18
      `, [
        data.title, data.creator, data.creatorBio, data.creatorAvatar, data.tagline,
        data.description, data.problems, data.category, data.imageUrl, data.goal,
        data.pledged, data.backers, data.city, data.country,
        data.anticipationScore, data.impactScore, data.efficiencyScore, id
      ]);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Project updated successfully' })
      };
    }

    // DELETE /api/projects/:id - Delete project
    if (httpMethod === 'DELETE' && path.includes('/projects/')) {
      const id = path.split('/projects/')[1];

      await pool.query('DELETE FROM projects WHERE id = $1', [id]);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Project deleted successfully' })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};
