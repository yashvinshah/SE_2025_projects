// src/components/LocationPickerMap.tsx
import React, { useEffect, useRef } from "react";

interface ParsedAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface LocationPickerMapProps {
  defaultLat?: number;
  defaultLng?: number;
  defaultAddress?: string;
  onLocationSelected: (
    lat: number,
    lng: number,
    fullAddress: string,
    structured: ParsedAddress
  ) => void;
}

const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  defaultLat = 35.7796,
  defaultLng = -78.6382,
  defaultAddress,
  onLocationSelected,
}) => {
  const mapDiv = useRef<HTMLDivElement | null>(null);
  const map = useRef<google.maps.Map | null>(null);
  const marker = useRef<google.maps.Marker | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);

  const parseAddressComponents = (
    components: google.maps.GeocoderAddressComponent[]
  ): ParsedAddress => {
    let streetNumber = "";
    let route = "";
    let city = "";
    let state = "";
    let zip = "";

    components.forEach((comp) => {
      if (comp.types.includes("street_number")) streetNumber = comp.long_name;
      if (comp.types.includes("route")) route = comp.long_name;
      if (
        comp.types.includes("locality") ||
        comp.types.includes("sublocality") ||
        comp.types.includes("postal_town")
      ) {
        if (!city) city = comp.long_name;
      }
      if (comp.types.includes("administrative_area_level_1")) {
        state = comp.short_name;
      }
      if (comp.types.includes("postal_code")) {
        zip = comp.long_name;
      }
    });

    return {
      street: `${streetNumber} ${route}`.trim(),
      city,
      state,
      zipCode: zip,
    };
  };

  const reverseGeocode = (latLng: google.maps.LatLng) => {
    if (!geocoder.current) return;

    geocoder.current.geocode({ location: latLng }, (results, status) => {
      if (status !== "OK" || !results || !results[0]) return;

      const r = results[0];
      const fullAddr = r.formatted_address;
      const structured = parseAddressComponents(r.address_components);

      onLocationSelected(latLng.lat(), latLng.lng(), fullAddr, structured);
    });
  };

  useEffect(() => {
    const g = (window as unknown as { google?: typeof google }).google;
    if (!g || !g.maps || !mapDiv.current) return;

    const center = new g.maps.LatLng(defaultLat, defaultLng);

    map.current = new g.maps.Map(mapDiv.current, {
      center,
      zoom: 14,
    });

    marker.current = new g.maps.Marker({
      map: map.current,
      position: center,
      draggable: true,
    });

    geocoder.current = new g.maps.Geocoder();

    map.current.addListener("click", (event: google.maps.MapMouseEvent) => {
      if (!marker.current) return;
      if (!event.latLng) return;

      marker.current.setPosition(event.latLng);
      reverseGeocode(event.latLng);
    });

    marker.current.addListener(
      "dragend",
      (event: google.maps.MapMouseEvent) => {
        if (!event.latLng) return;
        reverseGeocode(event.latLng);
      }
    );

    // Cleanup — 修正 TS 錯誤版本
    return () => {
      const gg = (window as unknown as { google?: typeof google }).google;
      if (!gg || !gg.maps) return;

      if (map.current) gg.maps.event.clearInstanceListeners(map.current);
      if (marker.current) gg.maps.event.clearInstanceListeners(marker.current);
    };
  }, []);

  return (
    <div
      ref={mapDiv}
      style={{
        width: "100%",
        height: "300px",
        borderRadius: "8px",
      }}
    />
  );
};

export default LocationPickerMap;
