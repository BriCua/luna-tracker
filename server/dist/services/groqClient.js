import Groq from 'groq-sdk';
// ─── Client Setup ─────────────────────────────────────────────────────────────
// Initialized once at module load. The SDK automatically reads GROQ_API_KEY
// from process.env — you don't need to pass it explicitly.
const groq = new Groq();
// ─── chat ─────────────────────────────────────────────────────────────────────
// Sends a conversation to Groq with phase context injected as the system prompt.
// messages: the full conversation history from the frontend
// phase:    the current cycle phase, used to make responses relevant
export async function chat(messages, phase) {
    const systemPrompt = buildSystemPrompt(phase);
    const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 512,
        temperature: 0.7,
        messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
        ],
    });
    const reply = completion.choices[0].message.content ?? '';
    const tokens = completion.usage?.total_tokens ?? 0;
    return { reply, tokens };
}
// ─── buildSystemPrompt ────────────────────────────────────────────────────────
// Builds the system prompt that frames every conversation.
// Kept as a separate function so it's easy to iterate on the prompt
// without touching the chat logic.
function buildSystemPrompt(phase) {
    const lateContext = phase.isLate
        ? `Her period is currently ${phase.daysLate} day(s) late. Be calm and non-alarming about this.`
        : `Her next period is predicted in ${28 - phase.dayOfCycle} days.`;
    return `
You are a warm, knowledgeable assistant inside a period tracking app called Luna.
The app is used by someone who wants to better understand and support their partner through her cycle.

Current cycle context:
- Phase: ${phase.name} (day ${phase.dayOfCycle} of ${phase.cycleLength})
- Diet tip: ${phase.tips.diet}
- Activity tip: ${phase.tips.activity}
- ${lateContext}

Your role:
- Give practical, empathetic advice relevant to the current phase
- Help the user understand what their partner may be experiencing
- Suggest thoughtful actions, foods, or conversation approaches
- Keep responses concise and warm — this is a personal app, not a medical portal

Important rules:
- Never diagnose medical conditions
- Never suggest the partner is pregnant based on a late period alone
- If asked about serious symptoms, recommend consulting a doctor
- Stay focused on cycle wellness and relationship support
  `.trim();
}
