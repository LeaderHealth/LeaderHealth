import fs from "node:fs";
import path from "node:path";

const DEFAULT_GATEWAY = "https://secure.nmi.com";

function parseEnvFile(relative: string) {
  const values: Record<string, string> = {};
  try {
    const source = fs.readFileSync(path.join(process.cwd(), relative), "utf8");
    for (const raw of source.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq < 1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      values[key] = value;
    }
  } catch {
    return values;
  }
  return values;
}

function labThreeEnv() {
  return {
    ...parseEnvFile("storefront/.env"),
    ...parseEnvFile("storefront/.env.local"),
    ...parseEnvFile("firebase/functions/.env"),
    ...parseEnvFile("firebase/functions/.env.local"),
  };
}

function labThreeGatewayFromConfig() {
  try {
    const source = fs.readFileSync(path.join(process.cwd(), "firebase/functions/config.js"), "utf8");
    return source.match(/NMI_GATEWAY_BASE_URL\s*\|\|\s*"([^"]+)"/)?.[1]?.trim() || "";
  } catch {
    return "";
  }
}

export function looksLikeTokenizationKey(raw: string) {
  const key = raw.trim();
  return Boolean(key) && (key.includes("-") || key.includes("."));
}

export function nmiPublicConfig() {
  const labThree = labThreeEnv();
  const tokenizationKey = (
    process.env.NMI_TOKENIZATION_KEY?.trim() ||
    process.env.VITE_NMI_TOKENIZATION_KEY?.trim() ||
    labThree.NMI_TOKENIZATION_KEY?.trim() ||
    labThree.VITE_NMI_TOKENIZATION_KEY?.trim() ||
    ""
  );
  const gatewayBaseUrl = (
    process.env.NMI_GATEWAY_BASE_URL?.trim() ||
    labThree.NMI_GATEWAY_BASE_URL?.trim() ||
    labThree.VITE_NMI_GATEWAY_BASE_URL?.trim() ||
    labThreeGatewayFromConfig() ||
    DEFAULT_GATEWAY
  ).replace(/\/+$/, "");

  return {
    tokenizationKey: looksLikeTokenizationKey(tokenizationKey) ? tokenizationKey : "",
    gatewayBaseUrl: gatewayBaseUrl || DEFAULT_GATEWAY,
  };
}

export function nmiSecurityKey() {
  const labThree = labThreeEnv();
  return (
    process.env.NMI_SECURITY_KEY?.trim() ||
    labThree.NMI_SECURITY_KEY?.trim() ||
    ""
  );
}
