import { Response } from 'express';

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

export const sendResponse = <T>(
  res: Response,
  code: number,
  message: string,
  data?: T
) => {
  const response: ApiResponse<T> = {
    code,
    message,
    data,
  };

  return res.status(code).json(response);
};