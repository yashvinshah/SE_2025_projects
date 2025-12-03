// src/utils/addressSync.ts
import type { StructuredAddress, FullAddress } from "../types/address";
import { parseAddressComponents } from "./address";

export interface AddressSyncResult {
  fullAddress: string;
  structured: StructuredAddress;
  lat: number;
  lng: number;
}

/**
 * 給一個 Google GeocoderResult，輸出同步後的 address + location
 */
export function fromGeocoderResult(
  result: google.maps.GeocoderResult
): AddressSyncResult {
  const fullAddress = result.formatted_address;
  const components = result.address_components;
  const structured = parseAddressComponents(components);

  const lat = result.geometry.location.lat();
  const lng = result.geometry.location.lng();

  return {
    fullAddress,
    structured,
    lat,
    lng,
  };
}
