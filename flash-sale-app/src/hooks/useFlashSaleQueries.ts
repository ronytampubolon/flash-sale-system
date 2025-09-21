import { useQuery } from '@tanstack/react-query';
import FlashService from '@/services/flash.service';
import { container } from '@/config/container';

export function useFlashSaleQueries() {
    const flashService = container.resolve(FlashService);

    const { data: status, isLoading: isStatusLoading } = useQuery({
        queryKey: ['flash-sale-status'],
        queryFn: () => flashService.programStatus(),
    });

    const { data: product, isLoading: isProductLoading } = useQuery({
        queryKey: ['flash-sale-product'],
        queryFn: () => flashService.flashProduct()
    });

    return {
        status,
        product,
        isStatusLoading,
        isProductLoading,
        isLoading: isStatusLoading || isProductLoading,
    };
}