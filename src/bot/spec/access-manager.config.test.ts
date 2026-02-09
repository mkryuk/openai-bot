import fs from "fs";
import os from "os";
import path from "path";

describe("AccessManager config persistence", () => {
  it("preserves systemMessages when saving config", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "access-config-"));
    const configPath = path.join(tempDir, "config.json");
    const initialConfig = {
      allowedUsers: [],
      allowedGroups: [],
      systemMessages: ["Initial system message"],
    };
    fs.writeFileSync(configPath, JSON.stringify(initialConfig, null, 2));

    process.env.CONFIG_PATH = configPath;
    jest.resetModules();
    const { accessManager } = await import("../access-manager");

    accessManager.addUser(1, "TestUser");

    const saved = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(saved.systemMessages).toEqual(["Initial system message"]);
  });
});
