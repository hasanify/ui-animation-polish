import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { auditPaths, auditSource, parseDurations } from "./audit-motion.mjs";

const checks = (source) => auditSource(source, "fixture.css").map((finding) => finding.check);
const has = (source, id) => checks(source).includes(id);

test("clean motion produces no findings", () => {
  const source = `
    .popover {
      transition: opacity 200ms cubic-bezier(0.23, 1, 0.32, 1),
                  transform 200ms cubic-bezier(0.23, 1, 0.32, 1);
      transform-origin: top right;
    }
    .btn:active { transform: scale(0.97); }
  `;
  assert.deepEqual(checks(source), []);
});

test("ease-in is flagged but ease-in-out is not", () => {
  assert.ok(has(".x { transition: opacity 200ms ease-in; }", "ease-in-entrance"));
  assert.ok(!has(".x { transition: transform 300ms ease-in-out; }", "ease-in-entrance"));
  assert.ok(has('<motion.div transition={{ duration: 0.2, ease: "easeIn" }} />', "ease-in-entrance"));
});

test("durations above 300ms are flagged, and seconds are converted", () => {
  assert.ok(has(".x { transition: opacity 600ms ease-out; }", "duration-long"));
  assert.ok(has("<motion.div transition={{ duration: 0.6 }} />", "duration-long"));
  assert.ok(!has("element.animate(frames, { duration: 300 });", "duration-long"));
  assert.ok(has("element.animate(frames, { duration: 1500 });", "duration-very-long"));
  assert.ok(!has(".x { transition: opacity 250ms ease-out; }", "duration-long"));
  assert.ok(!has(".pulse { animation: pop 350ms ease-out; }", "duration-long"));
  assert.deepEqual(parseDurations("transform 0.25s ease-out"), [250]);
});

test("page-level and token durations are allowed", () => {
  assert.ok(!has(".page { transition: opacity 500ms ease-out; }", "duration-long"));
  assert.ok(!has(":root { --dur-page: 500ms; }", "duration-long"));
  assert.ok(has(".x { transition: opacity 1500ms ease-out; }", "duration-very-long"));
});

test("staggers above 50ms are flagged", () => {
  assert.ok(has("const list = { show: { transition: { staggerChildren: 0.2 } } };", "stagger-long"));
  assert.ok(!has("const list = { show: { transition: { staggerChildren: 0.03 } } };", "stagger-long"));
});

test("scale(0) is flagged but scale(0.95) is not", () => {
  assert.ok(has(".x { transform: scale(0); }", "scale-zero"));
  assert.ok(has("<motion.div initial={{ scale: 0 }} />", "scale-zero"));
  assert.ok(!has("<motion.div initial={{ scale: 0.95 }} />", "scale-zero"));
});

test("anchored UI with a center origin is flagged", () => {
  assert.ok(has(".popover { transform-origin: center; }", "origin-center"));
  assert.ok(!has(".spinner { transform-origin: center; }", "origin-center"));
});

test("spring overshoot is flagged unless the moment is playful", () => {
  assert.ok(has("<motion.div transition={{ type: 'spring', bounce: 0.4 }} />", "spring-bounce"));
  assert.ok(!has("<motion.div transition={{ type: 'spring', bounce: 0 }} />", "spring-bounce"));
  assert.ok(!has("const confetti = { bounce: 0.5 };", "spring-bounce"));
});

test("wait mode, heavy blur and looping attention are flagged", () => {
  assert.ok(has('<AnimatePresence mode="wait">', "mode-wait"));
  assert.ok(has(".icon { filter: blur(10px); }", "blur-heavy"));
  assert.ok(!has(".icon { filter: blur(4px); }", "blur-heavy"));
  assert.ok(has(".badge { animation: nudge 1s eases infinite; }", "infinite-attention"));
  assert.ok(!has(".spinner { animation: spin 1s linear infinite; }", "infinite-attention"));
});

test("layout properties and transition: all are flagged", () => {
  assert.ok(has(".card { transition: width 200ms ease-out; }", "transition-layout"));
  assert.ok(has(".card { transition: all 200ms ease-out; }", "transition-all"));
  assert.ok(!has(".card { transition: opacity 200ms ease-out; }", "transition-layout"));
});

test("comments are ignored", () => {
  const source = `
    /* never use ease-in for entrances */
    // transition: opacity 600ms ease-in;
    .x { transition: opacity 200ms ease-out; }
  `;
  assert.deepEqual(checks(source), []);
});

test("disable directives suppress only what they cover", () => {
  const source = `
    /* audit-motion:disable-next-line */
    .bad { transition: opacity 600ms ease-in; }
    .worse { transform: scale(0); }
  `;
  assert.deepEqual(checks(source), ["scale-zero"]);

  const disabledFile = `
    /* audit-motion:disable-file */
    .bad { transition: opacity 600ms ease-in; }
  `;
  assert.deepEqual(checks(disabledFile), []);

  const toggled = `
    /* audit-motion:disable */
    .bad { transition: opacity 600ms ease-in; }
    /* audit-motion:enable */
    .worse { transform: scale(0); }
  `;
  assert.deepEqual(checks(toggled), ["scale-zero"]);
});

test("missing reduced-motion support is reported once per project", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "motion-audit-"));
  t.after(() => rm(directory, { recursive: true, force: true }));

  await writeFile(join(directory, "a.css"), ".x { transition: opacity 200ms ease-out; }");
  const withoutSupport = await auditPaths([directory]);
  assert.equal(withoutSupport.findings.filter((finding) => finding.check === "no-reduced-motion").length, 1);

  await writeFile(join(directory, "b.css"), "@media (prefers-reduced-motion: reduce) { * { transition-duration: 1ms; } }");
  const withSupport = await auditPaths([directory]);
  assert.equal(withSupport.findings.filter((finding) => finding.check === "no-reduced-motion").length, 0);
});

test("directories skip installed dependencies", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "motion-audit-"));
  t.after(() => rm(directory, { recursive: true, force: true }));

  await writeFile(join(directory, "good.css"), ".x { transition: opacity 200ms ease-out; }");
  const { mkdir } = await import("node:fs/promises");
  await mkdir(join(directory, "node_modules"));
  await writeFile(join(directory, "node_modules", "bad.css"), ".x { transform: scale(0); }");

  const result = await auditPaths([directory]);
  assert.equal(result.files, 1);
});
