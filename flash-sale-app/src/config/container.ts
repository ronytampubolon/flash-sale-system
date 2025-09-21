import { container } from 'tsyringe';
import AuthService from '@/services/auth.service';
import type { IFlashService } from '@/services/interface';
import FlashService from '@/services/flash.service';
import type { IOrderService } from '@/services/interface';
import OrderService from '@/services/order.service';

// Register AuthService
container.registerSingleton('AuthService', AuthService);

export { container };

// Register FlashService
container.register<IFlashService>('IFlashService', {
    useClass: FlashService
});

// Register OrderService
container.register<IOrderService>('IOrderService', {
    useClass: OrderService
});