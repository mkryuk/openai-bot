import fs from "fs";
const ADMIN_USER_ID = parseInt(process.env.ADMIN_USER_ID || "", 10);

interface User {
  id: number;
  userName: string;
}

interface Group {
  id: number;
  title: string;
}

class AccessManager {
  configPath = process.env.CONFIG_PATH || "config.json";
  allowedUsers: User[] = [];
  allowedUsersMap: Map<number, User> = new Map();
  allowedGroups: Group[] = [];
  allowedGroupsMap: Map<number, Group> = new Map();

  constructor() {
    this.loadConfig();
  }

  loadConfig() {
    if (fs.existsSync(this.configPath)) {
      const _config: { allowedUsers: User[]; allowedGroups: Group[] } =
        JSON.parse(fs.readFileSync(this.configPath, "utf8"));
      this.allowedUsers = _config.allowedUsers || [];
      this.allowedGroups = _config.allowedGroups || [];
      this.allowedUsersMap = new Map(
        this.allowedUsers.map((user) => [user.id, user]),
      );
      this.allowedGroupsMap = new Map(
        this.allowedGroups.map((group) => [group.id, group]),
      );
    } else {
      console.log(
        `Config file not found at ${this.configPath}, initializing with empty arrays.`,
      );
    }
  }

  // Access ADMIN_USER_ID from environment variables and convert it to a number

  isAdminUser(userId: number): boolean {
    return userId === ADMIN_USER_ID;
  }

  saveConfig() {
    fs.writeFileSync(
      this.configPath,
      JSON.stringify(
        { allowedUsers: this.allowedUsers, allowedGroups: this.allowedGroups },
        null,
        2,
      ),
    );
  }

  addUser(userId: number, userName: string) {
    if (!this.allowedUsersMap.has(userId)) {
      this.allowedUsers.push({ id: userId, userName });
      this.allowedUsersMap.set(userId, { id: userId, userName });
      this.saveConfig();
    }
  }

  deleteUser(userId: number) {
    this.allowedUsers = this.allowedUsers.filter((user) => user.id !== userId);
    this.allowedUsersMap.delete(userId);
    this.saveConfig();
  }

  addGroup(groupId: number, title: string) {
    if (!this.allowedGroupsMap.has(groupId)) {
      this.allowedGroups.push({ id: groupId, title });
      this.allowedGroupsMap.set(groupId, { id: groupId, title });
      this.saveConfig();
    }
  }

  deleteGroup(groupId: number) {
    this.allowedGroups = this.allowedGroups.filter(
      (group) => group.id !== groupId,
    );
    this.allowedGroupsMap.delete(groupId);
    this.saveConfig();
  }
}

export const accessManager = new AccessManager();
