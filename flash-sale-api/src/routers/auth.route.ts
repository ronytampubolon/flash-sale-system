import { Router } from 'express';
import { container } from 'tsyringe';
import AuthController from '../controllers/auth.controller';
import asyncHandler from '../utils/asyncHandlers';
import { IUserService } from '../services/interface';
import UserService from '../services/user.service';

const router = Router();
// Register services with DI container
container.register<IUserService>('IUserService', {
  useClass: UserService
});

const authController = container.resolve(AuthController);
router.post('/login', asyncHandler(authController.login.bind(authController)));
export default router;