export const tools = [
  {
    type: "function",
    function: {
      name: "getWeather",
      description: "Get current temperature for a given location.",
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
];
