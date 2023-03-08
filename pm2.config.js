module.exports = {
  apps: [
    {
      name: "openai-bot",
      script: "./dist/main.js",
      instances: "1",
      exp_backoff_restart_delay: 100,
    },
  ],
};
