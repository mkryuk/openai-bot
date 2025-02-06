import { OpenAi } from "../openai";
import {
  getCryptoExchangeRate,
  getFiatExchangeRate,
} from "../../services/currency";

jest.mock("../../services/currency");

describe("OpenAi Exchange Rate Tools", () => {
  let openAi: OpenAi;
  let postToOpenAiSpy: jest.SpyInstance;

  beforeEach(() => {
    openAi = new OpenAi("defaultToken");
    postToOpenAiSpy = jest.spyOn(openAi as any, "postToOpenAi");
  });

  it("should handle getFiatExchangeRate tool call", async () => {
    const message = "What's the exchange rate between USD and EUR?";
    const mockRate = "1 USD = 0.92 EUR";
    (getFiatExchangeRate as jest.Mock).mockResolvedValue(mockRate);

    postToOpenAiSpy.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              tool_calls: [
                {
                  id: "fiat_call",
                  function: {
                    name: "getFiatExchangeRate",
                    arguments: '{"baseCurrency":"USD","targetCurrency":"EUR"}',
                  },
                },
              ],
            },
          },
        ],
      },
    });

    postToOpenAiSpy.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              content: "The current exchange rate is 1 USD = 0.92 EUR",
            },
          },
        ],
      },
    });

    await openAi.getChatCompletions(message);
    expect(getFiatExchangeRate).toHaveBeenCalledWith("USD", "EUR");
  });

  it("should handle getCryptoExchangeRate tool call", async () => {
    const message = "What's the exchange rate between BTC and ETH?";
    const mockRate = "1 BTC = 15.5 ETH";
    (getCryptoExchangeRate as jest.Mock).mockResolvedValue(mockRate);

    postToOpenAiSpy.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              tool_calls: [
                {
                  id: "crypto_call",
                  function: {
                    name: "getCryptoExchangeRate",
                    arguments: '{"baseCrypto":"BTC","targetCrypto":"ETH"}',
                  },
                },
              ],
            },
          },
        ],
      },
    });

    postToOpenAiSpy.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              content: "The current crypto exchange rate is 1 BTC = 15.5 ETH",
            },
          },
        ],
      },
    });

    await openAi.getChatCompletions(message);
    expect(getCryptoExchangeRate).toHaveBeenCalledWith("BTC", "ETH");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
