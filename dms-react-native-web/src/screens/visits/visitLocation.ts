import * as Location from "expo-location";
import { Platform } from "react-native";

export type CurrentPosition = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

export async function getCurrentPosition(): Promise<CurrentPosition> {
  if (Platform.OS === "web") {
    return getWebPosition();
  }

  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) {
    throw new Error("App cần quyền vị trí để lấy tọa độ GPS.");
  }

  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    throw new Error("Vui lòng bật định vị/GPS trên thiết bị hoặc LDPlayer.");
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy ?? undefined,
  };
}

function getWebPosition(): Promise<CurrentPosition> {
  const nav = typeof globalThis !== "undefined" ? globalThis.navigator : undefined;

  if (!nav?.geolocation) {
    throw new Error("Trình duyệt không hỗ trợ định vị.");
  }

  return new Promise((resolve, reject) => {
    nav.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      () => reject(new Error("Không lấy được vị trí hiện tại.")),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 },
    );
  });
}
