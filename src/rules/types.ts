export type Severity = "info" | "warning" | "error";

export interface ReviewFinding {
  filePath: string;
  line?: number;
  severity: Severity;
  ruleId: string;
  message: string;
  suggestion: string;
}

export interface FileChange {
  filePath: string;
  diff: string;
  isNewFile?: boolean;
  isDeleted?: boolean;
}
