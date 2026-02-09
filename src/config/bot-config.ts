import fs from "fs";

export interface User {
  id: number;
  userName: string;
}

export interface Group {
  id: number;
  title: string;
}

export interface BotConfig {
  allowedUsers: User[];
  allowedGroups: Group[];
  systemMessages?: string[];
}

export function loadBotConfig(configPath: string): BotConfig {
  if (!fs.existsSync(configPath)) {
    return {
      allowedUsers: [],
      allowedGroups: [],
      systemMessages: [],
    };
  }

  const raw = JSON.parse(fs.readFileSync(configPath, "utf8"));
  return {
    allowedUsers: raw.allowedUsers || [],
    allowedGroups: raw.allowedGroups || [],
    systemMessages: raw.systemMessages || [],
  };
}
