import { readFileSync } from "node:fs";
import { join } from "node:path";
import { vi } from "vitest";
import JSZip from "jszip";

// jsdom's Blob has no arrayBuffer/text; exifr and the CSV test need them.
function readBlob(b, how) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(r.error);
    r[how](b);
  });
}
Blob.prototype.arrayBuffer ??= function () { return readBlob(this, "readAsArrayBuffer"); };
Blob.prototype.text ??= function () { return readBlob(this, "readAsText"); };

export async function boot() {
  const html = readFileSync(join(__dirname, "../index.html"), "utf8");
  document.body.innerHTML = html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1].replace(/<script[\s\S]*?<\/script>/g, "");
  const out = [];
  URL.createObjectURL = (b) => (out.push(b), "blob:x");
  URL.revokeObjectURL = () => {};
  HTMLAnchorElement.prototype.click = function () {};
  globalThis.JSZip = JSZip;
  vi.resetModules();
  await import("../app.js");
  return { out, $: (id) => document.getElementById(id) };
}

export async function add(files) {
  const input = document.getElementById("file");
  Object.defineProperty(input, "files", { value: files, configurable: true });
  input.dispatchEvent(new Event("change"));
  await vi.waitFor(() => {
    if (document.getElementById("status").textContent.startsWith("Waiting")) throw new Error("not yet");
  });
  await new Promise((r) => setTimeout(r, 20));
}

// Minimal JPEG: SOI, APP1 Exif with DateTimeOriginal in the Exif IFD, EOI.
export function jpeg(date) {
  if (!date) return new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
  const dt = new TextEncoder().encode(date + "\0"); // 20 bytes
  const tiff = [];
  const u16 = (v) => tiff.push(v & 255, v >> 8);
  const u32 = (v) => tiff.push(v & 255, (v >> 8) & 255, (v >> 16) & 255, v >>> 24);
  tiff.push(0x49, 0x49); u16(42); u32(8);
  u16(1); u16(0x8769); u16(4); u32(1); u32(26); u32(0); // IFD0 -> ExifIFD at 26
  u16(1); u16(0x9003); u16(2); u32(dt.length); u32(44); u32(0); // ExifIFD at 26, data at 44
  tiff.push(...dt);
  const body = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff];
  const len = body.length + 2;
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe1, len >> 8, len & 255, ...body, 0xff, 0xd9]);
}

export const file = (name, bytes, type = "image/jpeg") => new File([bytes], name, { type });
export const json = (name, obj) => new File([JSON.stringify(obj)], name, { type: "application/json" });
