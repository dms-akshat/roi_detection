import { createClient } from "@supabase/supabase-js"

let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

  const { data, error } = await supabase.auth.api.createJWT({
    role: 'authenticated', // Ensure your JWT has the correct role
    permissions: ['storage.read', 'storage.write'] // Adjust as per your needs
  });

  if (error) {
    console.error('Error generating token:', error);
    return;
  }

  console.log('Generated Blob Read/Write Token:', data);

  return supabaseClient
}


// export async function getBlobReadWriteToken() {
//   const { data, error } = await supabase.auth.api.createJWT({
//     role: 'authenticated', // Ensure your JWT has the correct role
//     permissions: ['storage.read', 'storage.write'] // Adjust as per your needs
//   });

//   if (error) {
//     console.error('Error generating token:', error);
//     return;
//   }

//   console.log('Generated Blob Read/Write Token:', data);
// }
