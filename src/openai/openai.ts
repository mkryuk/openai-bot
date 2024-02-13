import { Message } from "./message";
import axios from "axios";
import FormData from "form-data";

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
  chatCompletionsUrl: string = "https://api.openai.com/v1/chat/completions";
  generateImageUrl: string = "https://api.openai.com/v1/images/generations";
  variationsImageUrl: string = "https://api.openai.com/v1/images/variations";
  modelsListUel: string = "https://api.openai.com/v1/models";
  imageHistory = new Map<number, { prompt: string; imageUrl: string }>();

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

  getChatCompletions(message: string) {
    this.addMessage(message, "user");
    const headers = {
      Authorization: "Bearer " + this.token,
      "Content-Type": "application/json",
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

  draw(message: string) {
    const headers = {
      Authorization: "Bearer " + this.token,
      "Content-Type": "application/json",
    };
    const data = {
      model: "dall-e-3",
      prompt: message,
      n: 1, // Number of images to generate
      size: "1024x1024",
      style: "vivid",
      quality: "standard",
    };
    return axios.post(this.generateImageUrl, data, { headers });
  }

  async drawVariations(messageId: number) {
    if (!this.imageHistory.has(messageId)) {
      throw "No image history";
    }
    const { imageUrl } = this.imageHistory.get(messageId)!;
    // Download the image
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });
    // Prepare the form data with the image data
    const formData = new FormData();
    formData.append("image", response.data, "image.png");
    formData.append("n", 1);
    formData.append("size", "1024x1024");
    const headers = {
      Authorization: "Bearer " + this.token,
      ...formData.getHeaders(),
    };

    return axios.post(this.variationsImageUrl, formData, { headers });
  }

  getModelsList() {
    const headers = {
      Authorization: "Bearer " + this.token,
      "Content-Type": "application/json",
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

  addImageHistory(messageId: number, imageUrl: string, prompt: string) {
    // Check if the limit is reached
    while (this.imageHistory.size >= 100) {
      // Remove the oldest entry
      // Since Maps maintain insertion order, the first key is the oldest
      const oldestKey = this.imageHistory.keys().next().value;
      this.imageHistory.delete(oldestKey);
    }
    this.imageHistory.set(messageId, { imageUrl, prompt });
  }

  hasImageHistory(messageId: number): boolean {
    if (this.imageHistory.has(messageId)) {
      return true;
    }
    return false;
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
const reply_probability = parseFloat(process.env.REPLY_PROBABILITY ?? "10");
export const openAi = new OpenAi(
  openAi_token,
  max_tokens,
  temperature,
  model_name,
  reply_probability,
);
