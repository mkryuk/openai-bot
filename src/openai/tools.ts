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
];
