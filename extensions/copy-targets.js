export const COPY_ICON = "⧉";

export async function copyIfChanged(text, read, write) {
  let currentText;
  try {
    currentText = await read();
  } catch {}

  if (currentText === text) return false;
  await write(text);
  return true;
}

export function buildCopyTargets(lines, blocks, measure) {
  const targets = [];
  let blockIndex = 0;

  for (let y = 0; y < lines.length && blockIndex < blocks.length; y++) {
    const block = blocks[blockIndex];
    const iconIndex = lines[y].indexOf(block.icon);
    if (iconIndex < 0) continue;

    const x = measure(lines[y].slice(0, iconIndex));
    targets.push({
      y,
      xStart: x,
      xEnd: x + measure(block.icon),
      code: block.code,
    });
    blockIndex++;
  }

  return targets;
}

export function targetForPointer(event, targets) {
  if (
    (event.type !== "press" && event.type !== "click") ||
    event.button !== "left"
  ) {
    return undefined;
  }

  return targets.find(
    (target) =>
      event.y === target.y &&
      event.x >= target.xStart &&
      event.x < target.xEnd,
  );
}
