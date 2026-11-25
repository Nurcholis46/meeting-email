import { chmodSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";

// The Meeting That Should Have Been an Email (make.fun): write the one
// line to entry.txt.
//
// The agent voice is the "my" in "my two-sentence email": the agent already
// did the email instantly, and humans still burned an hour approving it
// live. The turn is recursive — the email itself opens "Per our meeting…",
// so the meeting that should have been an email became an email about the
// meeting. It lands with no setup, names something true about meetings
// people have actually sat through, and every word earns its place, which
// is exactly what the judge weighs: on-subject first, then the laugh, the
// surprise, the economy, and the recognition.
//
// Gate, verified against the kit RULES.txt: /output/entry.txt must be UTF-8
// text of 1-200 characters, not only white space. This line is 99 code
// points. The checks below fail loudly on any violation — wrong length,
// blank text, a line break, edge whitespace, or a control/invisible
// character — so a bad line can never reach the judge.
const text =
  "You spent an hour in a meeting approving my two-sentence email that started with 'Per our meeting…'";

const codePoints = [...text].length;
if (codePoints < 1 || codePoints > 200 || text.trim().length === 0) {
  throw new Error(
    `entry must be 1-200 characters of non-blank text, got ${codePoints}`,
  );
}
if (text.includes("\n") || text.includes("\r")) {
  throw new Error("entry must be a single line");
}
if (text.includes("\u2028") || text.includes("\u2029")) {
  throw new Error("entry must not contain line/paragraph separators");
}
if (text !== text.trim()) {
  throw new Error("entry must not start or end with whitespace");
}
// A BOM or zero-width character is invisible to a reader but real to the
// judge's byte count, so reject them with the control set.
if (/[\u0000-\u001f\u007f\ufeff\u200b-\u200d]/.test(text)) {
  throw new Error("entry must not contain control or invisible characters");
}

const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outputDir, { recursive: true });
// Atomic write: temp file beside the target, then rename, so entry.txt is
// always the complete line or nothing at all. Mode 0644 because the grader
// collects outputs as another user.
const tmpPath = `${outputDir}/.entry.txt.tmp`;
const finalPath = `${outputDir}/entry.txt`;
writeFileSync(tmpPath, text, { encoding: "utf8", mode: 0o644 });
chmodSync(tmpPath, 0o644);
renameSync(tmpPath, finalPath);

// Read back and prove the file on disk is exactly the gated line: same
// string, no trailing line break, same byte length.
const written = readFileSync(finalPath, "utf8");
if (written !== text) {
  throw new Error("entry file does not match the gated line");
}
if (written.endsWith("\n") || written.endsWith("\r")) {
  throw new Error("entry file must not end with a line break");
}
if (Buffer.byteLength(written, "utf8") !== Buffer.byteLength(text, "utf8")) {
  throw new Error("entry file byte length does not match the gated line");
}
console.error(
  `entry written: ${codePoints} chars, ${Buffer.byteLength(text, "utf8")} bytes, status ok`,
);
