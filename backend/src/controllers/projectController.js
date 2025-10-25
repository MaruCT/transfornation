import pool from '../config/database.js';

// Get all projects with related data
export const getAllProjects = async (req, res) => {
  try {
    const { category, featured } = req.query;

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

    // Transform snake_case to camelCase for frontend
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
      // Mock data for frontend compatibility
      comments: [],
      commentSummary: {
        sentiment: 'Positive',
        summary: 'The community is excited about this project and its potential impact.'
      },
      roadmap: [],
      backersList: [],
      favoritedBy: []
    }));

    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single project by ID or slug
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

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
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = result.rows[0];

    // Transform to camelCase
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

    res.json(transformedProject);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new project
export const createProject = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      id,
      slug,
      creatorId,
      title,
      creator,
      creatorBio,
      creatorAvatar,
      tagline,
      description,
      problems,
      category,
      imageUrl,
      isFeatured,
      media,
      team,
      socialLinks,
      rewards,
      faq,
      documents,
      goal,
      pledged,
      backers,
      fundingVelocity,
      city,
      country,
      anticipationScore,
      impactScore,
      efficiencyScore
    } = req.body;

    // Insert project
    const projectResult = await client.query(
      `INSERT INTO projects (
        id, slug, creator_id, title, creator, creator_bio, creator_avatar,
        tagline, description, problems, category, image_url, is_featured,
        goal, pledged, backers_count, funding_velocity, city, country,
        anticipation_score, impact_score, efficiency_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *`,
      [
        id, slug, creatorId, title, creator, creatorBio, creatorAvatar,
        tagline, description, problems, category, imageUrl, isFeatured,
        goal, pledged, backers, fundingVelocity, city, country,
        anticipationScore, impactScore, efficiencyScore
      ]
    );

    const projectId = projectResult.rows[0].id;

    // Insert media items
    if (media && media.length > 0) {
      for (let i = 0; i < media.length; i++) {
        await client.query(
          'INSERT INTO media_items (project_id, type, url, position) VALUES ($1, $2, $3, $4)',
          [projectId, media[i].type, media[i].url, i]
        );
      }
    }

    // Insert team members
    if (team && team.length > 0) {
      for (let i = 0; i < team.length; i++) {
        await client.query(
          'INSERT INTO team_members (project_id, name, role, avatar, position) VALUES ($1, $2, $3, $4, $5)',
          [projectId, team[i].name, team[i].role, team[i].avatar, i]
        );
      }
    }

    // Insert social links
    if (socialLinks && socialLinks.length > 0) {
      for (const link of socialLinks) {
        await client.query(
          'INSERT INTO social_links (project_id, platform, url) VALUES ($1, $2, $3)',
          [projectId, link.platform, link.url]
        );
      }
    }

    // Insert rewards
    if (rewards && rewards.length > 0) {
      for (let i = 0; i < rewards.length; i++) {
        await client.query(
          'INSERT INTO rewards (project_id, title, pledge_amount, description, is_founders_pass, position) VALUES ($1, $2, $3, $4, $5, $6)',
          [projectId, rewards[i].title, rewards[i].pledgeAmount, rewards[i].description, rewards[i].isFoundersPass, i]
        );
      }
    }

    // Insert FAQs
    if (faq && faq.length > 0) {
      for (let i = 0; i < faq.length; i++) {
        await client.query(
          'INSERT INTO faqs (project_id, question, answer, position) VALUES ($1, $2, $3, $4)',
          [projectId, faq[i].question, faq[i].answer, i]
        );
      }
    }

    // Insert documents
    if (documents && documents.length > 0) {
      for (const doc of documents) {
        await client.query(
          'INSERT INTO documents (project_id, title, url) VALUES ($1, $2, $3)',
          [projectId, doc.title, doc.url]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({ id: projectId, message: 'Project created successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};
