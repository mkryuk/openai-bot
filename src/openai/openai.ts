import { Message } from "./message";
import axios from "axios";

export class OpenAi {
  // Keep track of the last message_depth messages in the chat
  messageDepth = 10;
  systemMessages: Message[] = [];
  messageQueue: Message[] = [];
  maxTokens: number;
  temperature: number;
  modelName: string;

  // API endpoints
  completionsUrl: string = "https://api.openai.com/v1/completions";
  chatCompletionsUrl: string = "https://api.openai.com/v1/chat/completions";
  modelsListUel: string = "https://api.openai.com/v1/models";

  constructor(
    private token: string,
    maxTokens: number = 1024,
    temperature: number = 0.5,
    modelName = "gpt-3.5-turbo",
  ) {
    this.token = token;
    this.maxTokens = maxTokens;
    this.temperature = temperature;
    this.modelName = modelName;
  }

  get messages() {
    return [...this.systemMessages, ...this.messageQueue];
  }

  getTextCompletions(prompt: string) {
    const headers = {
      "Content-Type": "application/json",
      Authorization: "Bearer " + this.token,
    };
    const body = {
      model: this.modelName,
      prompt: prompt,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
    };
    return axios.post(this.completionsUrl, body, {
      headers: headers,
    });
  }

  getChatCompletions(message: string) {
    this.addMessage(message, "user");
    const headers = {
      "Content-Type": "application/json",
      Authorization: "Bearer " + this.token,
    };
    const body = {
      model: this.modelName,
      messages: this.messages,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
    };
    return axios.post(this.chatCompletionsUrl, body, {
      headers: headers,
    });
  }

  getModelsList() {
    const headers = {
      "Content-Type": "application/json",
      Authorization: "Bearer " + this.token,
    };
    return axios.get(this.modelsListUel, {
      headers: headers,
    });
  }

  addMessage(content: string, role: "user" | "assistant") {
    const message = {
      role: role,
      content: content,
    };
    this.messageQueue.push(message);
    while (this.messageQueue.length > this.messageDepth) {
      this.messageQueue.shift();
    }
  }

  setSystemMessage(message: string) {
    this.systemMessages = [{ role: "system", content: message }];
  }

  addSystemMessage(message: string) {
    this.systemMessages.push({ role: "system", content: message });
  }

  resetMessageQueue() {
    this.messageQueue = [];
  }
}
