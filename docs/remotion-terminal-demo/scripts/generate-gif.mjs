import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import gifenc from "gifenc";
import { PNG } from "pngjs";

const { GIFEncoder, quantize, applyPalette } = gifenc;

const rootDir = resolve(fileURLToPath(new URL("..", import.meta.url)));
const sourcePath = resolve(rootDir, "../assets/terminal-demo-poster.png");
const outputPath = resolve(rootDir, "../assets/terminal-demo.gif");

const source = PNG.sync.read(await readFile(sourcePath));
const width = 720;
const height = 405;
const frameCount = 54;
const delay = 70;

const gif = GIFEncoder({ initialCapacity: width * height * frameCount });

for (let frame = 0; frame < frameCount; frame += 1) {
  const progress = frame / (frameCount - 1);
  const pixels = renderFrame(source, width, height, progress, frame);
  const palette = quantize(pixels, 128, { format: "rgb444" });
  const index = applyPalette(pixels, palette, "rgb444");
  gif.writeFrame(index, width, height, {
    palette,
    delay,
    repeat: 0,
  });
}

gif.finish();
await writeFile(outputPath, gif.bytes());
console.log(`Generated ${outputPath}`);

function renderFrame(sourcePng, targetWidth, targetHeight, progress, frame) {
  const output = new Uint8Array(targetWidth * targetHeight * 4);
  const zoom = 1.02 + Math.sin(progress * Math.PI) * 0.035;
  const panX = Math.sin(progress * Math.PI * 2) * 14;
  const panY = Math.cos(progress * Math.PI * 2) * 7;
  const sourceAspect = sourcePng.width / sourcePng.height;
  const targetAspect = targetWidth / targetHeight;
  const coverHeight = sourceAspect > targetAspect ? sourcePng.height : sourcePng.width / targetAspect;
  const coverWidth = coverHeight * targetAspect;
  const scaledWidth = coverWidth / zoom;
  const scaledHeight = coverHeight / zoom;
  const sourceLeft = (sourcePng.width - scaledWidth) / 2 + panX;
  const sourceTop = (sourcePng.height - scaledHeight) / 2 + panY;

  for (let y = 0; y < targetHeight; y += 1) {
    for (let x = 0; x < targetWidth; x += 1) {
      const sx = clamp(Math.floor(sourceLeft + (x / targetWidth) * scaledWidth), 0, sourcePng.width - 1);
      const sy = clamp(Math.floor(sourceTop + (y / targetHeight) * scaledHeight), 0, sourcePng.height - 1);
      const sourceIndex = (sy * sourcePng.width + sx) * 4;
      const targetIndex = (y * targetWidth + x) * 4;
      output[targetIndex] = sourcePng.data[sourceIndex];
      output[targetIndex + 1] = sourcePng.data[sourceIndex + 1];
      output[targetIndex + 2] = sourcePng.data[sourceIndex + 2];
      output[targetIndex + 3] = 255;
    }
  }

  drawScanLine(output, targetWidth, targetHeight, frame);
  drawPulse(output, targetWidth, targetHeight, progress);
  drawProgressGlow(output, targetWidth, targetHeight, progress);
  return output;
}

function drawScanLine(pixels, width, height, frame) {
  const y = 112 + (frame * 6) % 166;
  fillRect(pixels, width, 56, y, 376, 3, [32, 216, 255, 92]);
  fillRect(pixels, width, 56, y + 3, 376, 1, [103, 240, 111, 120]);
}

function drawPulse(pixels, width, height, progress) {
  const alpha = 80 + Math.round(Math.sin(progress * Math.PI * 8) * 50);
  fillRect(pixels, width, 58, 255, 10, 14, [103, 240, 111, alpha]);
}

function drawProgressGlow(pixels, width, height, progress) {
  const lineX = 468;
  const lineWidth = 152;
  const yPositions = [154, 224];
  for (const y of yPositions) {
    const fillWidth = Math.max(8, Math.round(lineWidth * progress));
    fillRect(pixels, width, lineX, y, fillWidth, 3, [32, 216, 255, 145]);
    fillRect(pixels, width, lineX + fillWidth - 4, y - 3, 8, 9, [103, 240, 111, 160]);
  }
}

function fillRect(pixels, width, x, y, rectWidth, rectHeight, color) {
  const [red, green, blue, alpha] = color;
  for (let yy = Math.max(0, y); yy < Math.max(0, y) + rectHeight; yy += 1) {
    for (let xx = Math.max(0, x); xx < Math.max(0, x) + rectWidth; xx += 1) {
      const index = (yy * width + xx) * 4;
      const existingAlpha = alpha / 255;
      pixels[index] = Math.round(pixels[index] * (1 - existingAlpha) + red * existingAlpha);
      pixels[index + 1] = Math.round(pixels[index + 1] * (1 - existingAlpha) + green * existingAlpha);
      pixels[index + 2] = Math.round(pixels[index + 2] * (1 - existingAlpha) + blue * existingAlpha);
      pixels[index + 3] = 255;
    }
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
