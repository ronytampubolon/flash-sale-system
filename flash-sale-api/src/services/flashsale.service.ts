import { appConfig, singleFlashProduct } from "../config/app";
import { IFlashProduct, IProgramStatus, ProgramStatus } from "../dtos/program.status";
import { IFlashSaleService } from "./interface";
import moment from 'moment';

import { injectable } from "tsyringe";

@injectable()
class FlashSaleService implements IFlashSaleService {
    static readonly FLASH_START_FORMAT = "MM/DD/YYYY hh:mm:ss";

    async getStatus(): Promise<IProgramStatus> {
        const now = moment();
        const startDateTime = moment(appConfig.flashStart, FlashSaleService.FLASH_START_FORMAT);
        const endDateTime = moment(appConfig.flashEnd, FlashSaleService.FLASH_START_FORMAT);
        if (appConfig.flashStatus && now.isBetween(startDateTime, endDateTime)) {
            return ProgramStatus.Active;
        }
        return ProgramStatus.Inactive;
    }
    async getCatalog(): Promise<IFlashProduct> {
        return singleFlashProduct;
    }
}

export default FlashSaleService;