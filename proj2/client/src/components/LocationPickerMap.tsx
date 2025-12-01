import React, { useState, useCallback, useEffect } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

type Props = {
  defaultLat?: number;
  defaultLng?: number;
  onLocationSelected: (lat: number, lng: number) => void;
};

const containerStyle = {
  width: "100%",
  height: "300px",
  borderRadius: "10px",
};

const LocationPickerMap: React.FC<Props> = ({
  defaultLat,
  defaultLng,
  onLocationSelected,
}) => {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(
    defaultLat && defaultLng ? { lat: defaultLat, lng: defaultLng } : null
  );

  const [markerPos, setMarkerPos] = useState<{
    lat: number;
    lng: number;
  } | null>(
    defaultLat && defaultLng ? { lat: defaultLat, lng: defaultLng } : null
  );

  /** ⭐ 自動定位 */
  useEffect(() => {
    if (!center && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setCenter({ lat, lng });
        setMarkerPos({ lat, lng });
        onLocationSelected(lat, lng);
      });
    }
  }, [center, onLocationSelected]);

  /** ⭐ 點地圖更新 marker */
  const handleMapClick = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;

      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      setMarkerPos({ lat, lng });
      onLocationSelected(lat, lng);
    },
    [onLocationSelected]
  );

  if (!isLoaded || !center) return <p>Loading map...</p>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      onClick={handleMapClick}
    >
      {markerPos && <Marker position={markerPos} />}
    </GoogleMap>
  );
};

export default LocationPickerMap;
