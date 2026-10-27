import {
  copyToClipboard,
} from "@earendil-works/pi-coding-agent";
import {
  getNativeClipboard,
  Key,
  Markdown,
  visibleWidth,
} from "@earendil-works/pi-tui";
import {
  buildCopyTargets,
  copyIfChanged,
  COPY_ICON,
  targetForPointer,
} from "./copy-targets.js";

const PATCH_KEY = Symbol.for("pi-copy-code-block.markdown-patch");
const TUI_CAPTURE_WIDGET = "pi-copy-code-block-tui-capture";

function installMarkdownPatch() {
  const prototype = Markdown.prototype;
  if (prototype[PATCH_KEY]) return prototype[PATCH_KEY];

  const originalRender = prototype.render;
  const originalRenderToken = prototype.renderToken;
  const originalHandleMouse = prototype.handleMouse;

  if (typeof originalRenderToken !== "function") {
    throw new Error(
      "This Pi version does not expose the Markdown rendering seam required by pi-copy-code-block.",
    );
  }

  const state = {
    activeMarkdown: undefined,
    assistantMarkdown: new WeakSet(),
    renderData: new WeakMap(),
    copyCode: async () => {},
    latestCode: undefined,
  };

  prototype.render = function renderWithCopyControls(width) {
    const cacheHit =
      this.cachedLines &&
      this.cachedText === this.text &&
      this.cachedWidth === width;

    if (!cacheHit) {
      state.renderData.set(this, { blocks: [], targets: [] });
    }

    const previousActiveMarkdown = state.activeMarkdown;
    state.activeMarkdown = this;

    try {
      const lines = originalRender.call(this, width);
      const data = state.renderData.get(this);

      if (state.assistantMarkdown.has(this) && data && !cacheHit) {
        data.targets = buildCopyTargets(lines, data.blocks, visibleWidth);
        if (data.blocks.length > 0) {
          state.latestCode = data.blocks[data.blocks.length - 1].code;
        }
      }

      return lines;
    } finally {
      state.activeMarkdown = previousActiveMarkdown;
    }
  };

  prototype.renderToken = function renderTokenWithCopyControl(...args) {
    const token = args[0];
    const lines = originalRenderToken.apply(this, args);

    if (
      token?.type === "code" &&
      lines.length > 0 &&
      state.assistantMarkdown.has(this)
    ) {
      const data = state.renderData.get(this) ?? { blocks: [], targets: [] };
      data.blocks.push({ code: token.text, icon: COPY_ICON });
      state.renderData.set(this, data);

      const control = this.theme.codeBlockBorder(`  ${COPY_ICON}`);
      lines[0] = `${lines[0]}${control}`;
    }

    return lines;
  };

  prototype.handleMouse = function handleCopyControlMouse(event) {
    const data = state.renderData.get(this);
    const target = data ? targetForPointer(event, data.targets) : undefined;

    if (target && event.type === "press") {
      return { handled: true, capture: true, render: false };
    }

    if (target && event.type === "click") {
      void state.copyCode(target.code);
      return { handled: true, render: false };
    }

    return originalHandleMouse?.call(this, event);
  };

  Object.defineProperty(prototype, PATCH_KEY, {
    value: state,
    configurable: false,
    enumerable: false,
    writable: false,
  });

  return state;
}

export default function copyCodeBlockExtension(pi) {
  const patch = installMarkdownPatch();
  let activeContext;
  let flashCopied;

  const copy = async (code, context = activeContext) => {
    try {
      await copyIfChanged(
        code,
        async () => getNativeClipboard()?.getText(),
        copyToClipboard,
      );
      if (flashCopied) {
        flashCopied();
      } else {
        context?.ui.notify("Copied!", "info");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      context?.ui.notify(`Could not copy code: ${message}`, "error");
    }
  };

  patch.copyCode = copy;

  pi.registerMarkdownTransformer((markdown, context) => {
    if (context.messageType === "assistant" && patch.activeMarkdown) {
      patch.assistantMarkdown.add(patch.activeMarkdown);
    }
    return markdown;
  });

  pi.registerShortcut(Key.ctrlAlt("c"), {
    description: "Copy the latest assistant code block",
    handler: async (context) => {
      if (patch.latestCode === undefined) {
        context.ui.notify("No assistant code block is available.", "warning");
        return;
      }
      await copy(patch.latestCode, context);
    },
  });

  pi.on("session_start", (_event, context) => {
    activeContext = context;
    if (context.mode !== "tui") return;

    context.ui.setWidget(TUI_CAPTURE_WIDGET, (tui) => {
      flashCopied = () => {
        if (typeof tui.flash === "function") {
          tui.flash("Copied!");
          tui.requestRender();
        } else {
          context.ui.notify("Copied!", "info");
        }
      };

      return {
        render: () => [],
        invalidate: () => {},
      };
    });
  });

  pi.on("session_shutdown", (_event, context) => {
    if (context.mode === "tui") {
      context.ui.setWidget(TUI_CAPTURE_WIDGET, undefined);
    }
    activeContext = undefined;
    flashCopied = undefined;
  });
}
