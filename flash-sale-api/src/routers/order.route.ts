import { Router } from 'express';
import asyncHandler from '../utils/asyncHandlers';
import authHandler from '../middlewares/auth';
import OrderController from '../controllers/order.controller';
import OrderService from '../services/order.service';
import { IOrderService } from '../services/interface';
import { container } from 'tsyringe';

const router = Router();
// Register services with DI container
container.register<IOrderService>('IOrderService', {
    useClass: OrderService
});

const orderController = container.resolve(OrderController);

router.post('/purchase', authHandler, asyncHandler(orderController.purchase.bind(orderController)));
router.get('/purchase/status', authHandler, asyncHandler(orderController.getStatus.bind(orderController)));
export default router;