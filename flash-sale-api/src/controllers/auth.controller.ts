import { Request, Response } from 'express';

import { sendResponse } from '../utils/response';
import { authUserSchema } from './schema';
import { inject, injectable } from 'tsyringe';
import { IUserService } from '../services/interface';

@injectable()
class AuthController {
  constructor(@inject('IUserService') private userService: IUserService) { }
  async login(req: Request, res: Response) {
    const { email } = authUserSchema.parse(req.body);
    const userData = await this.userService.syncUserData(email);
    const token = await this.userService.generateToken(userData);
    sendResponse(res, 200, 'Login successful', token);
  }
}

export default AuthController;