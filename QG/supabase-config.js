// Configuración de conexión a Supabase.
// Completá estos dos valores con los tuyos:
// Project Settings → API → Project URL / anon public key
// (Nunca pongas acá la "service_role key" — esa es secreta.)

const SUPABASE_URL = 'https://ojdfoxqkmwiolemqohqw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZGZveHFrbXdpb2xlbXFvaHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NzI3NDcsImV4cCI6MjEwMDM0ODc0N30.CB8XMUsgj8GqB2FlVhlcxcSiRyVUab6Z8HsRlh6Onmc';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
