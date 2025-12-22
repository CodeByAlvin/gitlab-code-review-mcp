export interface ParsedMrUrl {
  projectPath: string;
  mrIid: string;
}

export function parseMrUrl(url: string): ParsedMrUrl {
  const regex = /^(?:https?:\/\/[^/]+\/)(.+)\/-\/merge_requests\/(\d+)/;
  const match = url.match(regex);

  if (!match) {
    throw new Error("Invalid GitLab Merge Request URL");
  }

  return {
    projectPath: match[1],
    mrIid: match[2],
  };
}
