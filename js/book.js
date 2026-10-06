// Parses rye.txt into chapters.
//
// The text opens with a title, byline and dedication, then each chapter starts
// with a line holding just its number ("1", "2", ...). Inside a chapter each
// paragraph is one line that starts with a space. A line that doesn't start
// with a space continues the paragraph before it.
//
// Returned shape:
//   { title, author, words, chapters: [chapter, ...] }   // chapters in reading order
//   chapter = { numeral, lines, index, words, wordsBefore }
//
// `lines` holds one paragraph per line with blank lines between them, which is
// the form views.js renders.

import { BOOK_AUTHOR, BOOK_TITLE } from './config.js';

const CHAPTER_HEADING = /^\d+$/;

function countWords(lines) {
  return lines.join(' ').split(/\s+/).filter(Boolean).length;
}

// Joins continuation lines onto their paragraph and returns the paragraphs
// separated by blank lines.
function toParagraphLines(lines) {
  const paragraphs = [];
  for (const line of lines) {
    const text = line.trim();
    if (!text) continue;
    if (/^\s/.test(line) || !paragraphs.length) {
      paragraphs.push(text);
    } else {
      paragraphs[paragraphs.length - 1] += ` ${text}`;
    }
  }
  return paragraphs.flatMap((p, i) => (i ? ['', p] : [p]));
}

// Groups lines into chapters. A heading only counts when it is the next
// chapter number, so a stray number in the prose can't start a chapter.
// Anything before chapter 1 (the front matter) is skipped.
function splitChapters(lines) {
  const chapters = [];
  let chapter = null;

  for (const line of lines) {
    const text = line.trim();
    if (CHAPTER_HEADING.test(text) && Number(text) === chapters.length + 1) {
      chapter = { numeral: text, lines: [] };
      chapters.push(chapter);
      continue;
    }
    if (chapter) chapter.lines.push(line);
  }

  for (const c of chapters) c.lines = toParagraphLines(c.lines);
  return chapters;
}

export function parseBook(text) {
  const lines = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n');
  const chapters = splitChapters(lines);

  let words = 0;
  chapters.forEach((chapter, index) => {
    chapter.index = index;
    chapter.words = countWords(chapter.lines);
    chapter.wordsBefore = words;
    words += chapter.words;
  });

  return { title: BOOK_TITLE, author: BOOK_AUTHOR, chapters, words };
}
