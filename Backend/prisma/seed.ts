import { PrismaClient, Role, LeadStatus, TaskStatus, TaskPriority, Currency, ActivityType, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

async function main() {
  console.log('🧹 Clearing existing data...');
  
  // Delete all data in reverse order of dependencies
  await prisma.followUpEnrollment.deleteMany();
  await prisma.followUpStep.deleteMany();
  await prisma.followUpSequence.deleteMany();
  await prisma.webhookLog.deleteMany();
  await prisma.filterPreset.deleteMany();
  await prisma.dashboardWidget.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.callLog.deleteMany();
  await prisma.mention.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatMember.deleteMany();
  await prisma.chatRoom.deleteMany();
  await prisma.customField.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.event.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  console.log('✅ Database cleared!');
  console.log('🌱 Seeding database...');

  const hashedPassword = await bcrypt.hash('password', 10);

  // ==================== ORGANIZATIONS ====================
  const flowCRM = await prisma.organization.create({
    data: {
      name: 'FlowCRM',
      currency: Currency.USD,
      logoLight: '/flowcrm-logo.svg',
      logoDark: '/flowcrm-logo-dark.svg',
      webhookUrl: 'https://webhook.flowcrm.com/events',
      webhookEvents: ['lead.created', 'deal.won', 'task.completed'],
    },
  });

  const acmeCorp = await prisma.organization.create({
    data: { name: 'Acme Corporation', currency: Currency.USD },
  });

  const techStart = await prisma.organization.create({
    data: { name: 'TechStart Inc', currency: Currency.EUR },
  });

  const globalSolutions = await prisma.organization.create({
    data: { name: 'Global Solutions Ltd', currency: Currency.GBP },
  });

  console.log('✅ Created 4 organizations');

  // ==================== FLOWCRM USERS ====================
  const flowOwner = await prisma.user.create({
    data: {
      email: 'admin@flowcrm.com',
      name: 'FlowCRM Admin',
      password: hashedPassword,
      role: Role.OWNER,
      orgId: flowCRM.id,
      phone: '+1-555-100-0001',
      emailNotifications: true,
    },
  });

  // Create admins
  const flowAdmin1 = await prisma.user.create({
    data: { email: 'sarah.johnson@flowcrm.com', name: 'Sarah Johnson', password: hashedPassword, role: Role.ADMIN, orgId: flowCRM.id },
  });
  const flowAdmin2 = await prisma.user.create({
    data: { email: 'david.kim@flowcrm.com', name: 'David Kim', password: hashedPassword, role: Role.ADMIN, orgId: flowCRM.id },
  });

  // Create managers
  const flowManager1 = await prisma.user.create({
    data: { email: 'mike.chen@flowcrm.com', name: 'Mike Chen', password: hashedPassword, role: Role.MANAGER, orgId: flowCRM.id },
  });
  const flowManager2 = await prisma.user.create({
    data: { email: 'jessica.martinez@flowcrm.com', name: 'Jessica Martinez', password: hashedPassword, role: Role.MANAGER, orgId: flowCRM.id },
  });
  const flowManager3 = await prisma.user.create({
    data: { email: 'robert.taylor@flowcrm.com', name: 'Robert Taylor', password: hashedPassword, role: Role.MANAGER, orgId: flowCRM.id },
  });

  // Create sales reps (9)
  const flowSales1 = await prisma.user.create({
    data: { email: 'emma.wilson@flowcrm.com', name: 'Emma Wilson', password: hashedPassword, role: Role.SALES, orgId: flowCRM.id },
  });
  const flowSales2 = await prisma.user.create({
    data: { email: 'james.brown@flowcrm.com', name: 'James Brown', password: hashedPassword, role: Role.SALES, orgId: flowCRM.id },
  });
  const flowSales3 = await prisma.user.create({
    data: { email: 'olivia.davis@flowcrm.com', name: 'Olivia Davis', password: hashedPassword, role: Role.SALES, orgId: flowCRM.id },
  });
  const flowSales4 = await prisma.user.create({
    data: { email: 'william.garcia@flowcrm.com', name: 'William Garcia', password: hashedPassword, role: Role.SALES, orgId: flowCRM.id },
  });
  const flowSales5 = await prisma.user.create({
    data: { email: 'sophia.rodriguez@flowcrm.com', name: 'Sophia Rodriguez', password: hashedPassword, role: Role.SALES, orgId: flowCRM.id },
  });
  const flowSales6 = await prisma.user.create({
    data: { email: 'benjamin.lee@flowcrm.com', name: 'Benjamin Lee', password: hashedPassword, role: Role.SALES, orgId: flowCRM.id },
  });
  const flowSales7 = await prisma.user.create({
    data: { email: 'isabella.hernandez@flowcrm.com', name: 'Isabella Hernandez', password: hashedPassword, role: Role.SALES, orgId: flowCRM.id },
  });
  const flowSales8 = await prisma.user.create({
    data: { email: 'mason.clark@flowcrm.com', name: 'Mason Clark', password: hashedPassword, role: Role.SALES, orgId: flowCRM.id },
  });
  const flowSales9 = await prisma.user.create({
    data: { email: 'ava.lewis@flowcrm.com', name: 'Ava Lewis', password: hashedPassword, role: Role.SALES, orgId: flowCRM.id },
  });

  const flowSales = [flowSales1, flowSales2, flowSales3, flowSales4, flowSales5, flowSales6, flowSales7, flowSales8, flowSales9];
  const flowManagers = [flowManager1, flowManager2, flowManager3];
  const flowAdmins = [flowAdmin1, flowAdmin2];
  const flowAllUsers = [flowOwner, ...flowAdmins, ...flowManagers, ...flowSales];
  const flowNonOwners = [...flowAdmins, ...flowManagers, ...flowSales];

  console.log('✅ Created 15 FlowCRM users');

  // ==================== OTHER ORG USERS ====================
  const acmeOwner = await prisma.user.create({
    data: { email: 'owner@acme.com', name: 'Alex Thompson', password: hashedPassword, role: Role.OWNER, orgId: acmeCorp.id },
  });
  const acmeManager = await prisma.user.create({
    data: { email: 'manager@acme.com', name: 'Diana Ross', password: hashedPassword, role: Role.MANAGER, orgId: acmeCorp.id },
  });
  const acmeSales1 = await prisma.user.create({
    data: { email: 'sales1@acme.com', name: 'Peter Parker', password: hashedPassword, role: Role.SALES, orgId: acmeCorp.id },
  });
  const acmeSales2 = await prisma.user.create({
    data: { email: 'sales2@acme.com', name: 'Mary Jane', password: hashedPassword, role: Role.SALES, orgId: acmeCorp.id },
  });
  const acmeSales3 = await prisma.user.create({
    data: { email: 'sales3@acme.com', name: 'Harry Osborn', password: hashedPassword, role: Role.SALES, orgId: acmeCorp.id },
  });
  const acmeUsers = [acmeManager, acmeSales1, acmeSales2, acmeSales3];
  console.log('✅ Created 5 Acme users');

  const techOwner = await prisma.user.create({
    data: { email: 'ceo@techstart.io', name: 'Marie Curie', password: hashedPassword, role: Role.OWNER, orgId: techStart.id },
  });
  const techManager = await prisma.user.create({
    data: { email: 'manager@techstart.io', name: 'Albert Newton', password: hashedPassword, role: Role.MANAGER, orgId: techStart.id },
  });
  const techSales1 = await prisma.user.create({
    data: { email: 'sales1@techstart.io', name: 'Nikola Tesla', password: hashedPassword, role: Role.SALES, orgId: techStart.id },
  });
  const techSales2 = await prisma.user.create({
    data: { email: 'sales2@techstart.io', name: 'Ada Lovelace', password: hashedPassword, role: Role.SALES, orgId: techStart.id },
  });
  const techUsers = [techManager, techSales1, techSales2];
  console.log('✅ Created 4 TechStart users');

  const globalOwner = await prisma.user.create({
    data: { email: 'admin@globalsolutions.co.uk', name: 'James Bond', password: hashedPassword, role: Role.OWNER, orgId: globalSolutions.id },
  });
  const globalSales1 = await prisma.user.create({
    data: { email: 'sales@globalsolutions.co.uk', name: 'Eve Moneypenny', password: hashedPassword, role: Role.SALES, orgId: globalSolutions.id },
  });
  const globalSales2 = await prisma.user.create({
    data: { email: 'analyst@globalsolutions.co.uk', name: 'Q Branch', password: hashedPassword, role: Role.SALES, orgId: globalSolutions.id },
  });
  const globalUsers = [globalSales1, globalSales2];
  console.log('✅ Created 3 Global Solutions users');

  // ==================== FLOWCRM LEADS (25) ====================
  const companies = [
    'TechCorp Inc', 'Innovate.io', 'StartupXYZ', 'GlobalTech', 'Enterprise Co',
    'DataDriven LLC', 'CloudFirst', 'DigitalEdge', 'SmartSystems', 'FutureTech',
    'AlphaSolutions', 'BetaWorks', 'GammaTech', 'DeltaCorp', 'OmegaSystems',
    'QuantumLeap', 'NovaStar', 'PrimeLogic', 'ApexIndustries', 'ZenithCorp',
    'VertexSoft', 'MatrixTech', 'SynergyPlus', 'PioneerData', 'VanguardTech'
  ];
  const sources = ['Website', 'LinkedIn', 'Referral', 'Trade Show', 'Cold Call', 'Google Ads', 'Partner', 'Webinar'];
  const statuses: LeadStatus[] = [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED, LeadStatus.PROPOSAL, LeadStatus.WON, LeadStatus.LOST];
  const values = [5000, 10000, 15000, 25000, 35000, 50000, 75000, 100000];

  const flowLeads = [];
  for (let i = 0; i < 25; i++) {
    const status = statuses[i % statuses.length];
    const lead = await prisma.lead.create({
      data: {
        name: `Contact ${i + 1}`,
        email: `contact${i + 1}@${companies[i].toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}.com`,
        phone: `+1-555-${300 + i}-${1000 + i}`,
        company: companies[i],
        source: sources[i % sources.length],
        status,
        value: values[i % values.length],
        score: status === LeadStatus.WON ? 100 : status === LeadStatus.LOST ? 10 : randomInt(30, 90),
        orgId: flowCRM.id,
        ownerId: flowOwner.id,
        assignedToId: flowSales[i % flowSales.length].id,
      },
    });
    flowLeads.push(lead);
  }
  console.log(`✅ Created ${flowLeads.length} FlowCRM leads`);

  // ==================== FLOWCRM DEALS (20) ====================
  const dealStages = ['QUALIFICATION', 'DISCOVERY', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
  const probs: Record<string, number> = { QUALIFICATION: 20, DISCOVERY: 40, PROPOSAL: 60, NEGOTIATION: 80, WON: 100, LOST: 0 };

  const flowDeals = [];
  for (let i = 0; i < 20; i++) {
    const stage = dealStages[i % dealStages.length];
    const lead = flowLeads[i];
    const deal = await prisma.deal.create({
      data: {
        name: `${lead.company} - Deal ${i + 1}`,
        value: lead.value,
        stage,
        probability: probs[stage],
        closeDate: stage === 'WON' || stage === 'LOST' ? new Date(2026, 0, 15 + i) : undefined,
        expectedCloseDate: stage !== 'WON' && stage !== 'LOST' ? new Date(2026, 1, 15 + i) : undefined,
        orgId: flowCRM.id,
        leadId: lead.id,
        ownerId: flowOwner.id,
        assignedToId: flowSales[i % flowSales.length].id,
      },
    });
    flowDeals.push(deal);
  }
  console.log(`✅ Created ${flowDeals.length} FlowCRM deals`);

  // ==================== FLOWCRM TASKS (50) ====================
  const taskTitles = ['Follow up call', 'Send proposal', 'Schedule demo', 'Contract review', 'Prepare presentation', 
    'Client meeting', 'Price negotiation', 'Technical assessment', 'Send documentation', 'Onboarding call'];
  const taskStatuses: TaskStatus[] = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE];
  const priorities: TaskPriority[] = [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.URGENT];

  for (let i = 0; i < 50; i++) {
    const status = taskStatuses[i % taskStatuses.length];
    await prisma.task.create({
      data: {
        title: `${taskTitles[i % taskTitles.length]} - ${flowLeads[i % flowLeads.length].company}`,
        description: `Task ${i + 1} description`,
        status,
        priority: priorities[i % priorities.length],
        dueDate: new Date(2026, 1, 1 + (i % 28)),
        orgId: flowCRM.id,
        leadId: flowLeads[i % flowLeads.length].id,
        dealId: i < 20 ? flowDeals[i].id : undefined,
        assignedToId: flowNonOwners[i % flowNonOwners.length].id,
        createdById: flowManagers[i % flowManagers.length].id,
      },
    });
  }
  console.log('✅ Created 50 FlowCRM tasks');

  // ==================== FLOWCRM ACTIVITIES (80) ====================
  const actTypes: ActivityType[] = [ActivityType.NOTE, ActivityType.CALL, ActivityType.EMAIL, ActivityType.MEETING, ActivityType.STATUS_CHANGE];
  const actContents: Record<string, string[]> = {
    NOTE: ['Added requirements', 'Updated preferences', 'Budget info recorded'],
    CALL: ['Discovery call', 'Follow-up call', 'Demo scheduled'],
    EMAIL: ['Proposal sent', 'Follow-up email', 'Contract shared'],
    MEETING: ['In-person demo', 'QBR meeting', 'Negotiation meeting'],
    STATUS_CHANGE: ['Status updated', 'Stage changed', 'Priority escalated'],
  };

  for (let i = 0; i < 80; i++) {
    const type = actTypes[i % actTypes.length];
    await prisma.activity.create({
      data: {
        type,
        content: actContents[type][i % actContents[type].length],
        metadata: type === ActivityType.STATUS_CHANGE ? { from: 'CONTACTED', to: 'QUALIFIED' } : undefined,
        leadId: flowLeads[i % flowLeads.length].id,
        dealId: i < 40 ? flowDeals[i % flowDeals.length].id : undefined,
        userId: flowNonOwners[i % flowNonOwners.length].id,
      },
    });
  }
  console.log('✅ Created 80 FlowCRM activities');

  // ==================== FLOWCRM NOTIFICATIONS (70) ====================
  const notifTypes: NotificationType[] = [
    NotificationType.LEAD_ASSIGNED, NotificationType.DEAL_UPDATED, NotificationType.TASK_ASSIGNED,
    NotificationType.TASK_REMINDER, NotificationType.MENTION, NotificationType.SYSTEM
  ];

  for (let i = 0; i < 70; i++) {
    const type = notifTypes[i % notifTypes.length];
    await prisma.notification.create({
      data: {
        title: type.replace(/_/g, ' '),
        message: `Notification ${i + 1} message`,
        type,
        isRead: i % 3 === 0,
        userId: flowNonOwners[i % flowNonOwners.length].id,
        orgId: flowCRM.id,
      },
    });
  }
  console.log('✅ Created 70 FlowCRM notifications');

  // ==================== CUSTOM FIELDS ====================
  await prisma.customField.create({
    data: { name: 'Industry', fieldType: 'select', options: ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing'], entityType: 'lead', required: true, orgId: flowCRM.id },
  });
  await prisma.customField.create({
    data: { name: 'Company Size', fieldType: 'select', options: ['1-10', '11-50', '51-200', '201-500', '500+'], entityType: 'lead', orgId: flowCRM.id },
  });
  await prisma.customField.create({
    data: { name: 'Budget Range', fieldType: 'select', options: ['$0-10k', '$10k-50k', '$50k-100k', '$100k+'], entityType: 'lead', orgId: flowCRM.id },
  });
  await prisma.customField.create({
    data: { name: 'Contract Length', fieldType: 'select', options: ['Monthly', 'Quarterly', 'Annual', 'Multi-year'], entityType: 'deal', orgId: flowCRM.id },
  });
  await prisma.customField.create({
    data: { name: 'Task Category', fieldType: 'select', options: ['Sales', 'Support', 'Implementation', 'Training'], entityType: 'task', orgId: flowCRM.id },
  });
  console.log('✅ Created 5 custom fields');

  // ==================== CALL LOGS (25) ====================
  const outcomes = ['answered', 'voicemail', 'no_answer', 'busy'];
  for (let i = 0; i < 25; i++) {
    const outcome = outcomes[i % outcomes.length];
    await prisma.callLog.create({
      data: {
        phoneNumber: flowLeads[i % flowLeads.length].phone || '+1-555-000-0000',
        direction: i % 2 === 0 ? 'outbound' : 'inbound',
        duration: outcome === 'answered' ? randomInt(120, 1800) : randomInt(0, 30),
        outcome,
        notes: outcome === 'answered' ? `Discussed requirements with ${flowLeads[i % flowLeads.length].name}` : `${outcome} - will retry`,
        leadId: flowLeads[i % flowLeads.length].id,
        userId: flowSales[i % flowSales.length].id,
      },
    });
  }
  console.log('✅ Created 25 call logs');

  // ==================== CALENDAR EVENTS (20) ====================
  const eventTypes = ['Demo', 'Meeting', 'Call', 'Review', 'Training'];
  for (let i = 0; i < 20; i++) {
    const startHour = 9 + (i % 8);
    await prisma.calendarEvent.create({
      data: {
        title: `${eventTypes[i % eventTypes.length]} - ${companies[i % companies.length]}`,
        description: `Scheduled event ${i + 1}`,
        startTime: new Date(2026, 1, 1 + (i % 28), startHour),
        endTime: new Date(2026, 1, 1 + (i % 28), startHour + 1),
        location: i % 2 === 0 ? 'Zoom' : `Room ${String.fromCharCode(65 + (i % 4))}`,
        userId: flowNonOwners[i % flowNonOwners.length].id,
      },
    });
  }
  console.log('✅ Created 20 calendar events');

  // ==================== CHAT ROOMS ====================
  const salesRoom = await prisma.chatRoom.create({
    data: { name: 'Sales Team', type: 'group', orgId: flowCRM.id },
  });
  const allHandsRoom = await prisma.chatRoom.create({
    data: { name: 'All Hands', type: 'group', orgId: flowCRM.id },
  });

  // Add members
  for (const user of [...flowSales, ...flowManagers]) {
    await prisma.chatMember.create({ data: { roomId: salesRoom.id, userId: user.id } });
  }
  for (const user of flowAllUsers) {
    await prisma.chatMember.create({ data: { roomId: allHandsRoom.id, userId: user.id } });
  }

  // Add messages
  await prisma.chatMessage.create({ data: { content: 'Welcome to the Sales Team chat! 🎉', roomId: salesRoom.id, senderId: flowManager1.id } });
  await prisma.chatMessage.create({ data: { content: 'Great job on closing TechCorp!', roomId: salesRoom.id, senderId: flowSales1.id } });
  await prisma.chatMessage.create({ data: { content: 'Welcome to FlowCRM everyone!', roomId: allHandsRoom.id, senderId: flowOwner.id } });
  console.log('✅ Created 2 chat rooms with messages');

  // ==================== DASHBOARD WIDGETS ====================
  const widgetTypes = ['stats', 'pipeline', 'leaderboard', 'activities'];
  for (const user of flowNonOwners.slice(0, 10)) {
    for (let i = 0; i < widgetTypes.length; i++) {
      await prisma.dashboardWidget.create({
        data: {
          widgetType: widgetTypes[i],
          title: widgetTypes[i].charAt(0).toUpperCase() + widgetTypes[i].slice(1),
          position: i,
          size: i === 0 ? 'large' : 'medium',
          userId: user.id,
          orgId: flowCRM.id,
        },
      });
    }
  }
  console.log('✅ Created dashboard widgets');

  // ==================== FOLLOW-UP SEQUENCES ====================
  const newLeadSeq = await prisma.followUpSequence.create({
    data: { name: 'New Lead Nurture', active: true, orgId: flowCRM.id },
  });
  await prisma.followUpStep.create({ data: { sequenceId: newLeadSeq.id, stepOrder: 0, delayDays: 0, actionType: 'email', subject: 'Welcome!', content: 'Thank you for your interest.' } });
  await prisma.followUpStep.create({ data: { sequenceId: newLeadSeq.id, stepOrder: 1, delayDays: 3, actionType: 'task', content: 'Make intro call' } });
  await prisma.followUpStep.create({ data: { sequenceId: newLeadSeq.id, stepOrder: 2, delayDays: 7, actionType: 'email', subject: 'Following up', content: 'Just checking in...' } });

  const coldLeadSeq = await prisma.followUpSequence.create({
    data: { name: 'Cold Lead Re-engagement', active: true, orgId: flowCRM.id },
  });
  await prisma.followUpStep.create({ data: { sequenceId: coldLeadSeq.id, stepOrder: 0, delayDays: 0, actionType: 'email', subject: 'Still interested?', content: 'We noticed its been a while...' } });
  await prisma.followUpStep.create({ data: { sequenceId: coldLeadSeq.id, stepOrder: 1, delayDays: 7, actionType: 'task', content: 'Re-engagement call' } });

  // Enroll some leads
  for (let i = 0; i < 8; i++) {
    await prisma.followUpEnrollment.create({
      data: {
        sequenceId: i < 5 ? newLeadSeq.id : coldLeadSeq.id,
        leadId: flowLeads[i].id,
        currentStep: i % 3,
        status: i % 4 === 0 ? 'completed' : 'active',
      },
    });
  }
  console.log('✅ Created 2 follow-up sequences with enrollments');

  // ==================== FILTER PRESETS ====================
  const presets = [
    { name: 'Hot Leads', filters: { status: ['QUALIFIED', 'PROPOSAL'], minScore: 70 } },
    { name: 'New This Week', filters: { status: ['NEW'] } },
    { name: 'High Value', filters: { minValue: 50000 } },
  ];
  for (const user of flowNonOwners.slice(0, 5)) {
    for (const preset of presets) {
      await prisma.filterPreset.create({
        data: { name: preset.name, entityType: 'leads', filters: preset.filters, userId: user.id },
      });
    }
  }
  console.log('✅ Created filter presets');

  // ==================== AUDIT LOGS ====================
  for (let i = 0; i < 20; i++) {
    await prisma.auditLog.create({
      data: {
        action: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN'][i % 4],
        entityType: ['lead', 'deal', 'task'][i % 3],
        entityId: flowLeads[i % flowLeads.length].id,
        changes: { field: 'status', from: 'old', to: 'new' },
        userId: flowNonOwners[i % flowNonOwners.length].id,
        orgId: flowCRM.id,
      },
    });
  }
  console.log('✅ Created 20 audit logs');

  // ==================== WEBHOOK LOGS ====================
  for (let i = 0; i < 10; i++) {
    await prisma.webhookLog.create({
      data: {
        eventType: ['lead.created', 'deal.won', 'task.completed'][i % 3],
        payload: { id: `entity-${i}` },
        status: i % 5 === 0 ? 'failed' : 'success',
        statusCode: i % 5 === 0 ? 500 : 200,
        attempts: i % 5 === 0 ? 3 : 1,
        orgId: flowCRM.id,
      },
    });
  }
  console.log('✅ Created 10 webhook logs');

  // ==================== OTHER ORGS DATA ====================
  // Acme leads & deals
  for (let i = 0; i < 6; i++) {
    const lead = await prisma.lead.create({
      data: {
        name: `Acme Lead ${i + 1}`,
        email: `lead${i + 1}@acmeclient.com`,
        company: `Acme Client ${i + 1}`,
        status: statuses[i % 4],
        value: values[i % values.length],
        score: randomInt(40, 85),
        orgId: acmeCorp.id,
        ownerId: acmeOwner.id,
        assignedToId: acmeUsers[i % acmeUsers.length].id,
      },
    });
    if (i < 4) {
      await prisma.deal.create({
        data: {
          name: `${lead.company} Deal`,
          value: lead.value,
          stage: dealStages[i % 4],
          probability: probs[dealStages[i % 4]],
          orgId: acmeCorp.id,
          leadId: lead.id,
          ownerId: acmeOwner.id,
          assignedToId: acmeUsers[i % acmeUsers.length].id,
        },
      });
    }
  }
  // Acme tasks
  for (const user of acmeUsers) {
    for (let i = 0; i < 2; i++) {
      await prisma.task.create({
        data: {
          title: `Acme Task ${i + 1}`,
          status: taskStatuses[i % taskStatuses.length],
          priority: priorities[i % priorities.length],
          dueDate: new Date(2026, 1, 10 + i),
          orgId: acmeCorp.id,
          assignedToId: user.id,
          createdById: acmeOwner.id,
        },
      });
    }
    await prisma.notification.create({
      data: { title: 'Welcome', message: 'Welcome to Acme CRM', type: NotificationType.SYSTEM, userId: user.id, orgId: acmeCorp.id },
    });
  }
  console.log('✅ Created Acme Corp data');

  // TechStart leads & deals
  for (let i = 0; i < 4; i++) {
    const lead = await prisma.lead.create({
      data: {
        name: `Tech Lead ${i + 1}`,
        email: `lead${i + 1}@techclient.io`,
        company: `Tech Client ${i + 1}`,
        status: statuses[i % 3],
        value: values[i % values.length],
        currency: Currency.EUR,
        score: randomInt(50, 85),
        orgId: techStart.id,
        ownerId: techOwner.id,
        assignedToId: techUsers[i % techUsers.length].id,
      },
    });
    if (i < 3) {
      await prisma.deal.create({
        data: {
          name: `${lead.company} Deal`,
          value: lead.value,
          currency: Currency.EUR,
          stage: dealStages[i % 3],
          probability: probs[dealStages[i % 3]],
          orgId: techStart.id,
          leadId: lead.id,
          ownerId: techOwner.id,
          assignedToId: techUsers[i % techUsers.length].id,
        },
      });
    }
  }
  // TechStart tasks
  for (const user of techUsers) {
    await prisma.task.create({
      data: { title: `TechStart Task`, status: TaskStatus.TODO, priority: TaskPriority.HIGH, dueDate: new Date(2026, 1, 15), orgId: techStart.id, assignedToId: user.id, createdById: techOwner.id },
    });
    await prisma.notification.create({
      data: { title: 'Welcome', message: 'Welcome to TechStart', type: NotificationType.SYSTEM, userId: user.id, orgId: techStart.id },
    });
  }
  console.log('✅ Created TechStart data');

  // Global Solutions leads & deals
  for (let i = 0; i < 3; i++) {
    const lead = await prisma.lead.create({
      data: {
        name: `Global Lead ${i + 1}`,
        email: `lead${i + 1}@globalclient.co.uk`,
        company: `Global Client ${i + 1}`,
        status: [LeadStatus.QUALIFIED, LeadStatus.PROPOSAL, LeadStatus.WON][i],
        value: [50000, 100000, 150000][i],
        currency: Currency.GBP,
        score: randomInt(70, 95),
        orgId: globalSolutions.id,
        ownerId: globalOwner.id,
        assignedToId: globalUsers[i % globalUsers.length].id,
      },
    });
    await prisma.deal.create({
      data: {
        name: `${lead.company} Enterprise Deal`,
        value: lead.value,
        currency: Currency.GBP,
        stage: ['PROPOSAL', 'NEGOTIATION', 'WON'][i],
        probability: [60, 80, 100][i],
        orgId: globalSolutions.id,
        leadId: lead.id,
        ownerId: globalOwner.id,
        assignedToId: globalUsers[i % globalUsers.length].id,
      },
    });
  }
  // Global tasks
  for (const user of globalUsers) {
    await prisma.task.create({
      data: { title: `Global Task`, status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, dueDate: new Date(2026, 1, 20), orgId: globalSolutions.id, assignedToId: user.id, createdById: globalOwner.id },
    });
    await prisma.notification.create({
      data: { title: 'Q1 Targets', message: 'Q1 targets released', type: NotificationType.SYSTEM, userId: user.id, orgId: globalSolutions.id },
    });
  }
  console.log('✅ Created Global Solutions data');

  // ==================== SUMMARY ====================
  const counts = {
    users: await prisma.user.count(),
    leads: await prisma.lead.count(),
    deals: await prisma.deal.count(),
    tasks: await prisma.task.count(),
    activities: await prisma.activity.count(),
    notifications: await prisma.notification.count(),
    callLogs: await prisma.callLog.count(),
    calendarEvents: await prisma.calendarEvent.count(),
  };

  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('       ✅ DATABASE SEEDED SUCCESSFULLY!     ');
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('📊 Data Summary:');
  console.log('   ─────────────────────────────────────');
  console.log(`   Organizations:     4`);
  console.log(`   Users:             ${counts.users}`);
  console.log(`   Leads:             ${counts.leads}`);
  console.log(`   Deals:             ${counts.deals}`);
  console.log(`   Tasks:             ${counts.tasks}`);
  console.log(`   Activities:        ${counts.activities}`);
  console.log(`   Notifications:     ${counts.notifications}`);
  console.log(`   Call Logs:         ${counts.callLogs}`);
  console.log(`   Calendar Events:   ${counts.calendarEvents}`);
  console.log('   ─────────────────────────────────────');
  console.log('');
  console.log('🔑 Login Credentials (password: password)');
  console.log('');
  console.log('   FlowCRM (15 users):');
  console.log('   • admin@flowcrm.com (OWNER)');
  console.log('   • sarah.johnson@flowcrm.com (ADMIN)');
  console.log('   • mike.chen@flowcrm.com (MANAGER)');
  console.log('   • emma.wilson@flowcrm.com (SALES)');
  console.log('');
  console.log('   Acme Corp (5 users):');
  console.log('   • owner@acme.com (OWNER)');
  console.log('');
  console.log('   TechStart (4 users):');
  console.log('   • ceo@techstart.io (OWNER)');
  console.log('');
  console.log('   Global Solutions (3 users):');
  console.log('   • admin@globalsolutions.co.uk (OWNER)');
  console.log('═══════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
