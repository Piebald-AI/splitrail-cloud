interface ExchangeRate {
  currency: string;
  rate: number;
}

interface ExchangeRatesResponse {
  success: boolean;
  data?: ExchangeRate[];
  eurToUsd?: number;
  error?: string;
}

let cachedRates: ExchangeRatesResponse | null = null;
let cacheTimestamp = 0;
const CLIENT_CACHE_DURATION = 300000; // 5 minutes for client-side cache

export async function fetchExchangeRates(): Promise<ExchangeRatesResponse> {
  try {
    // Check client-side cache
    if (cachedRates && Date.now() - cacheTimestamp < CLIENT_CACHE_DURATION) {
      return cachedRates;
    }

    const response = await fetch("/api/exchange-rates");
    const data = await response.json();
    
    if (data.success) {
      cachedRates = data;
      cacheTimestamp = Date.now();
    }
    
    return data;
  } catch (error) {
    console.error("Failed to fetch exchange rates:", error);
    return { success: false, error: "Failed to fetch exchange rates" };
  }
}

export function convertCurrency(
  amountInUsd: number,
  targetCurrency: string,
  rates: ExchangeRate[],
  eurToUsd: number
): number {
  // If target is USD, no conversion needed
  if (targetCurrency === "USD") {
    return amountInUsd;
  }
  
  // Convert USD to EUR first (since ECB rates are EUR-based)
  const amountInEur = amountInUsd / eurToUsd;
  
  // If target is EUR, we're done
  if (targetCurrency === "EUR") {
    return amountInEur;
  }
  
  // Find the target currency rate
  const targetRate = rates.find(r => r.currency === targetCurrency);
  if (!targetRate) {
    console.warn(`Exchange rate not found for ${targetCurrency}, returning USD amount`);
    return amountInUsd;
  }
  
  // Convert EUR to target currency
  return amountInEur * targetRate.rate;
}

export function formatCurrency(
  amount: number,
  currency: string,
  locale: string = "en"
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback formatting if Intl.NumberFormat fails
    console.error(`Failed to format currency ${currency}:`, error);
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export async function getCurrencySymbol(currency: string): Promise<string> {
  try {
    // Get the currency symbol by formatting 0
    const formatted = new Intl.NumberFormat("en", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(0);
    
    // Extract symbol by removing the numeric part
    return formatted.replace(/[\d\s.,]/g, "").trim();
  } catch {
    // Fallback to currency code
    return currency;
  }
}