import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { HttpError } from "../utils/httpError";
import { setCsrfCookie, clearCsrfCookie } from "../middlewares/csrf.middleware";

const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
};

/**
 * POST /auth/register
 */
export const registerUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.register(email, password);

  setRefreshTokenCookie(res, refreshToken);
  setCsrfCookie(res);

  return res.status(201).json({
    message: "User registered successfully",
    user,
    accessToken,
  });
};

/**
 * POST /auth/login
 */
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login(email, password);

  setRefreshTokenCookie(res, refreshToken);
  setCsrfCookie(res);

  return res.status(200).json({
    message: "Login successful",
    user,
    accessToken,
  });
};

/**
 * POST /auth/refresh
 */
export const refreshToken = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    throw new HttpError("Refresh token required", 400);
  }
  const tokens = await authService.refresh(token);

  setRefreshTokenCookie(res, tokens.refreshToken);
  setCsrfCookie(res);

  return res.status(200).json({
    accessToken: tokens.accessToken,
  });
};

/**
 * POST /auth/logout
 */
export const logoutUser = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    throw new HttpError("Refresh token required", 400);
  }
  await authService.logout(token);

  clearRefreshTokenCookie(res);
  clearCsrfCookie(res);

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
