export const VISITOR_ID_COOKIE = "visitor_id";
export const VISITOR_ID_MAX_AGE_SECONDS = 60 * 60 * 24 * 40;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string | undefined): value is string {
  return !!value && UUID_RE.test(value);
}
