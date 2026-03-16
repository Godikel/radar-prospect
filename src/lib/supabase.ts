import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://iykdrbvbotihaoizdwmp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5a2RyYnZib3RpaGFvaXpkd21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMTI0NDUsImV4cCI6MjA2NDY4ODQ0NX0.BoXL8JMYbvFgJMN0iL8MBOay5G0idARI2V68xbwSyXc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
