import type { Project, MediaItem, TeamMember, SocialLink, Reward } from '../types';

const CSV_URL = (import.meta as any).env?.VITE_PROJECTS_CSV_URL || '/projects.csv';

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
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");
  attempts.push(straightQuotes);
  // 3) Uppercase booleans (TRUE/FALSE) to lowercase
  const normalizedBools = straightQuotes.replace(/\bTRUE\b/g, 'true').replace(/\bFALSE\b/g, 'false');
  attempts.push(normalizedBools);
  // 4) If it looks like JSON but missing outer quotes cleanup, try unwrapping outer quotes
  const unwrapped = normalizedBools.replace(/^"([\s\S]*)"$/,'$1');
  attempts.push(unwrapped);

  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate) as T;
    } catch {}
  }
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
    const s = url.trim();
    // If it's already a Drive thumbnail link, keep as is
    if (/https:\/\/drive\.google\.com\/thumbnail\?/.test(s)) return s;
    // file/d/{id}/...
    let m = s.match(/https:\/\/drive\.google\.com\/file\/d\/([^/?#]+)(?:[/?#]|$)/);
    if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w2000`;
    // open?id={id}
    m = s.match(/https:\/\/drive\.google\.com\/open\?[^#]*\bid=([^&#]+)/);
    if (m) return `https://drive.google.com/thumbnail?id=${decodeURIComponent(m[1])}&sz=w2000`;
    // any link that has id=...
    m = s.match(/\bid=([^&#]+)/);
    if (m && /drive\.google\.com/.test(s)) return `https://drive.google.com/thumbnail?id=${decodeURIComponent(m[1])}&sz=w2000`;
    // Allow existing uc links but prefer thumbnail when possible
    if (/https:\/\/drive\.google\.com\/uc\?/.test(s)) return s;
    return s;
  };

  const normalizeDriveVideoUrl = (url: string | undefined) => {
    if (!url) return '';
    const s = url.trim();
    // Match file id in typical Drive file URL
    let m = s.match(/https:\/\/drive\.google\.com\/file\/d\/([^/?#]+)(?:[/?#]|$)/);
    if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    // open?id=...
    m = s.match(/https:\/\/drive\.google\.com\/open\?[^#]*\bid=([^&#]+)/);
    if (m) return `https://drive.google.com/file/d/${decodeURIComponent(m[1])}/preview`;
    // generic id=... on drive
    m = s.match(/\bid=([^&#]+)/);
    if (m && /drive\.google\.com/.test(s)) return `https://drive.google.com/file/d/${decodeURIComponent(m[1])}/preview`;
    return s;
  };

  return rows.slice(1).map(cols => {
    const get = (name: string) => cols[idx(name)];

    const mediaRaw = parseJSONCell<MediaItem[]>(getAny(['mediaUrls', 'mediaURL', 'media'], cols), []);
    const isValidUrl = (u?: string) => !!u && /^(https?:)?\/\//i.test(u);
    let media: MediaItem[] = mediaRaw
      .map(m => ({
        ...m,
        url: m.type === 'video' ? normalizeDriveVideoUrl(sanitize(m.url)) : normalizeDriveUrl(sanitize(m.url))
      }))
      .filter(m => isValidUrl(m.url));
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

    const project: Project = {
      id: get('id') || crypto.randomUUID(),
      creatorId: get('creator') || 'unknown',
      title: sanitize(get('title')) || 'Untitled',
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
      backers: parseNumber(get('backers'), 0),
      fundingVelocity: (get('fundingVelocity') as any) || 'stable',
      faq,
      rewards,
      comments: [],
      commentSummary: { sentiment: 'N/A', summary: 'Not enough comments to analyze.' },
      roadmap: [],
      analysis: undefined,
      backersList: [],
      favoritedBy: [],
      city: get('city') || '',
      country: get('country') || '',
      anticipationScore: parseNumber(get('anticipationScore'), 60),
      impactScore: parseNumber(get('impactScore'), 60),
      efficiencyScore: parseNumber(get('efficiencyScore'), 60),
    };

    return project;
  });
}


