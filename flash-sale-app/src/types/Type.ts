export interface LoginRequest {
  email: string;
  password?: string;
}
export interface PurchaseRequest {
    productId: string;
}

export interface AuthResponse {
  token: string;
  expiredAt: string;
}

export interface ProgramStatusResponse {
  isActive: boolean;
}

export interface PurchaseStatusResponse {
    status: string;
}

export interface ApiError {
  message: string;
  status: number;
}

export interface FlashSaleProduct {
  id: string;
  name: string;
  price: number;
  thumbnail: string;
}
