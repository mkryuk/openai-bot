import axios from "axios";

const WEATHER_API_KEY = process.env.WEATHER_API_KEY!;
const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather";

export async function getWeather(city: string): Promise<string> {
  try {
    const response = await axios.get(WEATHER_API_URL, {
      params: {
        q: city,
        appid: WEATHER_API_KEY,
        units: "metric",
        lang: "en",
      },
    });

    const { weather, main, wind } = response.data;
    return `Weather in ${city}: ${weather[0].description},
    Temperature: ${main.temp}°C, Feels like: ${main.feels_like}°C, 
    Humidity: ${main.humidity}%, Pressure: ${main.pressure}hPa, 
    Wind speed: ${wind.speed}m/s, Visibility: ${response.data.visibility}m`;
  } catch (error) {
    console.error("Error fetching weather:", error);
    return "I could not fetch the weather. Please check the city name.";
  }
}
