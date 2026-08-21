import "server-only";

import { randomBytes } from "node:crypto";

/**
 * 공유 링크 토큰.
 *
 * URL에 들어가는 유일한 열쇠라서 추측 가능하면 안 된다. 128비트 난수를
 * base64url로 담아 22자가 되며, DB의 result_shares_token_format_check
 * (`^[A-Za-z0-9_-]{16,64}$`)를 그대로 만족한다.
 *
 * requestId(UUID)를 재사용하지 않는 이유는 마이그레이션 주석에 있다 —
 * 회수할 수 없는 링크가 되기 때문이다.
 */
export function createShareToken() {
  return randomBytes(16).toString("base64url");
}
