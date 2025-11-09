import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

interface ExchangeRate {
  currency: string;
  rate: number;
}

interface CachedRates {
  rates: ExchangeRate[];
  timestamp: number;
  eurToUsd: number;
}

let cachedRates: CachedRates | null = null;
const CACHE_DURATION = 86400000; // 24 hours in milliseconds

async function fetchECBRates(): Promise<CachedRates> {
  const response = await fetch(
    "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"
  );

  if (!response.ok) {
    throw new Error("Failed to fetch ECB rates");
  }

  const xmlText = await response.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });

  const result = parser.parse(xmlText);

  // Navigate through the XML structure
  const cube = result["gesmes:Envelope"]?.Cube?.Cube;
  const rates: ExchangeRate[] = [];
  let eurToUsd = 1;

  if (cube && Array.isArray(cube.Cube)) {
    for (const rate of cube.Cube) {
      const currency = rate["@_currency"];
      const rateValue = parseFloat(rate["@_rate"]);

      if (currency && !isNaN(rateValue)) {
        rates.push({ currency, rate: rateValue });

        if (currency === "USD") {
          eurToUsd = rateValue;
        }
      }
    }
  }

  // Add EUR as base currency
  rates.push({ currency: "EUR", rate: 1 });

  return {
    rates,
    timestamp: Date.now(),
    eurToUsd,
  };
}

export async function GET() {
  try {
    // Check if cache is valid
    if (cachedRates && Date.now() - cachedRates.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: cachedRates.rates,
        eurToUsd: cachedRates.eurToUsd,
        cached: true,
        timestamp: cachedRates.timestamp,
      });
    }

    // Fetch fresh rates
    cachedRates = await fetchECBRates();

    return NextResponse.json({
      success: true,
      data: cachedRates.rates,
      eurToUsd: cachedRates.eurToUsd,
      cached: false,
      timestamp: cachedRates.timestamp,
    });
  } catch (error) {
    console.error("Failed to fetch exchange rates:", error);

    // Return cached rates if available, even if expired
    if (cachedRates) {
      return NextResponse.json({
        success: true,
        data: cachedRates.rates,
        eurToUsd: cachedRates.eurToUsd,
        cached: true,
        timestamp: cachedRates.timestamp,
        stale: true,
      });
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch exchange rates" },
      { status: 500 }
    );
  }
}
