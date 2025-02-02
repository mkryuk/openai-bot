import { Message } from "./message";
import axios, { AxiosInstance } from "axios";
import FormData from "form-data";
import { tools } from "./tools";
import { getDateTime } from "../services/date-time";
import {
  getWeather,
  getWeatherForecast,
  getHistoricalWeather,
} from "../services/weather";

export class OpenAi {
  private httpClient: AxiosInstance = axios.create();
  private _messageDepth: number = 10;
  private systemMessages: Message[] = [];
  private messageQueue: Message[] = [];
  private _replyProbability: number = 0;

  public readonly chatCompletionsUrl: string =
    "https://api.openai.com/v1/chat/completions";

  private readonly generateImageUrl: string =
    "https://api.openai.com/v1/images/generations";
  private readonly variationsImageUrl: string =
    "https://api.openai.com/v1/images/variations";
  private readonly modelsListUrl: string = "https://api.openai.com/v1/models";
  private readonly imageHistory = new Map<
    number,
    { prompt: string; imageUrl: string }
  >();

  private readonly tools = tools;

  constructor(
    private token: string,
    public maxTokens: number = 1024,
    public temperature: number = 0.5,
    public modelName: string = "gpt-4o",
    replyProbability: number = 10,
  ) {
    this.replyProbability = replyProbability;
  }

  get messageDepth(): number {
    return this._messageDepth;
  }

  set messageDepth(value: number) {
    if (value < 0) {
      throw new Error("messageDepth must be a positive integer");
    }
    this._messageDepth = value;
  }

  public get messages(): Message[] {
    return [...this.systemMessages, ...this.messageQueue];
  }

  set replyProbability(probability: number) {
    this._replyProbability = Math.max(0, Math.min(100, probability));
  }

  get replyProbability(): number {
    return this._replyProbability;
  }

  async getChatCompletions(message: string): Promise<string> {
    this.addToMessageHistory({ role: "user", content: message });
    let response = await this.postToOpenAi(this.chatCompletionsUrl, {
      model: this.modelName,
      messages: this.messages,
      max_tokens: this.maxTokens,
      tools: this.tools,
      temperature: this.temperature,
    });

    let toolCalls = response.data.choices[0]?.message?.tool_calls;

    while (toolCalls) {
      this.addToMessageHistory(response.data.choices[0]?.message);
      for (const toolCall of toolCalls) {
        const functionArgs = JSON.parse(toolCall.function.arguments);
        let content = "";
        if (toolCall.function.name === "getDateTime") {
          content = getDateTime();
        }
        if (toolCall.function.name === "getWeather") {
          // add the tool call to the message history
          const { location } = functionArgs;
          content = await getWeather(location);
        }
        if (toolCall.function.name === "getWeatherForecast") {
          const { location, date } = functionArgs;
          content = await getWeatherForecast(location, date);
        }
        if (toolCall.function.name === "getHistoricalWeather") {
          const { location, date } = functionArgs;
          content = await getHistoricalWeather(location, date);
        }

        // add the tool response correctly after OpenAI requested it
        this.addToMessageHistory({
          role: "tool",
          tool_call_id: toolCall.id, // Ensure it matches the function call ID
          content: content,
        });
      }
      // call OpenAI again to process the tool response
      response = await this.postToOpenAi(this.chatCompletionsUrl, {
        model: this.modelName,
        messages: this.messages, // Updated messages with tool response
        max_tokens: this.maxTokens,
        tools: this.tools,
        temperature: this.temperature,
      });
      toolCalls = response.data.choices[0]?.message?.tool_calls;
    }

    const content = response.data.choices[0]?.message?.content;
    this.addToMessageHistory({ role: "assistant", content });

    return content;
  }

  async handleImageVision(imageUrl: string, text: string): Promise<string> {
    const message: Message = {
      role: "user",
      content: [
        { type: "text", text },
        { type: "image_url", image_url: { url: imageUrl } },
      ],
    };
    this.addToMessageHistory(message);

    const response = await this.postToOpenAi(this.chatCompletionsUrl, {
      model: this.modelName,
      messages: this.messages,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
    });
    const content = response.data.choices[0].message.content;
    this.addToMessageHistory({ role: "assistant", content });
    return content;
  }

  draw(message: string): Promise<any> {
    return this.postToOpenAi(this.generateImageUrl, {
      model: "dall-e-3",
      prompt: message,
      n: 1,
      size: "1024x1024",
      style: "vivid",
      quality: "standard",
    });
  }

  async drawVariations(messageId: number): Promise<any> {
    const imageUrl = this.getImageUrlFromHistory(messageId);
    const response = await this.httpClient.get(imageUrl, {
      responseType: "arraybuffer",
    });
    const formData = new FormData();
    formData.append("image", response.data, "image.png");
    formData.append("n", 1);
    formData.append("size", "1024x1024");
    return this.postToOpenAi(
      this.variationsImageUrl,
      formData,
      formData.getHeaders(),
    );
  }

  getModelsList() {
    const headers = {
      Authorization: "Bearer " + this.token,
      "Content-Type": "application/json",
    };
    return this.httpClient.get(this.modelsListUrl, {
      headers: headers,
    });
  }

  addImageHistory(messageId: number, imageUrl: string, prompt: string): void {
    while (this.imageHistory.size >= 100) {
      const oldestKey = this.imageHistory.keys().next().value;
      if (oldestKey !== undefined) {
        this.imageHistory.delete(oldestKey);
      }
    }
    this.imageHistory.set(messageId, { imageUrl, prompt });
  }

  getImageHistory(messageId: number): { prompt: string; imageUrl: string } {
    const history = this.imageHistory.get(messageId);
    if (!history) {
      throw new Error("No image history found for message ID " + messageId);
    }
    return history;
  }

  hasImageHistory(messageId: number): boolean {
    return this.imageHistory.has(messageId);
  }

  setSystemMessage(message: string): void {
    this.systemMessages = [{ role: "system", content: message }];
  }

  addSystemMessage(message: string): void {
    this.systemMessages.push({ role: "system", content: message });
  }

  resetMessageQueue(): void {
    this.messageQueue = [];
  }

  shouldReply(): boolean {
    return Math.random() <= this.replyProbability / 100;
  }

  private addToMessageHistory(message: Message): void {
    this.messageQueue.push(message);
    while (this.messageQueue.length > this._messageDepth) {
      this.messageQueue.shift();
    }
  }

  private async postToOpenAi(
    url: string,
    data: any = null,
    headers: any = null,
  ): Promise<any> {
    headers = headers || {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };
    try {
      return await this.httpClient.post(url, data, { headers });
    } catch (error) {
      console.error(`Failed to post to OpenAI (${url}):`, error);
      throw error;
    }
  }

  private getImageUrlFromHistory(messageId: number): string {
    const history = this.imageHistory.get(messageId);
    if (!history) {
      throw new Error("No image history found for message ID " + messageId);
    }
    return history.imageUrl;
  }
}

export interface ApiConfig {
  baseUrl: string;
  endpoints: {
    chatCompletions: string;
    generateImage: string;
    variationsImage: string;
    modelsList: string;
  };
}

// OpenAI initialization
const openAiToken = process.env.OPENAI_TOKEN ?? "";
const maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS ?? "1024", 10);
const temperature = parseFloat(process.env.OPENAI_TEMPERATURE ?? "0.1");
const modelName = process.env.OPENAI_MODEL_NAME ?? "gpt-4o";
const replyProbability = parseFloat(process.env.REPLY_PROBABILITY ?? "10");

export const openAi = new OpenAi(
  openAiToken,
  maxTokens,
  temperature,
  modelName,
  replyProbability,
);
