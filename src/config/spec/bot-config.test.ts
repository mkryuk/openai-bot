import fs from "fs";
import os from "os";
import path from "path";
import { loadBotConfig } from "../bot-config";

describe("Bot config loader", () => {
  it("returns defaults when config file is missing", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bot-config-"));
    const configPath = path.join(tempDir, "missing.json");

    const config = loadBotConfig(configPath);

    expect(config.allowedUsers).toEqual([]);
    expect(config.allowedGroups).toEqual([]);
    expect(config.systemMessages).toEqual([]);
  });
});
