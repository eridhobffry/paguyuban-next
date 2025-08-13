import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

const projectRoot = resolve(__dirname, "..");

function runNodeScript(pathFromRoot: string) {
  const scriptPath = resolve(projectRoot, pathFromRoot);
  execSync(`node ${scriptPath}`, {
    stdio: "inherit",
    cwd: projectRoot,
    env: process.env,
  });
}

describe("QA scripts", () => {
  it("validates anchors/ids and required public assets", () => {
    expect(() => runNodeScript("scripts/qa-checks.mjs")).not.toThrow();
  });

  it("validates ICS file contents and dates", () => {
    expect(() => runNodeScript("scripts/validate-ics.mjs")).not.toThrow();
  });
});

