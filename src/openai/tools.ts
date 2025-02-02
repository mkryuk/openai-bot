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
];
