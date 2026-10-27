# pi-copy-code-block

A Pi extension that adds a clickable copy icon to every fenced code block in assistant messages.

## Appearance

Assistant code blocks are rendered like this:

````text
```javascript  ⧉
const message = "Hello from Pi";
console.log(message);
```
````

After the icon is clicked, Pi shows the same transient confirmation used for text-selection copying:

```text
                                                      Copied!
```

The `⧉` icon remains unchanged and can be clicked repeatedly. The extension writes the code again whenever the clipboard contains something else. If clipboard reading is unavailable, every click performs a safe clipboard write. Fences and language identifiers are never copied.

As a keyboard fallback, press `Ctrl+Alt+C` to copy the latest rendered assistant code block.

## Requirements

- Pi 1.2.0
- Fullscreen TUI mode for mouse clicks

Pi's regular terminal mode leaves mouse handling to the terminal. The copy icons remain visible there, but use `Ctrl+Alt+C` instead of clicking them.

## Install

From this directory:

```sh
pi install .
```

For project-local installation:

```sh
pi install --local .
```

To try the extension without installing it:

```sh
pi --extension ./extensions/index.js
```

Restart Pi after installation. If Pi asks whether to trust project resources, review the extension and approve the project.

## Usage

1. Ask Pi for an answer containing a fenced code block.
2. Click `⧉` on the opening fence.
3. Pi flashes `Copied!` in the top-right corner on success, using the same transient confirmation as Pi's text-selection copy.

## Compatibility note

Pi 1.2.0 does not provide a public extension hook for interactive controls inside built-in assistant Markdown. This extension uses a narrowly scoped runtime patch of Pi's `Markdown` component and activates it only for assistant messages. It preserves the standard Markdown renderer, syntax highlighting, streaming behavior, and clipboard implementation.

Because that rendering seam is internal, a future Pi release may require an extension update. When the seam is unavailable, the extension fails during loading with a clear compatibility error instead of silently changing transcript behavior.

## Development

Run the focused tests:

```sh
npm test
```

## License

MIT
