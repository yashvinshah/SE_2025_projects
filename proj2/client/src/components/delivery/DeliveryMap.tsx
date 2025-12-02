import React, { useEffect, useRef } from "react";

interface LatLng {
  lat: number;
  lng: number;
}

interface DeliveryMapProps {
  restaurant: LatLng;
  customer: LatLng;
  onDelivered?: () => void;
}

const DeliveryMap: React.FC<DeliveryMapProps> = ({
  restaurant,
  customer,
  onDelivered,
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const driverMarker = useRef<google.maps.Marker | null>(null);

  // ----------------------------------------
  // 1. 計算是否為無效座標（不能 early return）
  // ----------------------------------------
  const invalid =
    !restaurant ||
    !customer ||
    typeof restaurant.lat !== "number" ||
    typeof restaurant.lng !== "number" ||
    typeof customer.lat !== "number" ||
    typeof customer.lng !== "number" ||
    isNaN(restaurant.lat) ||
    isNaN(restaurant.lng) ||
    isNaN(customer.lat) ||
    isNaN(customer.lng);

  // ----------------------------------------
  // 2. useEffect 必須寫在最上面（React hook rule）
  // ----------------------------------------
  useEffect(() => {
    if (invalid) return; // 在 hook 內可以 return，不影響 hook order
    if (!mapRef.current) return;

    mapInstance.current = new google.maps.Map(mapRef.current, {
      center: restaurant,
      zoom: 14,
    });

    driverMarker.current = new google.maps.Marker({
      position: restaurant,
      map: mapInstance.current,
      title: "Delivery Driver",
    });
  }, [restaurant, invalid]);

  // ----------------------------------------
  // 3. 補充：動畫 function（跟 hook 無關，不會出錯）
  // ----------------------------------------
  const interpolate = (start: LatLng, end: LatLng, t: number): LatLng => ({
    lat: start.lat + (end.lat - start.lat) * t,
    lng: start.lng + (end.lng - start.lng) * t,
  });

  const startDeliveryAnimation = () => {
    if (invalid) return;

    if (!driverMarker.current || !mapInstance.current) return;

    const totalSteps = 20;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / totalSteps;

      const newPos = interpolate(restaurant, customer, progress);
      driverMarker.current?.setPosition(newPos);
      mapInstance.current?.panTo(newPos);

      if (currentStep >= totalSteps) {
        clearInterval(interval);
        onDelivered?.();
      }
    }, 1000);
  };

  // ----------------------------------------
  // 4. Early return 要放在 hook 之後（最底部）
  // ----------------------------------------
  if (invalid) {
    console.error("Invalid coordinates", { restaurant, customer });
    return (
      <div style={{ padding: "10px", color: "red" }}>
        ❌ Cannot render map: invalid coordinates
      </div>
    );
  }

  // ----------------------------------------
  // 5. 最終 JSX render
  // ----------------------------------------
  return (
    <div>
      <button className="btn btn-primary" onClick={startDeliveryAnimation}>
        Start Delivery
      </button>

      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "400px",
          borderRadius: "8px",
          marginTop: "12px",
        }}
      />
    </div>
  );
};

export default DeliveryMap;
