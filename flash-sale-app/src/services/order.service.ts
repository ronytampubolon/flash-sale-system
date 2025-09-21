import { fetchUtil } from '@/lib/fetchUtils';
import type { PurchaseRequest, PurchaseStatusResponse } from '@/types/Type';
import { injectable } from 'tsyringe';
import type { IOrderService } from './interface';

@injectable()
class OrderService implements IOrderService {
    async status(): Promise<PurchaseStatusResponse> {
        const response = await fetchUtil.get<{data: PurchaseStatusResponse}>('/api/orders/purchase/status');
        return response.data;
    }
    async purchase(data: PurchaseRequest): Promise<PurchaseStatusResponse> {
        const response = await fetchUtil.post<{data: PurchaseStatusResponse}>('/api/orders/purchase', data);
        return response.data;
    }
}

export default OrderService;
