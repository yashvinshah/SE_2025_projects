// src/utils/address.ts
import type { StructuredAddress } from "../types/address";

export function parseAddressComponents(
  components: google.maps.GeocoderAddressComponent[]
): StructuredAddress {
  let streetNumber = "";
  let route = "";
  let city = "";
  let state = "";
  let zipCode = "";

  for (const comp of components) {
    if (comp.types.includes("street_number")) {
      streetNumber = comp.long_name;
    }
    if (comp.types.includes("route")) {
      route = comp.long_name;
    }
    if (
      comp.types.includes("locality") || // 城市
      comp.types.includes("sublocality") ||
      comp.types.includes("postal_town")
    ) {
      if (!city) city = comp.long_name;
    }
    if (comp.types.includes("administrative_area_level_1")) {
      state = comp.short_name;
    }
    if (comp.types.includes("postal_code")) {
      zipCode = comp.long_name;
    }
  }

  const street = [streetNumber, route].filter(Boolean).join(" ").trim();

  return {
    street,
    city,
    state,
    zipCode,
  };
}

/**
 * 把 StructuredAddress 拼成一個 query string，用在 forward geocode
 */
export function buildAddressString(addr: StructuredAddress): string {
  const parts = [addr.street, addr.city, addr.state, addr.zipCode]
    .filter(Boolean)
    .join(", ");
  return parts;
}
