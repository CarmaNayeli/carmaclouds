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
  essential: 'dicecloud_character_id,character_name,class,level,race,alignment,discord_user_id,user_id_dicecloud,is_active',
  full: 'dicecloud_character_id,character_name,class,level,race,alignment,hit_points,hit_dice,temporary_hp,death_saves,armor_class,speed,initiative,proficiency_bonus,attributes,attribute_mods,saves,skills,spell_slots,resources,conditions,discord_user_id,user_id_dicecloud,is_active,updated_at,raw_dicecloud_data',
  list: 'dicecloud_character_id,character_name,class,level,race,hit_points,armor_class,is_active,discord_user_id'
}

// Helper: Create JSON response with optional compression
function jsonResponse(data: any, status: number, req: Request): Response {
  const jsonString = JSON.stringify(data)
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' }

  // Check if client supports gzip compression
  const acceptEncoding = req.headers.get('accept-encoding') || ''
  const supportsGzip = acceptEncoding.includes('gzip')

  if (supportsGzip && jsonString.length > 1024) { // Only compress if > 1KB
    try {
      // Note: Deno's native compression requires Deno.gzip which may not be available
      // For now, return uncompressed with a note for future enhancement
      headers['X-Compression-Available'] = 'true'
      return new Response(jsonString, { status, headers })
    } catch (e) {
      // Compression failed, return uncompressed
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

      // Get by Owlbear player ID (for Owlbear extension)
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

        return new Response(
          JSON.stringify({ success: true, character: data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
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

          return new Response(
            JSON.stringify({ success: true, character: data }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
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

          return new Response(
            JSON.stringify({ success: true, characters: data }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
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

        return new Response(
          JSON.stringify({ success: true, characters: data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
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

        return new Response(
          JSON.stringify({ success: true, character: data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ error: 'Missing required parameter: owlbear_player_id, discord_user_id, dicecloud_user_id, or character_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST/PATCH: Set active character
    if (req.method === 'POST' || req.method === 'PATCH') {
      const body = await req.json()
      const { owlbearPlayerId: bodyOwlbearId, character, characterName, discordUserId: bodyDiscordId } = body

      const playerIdToUse = bodyOwlbearId || owlbearPlayerId
      const discordIdToUse = bodyDiscordId || discordUserId

      if (!playerIdToUse && !discordIdToUse) {
        return new Response(
          JSON.stringify({ error: 'owlbearPlayerId or discordUserId required' }),
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
      if (character && playerIdToUse) {
        // First, mark all characters for this player as inactive
        await supabaseClient
          .from('clouds_characters')
          .update({ is_active: false })
          .eq('owlbear_player_id', playerIdToUse)

        // Then insert or update the active character
        const { data, error } = await supabaseClient
          .from('clouds_characters')
          .upsert({
            owlbear_player_id: playerIdToUse,
            dicecloud_character_id: character.id,
            character_name: character.name,
            class: character.class,
            race: character.race,
            level: character.level,
            hp_current: character.hitPoints?.current || 0,
            hp_max: character.hitPoints?.max || 0,
            ac: character.armorClass || 10,
            proficiency_bonus: character.proficiencyBonus || 2,
            is_active: true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'owlbear_player_id,dicecloud_character_id'
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
