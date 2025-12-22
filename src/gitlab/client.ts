import axios, { type AxiosInstance } from "axios";

const GITLAB_TOKEN = process.env.GITLAB_TOKEN;
const GITLAB_HOST = process.env.GITLAB_HOST || "https://gitlab.com";

if (!GITLAB_TOKEN) {
  console.error("❌ GITLAB_TOKEN is required");
  process.exit(1);
}

export const gitlabApi: AxiosInstance = axios.create({
  baseURL: `${GITLAB_HOST}/api/v4`,
  headers: {
    "PRIVATE-TOKEN": GITLAB_TOKEN,
  },
});
