const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vkkrnepveivqymcmondu.supabase.co';
const supabaseServiceRoleKey  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZra3JuZXB2ZWl2cXltY21vbmR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzI3NzE1MSwiZXhwIjoyMDUyODUzMTUxfQ.XlABEUfMZxC04Ldts_a8gcO9XQQJ2TF_in8RwhA-ji8';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey );

module.exports = supabase;