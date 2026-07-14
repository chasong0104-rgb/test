// Supabase 프로젝트 설정 (Firebase 에서 이전)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://qytspnzohmraaqfhxbcr.supabase.co";
// 공개(publishable) 키 — 클라이언트에 노출되어도 되는 값입니다.
// 실제 데이터 보호는 서버의 RLS(행 수준 보안) 정책이 담당합니다.
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_TZcZV3W1IKfDdUMV0-odZw_b3kSW-yU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
