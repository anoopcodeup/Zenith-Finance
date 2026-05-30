import { Request, Response } from "express";
import * as authService from "../services/auth.service";

/**
 * POST /auth/register
 */
export const registerUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.register(email, password);

  return res.status(201).json({
    message: "User registered successfully",
    ...result,
  });
};

/**
 * POST /auth/login
 */
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  return res.status(200).json({
    message: "Login successful",
    ...result,
  });
};

/**
 * POST /auth/refresh
 */
export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const tokens = await authService.refresh(refreshToken);

  return res.status(200).json(tokens);
};

/**
 * POST /auth/logout
 */
export const logoutUser = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  await authService.logout(refreshToken);

  return res.status(200).json({
    message: "Logged out successfully",
  });
};

/**
 * GET /auth/me
 */
export const getMe = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const user = await authService.getCurrentUser(userId);

  return res.status(200).json(user);
};
