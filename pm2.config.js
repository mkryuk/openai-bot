module.exports = {
  apps: [
    {
      name: "openai-bot",
      script: "./dist/index.js",
      instances: "1",
      exp_backoff_restart_delay: 100,
    },
  ],
};
