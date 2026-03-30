import tokenConfig from "./tokens.json";
import { env } from "./runtime";

export type SupportedToken = {
  symbol: string;
  coinType: string;
  decimals: number;
};

function assertSupportedToken(value: unknown, index: number): SupportedToken {
  if (!value || typeof value !== "object") {
    throw new Error(`Supported token config at index ${index} must be an object`);
  }

  const entry = value as Record<string, unknown>;
  const symbol = typeof entry.symbol === "string" ? entry.symbol.trim() : "";
  const coinType = typeof entry.coinType === "string" ? entry.coinType.trim() : "";
  const decimals = entry.decimals;

  if (!symbol) {
    throw new Error(`Supported token config at index ${index} is missing a symbol`);
  }

  if (!coinType) {
    throw new Error(`Supported token config at index ${index} is missing a coinType`);
  }

  if (!Number.isInteger(decimals) || Number(decimals) < 0) {
    throw new Error(`Supported token config for ${symbol} has an invalid decimals value`);
  }

  return {
    symbol,
    coinType,
    decimals: Number(decimals)
  };
}

function parseSupportedTokensConfig(raw: unknown) {
  if (!Array.isArray(raw)) {
    throw new Error("Supported token config must be an array");
  }

  const tokens = raw.map((entry, index) => assertSupportedToken(entry, index));
  const seenSymbols = new Set<string>();
  const seenCoinTypes = new Set<string>();

  for (const token of tokens) {
    if (seenSymbols.has(token.symbol)) {
      throw new Error(`Duplicate supported token symbol: ${token.symbol}`);
    }
    if (seenCoinTypes.has(token.coinType)) {
      throw new Error(`Duplicate supported token coin type: ${token.coinType}`);
    }

    seenSymbols.add(token.symbol);
    seenCoinTypes.add(token.coinType);
  }

  return tokens;
}

function loadSupportedTokens() {
  const override = env("VITE_SUPPORTED_TOKENS_JSON") ?? env("SUPPORTED_TOKENS_JSON");
  if (!override) {
    return parseSupportedTokensConfig(tokenConfig);
  }

  return parseSupportedTokensConfig(JSON.parse(override) as unknown);
}

export const supportedTokens: SupportedToken[] = loadSupportedTokens();

function decimalFactor(decimals: number) {
  return 10n ** BigInt(decimals);
}

function trimFraction(value: string) {
  if (!value.includes(".")) {
    return value;
  }

  return value.replace(/\.?0+$/, "");
}

export function getSupportedTokenByCoinType(coinType: string) {
  return supportedTokens.find((token) => token.coinType === coinType) ?? null;
}

export function getSupportedTokenBySymbol(symbol: string) {
  return supportedTokens.find((token) => token.symbol === symbol) ?? null;
}

export function parseDisplayAmountToAtomicUnits(value: string, token: SupportedToken) {
  const normalized = value.trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error(`Reward amount is invalid for ${token.symbol}`);
  }

  const [wholePart, fractionPart = ""] = normalized.split(".");
  if (fractionPart.length > token.decimals) {
    throw new Error(`${token.symbol} supports up to ${token.decimals} decimal places`);
  }

  const factor = decimalFactor(token.decimals);
  const wholeUnits = BigInt(wholePart) * factor;
  const fractionUnits = BigInt((fractionPart + "0".repeat(token.decimals)).slice(0, token.decimals));
  const amount = wholeUnits + fractionUnits;

  if (amount <= 0n) {
    throw new Error("Reward must be greater than zero");
  }

  if (amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Reward amount is too large");
  }

  return Number(amount);
}

export function formatAtomicAmount(amount: number, token: SupportedToken, maximumFractionDigits = 6) {
  const factor = 10 ** token.decimals;
  const displayAmount = amount / factor;

  return trimFraction(
    displayAmount.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: Math.min(token.decimals, maximumFractionDigits)
    })
  );
}
