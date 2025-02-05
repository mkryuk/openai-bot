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
import {
  getCryptoExchangeRate,
  getFiatExchangeRate,
} from "../services/currency";
import { fetchNews } from "../services/news";

interface ToolResponse {
  name: string;
  handler: (args: any) => Promise<string> | string;
}

export class OpenAi {
  private httpClient: AxiosInstance = axios.create();
  private _messageDepth: number = 3;
  private systemMessages: Message[] = [];
  private messageQueue: Message[] = [];
  private _replyProbability: number = 0;
  private readonly imageHistory = new Map<
    number,
    { prompt: string; imageUrl: string }
  >();
  private tools = tools;
  public maxTokens: number;
  public temperature: number;
  public modelName: string;

  public static readonly API_URLS = {
    chatCompletions: "https://api.openai.com/v1/chat/completions",
    generateImage: "https://api.openai.com/v1/images/generations",
    variationsImage: "https://api.openai.com/v1/images/variations",
    modelsList: "https://api.openai.com/v1/models",
  };

  private static readonly TOOL_HANDLERS: Record<string, ToolResponse> = {
    getDateTime: { name: "getDateTime", handler: (args: any) => getDateTime() },
    getWeather: {
      name: "getWeather",
      handler: (args: any) => getWeather(args.location),
    },
    getWeatherForecast: {
      name: "getWeatherForecast",
      handler: (args: any) => getWeatherForecast(args.location, args.date),
    },
    getHistoricalWeather: {
      name: "getHistoricalWeather",
      handler: (args: any) => getHistoricalWeather(args.location, args.date),
    },
    getFiatExchangeRate: {
      name: "getFiatExchangeRate",
      handler: (args: any) =>
        getFiatExchangeRate(args.baseCurrency, args.targetCurrency),
    },
    getCryptoExchangeRate: {
      name: "getCryptoExchangeRate",
      handler: (args: any) =>
        getCryptoExchangeRate(args.baseCrypto, args.targetCrypto),
    },
    getNewsSummary: {
      name: "getNewsSummary",
      handler: (args: any) =>
        fetchNews(
          args.topic,
          args.language,
          args.country,
          args.fromDate,
          args.toDate,
        ),
    },
  };

  constructor(
    token: string,
    maxTokens = 1024,
    temperature = 0.5,
    modelName = "gpt-4o",
    replyProbability = 10,
  ) {
    this._replyProbability = replyProbability;
    this.httpClient.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${token}`;
    this.maxTokens = maxTokens;
    this.temperature = temperature;
    this.modelName = modelName;
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
    let response = await this.makeOpenAiRequest();

    let toolCalls = response.data.choices[0]?.message?.tool_calls;
    while (toolCalls) {
      this.addToMessageHistory(response.data.choices[0]?.message);
      await this.handleToolCalls(toolCalls);
      response = await this.makeOpenAiRequest();
      toolCalls = response.data.choices[0]?.message?.tool_calls;
    }

    const content = response.data.choices[0]?.message?.content;
    this.addToMessageHistory({ role: "assistant", content });
    return content;
  }

  private async makeOpenAiRequest() {
    return this.postToOpenAi(OpenAi.API_URLS.chatCompletions, {
      model: this.modelName,
      messages: this.messages,
      max_tokens: this.maxTokens,
      tools: this.tools,
      temperature: this.temperature,
    });
  }

  private async handleToolCalls(toolCalls: any[]) {
    for (const toolCall of toolCalls) {
      const {
        function: { name, arguments: args },
      } = toolCall;
      const handler = OpenAi.TOOL_HANDLERS[name];

      if (handler) {
        const functionArgs = JSON.parse(args);
        const content = await handler.handler(functionArgs);

        this.addToMessageHistory({
          role: "tool",
          tool_call_id: toolCall.id,
          content,
        });
      }
    }
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

    const response = await this.postToOpenAi(OpenAi.API_URLS.chatCompletions, {
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
    return this.postToOpenAi(OpenAi.API_URLS.generateImage, {
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
      OpenAi.API_URLS.variationsImage,
      formData,
      formData.getHeaders(),
    );
  }

  getModelsList() {
    return this.httpClient.get(OpenAi.API_URLS.modelsList);
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
    while (
      this.messageQueue.filter((m) => m.role === "user").length >
      this._messageDepth
    ) {
      this.messageQueue.shift();
    }
  }

  private async postToOpenAi(
    url: string,
    data: any = null,
    headers: any = null,
  ): Promise<any> {
    const defaultHeaders = headers || { "Content-Type": "application/json" };
    try {
      return await this.httpClient.post(url, data, { headers: defaultHeaders });
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
