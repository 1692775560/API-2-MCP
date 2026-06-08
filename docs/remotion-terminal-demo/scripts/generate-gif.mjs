import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import gifenc from "gifenc";

const { GIFEncoder } = gifenc;

const rootDir = resolve(fileURLToPath(new URL("..", import.meta.url)));
const outputPath = resolve(rootDir, "../assets/terminal-demo.gif");

const width = 720;
const height = 405;
const frameCount = 112;
const frameDelayMs = 58;

const palette = [
  [6, 14, 26],
  [9, 24, 39],
  [13, 32, 51],
  [28, 41, 58],
  [43, 58, 78],
  [235, 246, 255],
  [164, 185, 209],
  [32, 216, 255],
  [103, 240, 111],
  [255, 184, 107],
  [255, 95, 87],
  [254, 188, 46],
  [40, 200, 64],
  [0, 0, 0],
  [34, 197, 94],
  [70, 89, 112],
];

const C = {
  bg: 0,
  grid: 2,
  term: 13,
  chrome: 3,
  chromeEdge: 4,
  text: 5,
  muted: 6,
  cyan: 7,
  green: 8,
  amber: 9,
  red: 10,
  yellow: 11,
  dotGreen: 12,
  prompt: 14,
  dim: 15,
};

const commands = [
  {
    start: 9,
    rate: 2.5,
    text: "npm install -g @taozhang123/api-to-mcp",
    output: ["added 2 packages in 4s"],
  },
  {
    start: 33,
    rate: 2.7,
    text: "api-to-mcp generate ./openapi.json --out ./petstore-mcp",
    output: ["Generated MCP server at ./petstore-mcp"],
  },
  {
    start: 62,
    rate: 2.9,
    text: "cd petstore-mcp && npm install && npm run build",
    output: ["> tsc", "build completed"],
  },
  {
    start: 88,
    rate: 1.6,
    text: "npm start",
    output: ["MCP stdio server ready", "tools/list -> list_pets, create_pet"],
  },
];

function renderFrame(index, frame) {
  fill(index, C.bg);
  drawGrid(index, frame);
  drawTitle(index);
  drawTerminal(index, frame);
  drawFlow(index, frame);
  drawFooter(index, frame);
}

function drawGrid(index, frame) {
  for (let x = (frame % 32) - 32; x < width; x += 32) {
    rect(index, x, 0, 1, height, C.grid);
  }
  for (let y = 0; y < height; y += 32) {
    rect(index, 0, y, width, 1, C.grid);
  }
  rect(index, 0, 0, width, height, C.bg, 0.74);
}

function drawTitle(index) {
  text(index, "API-2-MCP", 38, 24, 2, C.cyan);
  text(index, "OPENAPI TO MCP TOOLS", 38, 48, 3, C.text);
}

function drawTerminal(index, frame) {
  const x = 34;
  const y = 82;
  const w = 432;
  const h = 244;
  const enter = clamp(frame / 12, 0, 1);
  const offsetY = Math.round((1 - enter) * 18);
  const ty = y + offsetY;

  rect(index, x - 1, ty - 1, w + 2, h + 2, C.cyan);
  rect(index, x, ty, w, h, C.term);
  rect(index, x, ty, w, 31, C.chrome);
  rect(index, x, ty + 31, w, 1, C.chromeEdge);
  circle(index, x + 15, ty + 15, 5, C.red);
  circle(index, x + 29, ty + 15, 5, C.yellow);
  circle(index, x + 43, ty + 15, 5, C.dotGreen);
  text(index, "API-TO-MCP - DEMO", x + 62, ty + 9, 1, C.muted);

  text(index, "{ }", x + 18, ty + 48, 2, C.cyan);
  text(index, "GENERATE MCP SERVERS FROM OPENAPI SPECS", x + 58, ty + 51, 1, C.muted);

  let lineY = ty + 86;
  for (const command of commands) {
    const visibleChars = typedChars(command, frame);
    const hasStarted = frame >= command.start;
    if (!hasStarted) {
      continue;
    }

    text(index, "$", x + 18, lineY, 2, C.prompt);
    text(index, command.text.slice(0, visibleChars).toUpperCase(), x + 38, lineY + 1, 1, C.text);

    const doneFrame = command.start + Math.ceil(command.text.length / command.rate);
    if (frame >= command.start && frame <= doneFrame + 4 && Math.floor(frame / 6) % 2 === 0) {
      const cursorX = x + 38 + visibleChars * 7;
      rect(index, cursorX, lineY + 1, 6, 10, C.cyan);
    }

    lineY += 20;
    if (frame > doneFrame + 2) {
      for (let i = 0; i < command.output.length; i += 1) {
        const reveal = clamp((frame - doneFrame - 2 - i * 4) / 4, 0, 1);
        if (reveal > 0) {
          text(index, command.output[i].toUpperCase(), x + 38, lineY, 1, i === 0 ? C.cyan : C.green);
          if (reveal < 1) {
            rect(index, x + 38 + Math.round(command.output[i].length * 7 * reveal), lineY, 10, 10, C.term);
          }
        }
        lineY += 17;
      }
    }
    lineY += 5;
  }
}

function drawFlow(index, frame) {
  const x = 492;
  const y = 88;
  const cards = [
    ["OPENAPI.JSON", "SPEC", C.cyan, 36],
    ["MCP SERVER", "TOOLS + SCHEMAS", C.green, 62],
    ["AI CLIENTS", "CLAUDE + CODEX", C.amber, 88],
  ];

  for (let i = 0; i < cards.length; i += 1) {
    const [title, subtitle, color, revealFrame] = cards[i];
    if (frame < revealFrame) {
      continue;
    }
    const cy = y + i * 82;
    rect(index, x, cy, 188, 55, color);
    rect(index, x + 2, cy + 2, 184, 51, C.bg);
    diamond(index, x + 19, cy + 27, 10, color);
    text(index, title, x + 46, cy + 15, 2, C.text);
    text(index, subtitle, x + 46, cy + 38, 1, C.muted);
    if (i < 2) {
      const progress = clamp((frame - revealFrame) / 20, 0, 1);
      rect(index, x + 41, cy + 66, 108, 4, C.dim);
      rect(index, x + 41, cy + 66, Math.round(108 * progress), 4, C.cyan);
    }
  }
}

function drawFooter(index, frame) {
  const items = ["OPENAPI 3.X", "TYPESCRIPT", "MCP STDIO", "CLAUDE CODE", "CODEX"];
  let x = 38;
  for (let i = 0; i < items.length; i += 1) {
    if (frame < 22 + i * 5) {
      continue;
    }
    const label = items[i];
    const w = label.length * 8 + 20;
    rect(index, x, 356, w, 22, C.chromeEdge);
    rect(index, x + 1, 357, w - 2, 20, C.chrome);
    text(index, label, x + 10, 363, 1, C.text);
    x += w + 11;
  }
}

function typedChars(command, frame) {
  return clamp(Math.floor((frame - command.start) * command.rate), 0, command.text.length);
}

function fill(index, color) {
  index.fill(color);
}

function rect(index, x, y, w, h, color, alpha = 1) {
  const startX = clamp(Math.floor(x), 0, width);
  const startY = clamp(Math.floor(y), 0, height);
  const endX = clamp(Math.ceil(x + w), 0, width);
  const endY = clamp(Math.ceil(y + h), 0, height);
  for (let yy = startY; yy < endY; yy += 1) {
    for (let xx = startX; xx < endX; xx += 1) {
      if (alpha < 1 && ((xx + yy) % Math.ceil(1 / Math.max(alpha, 0.05))) !== 0) {
        continue;
      }
      index[yy * width + xx] = color;
    }
  }
}

function circle(index, cx, cy, r, color) {
  for (let y = -r; y <= r; y += 1) {
    for (let x = -r; x <= r; x += 1) {
      if (x * x + y * y <= r * r) {
        set(index, cx + x, cy + y, color);
      }
    }
  }
}

function diamond(index, cx, cy, r, color) {
  for (let y = -r; y <= r; y += 1) {
    for (let x = -r; x <= r; x += 1) {
      if (Math.abs(x) + Math.abs(y) <= r) {
        set(index, cx + x, cy + y, color);
      }
    }
  }
}

function set(index, x, y, color) {
  if (x < 0 || x >= width || y < 0 || y >= height) {
    return;
  }
  index[Math.floor(y) * width + Math.floor(x)] = color;
}

function text(index, value, x, y, scale, color) {
  let cursor = x;
  for (const rawChar of value) {
    const char = rawChar === " " ? " " : rawChar.toUpperCase();
    drawGlyph(index, char, cursor, y, scale, color);
    cursor += 6 * scale + scale;
  }
}

function drawGlyph(index, char, x, y, scale, color) {
  const glyph = FONT[char] || FONT["?"];
  for (let row = 0; row < glyph.length; row += 1) {
    for (let col = 0; col < glyph[row].length; col += 1) {
      if (glyph[row][col] === "1") {
        rect(index, x + col * scale, y + row * scale, scale, scale, color);
      }
    }
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

const FONT = {
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "?": ["11110", "00001", "00001", "00110", "00100", "00000", "00100"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10011", "10001", "10001", "01110"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  J: ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "_": ["00000", "00000", "00000", "00000", "00000", "00000", "11111"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "@": ["01110", "10001", "10111", "10101", "10111", "10000", "01110"],
  "$": ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  ">": ["10000", "01000", "00100", "00010", "00100", "01000", "10000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  ",": ["00000", "00000", "00000", "00000", "01100", "01100", "01000"],
  "{": ["00011", "00100", "00100", "11000", "00100", "00100", "00011"],
  "}": ["11000", "00100", "00100", "00011", "00100", "00100", "11000"],
};

const gif = GIFEncoder({ initialCapacity: width * height * frameCount });

for (let frame = 0; frame < frameCount; frame += 1) {
  const index = new Uint8Array(width * height);
  renderFrame(index, frame);
  gif.writeFrame(index, width, height, {
    palette,
    delay: frameDelayMs,
    repeat: 0,
  });
}

gif.finish();
await writeFile(outputPath, gif.bytes());
console.log(`Generated ${outputPath}`);
