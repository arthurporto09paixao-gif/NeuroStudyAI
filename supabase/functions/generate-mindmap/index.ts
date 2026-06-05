import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { text, title } = await req.json();
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      return new Response(
        JSON.stringify({
          mind_map: {
            title: title || "Mapa Mental",
            nodes: [title || "Tópico Principal"],
            children: [],
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `Com base no seguinte conteúdo, gere um mapa mental estruturado em JSON.

Título: ${title}
Conteúdo: ${text}

Responda com JSON no formato:
{
  "mind_map": {
    "title": "título central do mapa",
    "nodes": ["nó central"],
    "children": [
      {
        "label": "categoria principal 1",
        "items": ["subitem 1", "subitem 2", "subitem 3"]
      },
      {
        "label": "categoria principal 2",
        "items": ["subitem 4", "subitem 5", "subitem 6"]
      }
    ]
  }
}

Crie 4-6 categorias principais com 3-4 subitens cada. Responda APENAS com o JSON válido.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Você é especialista em organização de conhecimento e mapas mentais educacionais. Responda sempre em português brasileiro com JSON válido."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.5,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) throw new Error("OpenAI error");

    const data = await response.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao gerar mapa mental" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
