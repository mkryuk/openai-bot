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
import { webSearch } from "../services/search";

interface ToolResponse {
  name: string;
  handler: (args: any) => Promise<string> | string;
}

type ReasoningEffort = "none" | "low" | "medium" | "high" | "xhigh" | "max";

export class OpenAi {
  private httpClient: AxiosInstance = axios.create();
  private _messageDepth: number = 10;
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
  public reasoningEffort: ReasoningEffort;

  public static readonly API_URLS = {
    responses: "https://api.openai.com/v1/responses",
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
          args.max,
          args.language,
          args.country,
          args.fromDate,
          args.toDate,
        ),
    },
    webSearch: {
      name: "webSearch",
      handler: (args: any) => webSearch(args.query),
    },
  };

  constructor(
    token: string,
    maxTokens = 1024,
    temperature = 0.5,
    modelName = "gpt-5.6-luna",
    replyProbability = 10,
    reasoningEffort: ReasoningEffort = "low",
  ) {
    this._replyProbability = replyProbability;
    this.httpClient.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${token}`;
    this.maxTokens = maxTokens;
    this.temperature = temperature;
    this.modelName = modelName;
    this.reasoningEffort = reasoningEffort;
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

    let toolCalls = this.getFunctionCalls(response);
    while (toolCalls.length > 0) {
      this.addResponseOutputToMessageHistory(response);
      await this.handleToolCalls(toolCalls);
      response = await this.makeOpenAiRequest();
      toolCalls = this.getFunctionCalls(response);
    }

    const content = this.extractOutputText(response);
    this.addToMessageHistory({ role: "assistant", content });
    return content;
  }

  private async makeOpenAiRequest() {
    return this.postToOpenAi(OpenAi.API_URLS.responses, {
      model: this.modelName,
      input: this.toResponsesInput(this.messages),
      max_output_tokens: this.maxTokens,
      tools: this.toResponsesTools(),
      ...this.getReasoningRequestParams(),
    });
  }

  private toResponsesInput(messages: Message[]): any[] {
    return messages.map((message) => this.toResponsesInputItem(message));
  }

  private toResponsesInputItem(message: Message): any {
    if (message.type === "function_call") {
      return {
        type: "function_call",
        id: message.id,
        call_id: message.call_id,
        name: message.name,
        arguments: message.arguments,
        status: message.status,
      };
    }

    if (message.type === "function_call_output") {
      return {
        type: "function_call_output",
        id: message.id,
        call_id: message.call_id,
        output: message.output ?? message.content ?? "",
        status: message.status,
      };
    }

    if (message.type === "reasoning") {
      return message;
    }

    if (Array.isArray(message.content)) {
      return {
        role: message.role,
        content: message.content.map((content) => {
          if (content.type === "text") {
            return { type: "input_text", text: content.text };
          }

          return {
            type: "input_image",
            image_url: content.image_url.url,
          };
        }),
      };
    }

    return {
      role: message.role,
      content: message.content ?? "",
    };
  }

  private toResponsesTools() {
    return this.tools.map((tool) => ({
      type: tool.type,
      name: tool.function.name,
      description: tool.function.description,
      parameters: tool.function.parameters,
      strict: tool.function.strict,
    }));
  }

  private getFunctionCalls(response: any): any[] {
    return (response.data.output ?? []).filter(
      (output: any) => output.type === "function_call",
    );
  }

  private addResponseOutputToMessageHistory(response: any): void {
    for (const output of response.data.output ?? []) {
      if (output.type === "function_call" || output.type === "reasoning") {
        this.addToMessageHistory({
          ...output,
        });
      }
    }
  }

  private extractOutputText(response: any): any {
    if ("output_text" in response.data) {
      return response.data.output_text;
    }

    const textParts = (response.data.output ?? [])
      .flatMap((output: any) => output.content ?? [])
      .filter((content: any) => content.type === "output_text")
      .map((content: any) => content.text);

    return textParts.length > 0 ? textParts.join("") : null;
  }

  private async handleToolCalls(toolCalls: any[]) {
    for (const toolCall of toolCalls) {
      const { name, arguments: args, call_id: callId } = toolCall;
      const handler = OpenAi.TOOL_HANDLERS[name];

      if (handler) {
        const functionArgs = JSON.parse(args);
        const content = await handler.handler(functionArgs);

        this.addToMessageHistory({
          type: "function_call_output",
          role: "tool",
          call_id: callId,
          content,
          output: content,
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

    const response = await this.postToOpenAi(OpenAi.API_URLS.responses, {
      model: this.modelName,
      input: this.toResponsesInput(this.messages),
      max_output_tokens: this.maxTokens,
      ...this.getReasoningRequestParams(),
    });

    const content = this.extractOutputText(response);
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

  setSystemMessages(messages: string[]): void {
    this.systemMessages = messages.map((message) => ({
      role: "system",
      content: message,
    }));
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
      console.error(
        `Failed to post to OpenAI (${url}):`,
        this.formatOpenAiError(error),
      );
      throw error;
    }
  }

  private getReasoningRequestParams() {
    return this.modelName.startsWith("gpt-5")
      ? { reasoning: { effort: this.reasoningEffort } }
      : {};
  }

  private formatOpenAiError(error: any) {
    return {
      message: error?.message,
      code: error?.code,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      response: error?.response?.data,
    };
  }

  private getImageUrlFromHistory(messageId: number): string {
    const history = this.imageHistory.get(messageId);
    if (!history) {
      throw new Error("No image history found for message ID " + messageId);
    }
    return history.imageUrl;
  }
}

function parseReasoningEffort(value: string | undefined): ReasoningEffort {
  const allowed: ReasoningEffort[] = [
    "none",
    "low",
    "medium",
    "high",
    "xhigh",
    "max",
  ];

  return allowed.includes(value as ReasoningEffort)
    ? (value as ReasoningEffort)
    : "low";
}

export interface ApiConfig {
  baseUrl: string;
  endpoints: {
    responses: string;
    generateImage: string;
    variationsImage: string;
    modelsList: string;
  };
}

// OpenAI initialization
const openAiToken = process.env.OPENAI_TOKEN ?? "";
const maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS ?? "1024", 10);
const temperature = parseFloat(process.env.OPENAI_TEMPERATURE ?? "0.1");
const modelName = process.env.OPENAI_MODEL_NAME ?? "gpt-5.6-luna";
const replyProbability = parseFloat(process.env.REPLY_PROBABILITY ?? "10");
const reasoningEffort = parseReasoningEffort(
  process.env.OPENAI_REASONING_EFFORT,
);

export const openAi = new OpenAi(
  openAiToken,
  maxTokens,
  temperature,
  modelName,
  replyProbability,
  reasoningEffort,
);
