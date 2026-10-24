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
  published: boolean;
  body: string;
  readingTime: number;
};

type FrontmatterValue = string | string[];
type Frontmatter = Record<string, FrontmatterValue>;

const files = import.meta.glob('../content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function parseFrontmatter(raw: string): {
  meta: Frontmatter;
  body: string;
} {
  const normalized = raw.replace(/^\uFEFF/, '');

  const match = normalized.match(
    /^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/,
  );

  if (!match) {
    return { meta: {}, body: normalized };
  }

  const meta: Frontmatter = {};
  let activeList = '';

  for (const line of match[1].split(/\r?\n/)) {
    const item = line.match(/^\s+-\s+(.+)$/);

    if (item && activeList) {
      const current = Array.isArray(meta[activeList])
        ? [...meta[activeList] as string[]]
        : [];

      current.push(item[1].trim().replace(/^['"]|['"]$/g, ''));
      meta[activeList] = current;
      continue;
    }

    const field = line.match(/^([\w-]+):\s*(.*)$/);

    if (!field) {
      activeList = '';
      continue;
    }

    const key = field[1];
    const value = field[2].trim();

    activeList = key;

    if (!value) {
      meta[key] = [];
      continue;
    }

    if (value.startsWith('[') && value.endsWith(']')) {
      meta[key] = value
        .slice(1, -1)
        .split(',')
        .map(v => v.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    } else {
      meta[key] = value.replace(/^['"]|['"]$/g, '');
    }
  }

  return {
    meta,
    body: normalized.slice(match[0].length),
  };
}

function str(
  meta: Frontmatter,
  key: string,
  fallback = '',
): string {
  const value = meta[key];
  return typeof value === 'string' ? value : fallback;
}

function list(meta: Frontmatter, key: string): string[] {
  const value = meta[key];

  if (Array.isArray(value)) {
    return value;
  }

  return typeof value === 'string' && value.length > 0
    ? [value]
    : [];
}

function booleanValue(
  meta: Frontmatter,
  key: string,
  fallback: boolean,
): boolean {
  const value = str(meta, key).toLowerCase();

  if (value === 'true') return true;
  if (value === 'false') return false;

  return fallback;
}

function slugFromPath(path: string): string {
  const filename = path.split('/').pop() ?? 'untitled';

  return filename.replace(/\.md$/i, '');
}

function getReadingTime(body: string): number {
  const words = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(words / 220));
}

export const posts: Post[] = Object.entries(files)
  .map(([path, raw]) => {
    const { meta, body } = parseFrontmatter(raw);

    const draft = booleanValue(meta, 'draft', false);
    const published = booleanValue(meta, 'published', true);

    return {
      slug: str(meta, 'slug', slugFromPath(path)),
      title: str(meta, 'title', 'Untitled article'),
      description: str(meta, 'description'),
      date: str(meta, 'date', '1970-01-01'),
      updated: str(meta, 'updated') || undefined,
      author: str(meta, 'author', 'OpsNest'),
      category: str(meta, 'category', 'General'),
      tags: list(meta, 'tags'),
      cover:
        str(meta, 'cover') ||
        str(meta, 'coverImage') ||
        undefined,
      draft,
      published,
      body,
      readingTime: getReadingTime(body),
    };
  })
  .filter(post => !post.draft && post.published)
  .sort((a, b) => b.date.localeCompare(a.date));

export function formatDate(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);

  return Number.isNaN(parsed.getTime())
    ? date
    : new Intl.DateTimeFormat('en', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(parsed);
}