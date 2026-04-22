// ═══════════════════════════════════════════════════════
//  SUPABASE.JS — Client initialization
// ═══════════════════════════════════════════════════════

const SUPABASE_URL  = 'https://ivvpxcihjtbdqgcnqpil.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2dnB4Y2loanRiZHFnY25xcGlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NjM4MzYsImV4cCI6MjA5MjQzOTgzNn0.qcaON6fQKMyvIyICwWUWBYuSCeiNakV2nNY2eWqZYwM';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
