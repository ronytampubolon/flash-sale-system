import { fetchUtil } from '@/lib/fetchUtils';
import type { FlashSaleProduct, ProgramStatusResponse } from '@/types/Type';
import { injectable } from 'tsyringe';
import type { IFlashService } from './interface';

@injectable()
class FlashService implements IFlashService {
    async programStatus(): Promise<ProgramStatusResponse> {
        const response = await fetchUtil.get<{data: ProgramStatusResponse}>('/api/flash-sale/status');
        return response.data;
    }
    async flashProduct(): Promise<FlashSaleProduct> {
        const response = await fetchUtil.get<{data: FlashSaleProduct}>('/api/flash-sale/product');
        return response.data;
    }
}

export default FlashService;
