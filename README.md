# pi-copy-code-block

A Pi extension that adds a clickable copy icon to fenced code blocks in assistant messages.

## Preview

````text
```javascript  ⧉
const message = "Hello from Pi";
console.log(message);
```
````

Click `⧉` to copy the code without the fence or language identifier. Pi displays `Copied!` in the top-right corner after a successful copy.

The icon stays unchanged and can be clicked repeatedly. Press `Ctrl+Alt+C` to copy the latest assistant code block without using the mouse.

## Install

Run this command:

```sh
pi install git:github.com/juibcy/pi-copy-code-block
```

Restart Pi after installation.

## Requirements

- Pi 1.2.0
- Fullscreen TUI mode for mouse clicks

In regular terminal mode, use `Ctrl+Alt+C` because the terminal controls mouse input.

## Compatibility

Pi 1.2.0 does not expose a public API for interactive controls inside assistant Markdown. This extension applies a focused runtime patch to Pi's Markdown renderer. A future Pi version may require an extension update.

## License

MIT
