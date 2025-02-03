import axios from "axios";
const WEATHER_API_KEY = process.env.WEATHER_API_KEY!;
const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather";
const GEO_API_URL = "https://api.openweathermap.org/geo/1.0/direct";
const FORECAST_API_URL =
  "https://api.openweathermap.org/data/2.5/forecast/daily";
const HISTORY_API_URL = "https://archive-api.open-meteo.com/v1/archive";

interface Coordinates {
  lat: number;
  lon: number;
}

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
    const sunrise = new Date(response.data.sys.sunrise * 1000).toISOString();
    const sunset = new Date(response.data.sys.sunset * 1000).toISOString();
    return `Weather in ${city}: ${weather[0].description},
    Temperature: ${main.temp}°C, Feels like: ${main.feels_like}°C, 
    Humidity: ${main.humidity}%, Pressure: ${main.pressure}hPa, 
    Wind speed: ${wind.speed}m/s, Visibility: ${response.data.visibility}m
    Sunrise: ${sunrise}, Sunset: ${sunset}`;
  } catch (error) {
    console.error("Error fetching weather:", error);
    return "I could not fetch the weather. Please check the city name.";
  }
}

// Convert city name to coordinates
async function getCoordinates(city: string): Promise<Coordinates> {
  try {
    const response = await axios.get(GEO_API_URL, {
      params: {
        q: city,
        limit: 1,
        appid: WEATHER_API_KEY,
      },
    });
    if (response.data.length === 0) {
      throw new Error("Location not found");
    }
    return { lat: response.data[0].lat, lon: response.data[0].lon };
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    throw new Error("Failed to fetch coordinates");
  }
}

// Fetch weather forecast for a given date in the future
export async function getWeatherForecast(
  location: string,
  date: string,
): Promise<string> {
  try {
    const { lat, lon } = await getCoordinates(location);

    const forecastResponse = await axios.get(FORECAST_API_URL, {
      params: {
        lat,
        lon,
        units: "metric",
        appid: WEATHER_API_KEY,
        cnt: 16,
      },
    });

    // Find the forecast for the requested date
    const targetDate = new Date(date).setHours(0, 0, 0, 0);
    const forecast = forecastResponse.data.list.find((item: any) => {
      const itemDate = new Date(item.dt * 1000).setHours(0, 0, 0, 0);
      return itemDate === targetDate;
    });

    if (!forecast) {
      return `No forecast available for ${location} on ${date}.`;
    }

    // Convert Unix timestamps to readable time
    const sunrise = new Date(forecast.sunrise * 1000).toISOString();
    const sunset = new Date(forecast.sunset * 1000).toISOString();

    return `Forecast for ${location} on ${date}: ${
      forecast.weather[0].description
    },
    Temperature: ${forecast.temp.day}°C (Max: ${forecast.temp.max}°C, Min: ${
      forecast.temp.min
    }°C)
    Feels like: ${forecast.feels_like.day}°C
    Humidity: ${forecast.humidity}%, Pressure: ${forecast.pressure}hPa
    Wind speed: ${forecast.speed}m/s
    Sunrise: ${sunrise}, Sunset: ${sunset}
    Precipitation chance: ${forecast.pop * 100}%${
      forecast.rain ? `, Rain: ${forecast.rain}mm` : ""
    }`;
  } catch (error) {
    console.error("Error fetching weather forecast:", error);
    return "Could not retrieve weather forecast. Please try again.";
  }
}

// Fetch historical weather for a given past date
export async function getHistoricalWeather(
  location: string,
  date: string,
): Promise<string> {
  try {
    const { lat, lon } = await getCoordinates(location);

    // Call Open-Meteo API for historical weather
    const historyResponse = await axios.get(HISTORY_API_URL, {
      params: {
        latitude: lat,
        longitude: lon,
        start_date: date,
        end_date: date,
        daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
        timezone: "auto",
      },
    });

    const data = historyResponse.data?.daily;
    if (!data) {
      return `No historical data available for ${location} on ${date}.`;
    }

    return `Historical weather for ${location} on ${date}:
    - Max Temperature: ${data.temperature_2m_max[0]}°C
    - Min Temperature: ${data.temperature_2m_min[0]}°C
    - Precipitation: ${data.precipitation_sum[0]}mm.`;
  } catch (error) {
    console.error("Error fetching historical weather:", error);
    return "Could not retrieve historical weather. Please try again.";
  }
}
