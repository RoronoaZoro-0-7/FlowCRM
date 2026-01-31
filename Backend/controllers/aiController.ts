import { Request, Response } from 'express';
import { TryCatch } from '../utils/tryCatch';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const chatWithAI = TryCatch(async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    const { message, context } = req.body;

    if (!message) {
        return res.status(400).json({ message: 'Message is required' });
    }

    if (!OPENROUTER_API_KEY) {
        return res.status(500).json({ message: 'AI service not configured' });
    }

    // Build messages array with system prompt and context
    const messages = [
        {
            role: 'system',
            content: `You are an AI sales assistant for FlowCRM, a customer relationship management platform. 
Your role is to help sales professionals with:
- Lead analysis and qualification
- Sales strategy recommendations
- Email drafting and communication tips
- Deal prioritization
- Follow-up suggestions
- Sales metrics interpretation
- Best practices for closing deals

Be concise, professional, and actionable in your responses. Focus on practical advice that can be immediately applied.
When users ask about their specific data, acknowledge that you don't have access to their actual CRM data but provide general best practices.`
        }
    ];

    // Add conversation context if provided
    if (context && Array.isArray(context)) {
        messages.push(...context.slice(-10)); // Keep last 10 messages for context
    }

    // Add the current user message
    messages.push({
        role: 'user',
        content: message
    });

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3001',
                'X-Title': 'FlowCRM AI Assistant'
            },
            body: JSON.stringify({
                model: 'nvidia/nemotron-3-nano-30b-a3b:free',
                messages: messages,
                max_tokens: 1024,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('OpenRouter API error:', errorData);
            return res.status(response.status).json({ 
                message: 'AI service error', 
                error: errorData 
            });
        }

        const data = await response.json();
        
        const reply = data.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';

        res.json({ reply });
    } catch (error) {
        console.error('AI chat error:', error);
        res.status(500).json({ message: 'Failed to get AI response' });
    }
});

export { chatWithAI };
