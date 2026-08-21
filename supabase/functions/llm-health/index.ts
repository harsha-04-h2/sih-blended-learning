import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { callLLM } from "../_shared/llm.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } })
  }

  try {
    const provider = Deno.env.get('LLM_PROVIDER') || 'gemini';
    const model = Deno.env.get('LLM_MODEL') || 'local-model';

    // Simple ping to test connectivity
    const { ok } = await callLLM("Hello! Just reply with 'OK' in JSON format like {\"status\": \"OK\"}");

    if (ok) {
      return new Response(
        JSON.stringify({ provider, connected: true, model }),
        { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      )
    } else {
      return new Response(
        JSON.stringify({ 
          error: "Local AI server unavailable.",
          message: "Please start LM Studio and enable the local server." 
        }),
        { status: 503, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      )
    }

  } catch (error) {
    console.error("LLM Health Error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Access-Control-Allow-Origin": "*" } })
  }
})
