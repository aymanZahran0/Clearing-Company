import jwt from "jsonwebtoken";
import type { Role } from "@nuqaa-asir/shared";

export interface AccessTokenPayload {
  sub: string; // User.id
  role: Role;
  tokenVersion: number;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: jwt.SignOptions = {
    expiresIn: (process.env.JWT_ACCESS_TTL ?? "15m") as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign(payload, requireEnv("JWT_ACCESS_SECRET"), options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, requireEnv("JWT_ACCESS_SECRET")) as AccessTokenPayload;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string; // maps to RefreshToken.id for revocation lookups
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  const options: jwt.SignOptions = {
    expiresIn: (process.env.JWT_REFRESH_TTL ?? "30d") as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign(payload, requireEnv("JWT_REFRESH_SECRET"), options);
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, requireEnv("JWT_REFRESH_SECRET")) as RefreshTokenPayload;
}
