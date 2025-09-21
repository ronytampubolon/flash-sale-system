import { PurchaseOrderDto, PurchaseStatusDto } from "../../dtos/order";
import { IFlashProduct, IProgramStatus } from "../../dtos/program.status";
import { TokenResponse } from "../../dtos/token";
import { UserDto } from "../../dtos/user.dto";
interface IUserService {
    syncUserData(email: string): Promise<UserDto>;
    generateToken(userData: UserDto): Promise<TokenResponse>;
}
interface IOrderService {
    purchase(request: PurchaseOrderDto): Promise<PurchaseStatusDto>;
    getStatus(userId: string): Promise<PurchaseStatusDto>;
}
interface IFlashSaleService {
    getStatus(): Promise<IProgramStatus>;
    getCatalog(): Promise<IFlashProduct>;
}
interface IOrderQueueService {
    processOrderQueue(order: PurchaseOrderDto): Promise<void>;
}
export { IUserService, IOrderService, IFlashSaleService, IOrderQueueService }