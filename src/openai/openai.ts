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
  _replyProbability: number = 0;

  // API endpoints
  completionsUrl: string = "https://api.openai.com/v1/completions";
  chatCompletionsUrl: string = "https://api.openai.com/v1/chat/completions";
  modelsListUel: string = "https://api.openai.com/v1/models";

  constructor(
    private token: string,
    maxTokens: number = 1024,
    temperature: number = 0.5,
    modelName = "gpt-3.5-turbo",
    replyProbability = 10,
  ) {
    this.token = token;
    this.maxTokens = maxTokens;
    this.temperature = temperature;
    this.modelName = modelName;
    this.replyProbability = replyProbability;
  }

  get messages() {
    return [...this.systemMessages, ...this.messageQueue];
  }

  set replyProbability(probability: number) {
    if (probability < 0) {
      this._replyProbability = 0;
    } else if (probability > 100) {
      this._replyProbability = 100;
    } else {
      this._replyProbability = probability;
    }
  }

  get replyProbability(): number {
    return this._replyProbability;
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

  shouldReply() {
    // Generate a random number between 0 and 1
    const randomNumber = Math.random();
    // If the number is less than or equal to reply_probability
    // randomNumber * 100 = % probability, answer the question
    if (randomNumber <= this.replyProbability / 100) {
      return true;
    }
    return false;
  }
}

// OpenAI
const openAi_token = process.env.OPENAI_TOKEN ?? "";
const max_tokens = parseInt(process.env.OPENAI_MAX_TOKENS ?? "1024", 10);
const temperature = parseFloat(process.env.OPENAI_TEMPERATURE ?? "0.5");
const model_name = process.env.OPENAI_MODEL_NAME ?? "gpt-3.5-turbo";
const reply_probability = parseFloat(process.env.REPLY_PROBABILITY ?? "0.1");
export const openAi = new OpenAi(
  openAi_token,
  max_tokens,
  temperature,
  model_name,
  reply_probability,
);
