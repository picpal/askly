import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Admin 클라이언트 (service_role 키 사용)
 * RLS를 우회하여 서버 측 DB 작업에 사용
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
