# Telegram OpenAI Bot

A simple Telegram bot that uses OpenAI API to respond to messages.

## Prerequisites

- Node.js version 18.13.0 or higher
- npm
- OpenAI API Key
- Telegram Bot API Key

## Installation

1. Clone the repository:

```
git clone https://github.com/mkryuk/openai-bot.git
```

2. Navigate to the project directory:

```
cd openai-bot
```

3. Install the dependencies:

```
npm install
```

4. Create a .env file in the project root directory and add the following environment variables:

```
TELEGRAM_TOKEN=your_telegram_bot_api_key
OPENAI_TOKEN=your_openai_api_key
OPENAI_MAX_TOKENS="openai_max_tokens" # 1024
OPENAI_TEMPERATURE="openai_temperature" # 0.5
OPENAI_MODEL_NAME="text-davinci-003"
```

## Running the Bot

To run the bot, simply run the following command in the project directory:

```
npm start
```

## Deployment

The application can be deployed using the following steps:

1. Build a Docker image:

```
docker build -t telegram-openai-bot .
```

2. Run a Docker container:

```
docker run --name telegram-openai-bot -d telegram-openai-bot
```

## Built With

- Telegraf - A modern Telegram Bot Framework for Node.js
- OpenAI API - The OpenAI API provides free access to the largest-ever machine learning models trained by OpenAI.
  Contributing

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.
