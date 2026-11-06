#!/usr/bin/env node
/**
 * Static motion auditor for the ui-animation-polish skill.
 *
 * Usage:
 *   node scripts/audit-motion.mjs [paths...] [--json] [--fail-on error|warn|note|none]
 *
 * Zero dependencies. Node 18+.
 *
 * Suppress intentional violations:
 *   /* audit-motion:disable-next-line *\/
 *   /* audit-motion:disable *\/ ... /* audit-motion:enable *\/
 *   /* audit-motion:disable-file *\/
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const VERSION = "1.1.0";

const CODE_EXTENSIONS = new Set([
  ".css", ".scss", ".sass", ".less",
  ".tsx", ".jsx", ".ts", ".js", ".mjs", ".cjs",
  ".vue", ".svelte", ".html", ".astro",
]);

const IGNORED_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "out", "coverage",
  ".next", ".nuxt", ".svelte-kit", ".turbo", ".vercel", "vendor",
]);

const SEVERITY_RANK = { note: 1, warn: 2, error: 3 };

/** Parse a duration on a line into milliseconds. CSS defaults to ms; unitless is Motion seconds. */
export function parseDurations(line) {
  const durations = [];
  for (const match of line.matchAll(/(\d*\.?\d+)(ms|s)\b/g)) {
    durations.push(match[2] === "s" ? Number(match[1]) * 1000 : Number(match[1]));
  }
  if (durations.length === 0) {
    const motion = line.match(/\bduration\s*:\s*(\d*\.?\d+)\s*(?=[,;}])/);
    if (motion) {
      const value = Number(motion[1]);
      // Unitless is seconds in Motion but milliseconds in WAAPI; small values are seconds.
      durations.push(value <= 10 ? value * 1000 : value);
    }
  }
  return durations;
}

const LOOPING_OK = /spin|rotate|shimmer|marquee|pulse|skeleton|progress|caret|blink/i;
const LONG_UI_OK = /page|route|screen|onboarding|splash|hero|transition-name|view-transition/i;
const PLAYFUL_OK = /confetti|celebrat|playful|onboarding|party|achievement/i;
const ATTENTION_OK = /pulse|success|celebrat|confetti|attention|wiggle/i;

/**
 * Each check runs per line. `test` returns true when the line violates the rule.
 * Keep messages short: they are printed next to the source location.
 */
export const CHECKS = [
  {
    id: "ease-in-entrance",
    rule: "1",
    severity: "warn",
    test: (line) =>
      /(?<![\w-])ease-in(?![\w-])/.test(line) ||
      /ease\s*:\s*["']easeIn["']/.test(line),
    message: "ease-in entrance starts slow, exactly when the user is waiting.",
    fix: "Use ease-out, preferably cubic-bezier(0.23, 1, 0.32, 1).",
  },
  {
    id: "duration-long",
    rule: "2",
    severity: "warn",
    test: (line) => {
      if (!/transition|animation|duration/.test(line)) return false;
      if (/--[\w-]+\s*:/.test(line)) return false; // token definitions may be long
      if (LONG_UI_OK.test(line) || ATTENTION_OK.test(line)) return false;
      return parseDurations(line).some((ms) => ms > 300 && ms <= 1000);
    },
    message: "Repeated UI over 300ms reads as lag.",
    fix: "150–250ms for menus, popovers and toasts; 300ms is the ceiling for everyday motion.",
  },
  {
    id: "duration-very-long",
    rule: "2",
    severity: "note",
    test: (line) => {
      if (!/transition|animation|duration/.test(line)) return false;
      if (/--[\w-]+\s*:/.test(line)) return false;
      if (ATTENTION_OK.test(line)) return false;
      return parseDurations(line).some((ms) => ms > 1000);
    },
    message: "Over one second is a scene change, not a UI interaction.",
    fix: "Reserve 400–700ms for full-screen or page transitions, and only when the user is not waiting.",
  },
  {
    id: "stagger-long",
    rule: "3",
    severity: "warn",
    test: (line) => {
      const match = line.match(/(?:staggerChildren|stagger|delayChildren)\s*:\s*([\d.]+)/);
      return match ? Number(match[1]) > 0.05 : false;
    },
    message: "A stagger above 50ms turns a list into a slow wave.",
    fix: "Use 0.03s between rows and cap the staggered set at 8–10 items.",
  },
  {
    id: "scale-zero",
    rule: "10",
    severity: "warn",
    test: (line) =>
      /(?:^|[^\w-])(?:scale|scaleX|scaleY)\s*\(\s*0(?:\.0+)?\s*\)/.test(line) ||
      /(?:^|[^\w-])(?:scale|scaleX|scaleY)\s*:\s*0(?:\.0+)?\s*(?:[,}])/.test(line),
    message: "Nothing appears from zero size; it reads as a gimmick.",
    fix: "Start at scale(0.95) with opacity, and scale from the trigger origin.",
  },
  {
    id: "origin-center",
    rule: "11",
    severity: "note",
    scope: "file",
    test: (text) =>
      /transform-origin\s*:\s*center/.test(text) &&
      /(?:class|className|id)\s*=\s*["'][^"']*(?:popover|dropdown|tooltip|combobox|menu)[^"']*["']|\.(?:popover|dropdown|tooltip|combobox|menu)\b/.test(text),
    message: "Anchored UI scaling from its own centre looks detached from the trigger.",
    fix: "Set transform-origin to the corner nearest the trigger (Radix exposes --radix-popover-content-transform-origin).",
  },
  {
    id: "spring-bounce",
    rule: "13",
    severity: "warn",
    test: (line) => {
      if (PLAYFUL_OK.test(line)) return false;
      const match = line.match(/\bbounce\s*:\s*(0?\.\d+|[1-9]\d*)/);
      return match ? Number(match[1]) > 0 : false;
    },
    message: "Overshoot on everyday UI draws attention to the animation.",
    fix: "Use bounce: 0 or { type: 'spring', stiffness: 400, damping: 40 }.",
  },
  {
    id: "mode-wait",
    rule: "16",
    severity: "warn",
    test: (line) => /mode\s*=\s*["']wait["']/.test(line),
    message: "mode=\"wait\" leaves an empty frame between old and new content.",
    fix: "Overlap enter and exit (default sync mode or popLayout) and absolutely position the swap.",
  },
  {
    id: "blur-heavy",
    rule: "18",
    severity: "warn",
    test: (line) => {
      const match = line.match(/blur\(\s*(\d+(?:\.\d+)?)px\s*\)/);
      return match ? Number(match[1]) > 6 : false;
    },
    message: "Heavy blur is expensive and smears large surfaces.",
    fix: "Keep icon-swap blur at 4–6px, and never blur long text.",
  },
  {
    id: "transition-layout",
    rule: "perf",
    severity: "warn",
    test: (line) =>
      /(?:transition|animation)\s*:[^;{}]*\b(?:width|height|top|left|right|bottom|margin|padding)\b/.test(line),
    message: "Animating layout properties forces layout on every frame.",
    fix: "Animate transform and opacity; use FLIP or a shared layout animation for size changes.",
  },
  {
    id: "transition-all",
    rule: "perf",
    severity: "warn",
    test: (line) => /transition(?:-property)?\s*:\s*all\b/.test(line),
    message: "transition: all animates properties you did not intend to animate.",
    fix: "List the properties explicitly (typically opacity, transform, color).",
  },
  {
    id: "infinite-attention",
    rule: "8",
    severity: "note",
    test: (line) => {
      if (LOOPING_OK.test(line)) return false;
      return /animation\s*:[^;]*\binfinite\b/.test(line);
    },
    message: "A looping animation reads as 'still loading' and demands attention.",
    fix: "Pulse once for confirmations; reserve loops for indeterminate progress.",
  },
];

const SEVERITY_ORDER = { error: 0, warn: 1, note: 2 };

function findMatches(text, check) {
  if (check.scope === "file") {
    return check.test(text)
      ? [{ line: 1, column: 1, snippet: "" }]
      : [];
  }

  const hits = [];
  const lines = text.split(/\r?\n/);
  let inBlockComment = false;
  let disabled = false;
  let disableNextLine = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    const directive = line.match(/audit-motion:\s*([\w-]+)/);
    if (directive) {
      if (directive[1] === "disable-file") return [];
      if (directive[1] === "disable") disabled = true;
      if (directive[1] === "enable") disabled = false;
      if (directive[1] === "disable-next-line") disableNextLine = true;
      continue;
    }

    if (inBlockComment) {
      if (line.includes("*/") || line.includes("-->")) inBlockComment = false;
      continue;
    }
    if (trimmed.startsWith("/*") || trimmed.startsWith("{/*") || trimmed.startsWith("<!--")) {
      if (!line.includes("*/") && !line.includes("-->")) inBlockComment = true;
      continue;
    }
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

    const skip = disabled || disableNextLine;
    disableNextLine = false;
    if (skip) continue;

    if (!check.test(line)) continue;
    hits.push({
      line: index + 1,
      column: 1,
      snippet: trimmed.length > 120 ? `${trimmed.slice(0, 117)}…` : trimmed,
    });
  }
  return hits;
}

/** Audit one source string. Returns findings without project-level checks. */
export function auditSource(source, file = "<input>") {
  const findings = [];
  for (const check of CHECKS) {
    for (const hit of findMatches(source, check)) {
      findings.push({
        file,
        line: hit.line,
        column: hit.column,
        snippet: hit.snippet,
        rule: check.rule,
        check: check.id,
        severity: check.severity,
        message: check.message,
        fix: check.fix,
      });
    }
  }
  return findings.sort(
    (a, b) =>
      a.line - b.line ||
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      a.check.localeCompare(b.check),
  );
}

async function collectFiles(targets) {
  const files = [];
  const missing = [];

  async function walk(path) {
    const entries = await readdir(path, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) await walk(join(path, entry.name));
        continue;
      }
      if (!entry.isFile()) continue;
      if (!CODE_EXTENSIONS.has(extname(entry.name))) continue;
      if (entry.name.includes(".min.")) continue;
      files.push(join(path, entry.name));
    }
  }

  for (const target of targets) {
    const absolute = resolve(target);
    const info = await stat(absolute).catch(() => null);
    if (!info) {
      missing.push(target);
      continue;
    }
    if (info.isFile()) {
      if (CODE_EXTENSIONS.has(extname(absolute))) files.push(absolute);
      continue;
    }
    await walk(absolute);
  }

  return { files: [...new Set(files)].sort(), missing };
}

/** Audit a set of files or directories. Adds the project-level reduced-motion check. */
export async function auditPaths(targets) {
  const { files, missing } = await collectFiles(targets);
  const findings = [];
  let sawMotion = false;
  let sawReducedMotion = false;
  let scanned = 0;

  for (const file of files) {
    let source;
    try {
      source = await readFile(file, "utf8");
    } catch {
      continue;
    }
    if (source.length > 2_000_000) continue;
    scanned += 1;

    const display = relative(process.cwd(), file).replaceAll("\\", "/") || file;
    const fileFindings = auditSource(source, display);
    findings.push(...fileFindings);

    if (/transition|animation|@keyframes|whileTap|whileHover|layoutId|AnimatePresence/.test(source)) {
      sawMotion = true;
    }
    if (/prefers-reduced-motion|useReducedMotion/.test(source)) {
      sawReducedMotion = true;
    }
  }

  if (sawMotion && !sawReducedMotion) {
    findings.push({
      file: "(project)",
      line: 1,
      column: 1,
      snippet: "",
      rule: "a11y",
      check: "no-reduced-motion",
      severity: "warn",
      message: "Motion is present but nothing honours prefers-reduced-motion.",
      fix: "Add the media query for CSS and useReducedMotion() for Motion; keep opacity, drop travel and scale.",
    });
  }

  findings.sort(
    (a, b) =>
      a.file.localeCompare(b.file) ||
      a.line - b.line ||
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      a.check.localeCompare(b.check),
  );

  return { scanned, files: files.length, missing, findings };
}

const COLORS = {
  error: "\u001b[31m",
  warn: "\u001b[33m",
  note: "\u001b[36m",
  dim: "\u001b[2m",
  bold: "\u001b[1m",
  reset: "\u001b[0m",
};

function paint(text, color, enabled) {
  return enabled ? `${COLORS[color]}${text}${COLORS.reset}` : text;
}

function formatHuman(result) {
  const color = process.stdout.isTTY;
  const { findings } = result;
  const counts = { error: 0, warn: 0, note: 0 };
  for (const finding of findings) counts[finding.severity] += 1;

  const lines = [];
  lines.push(
    `${paint("ui-animation-polish", "bold", color)} · ${result.scanned} file${result.scanned === 1 ? "" : "s"} scanned · ${findings.length} finding${findings.length === 1 ? "" : "s"}`,
  );
  lines.push("");

  let currentFile = null;
  for (const finding of findings) {
    if (finding.file !== currentFile) {
      if (currentFile !== null) lines.push("");
      currentFile = finding.file;
      lines.push(paint(currentFile, "bold", color));
    }
    const location = finding.line === 1 && finding.column === 1 && finding.file === "(project)"
      ? "project"
      : `${finding.line}:${finding.column}`;
    const severity = paint(finding.severity.padEnd(5), finding.severity, color);
    lines.push(`  ${location.padEnd(8)} ${severity} ${paint(`rule ${finding.rule}`, "dim", color)}  ${finding.message}`);
    if (finding.snippet) lines.push(`  ${" ".repeat(8)} ${paint(finding.snippet, "dim", color)}`);
    lines.push(`  ${" ".repeat(8)} ${paint(`fix: ${finding.fix}`, "dim", color)}`);
  }

  if (findings.length > 0) lines.push("");
  const summary = [
    `${counts.error} error${counts.error === 1 ? "" : "s"}`,
    `${counts.warn} warning${counts.warn === 1 ? "" : "s"}`,
    `${counts.note} note${counts.note === 1 ? "" : "s"}`,
  ].join(", ");
  lines.push(findings.length === 0 ? "No motion anti-patterns found." : summary);
  return lines.join("\n");
}

function usage() {
  return `ui-animation-polish audit ${VERSION}

Audit CSS, JSX, TSX, Vue, Svelte and HTML for motion anti-patterns.

Usage:
  node scripts/audit-motion.mjs [paths...] [options]

Options:
  --json                 Machine-readable output
  --fail-on <severity>   Exit 1 on error (default), warn, note, or none
  -h, --help             Show this help
  -v, --version          Print the version

Directives:
  /* audit-motion:disable-next-line */
  /* audit-motion:disable */ ... /* audit-motion:enable */
  /* audit-motion:disable-file */

Examples:
  node scripts/audit-motion.mjs src
  node scripts/audit-motion.mjs src --fail-on warn
  node scripts/audit-motion.mjs src --json > motion-report.json
`;
}

async function main(argv) {
  const paths = [];
  let json = false;
  let failOn = "error";

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") json = true;
    else if (arg === "--fail-on") failOn = argv[++index];
    else if (arg.startsWith("--fail-on=")) failOn = arg.slice("--fail-on=".length);
    else if (arg === "-h" || arg === "--help") {
      process.stdout.write(usage());
      return 0;
    } else if (arg === "-v" || arg === "--version") {
      process.stdout.write(`${VERSION}\n`);
      return 0;
    } else if (arg.startsWith("-")) {
      process.stderr.write(`Unknown option: ${arg}\n\n${usage()}`);
      return 2;
    } else paths.push(arg);
  }

  if (!["error", "warn", "note", "none"].includes(failOn)) {
    process.stderr.write(`Invalid --fail-on value: ${failOn}. Use error, warn, note, or none.\n`);
    return 2;
  }

  const result = await auditPaths(paths.length ? paths : ["."]);

  if (result.missing.length > 0) {
    process.stderr.write(`Not found: ${result.missing.join(", ")}\n`);
  }
  if (result.scanned === 0) {
    process.stderr.write("No auditable files found. Pass a directory or a supported file extension.\n");
    return 2;
  }

  if (json) {
    const counts = { error: 0, warn: 0, note: 0 };
    for (const finding of result.findings) counts[finding.severity] += 1;
    process.stdout.write(`${JSON.stringify({ version: VERSION, ...result, counts }, null, 2)}\n`);
  } else {
    process.stdout.write(`${formatHuman(result)}\n`);
  }

  if (failOn === "none") return 0;
  const threshold = SEVERITY_RANK[failOn];
  return result.findings.some((finding) => SEVERITY_RANK[finding.severity] >= threshold) ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
