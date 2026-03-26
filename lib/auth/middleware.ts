import { NextRequest } from "next/server";
import { verifyToken, type JWTPayload } from "./jwt";

/**
 * Authorization 헤더에서 Bearer 토큰을 추출하고 검증
 * 유효하지 않으면 null 반환
 */
export async function extractUser(
  req: NextRequest
): Promise<JWTPayload | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);

  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * 인증된 사용자의 역할을 확인
 * 인증 실패 시 401, 역할 불일치 시 403 에러를 throw
 */
export async function requireRole(
  req: NextRequest,
  ...roles: string[]
): Promise<JWTPayload> {
  const user = await extractUser(req);

  if (!user) {
    throw new AuthError(401, "Authentication required");
  }

  if (!roles.includes(user.role)) {
    throw new AuthError(
      403,
      `Forbidden: required role(s) [${roles.join(", ")}]`
    );
  }

  return user;
}

export class AuthError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}
