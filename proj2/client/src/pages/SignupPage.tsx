import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import "./AuthPage.css";

// ⭐ Google Geocoding address component 型別
type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "customer" as "customer" | "restaurant" | "delivery",
    profile: {
      name: "",
      phone: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
      },
      location: { lat: null as number | null, lng: null as number | null },
      cuisine: "",
      description: "",
      vehicleType: "",
      licensePlate: "",
    },
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  /** ⭐ Reverse geocoding：lat,lng → address */
  const reverseGeocode = async (lat: number, lng: number) => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

    const res = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );

    if (res.data.status !== "OK") {
      throw new Error("Failed to reverse geocode");
    }

    const place = res.data.results[0];
    const components = place.address_components as AddressComponent[];

    const findComponent = (type: string) =>
      components.find((c: AddressComponent) => c.types.includes(type))
        ?.long_name || "";

    const streetNumber = findComponent("street_number");
    const streetName = findComponent("route");
    const city = findComponent("locality");
    const state = findComponent("administrative_area_level_1");
    const zipCode = findComponent("postal_code");

    return {
      street:
        streetNumber && streetName
          ? `${streetNumber} ${streetName}`
          : streetName,
      city,
      state,
      zipCode,
    };
  };

  /** ⭐ 用戶點擊「Use my current location」 */
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Your browser does not support Geolocation.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          console.log("User coordinates:", lat, lng);

          const addr = await reverseGeocode(lat, lng);

          setFormData((prev) => ({
            ...prev,
            profile: {
              ...prev.profile,
              location: { lat, lng },
              address: addr,
            },
          }));

          alert("Location auto-filled!");
        } catch (err) {
          console.error(err);
          alert("Failed to fetch your address.");
        }
      },
      (err) => {
        console.error(err);
        alert("Unable to access your location.");
      }
    );
  };

  /** ⭐ 處理 input change */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name.startsWith("profile.address.")) {
      const key = name.split(".")[2];
      setFormData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          address: {
            ...prev.profile.address,
            [key]: value,
          },
        },
      }));
    } else if (name.startsWith("profile.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          [key]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  /** ⭐ 提交表單 */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(formData);
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /** ⭐ 動態欄位（restaurant / delivery） */
  const renderRoleSpecificFields = () => {
    switch (formData.role) {
      case "restaurant":
        return (
          <>
            <div className="form-group">
              <label htmlFor="profile.cuisine">Cuisine Type</label>
              <input
                type="text"
                id="profile.cuisine"
                name="profile.cuisine"
                value={formData.profile.cuisine}
                onChange={handleChange}
                placeholder="e.g. Italian"
              />
            </div>

            <div className="form-group">
              <label htmlFor="profile.description">
                Restaurant Description
              </label>
              <textarea
                id="profile.description"
                name="profile.description"
                value={formData.profile.description}
                onChange={handleChange}
                rows={3}
                placeholder="Tell us about your restaurant"
              />
            </div>
          </>
        );
      case "delivery":
        return (
          <>
            <div className="form-group">
              <label htmlFor="profile.vehicleType">Vehicle Type</label>
              <select
                id="profile.vehicleType"
                name="profile.vehicleType"
                value={formData.profile.vehicleType}
                onChange={handleChange}
              >
                <option value="">Select vehicle type</option>
                <option value="car">Car</option>
                <option value="motorcycle">Motorcycle</option>
                <option value="bicycle">Bicycle</option>
                <option value="scooter">Scooter</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="profile.licensePlate">License Plate</label>
              <input
                type="text"
                id="profile.licensePlate"
                name="profile.licensePlate"
                value={formData.profile.licensePlate}
                onChange={handleChange}
                placeholder="ABC-1234"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>🐺 Join the Hungry Wolf Pack</h1>
          <p>Start your food adventure today</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          {/* Email */}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {/* Role */}
          <div className="form-group">
            <label>I want to join as:</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="customer">Customer</option>
              <option value="restaurant">Restaurant Owner</option>
              <option value="delivery">Delivery Partner</option>
            </select>
          </div>

          {/* Name */}
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="profile.name"
              required
              value={formData.profile.name}
              onChange={handleChange}
            />
          </div>

          {/* Phone */}
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="profile.phone"
              required
              value={formData.profile.phone}
              onChange={handleChange}
            />
          </div>

          {/* Address */}
          <div className="address-section">
            <h3>Address Information</h3>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleUseCurrentLocation}
            >
              📍 Use My Current Location
            </button>

            <div className="form-group">
              <label>Street</label>
              <input
                type="text"
                name="profile.address.street"
                value={formData.profile.address.street}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="profile.address.city"
                  value={formData.profile.address.city}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  name="profile.address.state"
                  value={formData.profile.address.state}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>ZIP</label>
                <input
                  type="text"
                  name="profile.address.zipCode"
                  value={formData.profile.address.zipCode}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {renderRoleSpecificFields()}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Join the Pack"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
