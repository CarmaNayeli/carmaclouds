// Unified Characters Edge Function
// Combines get-active-character, get-all-characters, and set-active-character
// Reduces cold starts, connection overhead, and egress costs via compression

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept-encoding',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
}

// Optimized field selections (reduces egress!)
const FIELDS = {
  essential: 'dicecloud_character_id,character_name,class,level,race,alignment,discord_user_id,user_id_dicecloud,supabase_user_id,is_active',
  full: 'dicecloud_character_id,character_name,class,level,race,alignment,hit_points,hit_dice,temporary_hp,death_saves,armor_class,speed,initiative,proficiency_bonus,attributes,attribute_mods,saves,skills,spell_slots,resources,conditions,discord_user_id,user_id_dicecloud,supabase_user_id,owlbear_player_id,is_active,updated_at,raw_dicecloud_data',
  list: 'dicecloud_character_id,character_name,class,level,race,hit_points,armor_class,is_active,discord_user_id,supabase_user_id'
}

// Helper: Generate ETag from data
function generateETag(data: any): string {
  // Simple hash based on JSON string
  const jsonString = JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return `"${Math.abs(hash).toString(36)}"`
}

// Helper: Create JSON response with ETag and optional compression
function jsonResponse(data: any, status: number, req: Request): Response {
  const jsonString = JSON.stringify(data)
  const headers: Record<string, string> = { ...corsHeaders, 'Content-Type': 'application/json' }

  // Generate and add ETag for caching
  const etag = generateETag(data)
  headers['ETag'] = etag
  headers['Cache-Control'] = 'private, must-revalidate'

  // Check if client's cached version matches
  const ifNoneMatch = req.headers.get('if-none-match')
  if (ifNoneMatch && ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers: { ...headers, 'Content-Length': '0' }
    })
  }

  // Check if client supports gzip compression
  const acceptEncoding = req.headers.get('accept-encoding') || ''
  const supportsGzip = acceptEncoding.includes('gzip')

  if (supportsGzip && jsonString.length > 1024) { // Only compress if > 1KB
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

    const url = new URL(req.url)
    const owlbearPlayerId = url.searchParams.get('owlbear_player_id')
    const supabaseUserId = url.searchParams.get('supabase_user_id')
    const discordUserId = url.searchParams.get('discord_user_id')
    const diceCloudUserId = url.searchParams.get('dicecloud_user_id')
    const characterId = url.searchParams.get('character_id')
    const fields = url.searchParams.get('fields') || 'full'

    // Determine which fields to select
    const selectFields = FIELDS[fields as keyof typeof FIELDS] || FIELDS.full

    // GET: Retrieve characters
    if (req.method === 'GET') {
      let query = supabaseClient
        .from('clouds_characters')
        .select(selectFields)

      // Get by Supabase user ID (for authenticated cross-device sync)
      if (supabaseUserId) {
        const activeOnly = url.searchParams.get('active_only') === 'true'

        if (activeOnly) {
          // Get active character only
          const { data, error } = await query
            .eq('supabase_user_id', supabaseUserId)
            .eq('is_active', true)
            .single()

          if (error && error.code !== 'PGRST116') {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return jsonResponse({ success: true, character: data }, 200, req)
        } else {
          // Get all characters for user
          const { data, error } = await query
            .eq('supabase_user_id', supabaseUserId)
            .order('is_active', { ascending: false })
            .order('character_name', { ascending: true })

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return jsonResponse({ success: true, characters: data }, 200, req)
        }
      }

      // Get by Owlbear player ID (for Owlbear extension - fallback for non-authenticated)
      if (owlbearPlayerId) {
        const { data, error } = await query
          .eq('owlbear_player_id', owlbearPlayerId)
          .eq('is_active', true)
          .single()

        if (error && error.code !== 'PGRST116') {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return jsonResponse({ success: true, character: data }, 200, req)
      }

      // Get by Discord user ID (for Discord bot)
      if (discordUserId) {
        const activeOnly = url.searchParams.get('active_only') === 'true'

        if (activeOnly) {
          // Get active character only
          const { data, error } = await query
            .eq('discord_user_id', discordUserId)
            .eq('is_active', true)
            .single()

          if (error && error.code !== 'PGRST116') {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return jsonResponse({ success: true, character: data }, 200, req)
        } else {
          // Get all characters for user
          const { data, error } = await query
            .eq('discord_user_id', discordUserId)
            .order('is_active', { ascending: false })
            .order('character_name', { ascending: true })

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return jsonResponse({ success: true, characters: data }, 200, req)
        }
      }

      // Get by DiceCloud user ID
      if (diceCloudUserId) {
        const { data, error } = await query.eq('user_id_dicecloud', diceCloudUserId)

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return jsonResponse({ success: true, characters: data }, 200, req)
      }

      // Get by character ID
      if (characterId) {
        const { data, error } = await query
          .eq('dicecloud_character_id', characterId)
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return jsonResponse({ success: true, character: data }, 200, req)
      }

      return new Response(
        JSON.stringify({ error: 'Missing required parameter: supabase_user_id, owlbear_player_id, discord_user_id, dicecloud_user_id, or character_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST/PATCH: Set active character
    if (req.method === 'POST' || req.method === 'PATCH') {
      const body = await req.json()
      const { owlbearPlayerId: bodyOwlbearId, supabaseUserId: bodySupabaseId, character, characterName, discordUserId: bodyDiscordId } = body

      const playerIdToUse = bodyOwlbearId || owlbearPlayerId
      const supabaseIdToUse = bodySupabaseId || supabaseUserId
      const discordIdToUse = bodyDiscordId || discordUserId

      if (!playerIdToUse && !discordIdToUse && !supabaseIdToUse) {
        return new Response(
          JSON.stringify({ error: 'owlbearPlayerId, supabaseUserId, or discordUserId required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Set active character by name (for Discord commands)
      if (characterName && discordIdToUse) {
        // First, mark all characters as inactive
        await supabaseClient
          .from('clouds_characters')
          .update({ is_active: false })
          .eq('discord_user_id', discordIdToUse)

        // Then set the named character as active
        const { data, error } = await supabaseClient
          .from('clouds_characters')
          .update({ is_active: true })
          .eq('discord_user_id', discordIdToUse)
          .ilike('character_name', characterName)
          .select(selectFields)
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, character: data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Set active character for Owlbear player
      if (character && (playerIdToUse || supabaseIdToUse)) {
        // First, mark all characters for this user as inactive
        // Prioritize supabase_user_id for authenticated users
        if (supabaseIdToUse) {
          await supabaseClient
            .from('clouds_characters')
            .update({ is_active: false })
            .eq('supabase_user_id', supabaseIdToUse)
        } else if (playerIdToUse) {
          await supabaseClient
            .from('clouds_characters')
            .update({ is_active: false })
            .eq('owlbear_player_id', playerIdToUse)
        }

        // Build upsert data - include both IDs if available
        const upsertData: any = {
          user_id_dicecloud: character.userId || character.user_id_dicecloud,
          dicecloud_character_id: character.id,
          character_name: character.name,
          class: character.class,
          race: character.race,
          level: character.level,
          hit_points: character.hitPoints || { current: 0, max: 0 },
          armor_class: character.armorClass || 10,
          proficiency_bonus: character.proficiency_bonus || character.proficiencyBonus || 2,
          raw_dicecloud_data: character,
          is_active: true,
          updated_at: new Date().toISOString()
        }

        if (playerIdToUse) {
          upsertData.owlbear_player_id = playerIdToUse
        }

        if (supabaseIdToUse) {
          upsertData.supabase_user_id = supabaseIdToUse
        }

        // Then insert or update the active character
        const { data, error } = await supabaseClient
          .from('clouds_characters')
          .upsert(upsertData, {
            onConflict: 'user_id_dicecloud,dicecloud_character_id'
          })
          .select(selectFields)
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, character: data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
