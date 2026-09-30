import { it, expect } from "vitest";
import { boot, add, jpeg, file, json } from "./setup.js";

const side = { photoTakenTime: { timestamp: "1562234400" } };

it.each([
  ["duplicate copy", "IMG_1234(1).jpg", "IMG_1234.jpg(1).json"],
  ["truncated supplemental name", "IMG_1234.jpg", "IMG_1234.jpg.supplemental-metad.json"],
  ["truncated supplemental on a duplicate", "IMG_1234(2).jpg", "IMG_1234.jpg.supplemental-metadata(2).json"],
  ["edited copy", "IMG_1234-edited.jpg", "IMG_1234.jpg.json"],
])("finds the Takeout sidecar for a %s", async (_, media, sidecar) => {
  const { $ } = await boot();
  await add([file(media, jpeg()), json(sidecar, side)]);
  expect($("c-miss").textContent).toBe("0");
});

it("doesn't give a duplicate the original's sidecar", async () => {
  const { $ } = await boot();
  await add([file("IMG_1234(1).jpg", jpeg()), json("IMG_1234.jpg.json", side)]);
  expect($("c-miss").textContent).toBe("1");
});
