import { describe, it, expect } from "vitest";
import { boot, add, jpeg, file, json } from "./setup.js";

describe("dategap", () => {
  it("counts files with EXIF, with a sidecar, and with neither", async () => {
    const { $ } = await boot();
    await add([
      file("exif.jpg", jpeg("2019:07:04 10:00:00")),
      file("side.jpg", jpeg()),
      json("side.jpg.json", { photoTakenTime: { timestamp: "1562234400" } }),
      file("none.jpg", jpeg()),
    ]);
    expect([$("c-media").textContent, $("c-ok").textContent, $("c-miss").textContent]).toEqual(["3", "2", "1"]);
    const miss = [...document.querySelectorAll("tr.miss td:first-child")].map((td) => td.textContent);
    expect(miss).toEqual(["none.jpg"]);
    expect(document.querySelector("tbody").textContent).toContain("2019-07-04T10:00:00.000Z");
  });
  it("exports only the missing files as CSV", async () => {
    const { out, $ } = await boot();
    await add([file("a.jpg", jpeg()), file("b.jpg", jpeg("2020:01:01 00:00:00"))]);
    $("csv").click();
    expect(await out.at(-1).text()).toBe('file,exif,json\n"a.jpg","",""\n');
  });
});
