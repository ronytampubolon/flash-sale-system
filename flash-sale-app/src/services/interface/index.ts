import type { AuthResponse, FlashSaleProduct, LoginRequest, ProgramStatusResponse, PurchaseRequest, PurchaseStatusResponse } from "@/types/Type";

interface IAuthService {
    login(data: LoginRequest): Promise<AuthResponse>;
}
interface IFlashService {
    programStatus(): Promise<ProgramStatusResponse>;
    flashProduct(): Promise<FlashSaleProduct>;
}
interface IOrderService {
    purchase(data: PurchaseRequest): Promise<PurchaseStatusResponse>;
    status(): Promise<PurchaseStatusResponse>;
}

export type { IAuthService, IFlashService, IOrderService }
