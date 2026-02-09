import fs from "fs";
import os from "os";
import path from "path";
import { OpenAi } from "../openai";
import { initializeSystemMessagesFromConfig } from "../system-message-init";

describe("System message initialization", () => {
  it("loads system messages from config and applies them", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "system-init-"));
    const configPath = path.join(tempDir, "config.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          allowedUsers: [],
          allowedGroups: [],
          systemMessages: ["First", "Second"],
        },
        null,
        2,
      ),
    );

    const openAi = new OpenAi("token");
    initializeSystemMessagesFromConfig(configPath, openAi);

    expect(openAi["systemMessages"]).toEqual([
      { role: "system", content: "First" },
      { role: "system", content: "Second" },
    ]);
  });
});
