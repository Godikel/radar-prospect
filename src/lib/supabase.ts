import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://iykdrbvbotihaoizdwmp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5a2RyYnZib3RpaGFvaXpkd21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MDI2NzcsImV4cCI6MjA4NjI3ODY3N30.pkNPu0_GphCexS5tmU5zglDIbxEuDeVqcAiCdQHzcuo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
