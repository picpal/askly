import { SignJWT, jwtVerify, type JWTPayload as JoseJWTPayload } from "jose";

export interface JWTPayload extends JoseJWTPayload {
  sub: string;
  sessionId: string;
  userId: string;
  role: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

/**
 * 커스텀 JWT 발급
 * - 24시간 만료
 */
export async function mintToken(payload: {
  sub: string;
  sessionId: string;
  userId: string;
  role: string;
}): Promise<string> {
  const secret = getSecret();

  return new SignJWT({
    sessionId: payload.sessionId,
    userId: payload.userId,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

/**
 * JWT 검증 + 디코드
 */
export async function verifyToken(token: string): Promise<JWTPayload> {
  const secret = getSecret();

  const { payload } = await jwtVerify(token, secret);

  return payload as JWTPayload;
}
