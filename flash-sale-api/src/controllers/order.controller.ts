import { Request, Response } from 'express';
import { sendResponse } from '../utils/response';
import { PurchaseOrderDto } from '../dtos/order';
import { purchaseSchema } from './schema';
import { inject, injectable } from 'tsyringe';
import { IOrderService } from '../services/interface';

@injectable()
class OrderController {
  constructor(@inject('IOrderService') private orderService: IOrderService) { }
  async purchase(req: Request, res: Response) {
    const user = (req as any).user;
    const param: PurchaseOrderDto = purchaseSchema.parse(req.body);
    param.userId = user.userData.id;
    const result = await this.orderService.purchase(param);
    sendResponse(res, 200, 'Purchase successful', result);
  }
  async getStatus(req: Request, res: Response) {
    const user = (req as any).user;
    const result = await this.orderService.getStatus(user.userData.id);
    sendResponse(res, 200, 'Order status', result);
  }
}
export default OrderController;