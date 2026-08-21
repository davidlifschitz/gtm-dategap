import exifr from "https://unpkg.com/exifr@7.1.3/dist/full.esm.js";

const MAX_BYTES = 15 * 1024 * 1024;
const MAX_FILES = 40;
const MEDIA = /\.(jpe?g|png|heic|heif|webp|tif|tiff|mp4|mov|m4v|avi|gif)$/i;

const els = {
  drop: document.getElementById("drop"),
  file: document.getElementById("file"),
  pick: document.getElementById("pick"),
  clear: document.getElementById("clear"),
  status: document.getElementById("status"),
  error: document.getElementById("error"),
  counts: document.getElementById("counts"),
  table: document.getElementById("table"),
  csv: document.getElementById("csv"),
  zip: document.getElementById("zip"),
};

let media = [];
let jsons = new Map();
let rows = [];

function setError(msg) {
  els.error.hidden = !msg;
  els.error.textContent = msg || "";
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function baseName(name) {
  return name.replace(/^.*[\\/]/, "");
}

function jsonKeys(mediaName) {
  const n = baseName(mediaName);
  return [n + ".json", n.replace(/\.[^.]+$/, "") + ".json", n + ".supplemental-metadata.json"];
}

function sidecarDate(obj) {
  if (!obj || typeof obj !== "object") return "";
  const t =
    obj.photoTakenTime?.timestamp ||
    obj.creationTime?.timestamp ||
    obj.photoTakenTime?.formatted ||
    obj.creationTime?.formatted ||
    obj.takenTime ||
    "";
  if (!t) return "";
  if (/^\d+$/.test(String(t))) {
    const d = new Date(Number(t) * (String(t).length <= 10 ? 1000 : 1));
    return Number.isNaN(d.getTime()) ? String(t) : d.toISOString();
  }
  return String(t);
}

async function exifDate(file) {
  try {
    const data = await exifr.parse(file, {
      pick: ["DateTimeOriginal", "CreateDate", "MediaCreateDate", "ModifyDate"],
    });
    if (!data) return "";
    const v = data.DateTimeOriginal || data.CreateDate || data.MediaCreateDate || data.ModifyDate;
    if (!v) return "";
    if (v instanceof Date) return v.toISOString();
    return String(v);
  } catch {
    return "";
  }
}

async function rebuild() {
  rows = [];
  for (const file of media) {
    const name = baseName(file.name);
    let jsonDate = "";
    for (const k of jsonKeys(name)) {
      if (jsons.has(k.toLowerCase())) {
        jsonDate = sidecarDate(jsons.get(k.toLowerCase()));
        break;
      }
    }
    const exif = await exifDate(file);
    const has = Boolean(jsonDate || exif);
    rows.push({ file, name, jsonDate, exif, has });
  }
  render();
}

function render() {
  const miss = rows.filter((r) => !r.has);
  els.status.textContent = rows.length
    ? `${rows.length} media · ${miss.length} missing a date · files stayed in this tab`
    : "Waiting for a Takeout dump.";
  els.counts.hidden = !rows.length;
  document.getElementById("c-media").textContent = String(rows.length);
  document.getElementById("c-ok").textContent = String(rows.length - miss.length);
  document.getElementById("c-miss").textContent = String(miss.length);
  if (!rows.length) {
    els.table.innerHTML = "";
  } else {
    const body = rows
      .slice(0, 80)
      .map(
        (r) => `<tr class="${r.has ? "" : "miss"}">
        <td>${escapeHtml(r.name)}</td>
        <td>${escapeHtml(r.exif || "—")}</td>
        <td>${escapeHtml(r.jsonDate || "—")}</td>
        <td>${r.has ? "ok" : "missing"}</td>
      </tr>`
      )
      .join("");
    els.table.innerHTML = `<table>
      <thead><tr><th>file</th><th>exif</th><th>json</th><th></th></tr></thead>
      <tbody>${body}</tbody>
    </table>`;
  }
  els.csv.disabled = !miss.length;
  els.zip.disabled = !miss.length;
}

async function addFiles(list) {
  setError("");
  for (const file of list) {
    if (file.size > MAX_BYTES) {
      setError(`${file.name} is over 15 MB.`);
      continue;
    }
    const n = baseName(file.name);
    if (/\.json$/i.test(n)) {
      try {
        jsons.set(n.toLowerCase(), JSON.parse(await file.text()));
      } catch {
        setError(`${n} is not JSON.`);
      }
      continue;
    }
    if (!MEDIA.test(n)) {
      setError(`${n} is not a photo, video, or sidecar I know.`);
      continue;
    }
    if (media.length >= MAX_FILES) {
      setError(`Cap is ${MAX_FILES} media files.`);
      continue;
    }
    media.push(file);
  }
  await rebuild();
}

function toCsv() {
  const miss = rows.filter((r) => !r.has);
  const lines = ["file,exif,json"];
  for (const r of miss) {
    const cells = [r.name, r.exif, r.jsonDate].map((v) => `"${String(v).replaceAll('"', '""')}"`);
    lines.push(cells.join(","));
  }
  return lines.join("\n") + "\n";
}

function download(name, blob) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

els.pick.addEventListener("click", () => els.file.click());
els.file.addEventListener("change", () => {
  addFiles([...els.file.files]);
  els.file.value = "";
});
els.clear.addEventListener("click", () => {
  media = [];
  jsons = new Map();
  rows = [];
  setError("");
  render();
});
els.csv.addEventListener("click", () => {
  download("dategap-missing.csv", new Blob([toCsv()], { type: "text/csv" }));
});
els.zip.addEventListener("click", async () => {
  const zip = new JSZip();
  for (const r of rows.filter((x) => !x.has)) zip.file(r.name, r.file);
  const blob = await zip.generateAsync({ type: "blob" });
  download("dategap-missing.zip", blob);
});

["dragenter", "dragover"].forEach((ev) => {
  els.drop.addEventListener(ev, (e) => {
    e.preventDefault();
    els.drop.classList.add("over");
  });
});
els.drop.addEventListener("dragleave", () => els.drop.classList.remove("over"));
els.drop.addEventListener("drop", (e) => {
  e.preventDefault();
  els.drop.classList.remove("over");
  addFiles([...e.dataTransfer.files]);
});

render();
