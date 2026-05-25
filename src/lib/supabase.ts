// Supabase クライアント。鍵が無いときは null（アプリはモックにフォールバック）。
// React Native(Expo Go) では URL polyfill が必要。web では無害。
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from '../config';

export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage as any,
        autoRefreshToken: true,
        persistSession: true,
        // OAuth リダイレクトの URL 解析は使わない（匿名/マジックリンク運用）。
        detectSessionInUrl: false,
      },
    })
  : null;
