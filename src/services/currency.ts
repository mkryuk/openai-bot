import axios from "axios";

const FIAT_API_URL = "https://api.exchangerate-api.com/v4/latest";
const CRYPTO_API_URL = "https://api.coingecko.com/api/v3/simple/price";

interface FiatResponse {
  rates: Record<string, number>;
}

interface CryptoResponse {
  [key: string]: {
    [key: string]: number;
  };
}

export async function getFiatExchangeRate(
  baseCurrency: string,
  targetCurrency: string,
): Promise<string> {
  try {
    const response = await axios.get<FiatResponse>(
      `${FIAT_API_URL}/${baseCurrency.toUpperCase()}`,
    );

    const rate = response.data.rates[targetCurrency.toUpperCase()];
    if (!rate) {
      return `Exchange rate not found for ${baseCurrency} to ${targetCurrency}.`;
    }

    return `Exchange rate from ${baseCurrency} to ${targetCurrency}: 1 ${baseCurrency} = ${rate} ${targetCurrency}.`;
  } catch (error) {
    console.error("Error fetching fiat exchange rate:", error);
    return "Could not retrieve fiat exchange rate. Please try again.";
  }
}

export async function getCryptoExchangeRate(
  baseCrypto: string,
  targetCrypto: string,
): Promise<string> {
  try {
    const response = await axios.get<CryptoResponse>(CRYPTO_API_URL, {
      params: {
        ids: baseCrypto.toLowerCase(),
        vs_currencies: targetCrypto.toLowerCase(),
      },
    });

    const baseData = response.data[baseCrypto.toLowerCase()];
    const rate = baseData?.[targetCrypto.toLowerCase()];
    if (!rate) {
      return `Exchange rate not found for ${baseCrypto} to ${targetCrypto}.`;
    }

    return `Exchange rate from ${baseCrypto} to ${targetCrypto}: 1 ${baseCrypto} = ${rate} ${targetCrypto}.`;
  } catch (error) {
    console.error("Error fetching crypto exchange rate:", error);
    return "Could not retrieve cryptocurrency exchange rate. Please try again.";
  }
}
