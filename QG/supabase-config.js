window.SUPABASE_URL = window.SUPABASE_URL || 'https://ojdfoxqkmwiolemqohqw.supabase.co';
window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZGZveHFrbXdpb2xlbXFvaHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NzI3NDcsImV4cCI6MjEwMDM0ODc0N30.CB8XMUsgj8GqB2FlVhlcxcSiRyVUab6Z8HsRlh6Onmc';

window.supabaseClient = window.supabaseClient || window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

window.supabase = window.supabaseClient;