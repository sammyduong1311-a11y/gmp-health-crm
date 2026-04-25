import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://sglmiyehltjbiacjchxg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_MjcNNNwC6QOMQPBjIv3N3g_oeqTZKl_";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);