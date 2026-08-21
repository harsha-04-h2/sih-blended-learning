export async function callLLM(systemPrompt: string): Promise<{ text: string, ok: boolean }> {
  const provider = Deno.env.get('LLM_PROVIDER') || 'gemini';
  const baseUrl = Deno.env.get('LLM_BASE_URL') || 'http://host.docker.internal:1234/v1';
  const apiKey = Deno.env.get('LLM_API_KEY') || 'lm-studio';
  const model = Deno.env.get('LLM_MODEL') || 'local-model';

  let responseText = "";
  let isOk = false;

  try {
    if (provider === 'lmstudio') {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: systemPrompt }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        })
      });
      
      isOk = res.ok;
      if (!isOk) {
        console.warn(`LM Studio error: ${res.status} ${res.statusText}`);
        return { text: "", ok: false };
      }

      const json = await res.json();
      responseText = json.choices[0].message.content;
    } else {
      // Fallback to old Gemini logic for backwards compatibility if needed
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`;
      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: {
            response_mime_type: "application/json"
          }
        })
      });

      isOk = res.ok;
      if (!isOk) {
        console.warn(`Gemini error: ${res.status} ${res.statusText}`);
        return { text: "", ok: false };
      }

      const json = await res.json();
      responseText = json.candidates[0].content.parts[0].text;
    }

    // Strip Markdown backticks to be safe
    const cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
    return { text: cleanText, ok: isOk };

  } catch (err) {
    console.error("LLM Service Error:", err);
    return { text: "", ok: false };
  }
}
