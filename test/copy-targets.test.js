import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCopyTargets,
  copyIfChanged,
  targetForPointer,
} from "../extensions/copy-targets.js";

const ansiPattern = /\x1b\[[0-?]*[ -/]*[@-~]/g;
const measure = (text) => text.replace(ansiPattern, "").length;

test("skips a redundant clipboard write", async () => {
  let writes = 0;
  const changed = await copyIfChanged(
    "same code",
    async () => "same code",
    async () => {
      writes++;
    },
  );

  assert.equal(changed, false);
  assert.equal(writes, 0);
});

test("writes after the clipboard changes or cannot be read", async () => {
  const writes = [];

  assert.equal(
    await copyIfChanged("new code", async () => "other text", async (text) => writes.push(text)),
    true,
  );
  assert.equal(
    await copyIfChanged(
      "fallback code",
      async () => {
        throw new Error("read unavailable");
      },
      async (text) => writes.push(text),
    ),
    true,
  );
  assert.deepEqual(writes, ["new code", "fallback code"]);
});

test("associates icon controls with code blocks in render order", () => {
  const lines = [
    "intro",
    "\x1b[90m```js  ⧉\x1b[0m",
    "  console.log('one')",
    "```",
    "\x1b[90m```sh  ⧉\x1b[0m",
    "  echo two",
    "```",
  ];
  const blocks = [
    { code: "console.log('one')", icon: "⧉" },
    { code: "echo two", icon: "⧉" },
  ];

  assert.deepEqual(buildCopyTargets(lines, blocks, measure), [
    { y: 1, xStart: 7, xEnd: 8, code: "console.log('one')" },
    { y: 4, xStart: 7, xEnd: 8, code: "echo two" },
  ]);
});

test("returns a target for left-button press and click inside its icon", () => {
  const target = {
    y: 2,
    xStart: 10,
    xEnd: 11,
    code: "const answer = 42;",
  };
  const targets = [target];

  assert.equal(
    targetForPointer({ type: "press", button: "left", x: 10, y: 2 }, targets),
    target,
  );
  assert.equal(
    targetForPointer({ type: "click", button: "left", x: 10, y: 2 }, targets),
    target,
  );
  assert.equal(
    targetForPointer({ type: "click", button: "right", x: 10, y: 2 }, targets),
    undefined,
  );
  assert.equal(
    targetForPointer({ type: "click", button: "left", x: 9, y: 2 }, targets),
    undefined,
  );
});
