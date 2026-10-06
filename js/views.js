// HTML builders for the cover and chapter pages. These return strings and
// don't touch the DOM.

import { REPO, WORDS_PER_MINUTE } from './config.js';

export function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Escapes text and turns the text's double hyphens into em dashes.
function typeset(s) {
  return escapeHtml(s).replace(/--/g, '—');
}

export function chapterHref(chapter) {
  return `#/${chapter.index + 1}`;
}

// "Chapter 4"
export function chapterTitle(chapter) {
  return `Chapter ${chapter.numeral}`;
}

function readingTime(words) {
  const minutes = words / WORDS_PER_MINUTE;
  return minutes / 60 >= 1.5
    ? `${Math.round(minutes / 60)} hours`
    : `${Math.max(1, Math.round(minutes))} min`;
}


// ---------- Chapter text ----------

// Splits lines into blank-line-separated blocks.
function toBlocks(lines) {
  const blocks = [];
  let block = [];
  for (const line of lines) {
    if (line.trim()) {
      block.push(line.trimEnd());
    } else if (block.length) {
      blocks.push(block);
      block = [];
    }
  }
  if (block.length) blocks.push(block);
  return blocks;
}

// A block whose lines are all indented is verse, or a footnote if it starts
// with "*". Everything else is a regular paragraph.
function blockHtml(block) {
  const indented = block.every((line) => /^\s/.test(line));
  const joined = () => typeset(block.map((line) => line.trim()).join(' '));

  if (indented && /^\s*\*/.test(block[0])) {
    return `<p class="note">${joined()}</p>`;
  }
  if (indented) {
    return `<p class="verse">${block.map((line) => typeset(line.trim())).join('\n')}</p>`;
  }
  return `<p>${joined()}</p>`;
}

function proseHtml(lines) {
  return toBlocks(lines).map(blockHtml).join('');
}


// ---------- Cover page ----------

function chapterCardHtml(chapter) {
  return `
    <a href="${chapterHref(chapter)}">
      <b>${chapterTitle(chapter)}</b>
      <span>${readingTime(chapter.words)}</span>
    </a>`;
}

// `resume` is the chapter the reader last had open, or null.
export function coverHtml(book, resume) {
  const first = book.chapters[0];

  const actions = resume
    ? `<a class="primary" href="${chapterHref(resume)}">Continue · ${chapterTitle(resume)} →</a>
       <a class="secondary" href="${chapterHref(first)}">Start from the beginning</a>`
    : `<a class="primary" href="${chapterHref(first)}">Start reading →</a>`;

  return `
    <section class="cover">
      <div class="kicker">A novel, 1951</div>
      <h1>${escapeHtml(book.title)}</h1>
      <p class="by">${escapeHtml(book.author)}</p>
      <p class="blurb">
        Salinger’s novel of Holden Caulfield’s few days in New York after Pencey Prep.
        Pick up where you left off, or start on the day he left.
      </p>

      <div class="stats">
        <span>${book.chapters.length} chapters</span>
        <span>${Math.round(book.words / 1000)}k words</span>
        <span>about ${readingTime(book.words)} of reading</span>
      </div>

      <div class="cta">${actions}</div>

      <h2>Contents</h2>
      <div class="contents">${book.chapters.map(chapterCardHtml).join('')}</div>

      <p class="foot">
        Text from <a href="https://github.com/${REPO}">${REPO}</a>.
      </p>
    </section>`;
}


// ---------- Chapter page ----------

function chapterNavHtml(book, chapter) {
  const prev = book.chapters[chapter.index - 1];
  const next = book.chapters[chapter.index + 1];

  const prevLink = prev
    ? `<a class="prev" href="${chapterHref(prev)}"><small>← Previous</small>${chapterTitle(prev)}</a>`
    : '';
  const nextLink = next
    ? `<a class="next" href="${chapterHref(next)}"><small>Next →</small>${chapterTitle(next)}</a>`
    : `<a class="next" href="#/"><small>The end</small>Back to the cover</a>`;

  return `<nav class="nav">${prevLink}${nextLink}</nav>`;
}

export function chapterHtml(book, chapter) {
  return `
    <article class="chapter">
      <h1>${chapterTitle(chapter)}</h1>
      <div class="prose">${proseHtml(chapter.lines)}</div>
    </article>
    ${chapterNavHtml(book, chapter)}`;
}
