import { Prisma } from '@prisma/client';
import prisma from '../config/client';

interface ScoreFactors {
  emailProvided: number;
  phoneProvided: number;
  companyProvided: number;
  sourceQuality: number;
  activityLevel: number;
  responseTime: number;
  valueScore: number;
  totalScore: number;
}

// Calculate lead score based on various factors
export async function calculateLeadScore(leadId: string): Promise<{ score: number; factors: ScoreFactors }> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      activities: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });

  if (!lead) throw new Error('Lead not found');

  const factors: ScoreFactors = {
    emailProvided: 0,
    phoneProvided: 0,
    companyProvided: 0,
    sourceQuality: 0,
    activityLevel: 0,
    responseTime: 0,
    valueScore: 0,
    totalScore: 0,
  };

  // Contact information completeness (30 points max)
  if (lead.email) factors.emailProvided = 15;
  if (lead.phone) factors.phoneProvided = 10;
  if (lead.company) factors.companyProvided = 5;

  // Source quality (20 points max)
  const highQualitySources = ['referral', 'direct', 'partner'];
  const mediumQualitySources = ['organic', 'social', 'event'];
  
  if (lead.source) {
    const sourceLower = lead.source.toLowerCase();
    if (highQualitySources.some(s => sourceLower.includes(s))) {
      factors.sourceQuality = 20;
    } else if (mediumQualitySources.some(s => sourceLower.includes(s))) {
      factors.sourceQuality = 12;
    } else {
      factors.sourceQuality = 5;
    }
  }

  // Activity level (25 points max)
  const activityCount = lead.activities.length;
  if (activityCount >= 5) {
    factors.activityLevel = 25;
  } else if (activityCount >= 3) {
    factors.activityLevel = 15;
  } else if (activityCount >= 1) {
    factors.activityLevel = 8;
  }

  // Response time - based on time since last activity (15 points max)
  if (lead.activities.length > 0) {
    const lastActivity = lead.activities[0];
    const daysSinceActivity = Math.floor((Date.now() - lastActivity.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceActivity <= 1) {
      factors.responseTime = 15;
    } else if (daysSinceActivity <= 3) {
      factors.responseTime = 12;
    } else if (daysSinceActivity <= 7) {
      factors.responseTime = 8;
    } else if (daysSinceActivity <= 14) {
      factors.responseTime = 4;
    }
  }

  // Value score (10 points max)
  if (lead.value > 0) {
    if (lead.value >= 50000) {
      factors.valueScore = 10;
    } else if (lead.value >= 20000) {
      factors.valueScore = 7;
    } else if (lead.value >= 5000) {
      factors.valueScore = 5;
    } else {
      factors.valueScore = 2;
    }
  }

  // Calculate total score
  factors.totalScore = 
    factors.emailProvided +
    factors.phoneProvided +
    factors.companyProvided +
    factors.sourceQuality +
    factors.activityLevel +
    factors.responseTime +
    factors.valueScore;

  return { score: factors.totalScore, factors };
}

// Update lead score in database
export async function updateLeadScore(leadId: string): Promise<void> {
  const { score, factors } = await calculateLeadScore(leadId);
  
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      score,
      scoreFactors: factors as unknown as Prisma.InputJsonValue,
    },
  });
}

// Batch update scores for all leads in an organization
export async function updateOrgLeadScores(orgId: string): Promise<{ updated: number }> {
  const leads = await prisma.lead.findMany({
    where: { orgId },
    select: { id: true },
  });

  let updated = 0;
  
  for (const lead of leads) {
    try {
      await updateLeadScore(lead.id);
      updated++;
    } catch {
      // Skip failed leads
    }
  }

  return { updated };
}
