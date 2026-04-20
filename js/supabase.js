// ═══════════════════════════════════════════════════════
//  SUPABASE.JS — Client initialization
// ═══════════════════════════════════════════════════════

const SUPABASE_URL  = 'https://cvkdmsycgtizkgxvvlzh.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a2Rtc3ljZ3RpemtneHZ2bHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTc4MjEsImV4cCI6MjA5MjIzMzgyMX0.x53N5rwIGxj_nolYjBEo5uQcK2SAcOacKzYk5Z5EqYg';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
