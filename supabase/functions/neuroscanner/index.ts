import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function sanitize(str: string, maxLen = 8000): string {
  return String(str || "").slice(0, maxLen).replace(/<[^>]*>/g, "");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const content = sanitize(body.content || "");
    const title = sanitize(body.title || "Análise de Conteúdo", 200);
    const fileUrl: string | undefined = body.fileUrl;

    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      return new Response(
        JSON.stringify({
          summary: "O serviço de IA não está configurado. Configure a chave OpenAI para processar o conteúdo.",
          simplified_text: content,
          exercises: [],
          flashcards: [],
          mind_map: { title, nodes: [title] },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = "Você é um especialista em educação inclusiva. Gere conteúdo educacional adaptado para estudantes neurodivergentes. Responda sempre em português brasileiro com JSON válido.";

    const jsonSchema = `{
  "summary": "resumo em 3-5 parágrafos claros e objetivos",
  "simplified_text": "versão simplificada do texto com linguagem acessível",
  "exercises": [{ "question": "pergunta", "answer": "resposta detalhada" }],
  "flashcards": [{ "front": "conceito", "back": "definição" }],
  "mind_map": {
    "title": "título",
    "nodes": ["nó central", "subtópico 1"],
    "children": [{ "label": "categoria", "items": ["item 1", "item 2"] }]
  }
}`;

    let messages: object[];

    if (fileUrl && (fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) || fileUrl.includes("image"))) {
      // Image analysis via Vision API
      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analise a imagem educacional com título "${title}" e gere um JSON com a estrutura:\n${jsonSchema}\nGere 5 exercícios e 8 flashcards. Responda APENAS com o JSON.`,
            },
            { type: "image_url", image_url: { url: fileUrl, detail: "high" } },
          ],
        },
      ];
    } else {
      const textContent = fileUrl
        ? `${content}\n\n[Arquivo disponível: ${fileUrl}]`
        : content;

      const prompt = `Analise o seguinte conteúdo educacional e gere uma resposta estruturada em JSON.

Título: ${title}
Conteúdo: ${textContent}

Gere um JSON com a seguinte estrutura exata:
${jsonSchema}

Gere 5 exercícios e 8 flashcards. Responda APENAS com o JSON, sem markdown ou texto extra.`;

      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ];
    }

    const model = fileUrl && fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? "gpt-4o" : "gpt-4o-mini";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 2500,
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: `Erro na API OpenAI: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(rawContent);

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Neuroscanner error:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao processar o conteúdo. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
