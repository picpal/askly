import { randomBytes } from "crypto";

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 6;

/**
 * 6자리 영숫자 대문자 세션 코드 생성
 * crypto.randomBytes(4)를 사용하여 암호학적으로 안전한 랜덤 코드 생성
 */
export function generateSessionCode(): string {
  const bytes = randomBytes(4);
  let code = "";

  for (let i = 0; i < CODE_LENGTH; i++) {
    // 바이트 값을 CHARSET 인덱스로 변환
    const index = bytes[i % bytes.length] % CHARSET.length;
    code += CHARSET[index];
  }

  return code;
}
