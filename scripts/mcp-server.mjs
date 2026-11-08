#!/usr/bin/env node
/**
 * Model Context Protocol (MCP) server for ui-animation-polish.
 * Exposes motion auditing, duration/easing presets, and animation rule explanations over stdio.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { auditPaths, auditSource, CHECKS } from "./audit-motion.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");
const VERSION = "1.1.0";

const RULES_TABLE = {
  1: { name: "Ease-out for entrances", before: "ease-in or linear", after: "cubic-bezier(0.23, 1, 0.32, 1)", why: "Entrances should start fast while user is actively waiting, decelerating into resting position." },
  2: { name: "Popovers at 150–250ms", before: "300–400ms", after: "150–250ms", why: "Repeated UI over 300ms reads as lag. 150-250ms feels instantaneous without popping." },
  3: { name: "Stagger list rows ~30ms", before: "100ms per row", after: "30ms per row (0.03s), cap at 8-10 rows", why: "Large staggers make lists feel like a slow falling curtain." },
  4: { name: "Scale to 0.97 on press", before: "No feedback or scale(0.85)", after: "whileTap: { scale: 0.97 }", why: "Gives tactile haptic feel of mechanical click without visual distortion." },
  5: { name: "Stretch moving knobs ~12%", before: "Rigid circle thumb", after: "scaleX(1.12) along movement axis", why: "Preserves fluid physical inertia during rapid state toggles." },
  6: { name: "Stagger as details settle", before: "All sub-details appear together", after: "Header first, body +15ms, actions +30ms", why: "Directs eye flow progressively from primary anchor to secondary info." },
  7: { name: "Arcs for object movement", before: "Diagonal straight line", after: "Curved arc path with offset bezier control point", why: "Natural human arm movements and physical objects travel in curved arcs, not diagonals." },
  8: { name: "Pulse to confirm success", before: "Static checkmark or jarring shake", after: "Single gentle scale(1.04) pulse + green color transition", why: "Confirms positive state change without startling the user." },
  9: { name: "Ease-in-out for moves", before: "linear or ease-out for traveling widgets", after: "cubic-bezier(0.77, 0, 0.175, 1)", why: "Objects already visible moving between two on-screen slots need acceleration and deceleration." },
  10: { name: "Start popovers at 0.95", before: "scale(0) or scale(0.5)", after: "scale(0.95) with opacity 0 -> 1", why: "Elements should emerge from realistic physical depth, not pop out of an atomic pinhole." },
  11: { name: "Enter from the trigger", before: "transform-origin: center", after: "transform-origin matching trigger attachment corner", why: "Anchored UI scaling from center looks detached and floaty." },
  12: { name: "Exit toward the trigger", before: "Exit straight down or fade out randomly", after: "Exit scale(0.95) collapsing back toward trigger", why: "Reinforces object permanence and where the element came from." },
  13: { name: "No bounce on everyday UI", before: "bouncy spring { bounce: 0.4 }", after: "Critically damped spring { stiffness: 400, damping: 40, bounce: 0 }", why: "Elastic overshoot draws unwanted attention on utilities and productivity apps." },
  14: { name: "Don't tween while held", before: "transition: transform 200ms during pointer drag", after: "Direct 1:1 hardware pointer coordinate tracking", why: "Artificial interpolation during direct user touch/drag feels laggy and unresponsive." },
  15: { name: "Exits ~20% shorter", before: "250ms in / 250ms out", after: "250ms in / 200ms out", why: "User is waiting for entry; user has already dismissed exit and wants to move on." },
  16: { name: "Overlap old and new states", before: "mode='wait' (empty black gap)", after: "Crossfade overlay with overlapping timeline", why: "Never leave an empty, blank or jarring white frame between state switches." },
  17: { name: "Masks for reveals and colour", before: "Clunky width expansion", after: "clip-path / CSS mask reveal", why: "Runs cleanly on compositor thread without triggering layout reflow." },
  18: { name: "Crossfade icons with scale + blur", before: "Abrupt icon snap or 360 deg rotation", after: "scale(0.7) + blur(4px) crossfade in 150ms", why: "Smooth seamless transition between state icons (e.g. sun to moon, copy to check)." },
  19: { name: "Rubber band past bounds", before: "Hard abrasive brick wall stop", after: "Logarithmic resistance formula past bounds", why: "Informs user of boundary limit with tactile elastic deceleration." },
  20: { name: "Reuse the same layoutId", before: "Disjointed remove-then-recreate elements", after: "Framer Motion layoutId='active-pill'", why: "Allows seamless continuous geometric morphing between shared states." },
};

const server = new McpServer({
  name: "ui-animation-polish",
  version: VERSION,
  description: "UI animation guidelines, motion presets, and static motion anti-pattern auditor",
});

// Tool 1: audit_motion
server.tool(
  "audit_motion",
  "Audit source code or files for UI animation anti-patterns (e.g. slow entrances, ease-in, spring overshoot, excessive staggers, missing reduced-motion).",
  {
    path: z.string().optional().describe("Relative or absolute path to a file or folder to audit (defaults to current directory if code is omitted)."),
    code: z.string().optional().describe("Direct source code snippet to audit instead of a file."),
    filename: z.string().optional().describe("Filename hint when providing direct code (e.g. 'Button.tsx', 'styles.css')."),
  },
  async ({ path: targetPath, code, filename }) => {
    try {
      if (code) {
        const findings = auditSource(code, filename || "<snippet>");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                scanned: 1,
                findingsCount: findings.length,
                findings,
                summary: findings.length === 0 ? "No motion anti-patterns found." : `Found ${findings.length} motion anti-pattern(s).`,
              }, null, 2),
            },
          ],
        };
      }

      const paths = [targetPath || "."];
      const result = await auditPaths(paths);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              scanned: result.scanned,
              files: result.files,
              findingsCount: result.findings.length,
              findings: result.findings,
              summary: result.findings.length === 0 ? "No motion anti-patterns found." : `Found ${result.findings.length} motion anti-pattern(s).`,
            }, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Motion audit failed: ${err.message}` }],
      };
    }
  }
);

// Tool 2: get_motion_preset
server.tool(
  "get_motion_preset",
  "Get copy-ready, production-grade motion tokens, easing curves, and presets for UI components.",
  {
    component: z.enum([
      "popover", "modal", "toast", "list", "press", "switch", "tabIndicator", "iconSwap", "rubberBand", "tokens"
    ]).describe("The UI component or pattern needed."),
    framework: z.enum(["framer-motion", "css", "tailwind"]).default("framer-motion").describe("Target UI styling framework."),
  },
  async ({ component, framework }) => {
    try {
      if (component === "tokens" || framework === "css") {
        const tokensCss = await readFile(join(ROOT_DIR, "assets", "motion-tokens.css"), "utf8");
        return {
          content: [{ type: "text", text: tokensCss }],
        };
      }

      const presetsTs = await readFile(join(ROOT_DIR, "assets", "motion-presets.ts"), "utf8");
      return {
        content: [
          {
            type: "text",
            text: `// Framer Motion / Motion Preset for ${component}\n// Reference from assets/motion-presets.ts\n\n${presetsTs}`,
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Failed to load presets: ${err.message}` }],
      };
    }
  }
);

// Tool 3: explain_rule
server.tool(
  "explain_rule",
  "Get the full reasoning, physical principles, and before/after fixes for any of the 20 UI animation rules.",
  {
    ruleNumber: z.number().min(1).max(20).describe("The rule number to explain (1 to 20)."),
  },
  async ({ ruleNumber }) => {
    const rule = RULES_TABLE[ruleNumber];
    if (!rule) {
      return {
        isError: true,
        content: [{ type: "text", text: `Rule #${ruleNumber} not found. Must be between 1 and 20.` }],
      };
    }

    const check = CHECKS.find((c) => c.rule === String(ruleNumber));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            rule: ruleNumber,
            name: rule.name,
            before: rule.before,
            after: rule.after,
            why: rule.why,
            auditorCheck: check ? { id: check.id, severity: check.severity, message: check.message, fix: check.fix } : null,
          }, null, 2),
        },
      ],
    };
  }
);

// Resource 1: CSS tokens
server.resource("motion-tokens", "motion://tokens/css", async (uri) => {
  const content = await readFile(join(ROOT_DIR, "assets", "motion-tokens.css"), "utf8");
  return {
    contents: [{ uri: uri.href, mimeType: "text/css", text: content }],
  };
});

// Resource 2: Motion presets
server.resource("motion-presets", "motion://presets/framer-motion", async (uri) => {
  const content = await readFile(join(ROOT_DIR, "assets", "motion-presets.ts"), "utf8");
  return {
    contents: [{ uri: uri.href, mimeType: "text/typescript", text: content }],
  };
});

// Resource 3: Rules Summary
server.resource("motion-rules", "motion://rules/all", async (uri) => {
  return {
    contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(RULES_TABLE, null, 2) }],
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`Fatal error starting MCP server: ${err?.stack || err}\n`);
  process.exit(1);
});

