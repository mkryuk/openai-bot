import { OpenAi } from "../openai";

describe("OpenAi System Messages", () => {
  let openAi: OpenAi;

  beforeEach(() => {
    openAi = new OpenAi("defaultToken");
  });

  it("should correctly add a system message", () => {
    const initialSystemMessagesLength = openAi["systemMessages"].length;
    openAi.addSystemMessage("System test message");
    expect(openAi["systemMessages"].length).toBe(
      initialSystemMessagesLength + 1,
    );
  });

  it("should set and add system messages correctly", () => {
    openAi.setSystemMessages(["Initial system message"]);
    expect(openAi["systemMessages"].length).toBe(1);
    openAi.addSystemMessage("Additional system message");
    expect(openAi["systemMessages"].length).toBe(2);
  });

  it("should handle adding a duplicate system message", () => {
    openAi.addSystemMessage("Duplicate message");
    const initialLength = openAi["systemMessages"].length;
    openAi.addSystemMessage("Duplicate message");
    expect(openAi["systemMessages"].length).toBe(initialLength + 1);
  });

  it("should set system messages from a list", () => {
    const messages = ["First message", "Second message"];
    openAi.setSystemMessages(messages);
    expect(openAi["systemMessages"]).toEqual([
      { role: "system", content: "First message" },
      { role: "system", content: "Second message" },
    ]);
  });
});
