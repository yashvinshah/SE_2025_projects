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
  const restaurantMarker = useRef<google.maps.Marker | null>(null);
  const customerMarker = useRef<google.maps.Marker | null>(null);

  /** Linear Interpolation */
  const interpolate = (start: LatLng, end: LatLng, t: number): LatLng => ({
    lat: start.lat + (end.lat - start.lat) * t,
    lng: start.lng + (end.lng - start.lng) * t,
  });

  /** Initialize map + markers */
  useEffect(() => {
    if (!mapRef.current) return;

    // 🌟 調整 zoom 更近（15 或 16 都可以）
    mapInstance.current = new google.maps.Map(mapRef.current, {
      center: restaurant,
      zoom: 16, // ⭐ 調近視角
    });

    // 🟣 Restaurant Pin
    restaurantMarker.current = new google.maps.Marker({
      position: restaurant,
      map: mapInstance.current,
      title: "Restaurant",
      label: {
        text: "Restaurant",
        color: "white",
        fontWeight: "bold",
      },
      icon: {
        url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
      },
    });

    // 🔵 Customer Pin
    customerMarker.current = new google.maps.Marker({
      position: customer,
      map: mapInstance.current,
      title: "Your Location",
      label: {
        text: "You",
        color: "white",
        fontWeight: "bold",
      },
      icon: {
        url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      },
    });

    // 🚚 Delivery Driver Marker
    driverMarker.current = new google.maps.Marker({
      position: restaurant,
      map: mapInstance.current,
      title: "Delivery Driver",
      icon: {
        url: "../../../icons/delivery-man.png", // ⭐ 使用卡車圖示
        scaledSize: new google.maps.Size(40, 40), // ⭐ 大小（你可以調整）
        anchor: new google.maps.Point(20, 20), // ⭐ 錨點（讓圖居中）
      },
    });
  }, [restaurant, customer]);

  /** Start Animation */
  const startDeliveryAnimation = () => {
    if (!driverMarker.current || !mapInstance.current) return;

    const duration = 20; // 20 seconds (maintain for now)
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / duration;

      const newPos = interpolate(restaurant, customer, progress);
      driverMarker.current?.setPosition(newPos);
      mapInstance.current?.panTo(newPos);

      if (currentStep >= duration) {
        clearInterval(interval);
        onDelivered?.();
      }
    }, 1000);
  };

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
