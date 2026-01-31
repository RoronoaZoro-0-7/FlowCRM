import { Request, Response } from 'express';
import { TryCatch } from '../utils/tryCatch';
import prisma from '../config/client';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Helper to get CRM data summary for AI context
async function getCRMDataSummary(orgId: string, userId: string) {
    const now = new Date();
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Fetch leads data
    const [totalLeads, newLeadsThisMonth, leadsByStatus, leadsBySource] = await Promise.all([
        prisma.lead.count({ where: { orgId } }),
        prisma.lead.count({ where: { orgId, createdAt: { gte: startOfMonth } } }),
        prisma.lead.groupBy({
            by: ['status'],
            where: { orgId },
            _count: { id: true }
        }),
        prisma.lead.groupBy({
            by: ['source'],
            where: { orgId },
            _count: { id: true }
        })
    ]);

    // Fetch deals data
    const [totalDeals, dealsThisQuarter, dealsByStage, totalDealValue, wonDeals, lostDeals] = await Promise.all([
        prisma.deal.count({ where: { orgId } }),
        prisma.deal.count({ where: { orgId, createdAt: { gte: startOfQuarter } } }),
        prisma.deal.groupBy({
            by: ['stage'],
            where: { orgId },
            _count: { id: true },
            _sum: { value: true }
        }),
        prisma.deal.aggregate({ where: { orgId }, _sum: { value: true } }),
        prisma.deal.count({ where: { orgId, stage: 'CLOSED_WON' } }),
        prisma.deal.count({ where: { orgId, stage: 'CLOSED_LOST' } })
    ]);

    // Fetch tasks data
    const [totalTasks, pendingTasks, overdueTasks, completedTasks] = await Promise.all([
        prisma.task.count({ where: { orgId } }),
        prisma.task.count({ where: { orgId, status: { in: ['TODO', 'IN_PROGRESS'] } } }),
        prisma.task.count({ where: { orgId, status: { not: 'DONE' }, dueDate: { lt: now } } }),
        prisma.task.count({ where: { orgId, status: 'DONE' } })
    ]);

    // Get recent deals for context
    const recentDeals = await prisma.deal.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { name: true, value: true, stage: true, createdAt: true }
    });

    // Get recent leads
    const recentLeads = await prisma.lead.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { name: true, company: true, status: true, source: true, createdAt: true }
    });

    // Calculate metrics
    const winRate = totalDeals > 0 ? ((wonDeals / (wonDeals + lostDeals)) * 100).toFixed(1) : 0;
    const avgDealValue = wonDeals > 0 ? (totalDealValue._sum.value || 0) / totalDeals : 0;
    const conversionRate = totalLeads > 0 ? ((leadsByStatus.find(l => l.status === 'WON')?._count.id || 0) / totalLeads * 100).toFixed(1) : 0;

    return {
        overview: {
            totalLeads,
            newLeadsThisMonth,
            totalDeals,
            dealsThisQuarter,
            totalPipelineValue: totalDealValue._sum.value || 0,
            totalTasks,
            pendingTasks,
            overdueTasks,
            completedTasks
        },
        metrics: {
            winRate: `${winRate}%`,
            avgDealValue: avgDealValue.toFixed(2),
            conversionRate: `${conversionRate}%`,
            wonDeals,
            lostDeals
        },
        leadsByStatus: leadsByStatus.map(l => ({ status: l.status, count: l._count.id })),
        leadsBySource: leadsBySource.map(l => ({ source: l.source, count: l._count.id })),
        dealsByStage: dealsByStage.map(d => ({ 
            stage: d.stage, 
            count: d._count.id, 
            totalValue: d._sum.value || 0 
        })),
        recentDeals: recentDeals.map(d => ({
            name: d.name,
            value: d.value,
            stage: d.stage,
            date: d.createdAt.toISOString().split('T')[0]
        })),
        recentLeads: recentLeads.map(l => ({
            name: l.name,
            company: l.company,
            status: l.status,
            source: l.source,
            date: l.createdAt.toISOString().split('T')[0]
        }))
    };
}

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

    // Get user's organization ID
    const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { orgId: true }
    });

    if (!user) {
        return res.status(401).json({ message: 'User not found' });
    }

    // Fetch CRM data for context
    const crmData = await getCRMDataSummary(user.orgId, req.user.userId);

    // Build messages array with system prompt and CRM data context
    const systemPrompt = `You are an AI sales assistant for FlowCRM, a customer relationship management platform.
You have access to the user's actual CRM data. Here is their current data:

## CRM Overview
- Total Leads: ${crmData.overview.totalLeads}
- New Leads This Month: ${crmData.overview.newLeadsThisMonth}
- Total Deals: ${crmData.overview.totalDeals}
- Deals This Quarter: ${crmData.overview.dealsThisQuarter}
- Total Pipeline Value: $${crmData.overview.totalPipelineValue.toLocaleString()}
- Total Tasks: ${crmData.overview.totalTasks}
- Pending Tasks: ${crmData.overview.pendingTasks}
- Overdue Tasks: ${crmData.overview.overdueTasks}
- Completed Tasks: ${crmData.overview.completedTasks}

## Key Metrics
- Win Rate: ${crmData.metrics.winRate}
- Average Deal Value: $${crmData.metrics.avgDealValue}
- Lead Conversion Rate: ${crmData.metrics.conversionRate}
- Won Deals: ${crmData.metrics.wonDeals}
- Lost Deals: ${crmData.metrics.lostDeals}

## Leads by Status
${crmData.leadsByStatus.map(l => `- ${l.status}: ${l.count}`).join('\n')}

## Leads by Source
${crmData.leadsBySource.map(l => `- ${l.source || 'Unknown'}: ${l.count}`).join('\n')}

## Deals by Stage
${crmData.dealsByStage.map(d => `- ${d.stage}: ${d.count} deals ($${d.totalValue.toLocaleString()})`).join('\n')}

## Recent Deals
${crmData.recentDeals.map(d => `- ${d.name}: $${d.value.toLocaleString()} (${d.stage}) - ${d.date}`).join('\n')}

## Recent Leads
${crmData.recentLeads.map(l => `- ${l.name} at ${l.company || 'N/A'} (${l.status}, Source: ${l.source || 'Unknown'}) - ${l.date}`).join('\n')}

Your role is to help sales professionals with:
- Analyzing their specific CRM data and performance
- Lead analysis and qualification recommendations
- Sales strategy based on their actual metrics
- Deal prioritization and pipeline management
- Identifying areas for improvement
- Actionable next steps based on their data

Be specific and reference their actual numbers when providing insights. Be concise, professional, and actionable.`;

    const messages = [
        {
            role: 'system',
            content: systemPrompt
        }
    ];

    // Add conversation context if provided
    if (context && Array.isArray(context)) {
        messages.push(...context.slice(-10));
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
                max_tokens: 2048,
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
