import { it, expect } from "vitest";
import { boot, add, jpeg, file } from "./setup.js";

it("lists every skipped file instead of only the last one", async () => {
  const { $ } = await boot();
  const many = Array.from({ length: 42 }, (_, i) => file(`p${i}.jpg`, jpeg()));
  await add([file("notes.txt", "hi", "text/plain"), file("bad.json", "{", "application/json"), ...many]);
  const msg = $("error").textContent;
  expect(msg).toContain("notes.txt");
  expect(msg).toContain("bad.json");
  expect(msg).toMatch(/2 .*over the 40/);
  expect($("c-media").textContent).toBe("40");
});

it("announces status and errors and scopes table headers", async () => {
  const { $ } = await boot();
  expect($("status").getAttribute("role")).toBe("status");
  expect($("error").getAttribute("role")).toBe("alert");
  await add([file("a.jpg", jpeg())]);
  expect([...document.querySelectorAll("#table th")].every((th) => th.getAttribute("scope") === "col")).toBe(true);
  expect(document.querySelectorAll("#table th")[3].textContent.trim()).not.toBe("");
});
