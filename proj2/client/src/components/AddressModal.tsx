import React from "react";
import LocationPickerMap from "./LocationPickerMap";
import "./AddressModal.css";

interface AddressModalProps {
  onClose: () => void;
  onSave: () => void;
  defaultLat: number;
  defaultLng: number;
  defaultAddress: string;
  setTempAddress: (address: { lat: number; lng: number; addr: string }) => void;
}

const AddressModal: React.FC<AddressModalProps> = ({
  onClose,
  onSave,
  defaultLat,
  defaultLng,
  defaultAddress,
  setTempAddress
}) => {
  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <h2>Set Your Location</h2>

        <LocationPickerMap
          defaultLat={defaultLat}
          defaultLng={defaultLng}
          defaultAddress={defaultAddress}
          onLocationSelected={(lat, lng, addr) => {
            setTempAddress({ lat, lng, addr });
          }}
        />

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={onSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressModal;
