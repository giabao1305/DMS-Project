import Constants from "expo-constants";
import { Platform } from "react-native";

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;
const webHost =
  typeof window !== "undefined" && window.location?.hostname
    ? window.location.hostname
    : "localhost";

const metroHost =
  Platform.OS === "web"
    ? undefined
    : hostFromUri(Constants.expoConfig?.hostUri) || hostFromUri(Constants.linkingUri);

// Expo Go runs on the phone, where localhost is the phone itself. Reuse Metro's LAN host for local APIs.
const metroApiUrl =
  metroHost && isLanHost(metroHost)
    ? replaceLoopbackHost(configuredApiUrl, metroHost) || `http://${metroHost}:5000`
    : undefined;

const nativeConfiguredApiUrl =
  configuredApiUrl && isLoopbackUrl(configuredApiUrl) && metroApiUrl
    ? metroApiUrl
    : configuredApiUrl;

const defaultApiUrl =
  Platform.OS === "android"
    ? metroApiUrl || "http://10.0.2.2:5000"
    : Platform.OS === "ios"
      ? metroApiUrl || "http://localhost:5000"
      : `http://${webHost}:5000`;

const isLocalWebHost =
  Platform.OS === "web" && isLoopbackHost(webHost);

export const API_URL =
  isLocalWebHost ? `http://${webHost}:5000` : nativeConfiguredApiUrl || defaultApiUrl;

const platformFallbackApiUrls = configuredApiUrl && !isLocalWebHost && !isLoopbackUrl(configuredApiUrl)
  ? []
  : Platform.OS === "android"
    ? [
        metroApiUrl,
        "http://10.0.2.2:5000",
        "http://10.0.3.2:5000",
      ]
    : Platform.OS === "ios"
      ? [
          metroApiUrl,
          "http://localhost:5000",
        ]
      : [
          webHost === "localhost"
            ? "http://127.0.0.1:5000"
            : undefined,
          webHost === "127.0.0.1"
            ? "http://localhost:5000"
            : undefined,
        ];

export const API_URLS = Array.from(
  new Set([
    API_URL,
    ...platformFallbackApiUrls,
  ].filter(Boolean) as string[]),
);

export const PAGE_SIZE = 20;

function hostFromUri(uri?: string | null) {
  if (!uri) return undefined;
  try {
    return new URL(uri.includes("://") ? uri : `http://${uri}`).hostname;
  } catch {
    return undefined;
  }
}

function isLoopbackHost(host: string) {
  return host === "localhost" || host === "127.0.0.1";
}

function isLanHost(host: string) {
  return /^(10|192\.168|172\.(1[6-9]|2\d|3[0-1]))\.\d+\.\d+$/.test(host);
}

function isLoopbackUrl(url?: string) {
  return Boolean(url && isLoopbackHost(hostFromUri(url) || ""));
}

function replaceLoopbackHost(url: string | undefined, host: string) {
  if (!url || !isLoopbackUrl(url)) return undefined;
  try {
    const localUrl = new URL(url);
    localUrl.hostname = host;
    return localUrl.toString().replace(/\/$/, "");
  } catch {
    return undefined;
  }
}
