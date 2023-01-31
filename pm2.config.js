module.exports = {
  apps: [
    {
      name: "openai-bot",
      script: "./dist/index.js",
      instances: '1',
    },
  ],
};
