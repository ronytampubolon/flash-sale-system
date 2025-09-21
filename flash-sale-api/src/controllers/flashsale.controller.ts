import { Request, Response } from 'express';
import { sendResponse } from '../utils/response';
import { inject, injectable } from 'tsyringe';
import { IFlashSaleService } from '../services/interface';

@injectable()
class FlashSaleController {
  constructor(@inject('IFlashSaleService') private flashSaleService: IFlashSaleService) { }
  async getStatus(req: Request, res: Response) {
    const status = await this.flashSaleService.getStatus();
    sendResponse(res, 200, `Flash sale status ${status.isActive}`, status);
  }
  async getProduct(req: Request, res: Response) {
    const product = await this.flashSaleService.getCatalog();
    sendResponse(res, 200, 'Flash sale product', product);
  }
}
export default FlashSaleController;