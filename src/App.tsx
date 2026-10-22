import { useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { formatDate, posts, type Post } from './content';

marked.setOptions({ gfm: true, breaks: false });

type Route = { slug?: string };
function readRoute(): Route {
  const match = window.location.hash.match(/^#\/post\/([^/?#]+)/);
  return match ? { slug: decodeURIComponent(match[1]) } : {};
}

function App() {
  const [route, setRoute] = useState<Route>(readRoute);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [activeTag, setActiveTag] = useState('');
  const categories = useMemo(() => ['All', ...Array.from(new Set(posts.map(p => p.category))).sort()], []);
  const selected = posts.find(p => p.slug === route.slug);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter(p => {
      const matchesQuery = !q || [p.title, p.description, p.category, p.author, ...p.tags, p.body].join(' ').toLowerCase().includes(q);
      const matchesCategory = category === 'All' || p.category === category;
      const matchesTag = !activeTag || p.tags.includes(activeTag);
      return matchesQuery && matchesCategory && matchesTag;
    });
  }, [query, category, activeTag]);

  useEffect(() => {
    const onHash = () => { setRoute(readRoute()); window.scrollTo({ top: 0, behavior: 'auto' }); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.title = selected ? `${selected.title} — OpsNest Blog` : 'OpsNest Blog — Engineering notes and practical guides';
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', selected?.description || 'Practical engineering notes, tutorials, and ideas from OpsNest.');
  }, [selected]);

  function openPost(post: Post) { window.location.hash = `/post/${encodeURIComponent(post.slug)}`; }
  function home() { window.location.hash = '/'; setQuery(''); setCategory('All'); setActiveTag(''); }

  return <div className="site-shell">
    <header className="topbar"><a className="brand" href="#/" onClick={home}><span className="brand-mark">O</span><span>OpsNest <em>Blog</em></span></a><nav><a href="../">Main website ↗</a><a href="../learn/">Learn ↗</a></nav></header>
    {selected ? <Article post={selected} onBack={home} onTag={tag => { setActiveTag(tag); window.location.hash = '/'; }} /> : <>
      <section className="hero"><div className="eyebrow"><span className="pulse"/> ENGINEERING FIELD NOTES</div><h1>Ideas into <span>practice.</span></h1><p>Practical guides, lessons learned, and clear explanations for building and operating reliable software.</p><div className="hero-meta"><span>{posts.length} articles</span><span>·</span><span>DevOps, cloud, security & engineering</span></div></section>
      <main className="content-wrap"><div className="toolbar"><label className="searchbox"><span aria-hidden="true">⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search articles, topics, tools…" aria-label="Search articles"/><kbd>/</kbd></label><label className="category-select"><span className="sr-only">Filter category</span><select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></label></div>
        {activeTag && <button className="filter-chip" onClick={() => setActiveTag('')}>Tag: {activeTag} <span>×</span></button>}
        <div className="results-line"><span>{filtered.length} {filtered.length === 1 ? 'article' : 'articles'}</span><span>Newest first</span></div>
        {filtered.length ? <div className="post-grid">{filtered.map((post, i) => <PostCard key={post.slug} post={post} featured={i === 0 && !query && category === 'All' && !activeTag} onOpen={() => openPost(post)} onTag={setActiveTag}/>)}</div> : <div className="empty"><span>⌕</span><h2>No articles found</h2><p>Try a different search term or category.</p><button className="button" onClick={home}>Clear filters</button></div>}
      </main></>}
    <footer className="footer"><div className="footer-brand"><span className="brand-mark">O</span><span>OpsNest Blog</span></div><span>Built for curious engineers.</span><a href="../">opsnest.in ↗</a></footer>
  </div>;
}

function PostCard({ post, featured, onOpen, onTag }: { post: Post; featured: boolean; onOpen: () => void; onTag: (tag: string) => void }) {
  return <article className={`post-card ${featured ? 'featured' : ''}`}>
    <button className="card-main" onClick={onOpen} aria-label={`Read ${post.title}`}>
      <div className="card-top"><span className="category-pill">{post.category}</span><span className="card-date">{formatDate(post.date)}</span></div>
      <h2>{post.title}</h2><p className="post-description">{post.description || 'A practical note from the OpsNest engineering desk.'}</p>
      <div className="card-bottom"><span>{post.readingTime} min read</span><span className="read-link">Read article <span aria-hidden="true">↗</span></span></div>
    </button>
    {post.tags.length > 0 && <div className="tag-row">{post.tags.map(tag => <button key={tag} className="tag" onClick={() => onTag(tag)}>#{tag}</button>)}</div>}
  </article>;
}

function Article({ post, onBack, onTag }: { post: Post; onBack: () => void; onTag: (tag: string) => void }) {
  const html = DOMPurify.sanitize(marked.parse(post.body) as string);
  return <main className="article-wrap"><button className="back-link" onClick={onBack}>← All articles</button><article className="article">
    <div className="article-heading"><span className="category-pill">{post.category}</span><h1>{post.title}</h1><p className="article-description">{post.description}</p><div className="byline"><span>By <strong>{post.author}</strong></span><span>·</span><time dateTime={post.date}>{formatDate(post.date)}</time><span>·</span><span>{post.readingTime} min read</span></div>{post.updated && <p className="updated">Updated {formatDate(post.updated)}</p>}</div>
    <div className="article-layout"><div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} /><aside className="article-aside"><div className="aside-box"><span className="aside-label">IN THIS ARTICLE</span><p>Use the headings to navigate this guide.</p><a href="#top" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Back to top ↑</a></div><div className="aside-box"><span className="aside-label">TOPICS</span><div className="tag-row aside-tags">{post.tags.map(tag => <button key={tag} className="tag" onClick={() => onTag(tag)}>#{tag}</button>)}</div></div></aside></div>
    <div className="article-end"><span>End of article</span><button className="button" onClick={onBack}>Explore more articles →</button></div>
  </article></main>;
}

export default App;
