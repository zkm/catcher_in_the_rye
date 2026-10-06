# The Catcher in the Rye reader

This branch holds the GitHub Pages reader. The page contains no book text: it
downloads `rye.txt` from the `master` branch each time it loads, so edits to
the text show up without changing this branch.

`js/book.js` splits the text into chapters. Each chapter starts with a line
holding just its number, and the parser expects the paragraph layout
described at the top of that file. Check it against the text before changing
the format of `rye.txt`.

Your theme, text size and reading position are saved in your own browser and
nowhere else.

## Development

Serve the folder over HTTP, since the modules don't load from `file://`:

    python3 -m http.server 8000

Run the parser tests with `node --test`.
