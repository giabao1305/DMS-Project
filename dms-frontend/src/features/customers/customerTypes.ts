export type CustomerStatus = "pending" | "approved" | "rejected";

export interface Customer {
  _id: string;

  name: string;
  phone: string;
  address: string;

  latitude?: number;
  longitude?: number;

  ownerName?: string;
  customerType?: string;

  assignedSeller?:
    | string
    | {
        _id: string;
        fullName?: string;
        email?: string;
        phone?: string;
        companyName?: string;
      };

  createdBy?:
    | string
    | {
        _id: string;
        fullName?: string;
        email?: string;
      };

  approvedBy?:
    | string
    | {
        _id: string;
        fullName?: string;
        email?: string;
      };

  status: CustomerStatus;

  isActive: boolean;

  rejectReason?: string;

  approvedAt?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone: string;
  address: string;

  latitude?: number;
  longitude?: number;

  ownerName?: string;
  customerType?: string;

  assignedSeller?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  phone?: string;
  address?: string;

  latitude?: number;
  longitude?: number;

  ownerName?: string;
  customerType?: string;

  assignedSeller?: string;

  isActive?: boolean;
}
