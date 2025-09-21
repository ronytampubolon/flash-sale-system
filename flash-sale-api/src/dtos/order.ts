import { PurchaseStatus } from "../types";

interface PurchaseOrderDto {
    productId: string;
    userId?: string;
}
interface PurchaseStatusDto {
    status: PurchaseStatus;
}
interface IUserDto{
    email: string;
}
export { PurchaseOrderDto, PurchaseStatusDto, IUserDto }
