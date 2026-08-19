export interface AIReplyOptions {
  incomingMessage: string;
  conversationHistory?: Array<{ direction: string; message_text: string }>;
  aiContext?: string;
  aiApiKey?: string;
  aiModel?: string;
  maxResponseLength?: number;
  fallbackResponse?: string;
}

/**
 * AI Auto-Reply Engine using Gemini API (gemini-1.5-flash)
 */
export async function generateAIReply({
  incomingMessage,
  conversationHistory = [],
  aiContext,
  aiApiKey,
  aiModel = "gemini-1.5-flash",
  maxResponseLength = 250,
  fallbackResponse,
}: AIReplyOptions): Promise<string> {
  const apiKey = aiApiKey || process.env.GEMINI_API_KEY;
  const defaultFallback = fallbackResponse || "Thanks for reaching out! We'll get back to you shortly.";

  if (!apiKey) {
    console.log("ℹ️ No AI API Key provided. Returning fallback message.");
    return defaultFallback;
  }

  const brandInstructions = aiContext
    ? `Brand Context & Guidelines: "${aiContext}"`
    : "Be a helpful, friendly, and concise Instagram assistant.";

  const systemPrompt = `You are an Instagram Direct Message auto-responder assistant.
${brandInstructions}

Guardrails & Instructions:
1. Provide a direct, helpful, and natural response to the user's message.
2. Keep your answer under ${maxResponseLength} characters.
3. Do NOT use markdown formatting, bullet points, or codeblocks.
4. Keep the tone warm, engaging, and professional.`;

  // Format past 5 messages for context
  const pastMessages = conversationHistory.slice(-5).map((msg) => ({
    role: msg.direction === "outgoing" ? "model" : "user",
    parts: [{ text: msg.message_text }],
  }));

  const messagesPayload = [
    ...pastMessages,
    { role: "user", parts: [{ text: incomingMessage }] },
  ];

  // 5-second timeout guardrail
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: messagesPayload,
        generationConfig: {
          maxOutputTokens: Math.min(250, Math.ceil(maxResponseLength / 2)),
          temperature: 0.7,
        }
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.warn("[Gemini API Warning] API call failed:", errText);
      return defaultFallback;
    }

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (aiText) {
      console.log(`✨ [AI REPLY GENERATED] (${aiText.length} chars): "${aiText}"`);
      // Enforce hard character length limit guardrail
      return aiText.length > maxResponseLength ? aiText.substring(0, maxResponseLength - 3) + "..." : aiText;
    }

    return defaultFallback;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      console.warn("⚠️ AI API call timed out after 5000ms. Returning fallback response.");
    } else {
      console.warn("AI API Exception:", err);
    }
    return defaultFallback;
  }
}
