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
OPENAI_MAX_TOKENS=openai_max_tokens # 1024
OPENAI_TEMPERATURE=openai_temperature # 0.5
OPENAI_MODEL_NAME=gpt-4
REPLY_PROBABILITY=10
ADMIN_USER_ID=1234567890
CONFIG_PATH=config.json
BIRTHDAYS_CONFIG_PATH="birthdays_config_file_path"
BIRTHDAYS_SCHEDULE="0 0 9 * * *" # cron expression
WEATHER_API_KEY=openweather_api_key
GNEWS_API_KEY=newsapi_api_key
```

5. Create a config file for CONFIG_PATH env variable. The file should contain a JSON object with the following structure:

```
{
  "allowedUsers": [
    {
      "id": 1234567890,
      "userName": "Username"
    }
  ],
  "allowedGroups": [
    {
      "id": 1234567890,
      "title": "Group name"
    }
  ]
}
```

6. Create a birthdays config file for BIRTHDAYS_CONFIG_PATH env variable. The file should contain a JSON object with the following structure:

```
{
  "chatId": "1234567890",
  "messageTemplate": "Congratulate {name} on their birthday and wish them something nice",
  "members": [
    { "name": "Chris", "date": "25.12" },
    { "name": "Claus", "date": "15.03" }
  ]
}
```

- The `chatId` is the chat Id where the bot will send birthday messages to.
- The `messageTemplate` is a template string that can contain `{name}` that will be replaced with the `name` of the person whose birthday it is. This message will be sent to the OpenAI gpt model to generate a response message.
- The `date` should be in DD.MM format.

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
docker run -v /path/to/birthdays.config.json:/app/birthdays.config.json --name telegram-openai-bot -d telegram-openai-bot
```

You can also run it with env file from a prebuilt image:

```
docker run --env-file config.env -v /path/to/birthdays.config.json:/app/birthdays.config.json -v /path/to/config.json:/app/config.json --name telegram-openai-bot -d mkryuk/telegram-openai-bot

```

3. Run it with docker compose:

```
docker-compose up -d
```

## Bot commands

chat - Chat with OpenAI
openai - Text to OpenAI
get_models - List all models
get_model - Get current model
set_model - Set new model
get_temperature - Get current model temperature
set_temperature - Set new temperature
get_tokens - Get current model tokens
set_tokens - Set new tokens amount
get_depth - Get message depth
set_depth - Set message depth
get_reply_probability - Get probability to reply to a random question
set_reply_probability - Set probability to reply to a random question
set_system - Set system message
add_system - Add new message to system messages
reset - Reset chat conversation. Clears messages history
add_user - Add user to authorized list, user will be allowed to use the bot
delete_user - Delete user from authorized list
add_group - Add group to authorized list, all users of this group will be allowed to use the bot
delete_group - Delete group from authorized list

## Built With

- Telegraf - A modern Telegram Bot Framework for Node.js
- OpenAI API - The OpenAI API provides free access to the largest-ever machine learning models trained by OpenAI.
  Contributing

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.
