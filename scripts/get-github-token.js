import { getGithubToken } from "../src/github.js";
import fs from "fs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv))
  .option("app-id", {
    type: "string",
    describe: "GitHub App ID",
  })
  .option("installation-id", {
    type: "string",
    describe: "GitHub App Installation ID",
  })
  .option("private-key", {
    type: "string",
    describe: "Path to GitHub App private key file",
  })
  .help()
  .argv;

(async () => {
  try {
    const token = await getGithubToken(argv);
    console.log("GitHub Token:", token);
    process.exit(0);
  } catch (err) {
    console.error("Error getting GitHub token:", err);
    process.exit(1);
  }
})(); 