// Tests for the rye.txt parser. Run with `node --test`.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseBook } from '../js/book.js';
import { BOOK_AUTHOR, BOOK_TITLE } from '../js/config.js';

// Shaped like rye.txt: front matter, numbered chapters, one paragraph per
// indented line, and an unindented line that continues the paragraph above.
const SAMPLE = [
  'THE CATCHER IN THE RYE',
  'by J.D. Salinger',
  ' TO',
  ' MY',
  ' MOTHER',
  '',
  '1',
  ' If you really want to hear about it,',
  ' Where I want to start telling is the day',
  'I left Pencey Prep.',
  '2',
  ' They each had their own room and all.',
  '3',
  ' Where I lived at Pencey, I lived in the',
  ' 1952 was a good year.',
  '7',
  ' Not a chapter heading.',
].join('\n');

test('finds each numbered chapter and skips the front matter', () => {
  const book = parseBook(SAMPLE);
  assert.deepEqual(book.chapters.map((c) => c.numeral), ['1', '2', '3']);
  const text = book.chapters.flatMap((c) => c.lines).join(' ');
  assert.ok(!text.includes('Salinger'));
  assert.ok(!text.includes('MOTHER'));
});

test('a number out of sequence stays in the text', () => {
  const book = parseBook(SAMPLE);
  assert.deepEqual(book.chapters[2].lines, [
    'Where I lived at Pencey, I lived in the',
    '',
    '1952 was a good year. 7',
    '',
    'Not a chapter heading.',
  ]);
});

test('joins continuation lines and separates paragraphs with blank lines', () => {
  const book = parseBook(SAMPLE);
  assert.deepEqual(book.chapters[0].lines, [
    'If you really want to hear about it,',
    '',
    'Where I want to start telling is the day I left Pencey Prep.',
  ]);
});

test('splits paragraphs run together with three spaces', () => {
  const book = parseBook([
    '1',
    ' "Who\'s that?" he yelled.   "Caulfield? Come in, boy."',
    ' I sat down on it.   Then he said,',
    'something.   "Hello," I said.   Boy, was it cold.',
  ].join('\n'));
  assert.deepEqual(book.chapters[0].lines, [
    '"Who\'s that?" he yelled.',
    '',
    '"Caulfield? Come in, boy."',
    '',
    'I sat down on it.',
    '',
    'Then he said, something.',
    '',
    '"Hello," I said.',
    '',
    'Boy, was it cold.',
  ]);
});

test('keeps three spaces that are not at a sentence end', () => {
  const book = parseBook('1\n residing in   one of the northern sections.\n at me,   I hope not.');
  assert.deepEqual(book.chapters[0].lines, [
    'residing in   one of the northern sections.',
    '',
    'at me,   I hope not.',
  ]);
});

test('numbers chapters in reading order', () => {
  const book = parseBook(SAMPLE);
  assert.deepEqual(book.chapters.map((c) => c.index), [0, 1, 2]);
});

test('counts words per chapter and in total', () => {
  const book = parseBook(SAMPLE);
  assert.deepEqual(book.chapters.map((c) => c.words), [21, 8, 19]);
  assert.deepEqual(book.chapters.map((c) => c.wordsBefore), [0, 21, 29]);
  assert.equal(book.words, 48);
});

test('handles a byte-order mark and Windows line endings', () => {
  const book = parseBook(`\uFEFF${SAMPLE.replace(/\n/g, '\r\n')}`);
  assert.deepEqual(book, parseBook(SAMPLE));
});

test('accepts headings with surrounding whitespace', () => {
  const book = parseBook(' 1 \n text\n2\t\n more');
  assert.deepEqual(book.chapters.map((c) => c.numeral), ['1', '2']);
});

test('returns no chapters for text without headings', () => {
  for (const text of ['', 'just some text', '2\n starts at two']) {
    const book = parseBook(text);
    assert.deepEqual(book.chapters, []);
    assert.equal(book.words, 0);
  }
});

test('carries the title and author from config', () => {
  const book = parseBook(SAMPLE);
  assert.equal(book.title, BOOK_TITLE);
  assert.equal(book.author, BOOK_AUTHOR);
});
