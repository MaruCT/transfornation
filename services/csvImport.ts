import type { Project, MediaItem, TeamMember, SocialLink, Reward, Comment, Backer } from '../types';

const CSV_URL = (import.meta as any).env?.VITE_PROJECTS_CSV_URL || '/projects.csv';

// Generate mock data for CSV projects
function generateMockComments(projectTitle: string): Comment[] {
  const commentTemplates = [
    { text: "This looks amazing! Can't wait to see it in action.", author: "TechEnthusiast" },
    { text: "Great concept! How can I get involved?", author: "Innovator" },
    { text: "This could really make a difference in our community.", author: "CommunityLeader" },
    { text: "Impressive work! When will this be available?", author: "EarlyAdopter" },
    { text: "Love the vision behind this project. Count me in!", author: "Supporter" },
    { text: "This is exactly what we need right now.", author: "ProblemSolver" },
    { text: "Amazing progress! Keep up the great work.", author: "Follower" },
    { text: "How can I help spread the word about this?", author: "Advocate" }
  ];
  
  const numComments = Math.floor(Math.random() * 5) + 2; // 2-6 comments
  return Array.from({ length: numComments }, (_, i) => {
    const template = commentTemplates[i % commentTemplates.length];
    return {
      author: template.author,
      avatar: `https://i.pravatar.cc/150?u=${template.author.toLowerCase()}_${i}`,
      text: template.text,
      date: `${Math.floor(Math.random() * 30) + 1} days ago`,
      type: 'user' as const
    };
  });
}

function generateMockBackers(projectTitle: string, numBackers: number): Backer[] {
  const levels = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  const badges = ['Early Bird', 'Super Supporter', 'Community Champion', 'Innovation Partner'];
  
  return Array.from({ length: numBackers }, (_, i) => {
    const isFounder = i < Math.min(3, Math.floor(numBackers * 0.1));
    return {
      name: `Backer ${i + 1}`,
      avatar: `https://i.pravatar.cc/150?u=${projectTitle.toLowerCase().replace(/\s+/g, '_')}_backer_${i}`,
      level: levels[Math.floor(Math.random() * levels.length)],
      badges: Math.random() > 0.7 ? [badges[Math.floor(Math.random() * badges.length)]] : [],
      isFounder,
      foundersPassImage: isFounder ? `https://picsum.photos/seed/${projectTitle.toLowerCase().replace(/\s+/g, '_')}_pass_${i}/300/400` : undefined
    };
  });
}

function generateMockScores(): { anticipationScore: number; impactScore: number; efficiencyScore: number } {
  return {
    anticipationScore: Math.floor(Math.random() * 30) + 70, // 70-100
    impactScore: Math.floor(Math.random() * 25) + 75, // 75-100
    efficiencyScore: Math.floor(Math.random() * 35) + 65 // 65-100
  };
}

function parseJSONCell<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  const attempts: string[] = [];
  const base = raw.trim();
  attempts.push(base);
  // Heuristics for Google Sheets/Excel exports
  // 1) Normalize Windows line breaks and remove raw newlines inside JSON
  const noNewlines = base.replace(/\r\n|\r|\n/g, '');
  attempts.push(noNewlines);
  // 2) Normalize smart quotes to straight quotes
  const straightQuotes = noNewlines
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'");
  attempts.push(straightQuotes);
  // 3) Uppercase booleans (TRUE/FALSE) to lowercase
  const normalizedBools = straightQuotes.replace(/\bTRUE\b/g, 'true').replace(/\bFALSE\b/g, 'false');
  attempts.push(normalizedBools);
  // 4) If it looks like JSON but missing outer quotes cleanup, try unwrapping outer quotes
  const unwrapped = normalizedBools.replace(/^"([\s\S]*)"$/,'$1');
  attempts.push(unwrapped);
  // 5) Fix common JSON syntax errors - missing commas
  const fixedCommas = unwrapped.replace(/"\s*"([^"]*)"\s*:/g, '", "$1":');
  attempts.push(fixedCommas);

  for (const candidate of attempts) {
    try {
      const result = JSON.parse(candidate) as T;
      if (candidate !== base) {
        console.log('JSON parsed successfully after normalization:', candidate.substring(0, 100) + '...');
      }
      return result;
    } catch (error) {
      console.log('JSON parse attempt failed:', error.message, 'for:', candidate.substring(0, 100) + '...');
    }
  }
  console.warn('All JSON parse attempts failed for:', base.substring(0, 100) + '...');
  return fallback;
}

function parseNumber(raw: string | undefined, def: number): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : def;
}

const parseBoolean = (raw: string | undefined, def = false): boolean => {
  if (!raw) return def;
  const s = raw.trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'y';
};

// Fix HTTP links to HTTPS to avoid Mixed Content warnings
const fixHttpToHttps = (url: string | undefined): string => {
  if (!url) return '';
  const s = url.trim();
  // Convert HTTP to HTTPS for external links
  if (s.startsWith('http://') && !s.includes('localhost') && !s.includes('127.0.0.1')) {
    return s.replace('http://', 'https://');
  }
  return s;
};

export async function loadProjectsFromCSV(): Promise<Project[]> {
  const res = await fetch(CSV_URL, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status}`);
  const text = await res.text();

  // Определяем разделитель: запятая, таб или точка с запятой
  const firstLine = text.split(/\r?\n/)[0] || '';
  const delimiter = ((): string => {
    const counts = [',', '\t', ';'].map(d => ({ d, c: (firstLine.match(new RegExp(`\${d}`, 'g')) || []).length }));
    counts.sort((a, b) => b.c - a.c);
    return counts[0].c > 0 ? counts[0].d : ',';
  })();

  // Парсер CSV/TSV с поддержкой кавычек
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
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

  if (rows.length < 2) return [];
  const header = rows[0].map(h => h.replace(/^\uFEFF/, ''));
  const idx = (name: string) => header.indexOf(name);
  const headerIndexByNameLower = new Map<string, number>();
  header.forEach((h, i) => headerIndexByNameLower.set(h.trim().toLowerCase(), i));
  const idxi = (name: string) => headerIndexByNameLower.get(name.trim().toLowerCase()) ?? -1;
  const getAny = (names: string[], cols: string[]) => {
    for (const n of names) {
      const i = idxi(n);
      if (i >= 0 && cols[i] && cols[i].trim().length) return cols[i];
    }
    return undefined;
  };

  const stripBrackets = (v?: string) => {
    if (!v) return v;
    const t = v.trim();
    if (t.startsWith('[') && t.endsWith(']') && !t.includes(',') && !t.includes('{')) {
      return t.slice(1, -1);
    }
    return v;
  };

  const sanitize = (v?: string) => {
    if (!v) return v;
    let s = v.trim();
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      s = s.slice(1, -1);
    }
    return s.trim();
  };

  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const formatPlainTextToHtml = (raw?: string) => {
    const input = sanitize(raw) || '';
    if (!input) return '';
    // Normalize newlines
    let text = input.replace(/\r\n|\r/g, '\n');
    // If пользователь попытался вставить <ol>/<li> для каждого элемента – уберём теги и распознаем списки заново
    if (/<\/?(ol|li)[^>]*>/i.test(text)) {
      text = text.replace(/<\/?(ol|li)[^>]*>/gi, '');
    }

    const renderInline = (line: string): string => {
      const regex = /\*\*(.+?)\*\*/g;
      let result = '';
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(line)) !== null) {
        const before = line.slice(lastIndex, match.index);
        const inner = match[1];
        result += escapeHtml(before);
        result += `<strong>${escapeHtml(inner)}</strong>`;
        lastIndex = match.index + match[0].length;
      }
      result += escapeHtml(line.slice(lastIndex));
      return result;
    };

    const lines = text.split(/\n+/);
    const htmlParts: string[] = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line) { i += 1; continue; }
      // Detect ordered list sequence (e.g., "1) text", "1. text", or "1 text")
      if (/^\d+(?:[\.)]|\s+)\s*/.test(line)) {
        htmlParts.push('<ol>');
        while (i < lines.length && /^\d+(?:[\.)]|\s+)\s*/.test(lines[i].trim())) {
          const item = lines[i].trim().replace(/^\d+(?:[\.)]|\s+)\s*/, '');
          htmlParts.push(`<li>${renderInline(item)}</li>`);
          i += 1;
        }
        htmlParts.push('</ol>');
        continue;
      }
      // Detect unordered list sequence (- text or • text)
      if (/^([-•])\s+/.test(line)) {
        htmlParts.push('<ul>');
        while (i < lines.length && /^([-•])\s+/.test(lines[i].trim())) {
          const item = lines[i].trim().replace(/^([-•])\s+/, '');
          htmlParts.push(`<li>${renderInline(item)}</li>`);
          i += 1;
        }
        htmlParts.push('</ul>');
        continue;
      }
      // Paragraph with inline bold rendering
      htmlParts.push(`<p>${renderInline(line)}</p>`);
      i += 1;
    }
    return htmlParts.join('');
  };

  const normalizeDriveUrl = (url: string | undefined) => {
    if (!url) return '';
    const s = fixHttpToHttps(url).trim();
    console.log('Normalizing Drive URL:', s);
    
    // If it's already a Drive thumbnail link, keep as is
    if (/https:\/\/drive\.google\.com\/thumbnail\?/.test(s)) return s;
    
    // file/d/{id}/...
    let m = s.match(/https:\/\/drive\.google\.com\/file\/d\/([^/?#]+)(?:[/?#]|$)/);
    if (m) {
      const normalized = `https://drive.google.com/thumbnail?id=${m[1]}&sz=w2000`;
      console.log('Normalized Drive view URL to thumbnail:', normalized);
      return normalized;
    }
    
    // open?id={id}
    m = s.match(/https:\/\/drive\.google\.com\/open\?[^#]*\bid=([^&#]+)/);
    if (m) {
      const normalized = `https://drive.google.com/thumbnail?id=${decodeURIComponent(m[1])}&sz=w2000`;
      console.log('Normalized Drive open URL to thumbnail:', normalized);
      return normalized;
    }
    
    // any link that has id=...
    m = s.match(/\bid=([^&#]+)/);
    if (m && /drive\.google\.com/.test(s)) {
      const normalized = `https://drive.google.com/thumbnail?id=${decodeURIComponent(m[1])}&sz=w2000`;
      console.log('Normalized Drive ID URL to thumbnail:', normalized);
      return normalized;
    }
    
    // Allow existing uc links but prefer thumbnail when possible
    if (/https:\/\/drive\.google\.com\/uc\?/.test(s)) return s;
    
    console.log('Drive URL not normalized, returning as-is:', s);
    return s;
  };

  const normalizeDriveVideoUrl = (url: string | undefined) => {
    if (!url) return '';
    const s = fixHttpToHttps(url).trim();
    // Match file id in typical Drive file URL
    let m = s.match(/https:\/\/drive\.google\.com\/file\/d\/([^/?#]+)(?:[/?#]|$)/);
    if (m) return `https://drive.google.com/uc?export=download&id=${m[1]}`;
    // open?id=...
    m = s.match(/https:\/\/drive\.google\.com\/open\?[^#]*\bid=([^&#]+)/);
    if (m) return `https://drive.google.com/uc?export=download&id=${decodeURIComponent(m[1])}`;
    // generic id=... on drive
    m = s.match(/\bid=([^&#]+)/);
    if (m && /drive\.google\.com/.test(s)) return `https://drive.google.com/uc?export=download&id=${decodeURIComponent(m[1])}`;
    return s;
  };

  return rows.slice(1).map(cols => {
    const get = (name: string) => cols[idx(name)];

    const mediaRaw = parseJSONCell<MediaItem[]>(getAny(['mediaUrls', 'mediaURL', 'media'], cols), []);
    console.log('Raw media data:', mediaRaw);
    
    const isValidUrl = (u?: string) => !!u && /^(https?:)?\/\//i.test(u);
    let media: MediaItem[] = mediaRaw
      .map(m => {
        const normalizedUrl = m.type === 'video' ? normalizeDriveVideoUrl(sanitize(m.url)) : normalizeDriveUrl(sanitize(m.url));
        console.log(`Processing ${m.type} media:`, m.url, '->', normalizedUrl);
        return {
          ...m,
          url: normalizedUrl
        };
      })
      .filter(m => {
        const isValid = isValidUrl(m.url);
        if (!isValid) {
          console.warn('Filtered out invalid media URL:', m.url);
        }
        return isValid;
      });
    
    console.log('Final processed media:', media);
    const team: TeamMember[] = parseJSONCell<TeamMember[]>(get('team'), []);
    const socialLinks: SocialLink[] = parseJSONCell<SocialLink[]>(get('socialLinks'), []);
    const faq = parseJSONCell<{question: string; answer: string}[]>(get('faq'), []);
    const rewards: Reward[] = parseJSONCell<Reward[]>(get('rewards'), []);

    // Ensure cover image also appears in media as first item
    const rawCover = getAny(['imageUrl', 'imageURL', 'image', 'cover', 'coverImage'], cols);
    const normalizedCover = normalizeDriveUrl(sanitize(stripBrackets(rawCover) || ''));
    if (isValidUrl(normalizedCover) && !media.some(m => m.type === 'image' && m.url === normalizedCover)) {
      media = [{ type: 'image', url: normalizedCover }, ...media];
    }

    const title = sanitize(get('title')) || 'Untitled';
    const numBackers = parseNumber(get('backers'), 0) || Math.floor(Math.random() * 50) + 10;
    const mockScores = generateMockScores();
    const mockComments = generateMockComments(title);
    const mockBackers = generateMockBackers(title, numBackers);
    
    const project: Project = {
      id: get('id') || crypto.randomUUID(),
      slug: sanitize(getAny(['slug', 'permalink'], cols)) || undefined,
      creatorId: get('creator') || 'unknown',
      title,
      creator: sanitize(get('creator')) || 'Unknown',
      creatorBio: sanitize(get('creatorBio')) || '',
      creatorAvatar: sanitize(stripBrackets(get('creatorAvatar')) || ''),
      tagline: sanitize(get('tagline')) || '',
      description: formatPlainTextToHtml(get('description')),
      problems: formatPlainTextToHtml(getAny(['problems', 'problem', 'problemStatement'], cols)),
      category: sanitize(get('category')) || 'General',
      imageUrl: isValidUrl(normalizedCover) ? normalizedCover : '',
      isFeatured: parseBoolean(getAny(['isFeatured', 'featured'], cols)),
      media,
      team,
      socialLinks,
      videoGenerationState: (get('videoGenerationState') as any) || 'none',
      goal: parseNumber(get('goal'), 0),
      pledged: parseNumber(get('pledged'), 0),
      backers: numBackers,
      fundingVelocity: (get('fundingVelocity') as any) || 'stable',
      faq,
      rewards,
      comments: mockComments,
      commentSummary: { 
        sentiment: 'Positive', 
        summary: 'The community is excited about this project and its potential impact.' 
      },
      roadmap: [],
      analysis: undefined,
      backersList: mockBackers,
      favoritedBy: [],
      city: get('city') || '',
      country: get('country') || '',
      anticipationScore: parseNumber(get('anticipationScore'), mockScores.anticipationScore),
      impactScore: parseNumber(get('impactScore'), mockScores.impactScore),
      efficiencyScore: parseNumber(get('efficiencyScore'), mockScores.efficiencyScore),
    };

    return project;
  });
}


