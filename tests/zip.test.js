import { it, expect } from "vitest";
import JSZip from "jszip";
import { boot, add, jpeg, file } from "./setup.js";

it("keeps both photos when two folders have the same file name", async () => {
  const { out, $ } = await boot();
  await add([file("2019/IMG_1.jpg", jpeg()), file("2020/IMG_1.jpg", jpeg()), file("x.jpg", jpeg())]);
  $("zip").click();
  await new Promise((r) => setTimeout(r, 200));
  const zip = await JSZip.loadAsync(await out.at(-1).arrayBuffer());
  expect(Object.keys(zip.files).sort()).toEqual(["IMG_1 (2).jpg", "IMG_1.jpg", "x.jpg"]);
});

it("CSV doesn't let a file name run as a spreadsheet formula", async () => {
  const { out, $ } = await boot();
  await add([file("=HYPERLINK(1).jpg", jpeg())]);
  $("csv").click();
  expect(await out.at(-1).text()).toContain(`"'=HYPERLINK(1).jpg"`);
});
