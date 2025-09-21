import { Router } from 'express';
import asyncHandler from '../utils/asyncHandlers';
import { IFlashSaleService } from '../services/interface';
import FlashSaleController from '../controllers/flashsale.controller';
import { container } from 'tsyringe';
import FlashSaleService from '../services/flashsale.service';

const router = Router();
// Register services with DI container
container.register<IFlashSaleService>('IFlashSaleService', {
    useClass: FlashSaleService
});

const flashSaleController = container.resolve(FlashSaleController);
router.get('/status', asyncHandler(flashSaleController.getStatus.bind(flashSaleController)));
router.get('/product', asyncHandler(flashSaleController.getProduct.bind(flashSaleController)));
export default router;