// Unsync Character Edge Function
// Clears the Owlbear sync for a character, allowing a new character to be synced

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept-encoding',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Helper: Create JSON response with optional compression (reduces egress costs)
function jsonResponse(data: any, status: number, req: Request): Response {
  const jsonString = JSON.stringify(data)
  const headers: Record<string, string> = { ...corsHeaders, 'Content-Type': 'application/json' }

  // Check if client supports gzip compression
  const acceptEncoding = req.headers.get('accept-encoding') || ''
  const supportsGzip = acceptEncoding.includes('gzip')

  if (supportsGzip && jsonString.length > 512) { // Only compress if > 512 bytes
    try {
      // Use CompressionStream API for gzip compression
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(jsonString))
          controller.close()
        }
      })

      const compressedStream = stream.pipeThrough(new CompressionStream('gzip'))
      headers['Content-Encoding'] = 'gzip'
      headers['Vary'] = 'Accept-Encoding'

      return new Response(compressedStream, { status, headers })
    } catch (e) {
      // Compression failed, return uncompressed
      console.warn('Compression failed:', e)
      return new Response(jsonString, { status, headers })
    }
  }

  return new Response(jsonString, { status, headers })
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, req)
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    const body = await req.json()
    const { owlbearPlayerId, supabaseUserId } = body

    if (!owlbearPlayerId && !supabaseUserId) {
      return jsonResponse({ error: 'owlbearPlayerId or supabaseUserId required' }, 400, req)
    }

    // Find the character to unsync
    let query = supabaseClient
      .from('clouds_characters')
      .select('dicecloud_character_id,user_id_dicecloud,character_name')

    // Prioritize supabase_user_id for authenticated users
    if (supabaseUserId) {
      query = query.eq('supabase_user_id', supabaseUserId).eq('is_active', true)
    } else if (owlbearPlayerId) {
      query = query.eq('owlbear_player_id', owlbearPlayerId).eq('is_active', true)
    }

    const { data: character, error: findError } = await query.single()

    if (findError) {
      if (findError.code === 'PGRST116') {
        return jsonResponse({ success: false, error: 'No active character found to unsync' }, 404, req)
      }
      return jsonResponse({ error: findError.message }, 500, req)
    }

    // Clear the owlbear_player_id and set is_active to false
    const { error: updateError } = await supabaseClient
      .from('clouds_characters')
      .update({
        owlbear_player_id: null,
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id_dicecloud', character.user_id_dicecloud)
      .eq('dicecloud_character_id', character.dicecloud_character_id)

    if (updateError) {
      return jsonResponse({ error: updateError.message }, 500, req)
    }

    return jsonResponse({
      success: true,
      message: `Character ${character.character_name} unsynced from Owlbear session`
    }, 200, req)

  } catch (error) {
    return jsonResponse({ error: error.message }, 500, req)
  }
})
