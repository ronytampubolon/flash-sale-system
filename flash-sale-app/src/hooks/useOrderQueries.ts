import { useMutation, useQuery } from '@tanstack/react-query';
import { container } from '@/config/container';
import OrderService from '@/services/order.service';
import type { ApiError, PurchaseRequest, PurchaseStatusResponse } from '@/types/Type';
import { useAuth } from '@/context/useAuth';

export function useOrderQueries() {
    const orderService = container.resolve(OrderService);
    const { isAuthenticated } = useAuth();

    const { data: orderStatus, isLoading: isStatusLoading } = useQuery({
        queryKey: ['flash-order-status'],
        queryFn: () => orderService.status(),
        enabled: isAuthenticated
    });
    const purchaseMutation = useMutation<PurchaseStatusResponse, ApiError, PurchaseRequest>({
        mutationFn: async (data: PurchaseRequest) => {
            const response = await orderService.purchase(data);
            return response;
        },
        onError: (error: ApiError) => {
            console.error('Purchase failed:', error.message);
        },
    });

    return {
        orderStatus,
        purchaseMutation,
        isStatusLoading,
        isLoading: isStatusLoading || purchaseMutation.isPending,
    };
}