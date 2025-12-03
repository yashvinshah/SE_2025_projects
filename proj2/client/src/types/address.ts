// src/types/address.ts
export interface StructuredAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface FullAddress extends StructuredAddress {
  fullAddress: string;
}
