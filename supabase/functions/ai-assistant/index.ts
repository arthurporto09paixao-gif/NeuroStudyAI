import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { message, history = [] } = await req.json();
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      return new Response(
        JSON.stringify({ response: "O assistente de IA não está configurado no momento. Entre em contato com o suporte." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Você é o NeuroTutor, um assistente educacional especializado em educação inclusiva para estudantes neurodivergentes.

Suas especialidades incluem:
- Apoio a estudantes com Dislexia, TDAH, TEA e Discalculia
- Explicações simples e objetivas, sem linguagem excessivamente complexa
- Criação de resumos estruturados, flashcards e mapas mentais
- Geração de exercícios práticos com diferentes níveis de dificuldade
- Planejamento de estudos e preparação para provas
- Técnicas de memorização e organização do aprendizado

Diretrizes:
- Use linguagem clara e acessível
- Divida informações complexas em partes menores
- Prefira listas e estruturas visuais quando possível
- Seja encorajador sem ser artificial ou excessivo
- Respeite o ritmo de aprendizagem individual
- Responda sempre em português brasileiro
- Mantenha respostas focadas e objetivas`;

    const messages: Message[] = [
      ...history.slice(-8).map((h: Message) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI error:", err);
      return new Response(
        JSON.stringify({ response: "Não foi possível processar sua solicitação. Tente novamente em alguns instantes." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const assistantResponse = data.choices?.[0]?.message?.content || "Desculpe, não consegui gerar uma resposta.";

    return new Response(
      JSON.stringify({ response: assistantResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
