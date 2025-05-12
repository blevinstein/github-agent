import { createAppAuth } from "@octokit/auth-app";
import fs from "fs";

export async function getGithubToken({ appId, installationId, privateKey } = {}) {
  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }
  // Use provided args or fallback to env vars
  appId = appId || process.env.GITHUB_APP_ID;
  installationId = installationId || process.env.GITHUB_APP_INSTALLATION_ID;
  privateKey = fs.readFileSync(privateKey || process.env.GITHUB_APP_PRIVATE_KEY, 'utf8');
  if (appId && installationId && privateKey) {
    const auth = createAppAuth({
      appId,
      privateKey,
      installationId,
    });
    const { token } = await auth({ type: "installation" });
    return token;
  }
  throw new Error("No GitHub authentication available. Set GITHUB_TOKEN or GitHub App credentials.");
}