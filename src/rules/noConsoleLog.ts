import type { FileChange, ReviewFinding } from "./types";

export function noConsoleLog(change: FileChange): ReviewFinding[] {
  if (!/console\.log/.test(change.diff)) return [];

  return [
    {
      filePath: change.filePath,
      severity: "warning",
      ruleId: "no-console-log",
      message: "console.log should not be committed to production code",
      suggestion: "Use a centralized logger or remove this log",
    },
  ];
}
