import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendResponse } from '../utils/response';
import { IUser } from '../types';

const authHandler = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    if (!token) {
        return sendResponse(res, 401, 'Unauthorized',null);
    }
    try {
        const user = jwt.verify(token, process.env.JWT_SECRET || 'secret') as IUser;
        (req as any).user = user;
        next();
    } catch (err) {
        if (err instanceof jwt.JsonWebTokenError) {
            return sendResponse(res, 403, 'Invalid token or Expired token',null);
        }
        sendResponse(res, 500, 'Internal server error',null);
    }
}
export default authHandler;
