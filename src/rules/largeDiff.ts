import type { FileChange, ReviewFinding } from "./types";

const MAX_DIFF_LENGTH = 3000;

export function largeDiff(change: FileChange): ReviewFinding[] {
  if (change.diff.length < MAX_DIFF_LENGTH) return [];

  return [
    {
      filePath: change.filePath,
      severity: "info",
      ruleId: "large-diff",
      message: "This file has a large diff which may reduce review quality",
      suggestion: "Consider splitting this change into smaller commits",
    },
  ];
}
