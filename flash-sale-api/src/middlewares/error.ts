import { ErrorRequestHandler } from 'express';
import { sendResponse } from '../utils/response';
import { ZodError } from 'zod';
import { BadRequestException } from '../exceptions/badrequest.exception';
import { NotFoundException } from '../exceptions/notfound.exception';

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    if(err instanceof ZodError){
        sendResponse(res, 422, 'Validation failed', err.issues.map((issue) => issue.message));
    }else if(err instanceof BadRequestException){
        sendResponse(res, 400, `Bad request ${err.message}`,null);
    }else if(err instanceof NotFoundException){
        sendResponse(res, 404, `Not Found ${err.message}`,null);
    }else{
      sendResponse(res, 500, err.message || 'Internal Server Error', {
        success: false,
      });
    }
};

export default errorHandler;