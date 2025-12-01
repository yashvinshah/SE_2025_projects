import React, { useState, useEffect, useCallback } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import axios from "axios";

type Props = {
  defaultLat?: number;
  defaultLng?: number;
  defaultAddress?: string;
  onLocationSelected: (lat: number, lng: number, address: string) => void;
};

const containerStyle = {
  width: "100%",
  height: "320px",
  borderRadius: "10px",
};

const LocationPickerMap: React.FC<Props> = ({
  defaultLat,
  defaultLng,
  defaultAddress,
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

  const [address, setAddress] = useState(defaultAddress || "");

  /** ⭐ Reverse Geocode：lat/lng → 地址字串 */
  const reverseGeocode = async (lat: number, lng: number) => {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const res = await axios.get(url);

    if (res.data.status === "OK") {
      const place = res.data.results[0];
      return place.formatted_address;
    }
    return "";
  };

  /** ⭐ Geocode：地址輸入 → lat/lng */
  const geocodeAddress = async (addressString: string) => {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      addressString
    )}&key=${apiKey}`;

    const res = await axios.get(url);

    if (res.data.status === "OK") {
      const loc = res.data.results[0].geometry.location;
      return { lat: loc.lat, lng: loc.lng };
    }

    alert("Address not found");
    return null;
  };

  /** ⭐ 自動定位 */
  useEffect(() => {
    if (defaultLat && defaultLng) {
      setCenter({ lat: defaultLat, lng: defaultLng });
      setMarkerPos({ lat: defaultLat, lng: defaultLng });
      return;
    }

    if (!center && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const addr = await reverseGeocode(lat, lng);

        setCenter({ lat, lng });
        setMarkerPos({ lat, lng });
        setAddress(addr);

        onLocationSelected(lat, lng, addr);
      });
    }
  }, []);

  /** ⭐ 點擊地圖時更新位置 + 地址 */
  const handleMapClick = useCallback(
    async (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;

      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      setMarkerPos({ lat, lng });
      setCenter({ lat, lng });

      const addr = await reverseGeocode(lat, lng);
      setAddress(addr);

      onLocationSelected(lat, lng, addr);
    },
    [onLocationSelected]
  );

  /** ⭐ 手動輸入地址 → move map */
  const handleAddressSubmit = async () => {
    if (!address) return;

    const loc = await geocodeAddress(address);
    if (loc) {
      setCenter(loc);
      setMarkerPos(loc);

      onLocationSelected(loc.lat, loc.lng, address);
    }
  };

  if (!isLoaded || !center) return <p>Loading map...</p>;

  return (
    <div>
      {/* ⭐ 地址輸入框 */}
      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          value={address}
          placeholder="Enter address"
          onChange={(e) => setAddress(e.target.value)}
          style={{
            width: "80%",
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            marginRight: "8px",
          }}
        />
        <button onClick={handleAddressSubmit} className="btn btn-primary">
          Set
        </button>
      </div>

      {/* ⭐ Google Map */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={15}
        onClick={handleMapClick}
      >
        {markerPos && <Marker position={markerPos} />}
      </GoogleMap>
    </div>
  );
};

export default LocationPickerMap;
