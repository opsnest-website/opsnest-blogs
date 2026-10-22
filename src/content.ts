export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  author: string;
  category: string;
  tags: string[];
  cover?: string;
  draft: boolean;
  body: string;
  readingTime: number;
};

const files = import.meta.glob('../content/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

function parseFrontmatter(raw: string): { meta: Record<string, string | string[]>; body: string } {
  const normalized = raw.replace(/^\uFEFF/, '');
  const match = normalized.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!match) return { meta: {}, body: normalized };
  const meta: Record<string, string | string[]> = {};
  let activeList = '';
  for (const line of match[1].split(/\r?\n/)) {
    const item = line.match(/^\s+-\s+(.+)$/);
    if (item && activeList) {
      const current = Array.isArray(meta[activeList]) ? meta[activeList] as string[] : [];
      current.push(item[1].trim().replace(/^['"]|['"]$/g, ''));
      meta[activeList] = current;
      continue;
    }
    const field = line.match(/^([\w-]+):\s*(.*)$/);
    if (!field) continue;
    activeList = field[1];
    const value = field[2].trim();
    if (!value) { meta[activeList] = []; continue; }
    if (value.startsWith('[') && value.endsWith(']')) {
      meta[activeList] = value.slice(1, -1).split(',').map(v => v.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    } else {
      meta[activeList] = value.replace(/^['"]|['"]$/g, '');
    }
  }
  return { meta, body: normalized.slice(match[0].length) };
}

function str(meta: Record<string, string | string[]>, key: string, fallback = ''): string {
  const value = meta[key];
  return typeof value === 'string' ? value : fallback;
}

function list(meta: Record<string, string | string[]>, key: string): string[] {
  const value = meta[key];
  return Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
}

function slugFromPath(path: string): string {
  return path.split('/').pop()!.replace(/\.md$/, '');
}

export const posts: Post[] = Object.entries(files).map(([path, raw]) => {
  const { meta, body } = parseFrontmatter(raw);
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return {
    slug: str(meta, 'slug', slugFromPath(path)),
    title: str(meta, 'title', 'Untitled article'),
    description: str(meta, 'description'),
    date: str(meta, 'date', '1970-01-01'),
    updated: str(meta, 'updated') || undefined,
    author: str(meta, 'author', 'OpsNest'),
    category: str(meta, 'category', 'General'),
    tags: list(meta, 'tags'),
    cover: str(meta, 'cover') || undefined,
    draft: str(meta, 'draft', 'false').toLowerCase() === 'true',
    body,
    readingTime: Math.max(1, Math.ceil(words / 220)),
  };
}).filter(post => !post.draft).sort((a, b) => b.date.localeCompare(a.date));

export function formatDate(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? date : new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(parsed);
}
