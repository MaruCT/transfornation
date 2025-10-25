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

      // Implementation for creating project
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ message: 'Project creation not yet implemented' })
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
