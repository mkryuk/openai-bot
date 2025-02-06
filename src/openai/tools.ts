export const tools = [
  {
    type: "function",
    function: {
      name: "getWeather",
      description: "Get current weather data for a given location.",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "City and country in english e.g. Kyiv, Ukraine",
          },
        },
        required: ["location"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
  {
    type: "function",
    function: {
      name: "getDateTime",
      description: "Get the current date and time in ISO format.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
      strict: true,
    },
  },
  {
    type: "function",
    function: {
      name: "getWeatherForecast",
      description:
        "Get weather forecast data for a given location and future date (YYYY-MM-DD).",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "City and country in English (e.g. 'Kyiv, Ukraine').",
          },
          date: {
            type: "string",
            description: "Date in YYYY-MM-DD format for the forecast.",
          },
        },
        required: ["location", "date"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
  {
    type: "function",
    function: {
      name: "getHistoricalWeather",
      description:
        "Get historical weather data for a given location and past date (YYYY-MM-DD).",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "City and country in English (e.g. 'Kyiv, Ukraine').",
          },
          date: {
            type: "string",
            description: "Date in YYYY-MM-DD format for the historical data.",
          },
        },
        required: ["location", "date"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
  {
    type: "function",
    function: {
      name: "getFiatExchangeRate",
      description:
        "Get the exchange rate between two fiat currencies (e.g., USD to EUR).",
      parameters: {
        type: "object",
        properties: {
          baseCurrency: {
            type: "string",
            description: "The base fiat currency (e.g., USD, EUR, GBP).",
          },
          targetCurrency: {
            type: "string",
            description: "The target fiat currency (e.g., USD, EUR, GBP).",
          },
        },
        required: ["baseCurrency", "targetCurrency"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
  {
    type: "function",
    function: {
      name: "getCryptoExchangeRate",
      description:
        "Get the exchange rate between two cryptocurrencies or a cryptocurrency and a fiat currency.",
      parameters: {
        type: "object",
        properties: {
          baseCrypto: {
            type: "string",
            description:
              "The base cryptocurrency (e.g., bitcoin, ethereum, solana).",
          },
          targetCrypto: {
            type: "string",
            description:
              "The target cryptocurrency or fiat currency (e.g., ethereum, USD, EUR).",
          },
        },
        required: ["baseCrypto", "targetCrypto"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
  {
    type: "function",
    function: {
      name: "getNewsSummary",
      description:
        "Fetch latest news articles about a specific topic, optionally filtered by language, country, and date range. Return a summary of the news articles.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description:
              "The topic to fetch news about (e.g., 'AI', 'Bitcoin', 'Technology').",
          },
          max: {
            type: "number",
            description: "The maximum number of news articles to fetch.",
          },
          language: {
            type: "string",
            description:
              "Preferred language for news. Defaults to 'uk' (Ukrainian) or 'en' (English) if available. Language should corelate to the country, do not mix them. Try to use empty string if no results are found in preferred languages.",
          },
          country: {
            type: "string",
            description:
              "Preferred country for news. Defaults to 'ua' (Ukraine) or 'us' (United States) if available. Country should corelate to the language, do not mix them. Try to use empty string if no results are found in preferred countries.",
          },
          fromDate: {
            type: "string",
            description:
              "Filter the articles that have a publication date greater than or equal to the specified value. The date must be in the format:YYYY-MM-DDThh:mm:ssZ eg 2025-02-04T22:49:43Z (Specify date only if needed).",
          },
          toDate: {
            type: "string",
            description:
              "Filter the articles that have a publication date smaller than or equal to the specified value. The date must be in the format:YYYY-MM-DDThh:mm:ssZ eg 2025-02-04T22:49:43Z (Specify date only if needed).",
          },
        },
        required: ["topic", "max", "language", "country", "fromDate", "toDate"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
  {
    type: "function",
    function: {
      name: "webSearch",
      description: "Perform an internet search and return relevant results.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "The search query string (e.g., 'latest AI trends', 'best programming languages').",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
];
