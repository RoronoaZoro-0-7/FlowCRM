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
  // FlowCRM - Owner's Organization (platform owner)
  const flowCRM = await prisma.organization.create({
    data: {
      name: 'FlowCRM',
      currency: Currency.USD,
      logoLight: '/pravarit1.png',
      logoDark: '/pravarit.png',
      webhookUrl: 'https://webhook.flowcrm.com/events',
      webhookEvents: ['lead.created', 'deal.won', 'task.completed'],
    },
  });

  // Customer Organizations - These are companies using FlowCRM as customers
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

  // ==================== FLOWCRM USERS (Platform Owner's Team) ====================
  // THE ONLY OWNER IN THE ENTIRE SYSTEM - Platform Owner
  const flowOwner = await prisma.user.create({
    data: {
      email: 'admin@flowcrm.com',
      name: 'FlowCRM Admin',
      password: hashedPassword,
      role: Role.OWNER,  // ONLY OWNER - owns the entire FlowCRM platform
      orgId: flowCRM.id,
      phone: '+1-555-100-0001',
      emailNotifications: true,
    },
  });

  // FlowCRM Admins (platform staff)
  const flowAdmin1 = await prisma.user.create({
    data: { email: 'sarah.johnson@flowcrm.com', name: 'Sarah Johnson', password: hashedPassword, role: Role.ADMIN, orgId: flowCRM.id },
  });
  const flowAdmin2 = await prisma.user.create({
    data: { email: 'david.kim@flowcrm.com', name: 'David Kim', password: hashedPassword, role: Role.ADMIN, orgId: flowCRM.id },
  });

  // FlowCRM Managers
  const flowManager1 = await prisma.user.create({
    data: { email: 'mike.chen@flowcrm.com', name: 'Mike Chen', password: hashedPassword, role: Role.MANAGER, orgId: flowCRM.id },
  });
  const flowManager2 = await prisma.user.create({
    data: { email: 'jessica.martinez@flowcrm.com', name: 'Jessica Martinez', password: hashedPassword, role: Role.MANAGER, orgId: flowCRM.id },
  });

  // FlowCRM Sales (5 people)
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

  const flowSales = [flowSales1, flowSales2, flowSales3, flowSales4, flowSales5];
  const flowManagers = [flowManager1, flowManager2];
  const flowAdmins = [flowAdmin1, flowAdmin2];
  const flowAllUsers = [flowOwner, ...flowAdmins, ...flowManagers, ...flowSales];
  const flowNonOwners = [...flowAdmins, ...flowManagers, ...flowSales];

  console.log('✅ Created 10 FlowCRM users (1 OWNER - platform owner)');

  // ==================== ACME CORPORATION USERS (Customer Company) ====================
  // ADMIN is the company owner (using FlowCRM as a customer)
  const acmeAdmin = await prisma.user.create({
    data: { email: 'ceo@acme.com', name: 'Alex Thompson', password: hashedPassword, role: Role.ADMIN, orgId: acmeCorp.id },
  });
  const acmeManager1 = await prisma.user.create({
    data: { email: 'manager@acme.com', name: 'Diana Ross', password: hashedPassword, role: Role.MANAGER, orgId: acmeCorp.id },
  });
  const acmeManager2 = await prisma.user.create({
    data: { email: 'team.lead@acme.com', name: 'Chris Evans', password: hashedPassword, role: Role.MANAGER, orgId: acmeCorp.id },
  });
  const acmeSales1 = await prisma.user.create({
    data: { email: 'peter.parker@acme.com', name: 'Peter Parker', password: hashedPassword, role: Role.SALES, orgId: acmeCorp.id },
  });
  const acmeSales2 = await prisma.user.create({
    data: { email: 'mary.jane@acme.com', name: 'Mary Jane', password: hashedPassword, role: Role.SALES, orgId: acmeCorp.id },
  });
  const acmeSales3 = await prisma.user.create({
    data: { email: 'harry.osborn@acme.com', name: 'Harry Osborn', password: hashedPassword, role: Role.SALES, orgId: acmeCorp.id },
  });
  const acmeUsers = [acmeAdmin, acmeManager1, acmeManager2, acmeSales1, acmeSales2, acmeSales3];
  const acmeNonAdmin = [acmeManager1, acmeManager2, acmeSales1, acmeSales2, acmeSales3];
  console.log('✅ Created 6 Acme users (ADMIN is company owner)');

  // ==================== TECHSTART USERS (Customer Company) ====================
  const techAdmin = await prisma.user.create({
    data: { email: 'founder@techstart.io', name: 'Marie Curie', password: hashedPassword, role: Role.ADMIN, orgId: techStart.id },
  });
  const techManager = await prisma.user.create({
    data: { email: 'cto@techstart.io', name: 'Albert Newton', password: hashedPassword, role: Role.MANAGER, orgId: techStart.id },
  });
  const techSales1 = await prisma.user.create({
    data: { email: 'nikola@techstart.io', name: 'Nikola Tesla', password: hashedPassword, role: Role.SALES, orgId: techStart.id },
  });
  const techSales2 = await prisma.user.create({
    data: { email: 'ada@techstart.io', name: 'Ada Lovelace', password: hashedPassword, role: Role.SALES, orgId: techStart.id },
  });
  const techSales3 = await prisma.user.create({
    data: { email: 'alan@techstart.io', name: 'Alan Turing', password: hashedPassword, role: Role.SALES, orgId: techStart.id },
  });
  const techUsers = [techAdmin, techManager, techSales1, techSales2, techSales3];
  const techNonAdmin = [techManager, techSales1, techSales2, techSales3];
  console.log('✅ Created 5 TechStart users (ADMIN is company owner)');

  // ==================== GLOBAL SOLUTIONS USERS (Customer Company) ====================
  const globalAdmin = await prisma.user.create({
    data: { email: 'director@globalsolutions.co.uk', name: 'James Bond', password: hashedPassword, role: Role.ADMIN, orgId: globalSolutions.id },
  });
  const globalManager = await prisma.user.create({
    data: { email: 'ops@globalsolutions.co.uk', name: 'M Director', password: hashedPassword, role: Role.MANAGER, orgId: globalSolutions.id },
  });
  const globalSales1 = await prisma.user.create({
    data: { email: 'eve@globalsolutions.co.uk', name: 'Eve Moneypenny', password: hashedPassword, role: Role.SALES, orgId: globalSolutions.id },
  });
  const globalSales2 = await prisma.user.create({
    data: { email: 'q@globalsolutions.co.uk', name: 'Q Branch', password: hashedPassword, role: Role.SALES, orgId: globalSolutions.id },
  });
  const globalUsers = [globalAdmin, globalManager, globalSales1, globalSales2];
  const globalNonAdmin = [globalManager, globalSales1, globalSales2];
  console.log('✅ Created 4 Global Solutions users (ADMIN is company owner)');

  // Total: 10 + 6 + 5 + 4 = 25 users (only 1 OWNER)

  // ==================== FLOWCRM LEADS (30) ====================
  const companies = [
    'TechCorp Inc', 'Innovate.io', 'StartupXYZ', 'GlobalTech', 'Enterprise Co',
    'DataDriven LLC', 'CloudFirst', 'DigitalEdge', 'SmartSystems', 'FutureTech',
    'AlphaSolutions', 'BetaWorks', 'GammaTech', 'DeltaCorp', 'OmegaSystems',
    'QuantumLeap', 'NovaStar', 'PrimeLogic', 'ApexIndustries', 'ZenithCorp',
    'VertexSoft', 'MatrixTech', 'SynergyPlus', 'PioneerData', 'VanguardTech',
    'NextGen Co', 'BlueSky Ltd', 'RedHat Inc', 'GreenField', 'SilverLining'
  ];
  const sources = ['Website', 'LinkedIn', 'Referral', 'Trade Show', 'Cold Call', 'Google Ads', 'Partner', 'Webinar'];
  const statuses: LeadStatus[] = [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED, LeadStatus.PROPOSAL, LeadStatus.WON, LeadStatus.LOST];
  const values = [5000, 10000, 15000, 25000, 35000, 50000, 75000, 100000, 150000, 200000];

  const flowLeads = [];
  for (let i = 0; i < 30; i++) {
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

  // ==================== FLOWCRM DEALS (25) ====================
  const dealStages = ['QUALIFICATION', 'DISCOVERY', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
  const probs: Record<string, number> = { QUALIFICATION: 20, DISCOVERY: 40, PROPOSAL: 60, NEGOTIATION: 80, WON: 100, LOST: 0 };

  const flowDeals = [];
  for (let i = 0; i < 25; i++) {
    const stage = dealStages[i % dealStages.length];
    const lead = flowLeads[i];
    const deal = await prisma.deal.create({
      data: {
        name: `${lead.company} - Deal ${i + 1}`,
        value: lead.value,
        stage,
        probability: probs[stage],
        closeDate: stage === 'WON' || stage === 'LOST' ? new Date(2026, 0, 15 + i) : undefined,
        expectedCloseDate: stage !== 'WON' && stage !== 'LOST' ? new Date(2026, 2, 15 + i) : undefined,
        orgId: flowCRM.id,
        leadId: lead.id,
        ownerId: flowOwner.id,
        assignedToId: flowSales[i % flowSales.length].id,
      },
    });
    flowDeals.push(deal);
  }
  console.log(`✅ Created ${flowDeals.length} FlowCRM deals`);

  // ==================== FLOWCRM TASKS (60) ====================
  const taskTitles = ['Follow up call', 'Send proposal', 'Schedule demo', 'Contract review', 'Prepare presentation', 
    'Client meeting', 'Price negotiation', 'Technical assessment', 'Send documentation', 'Onboarding call',
    'Quarterly review', 'Renewal discussion', 'Support check-in', 'Feedback collection', 'Feature demo'];
  const taskStatuses: TaskStatus[] = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE];
  const priorities: TaskPriority[] = [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH];

  for (let i = 0; i < 60; i++) {
    const status = taskStatuses[i % taskStatuses.length];
    await prisma.task.create({
      data: {
        title: `${taskTitles[i % taskTitles.length]} - ${flowLeads[i % flowLeads.length].company}`,
        description: `Task ${i + 1} - ${taskTitles[i % taskTitles.length]} for ${flowLeads[i % flowLeads.length].company}`,
        status,
        priority: priorities[i % priorities.length],
        dueDate: new Date(2026, 1, 1 + (i % 28)),
        orgId: flowCRM.id,
        leadId: flowLeads[i % flowLeads.length].id,
        dealId: i < 25 ? flowDeals[i].id : undefined,
        assignedToId: flowNonOwners[i % flowNonOwners.length].id,
        createdById: flowManagers[i % flowManagers.length].id,
      },
    });
  }
  console.log('✅ Created 60 FlowCRM tasks');

  // ==================== FLOWCRM ACTIVITIES (100) ====================
  const actTypes: ActivityType[] = [ActivityType.NOTE, ActivityType.CALL, ActivityType.EMAIL, ActivityType.MEETING, ActivityType.STATUS_CHANGE];
  const actContents: Record<string, string[]> = {
    NOTE: ['Added requirements details', 'Updated preferences', 'Budget info recorded', 'Technical specs noted', 'Decision maker identified'],
    CALL: ['Discovery call completed', 'Follow-up call', 'Demo scheduled', 'Pricing discussed', 'Questions answered'],
    EMAIL: ['Proposal sent', 'Follow-up email', 'Contract shared', 'Information requested', 'Thank you note'],
    MEETING: ['In-person demo', 'QBR meeting', 'Negotiation meeting', 'Kickoff call', 'Strategy session'],
    STATUS_CHANGE: ['Status updated to Contacted', 'Qualified the lead', 'Moved to Proposal', 'Deal won!', 'Lost to competitor'],
  };

  for (let i = 0; i < 100; i++) {
    const type = actTypes[i % actTypes.length];
    await prisma.activity.create({
      data: {
        type,
        content: actContents[type][i % actContents[type].length],
        metadata: type === ActivityType.STATUS_CHANGE ? { from: statuses[i % 3], to: statuses[(i + 1) % 4] } : undefined,
        leadId: flowLeads[i % flowLeads.length].id,
        dealId: i < 50 ? flowDeals[i % flowDeals.length].id : undefined,
        userId: flowNonOwners[i % flowNonOwners.length].id,
      },
    });
  }
  console.log('✅ Created 100 FlowCRM activities');

  // ==================== FLOWCRM NOTIFICATIONS (80) ====================
  const notifTypes: NotificationType[] = [
    NotificationType.LEAD_ASSIGNED, NotificationType.DEAL_UPDATED, NotificationType.TASK_ASSIGNED,
    NotificationType.TASK_REMINDER, NotificationType.MENTION, NotificationType.SYSTEM
  ];
  const notifMessages: Record<NotificationType, string[]> = {
    [NotificationType.LEAD_ASSIGNED]: ['New lead assigned to you', 'Lead TechCorp assigned', 'You have a new lead'],
    [NotificationType.DEAL_UPDATED]: ['Deal stage changed', 'Deal value updated', 'Deal closed won!'],
    [NotificationType.TASK_ASSIGNED]: ['New task assigned', 'Task due tomorrow', 'High priority task'],
    [NotificationType.TASK_REMINDER]: ['Task due in 1 hour', 'Overdue task reminder', 'Task deadline approaching'],
    [NotificationType.MENTION]: ['You were mentioned in a note', 'Someone tagged you', 'New mention'],
    [NotificationType.CHAT_MESSAGE]: ['New message in chat', 'Team message', 'Direct message'],
    [NotificationType.SYSTEM]: ['System maintenance scheduled', 'New feature released', 'Weekly summary'],
    [NotificationType.USER_ADDED]: ['New team member joined', 'Welcome to the team', 'User added'],
  };

  for (let i = 0; i < 80; i++) {
    const type = notifTypes[i % notifTypes.length];
    await prisma.notification.create({
      data: {
        title: type.replace(/_/g, ' '),
        message: notifMessages[type][i % notifMessages[type].length],
        type,
        isRead: i % 3 === 0,
        userId: flowNonOwners[i % flowNonOwners.length].id,
        orgId: flowCRM.id,
      },
    });
  }
  console.log('✅ Created 80 FlowCRM notifications');

  // ==================== CUSTOM FIELDS (6) ====================
  await prisma.customField.create({
    data: { name: 'Industry', fieldType: 'select', options: ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Education'], entityType: 'lead', required: true, orgId: flowCRM.id },
  });
  await prisma.customField.create({
    data: { name: 'Company Size', fieldType: 'select', options: ['1-10', '11-50', '51-200', '201-500', '500+'], entityType: 'lead', orgId: flowCRM.id },
  });
  await prisma.customField.create({
    data: { name: 'Budget Range', fieldType: 'select', options: ['$0-10k', '$10k-50k', '$50k-100k', '$100k-500k', '$500k+'], entityType: 'lead', orgId: flowCRM.id },
  });
  await prisma.customField.create({
    data: { name: 'Contract Length', fieldType: 'select', options: ['Monthly', 'Quarterly', 'Annual', 'Multi-year'], entityType: 'deal', orgId: flowCRM.id },
  });
  await prisma.customField.create({
    data: { name: 'Payment Terms', fieldType: 'select', options: ['Net 15', 'Net 30', 'Net 60', 'Prepaid'], entityType: 'deal', orgId: flowCRM.id },
  });
  await prisma.customField.create({
    data: { name: 'Task Category', fieldType: 'select', options: ['Sales', 'Support', 'Implementation', 'Training', 'Admin'], entityType: 'task', orgId: flowCRM.id },
  });
  console.log('✅ Created 6 custom fields');

  // ==================== CALL LOGS (35) ====================
  const outcomes = ['answered', 'voicemail', 'no_answer', 'busy'];
  for (let i = 0; i < 35; i++) {
    const outcome = outcomes[i % outcomes.length];
    await prisma.callLog.create({
      data: {
        phoneNumber: flowLeads[i % flowLeads.length].phone || '+1-555-000-0000',
        direction: i % 2 === 0 ? 'outbound' : 'inbound',
        duration: outcome === 'answered' ? randomInt(120, 1800) : randomInt(0, 30),
        outcome,
        notes: outcome === 'answered' ? `Discussed requirements with ${flowLeads[i % flowLeads.length].name}. ${['Good progress', 'Needs follow-up', 'Ready to close', 'Budget concerns'][i % 4]}` : `${outcome} - will retry`,
        leadId: flowLeads[i % flowLeads.length].id,
        userId: flowSales[i % flowSales.length].id,
      },
    });
  }
  console.log('✅ Created 35 call logs');

  // ==================== CALENDAR EVENTS (30) ====================
  const eventTypes = ['Demo', 'Meeting', 'Call', 'Review', 'Training', 'Webinar', 'Conference', 'Team Sync'];
  for (let i = 0; i < 30; i++) {
    const startHour = 9 + (i % 8);
    await prisma.calendarEvent.create({
      data: {
        title: `${eventTypes[i % eventTypes.length]} - ${companies[i % companies.length]}`,
        description: `Scheduled ${eventTypes[i % eventTypes.length].toLowerCase()} with ${companies[i % companies.length]}`,
        startTime: new Date(2026, 1, 1 + (i % 28), startHour),
        endTime: new Date(2026, 1, 1 + (i % 28), startHour + 1),
        location: i % 3 === 0 ? 'Zoom' : i % 3 === 1 ? 'Google Meet' : `Conference Room ${String.fromCharCode(65 + (i % 4))}`,
        userId: flowNonOwners[i % flowNonOwners.length].id,
      },
    });
  }
  console.log('✅ Created 30 calendar events');

  // ==================== CHAT ROOMS (3) ====================
  const salesRoom = await prisma.chatRoom.create({
    data: { name: 'Sales Team', type: 'group', orgId: flowCRM.id },
  });
  const allHandsRoom = await prisma.chatRoom.create({
    data: { name: 'All Hands', type: 'group', orgId: flowCRM.id },
  });
  const managersRoom = await prisma.chatRoom.create({
    data: { name: 'Managers Only', type: 'group', orgId: flowCRM.id },
  });

  // Add members
  for (const user of [...flowSales, ...flowManagers]) {
    await prisma.chatMember.create({ data: { roomId: salesRoom.id, userId: user.id } });
  }
  for (const user of flowAllUsers) {
    await prisma.chatMember.create({ data: { roomId: allHandsRoom.id, userId: user.id } });
  }
  for (const user of [...flowManagers, ...flowAdmins, flowOwner]) {
    await prisma.chatMember.create({ data: { roomId: managersRoom.id, userId: user.id } });
  }

  // Add messages
  await prisma.chatMessage.create({ data: { content: 'Welcome to the Sales Team chat! 🎉', roomId: salesRoom.id, senderId: flowManager1.id } });
  await prisma.chatMessage.create({ data: { content: 'Great job on closing TechCorp!', roomId: salesRoom.id, senderId: flowSales1.id } });
  await prisma.chatMessage.create({ data: { content: 'Reminder: Sales meeting tomorrow at 10am', roomId: salesRoom.id, senderId: flowManager2.id } });
  await prisma.chatMessage.create({ data: { content: 'Welcome to FlowCRM everyone!', roomId: allHandsRoom.id, senderId: flowOwner.id } });
  await prisma.chatMessage.create({ data: { content: 'Q1 results are in - great work team!', roomId: allHandsRoom.id, senderId: flowAdmin1.id } });
  await prisma.chatMessage.create({ data: { content: 'Management sync for next week', roomId: managersRoom.id, senderId: flowAdmin1.id } });
  console.log('✅ Created 3 chat rooms with messages');

  // ==================== DASHBOARD WIDGETS ====================
  const widgetTypes = ['stats', 'pipeline', 'leaderboard', 'activities', 'tasks', 'calendar'];
  for (const user of flowNonOwners) {
    for (let i = 0; i < widgetTypes.length; i++) {
      await prisma.dashboardWidget.create({
        data: {
          widgetType: widgetTypes[i],
          title: widgetTypes[i].charAt(0).toUpperCase() + widgetTypes[i].slice(1),
          position: i,
          size: i === 0 ? 'large' : i < 3 ? 'medium' : 'small',
          userId: user.id,
          orgId: flowCRM.id,
        },
      });
    }
  }
  console.log('✅ Created dashboard widgets for all users');

  // ==================== FOLLOW-UP SEQUENCES (3) ====================
  const newLeadSeq = await prisma.followUpSequence.create({
    data: { name: 'New Lead Nurture', active: true, orgId: flowCRM.id },
  });
  await prisma.followUpStep.create({ data: { sequenceId: newLeadSeq.id, stepOrder: 0, delayDays: 0, actionType: 'email', subject: 'Welcome to FlowCRM!', content: 'Thank you for your interest in FlowCRM.' } });
  await prisma.followUpStep.create({ data: { sequenceId: newLeadSeq.id, stepOrder: 1, delayDays: 2, actionType: 'task', content: 'Make intro call to new lead' } });
  await prisma.followUpStep.create({ data: { sequenceId: newLeadSeq.id, stepOrder: 2, delayDays: 5, actionType: 'email', subject: 'Quick check-in', content: 'Just following up on our initial conversation...' } });
  await prisma.followUpStep.create({ data: { sequenceId: newLeadSeq.id, stepOrder: 3, delayDays: 10, actionType: 'task', content: 'Schedule product demo' } });

  const coldLeadSeq = await prisma.followUpSequence.create({
    data: { name: 'Cold Lead Re-engagement', active: true, orgId: flowCRM.id },
  });
  await prisma.followUpStep.create({ data: { sequenceId: coldLeadSeq.id, stepOrder: 0, delayDays: 0, actionType: 'email', subject: 'Still interested?', content: 'We noticed it has been a while since we connected...' } });
  await prisma.followUpStep.create({ data: { sequenceId: coldLeadSeq.id, stepOrder: 1, delayDays: 7, actionType: 'task', content: 'Re-engagement call attempt' } });
  await prisma.followUpStep.create({ data: { sequenceId: coldLeadSeq.id, stepOrder: 2, delayDays: 14, actionType: 'email', subject: 'Final follow-up', content: 'Last chance to reconnect...' } });

  const qualifiedSeq = await prisma.followUpSequence.create({
    data: { name: 'Qualified Lead Fast Track', active: true, orgId: flowCRM.id },
  });
  await prisma.followUpStep.create({ data: { sequenceId: qualifiedSeq.id, stepOrder: 0, delayDays: 0, actionType: 'task', content: 'Immediate call to qualified lead' } });
  await prisma.followUpStep.create({ data: { sequenceId: qualifiedSeq.id, stepOrder: 1, delayDays: 1, actionType: 'email', subject: 'Your personalized demo', content: 'Based on our conversation, here is a custom demo...' } });
  await prisma.followUpStep.create({ data: { sequenceId: qualifiedSeq.id, stepOrder: 2, delayDays: 3, actionType: 'task', content: 'Send proposal' } });

  // Enroll some leads in sequences
  for (let i = 0; i < 12; i++) {
    await prisma.followUpEnrollment.create({
      data: {
        sequenceId: i < 5 ? newLeadSeq.id : i < 9 ? coldLeadSeq.id : qualifiedSeq.id,
        leadId: flowLeads[i].id,
        currentStep: i % 3,
        status: i % 4 === 0 ? 'completed' : 'active',
      },
    });
  }
  console.log('✅ Created 3 follow-up sequences with enrollments');

  // ==================== FILTER PRESETS ====================
  const presets = [
    { name: 'Hot Leads', filters: { status: ['QUALIFIED', 'PROPOSAL'], minScore: 70 } },
    { name: 'New This Week', filters: { status: ['NEW'], dateRange: 'week' } },
    { name: 'High Value', filters: { minValue: 50000 } },
    { name: 'Cold Leads', filters: { status: ['CONTACTED'], maxScore: 40 } },
    { name: 'Won Deals', filters: { status: ['WON'] } },
  ];
  for (const user of flowNonOwners.slice(0, 7)) {
    for (const preset of presets) {
      await prisma.filterPreset.create({
        data: { name: preset.name, entityType: 'leads', filters: preset.filters, userId: user.id },
      });
    }
  }
  console.log('✅ Created filter presets');

  // ==================== AUDIT LOGS (30) ====================
  const auditActions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT'];
  for (let i = 0; i < 30; i++) {
    await prisma.auditLog.create({
      data: {
        action: auditActions[i % auditActions.length],
        entityType: ['lead', 'deal', 'task', 'user'][i % 4],
        entityId: flowLeads[i % flowLeads.length].id,
        changes: { field: 'status', from: 'old_value', to: 'new_value' },
        userId: flowNonOwners[i % flowNonOwners.length].id,
        orgId: flowCRM.id,
      },
    });
  }
  console.log('✅ Created 30 audit logs');

  // ==================== WEBHOOK LOGS (15) ====================
  const webhookEvents = ['lead.created', 'lead.updated', 'deal.won', 'deal.lost', 'task.completed'];
  for (let i = 0; i < 15; i++) {
    await prisma.webhookLog.create({
      data: {
        eventType: webhookEvents[i % webhookEvents.length],
        payload: { id: flowLeads[i % flowLeads.length].id, event: webhookEvents[i % webhookEvents.length] },
        status: i % 7 === 0 ? 'failed' : 'success',
        statusCode: i % 7 === 0 ? 500 : 200,
        attempts: i % 7 === 0 ? 3 : 1,
        orgId: flowCRM.id,
      },
    });
  }
  console.log('✅ Created 15 webhook logs');

  // ==================== ACME CORPORATION DATA ====================
  const acmeLeads = [];
  for (let i = 0; i < 10; i++) {
    const lead = await prisma.lead.create({
      data: {
        name: `Acme Lead ${i + 1}`,
        email: `lead${i + 1}@acmeclient.com`,
        phone: `+1-555-800-${1000 + i}`,
        company: `Acme Client ${i + 1}`,
        source: sources[i % sources.length],
        status: statuses[i % 4],
        value: values[i % values.length],
        score: randomInt(40, 85),
        orgId: acmeCorp.id,
        ownerId: acmeAdmin.id,
        assignedToId: acmeUsers[i % acmeUsers.length].id,
      },
    });
    acmeLeads.push(lead);
  }

  for (let i = 0; i < 8; i++) {
    await prisma.deal.create({
      data: {
        name: `${acmeLeads[i].company} Deal`,
        value: acmeLeads[i].value,
        stage: dealStages[i % 5],
        probability: probs[dealStages[i % 5]],
        expectedCloseDate: new Date(2026, 2, 10 + i),
        orgId: acmeCorp.id,
        leadId: acmeLeads[i].id,
        ownerId: acmeAdmin.id,
        assignedToId: acmeUsers[i % acmeUsers.length].id,
      },
    });
  }

  for (const user of acmeUsers) {
    for (let i = 0; i < 3; i++) {
      await prisma.task.create({
        data: {
          title: `Acme Task ${i + 1} for ${user.name}`,
          description: `Task description ${i + 1}`,
          status: taskStatuses[i % taskStatuses.length],
          priority: priorities[i % priorities.length],
          dueDate: new Date(2026, 1, 10 + i),
          orgId: acmeCorp.id,
          assignedToId: user.id,
          createdById: acmeAdmin.id,
        },
      });
    }
    for (let i = 0; i < 2; i++) {
      await prisma.notification.create({
        data: { title: ['Welcome', 'Task Reminder'][i], message: ['Welcome to Acme CRM', 'You have tasks due soon'][i], type: NotificationType.SYSTEM, userId: user.id, orgId: acmeCorp.id },
      });
    }
  }
  console.log('✅ Created Acme Corp data (10 leads, 8 deals, 18 tasks)');

  // ==================== TECHSTART DATA ====================
  const techLeads = [];
  for (let i = 0; i < 8; i++) {
    const lead = await prisma.lead.create({
      data: {
        name: `Tech Lead ${i + 1}`,
        email: `lead${i + 1}@techclient.io`,
        phone: `+49-555-${200 + i}-${2000 + i}`,
        company: `Tech Client ${i + 1}`,
        source: sources[i % sources.length],
        status: statuses[i % 4],
        value: values[i % values.length],
        currency: Currency.EUR,
        score: randomInt(50, 90),
        orgId: techStart.id,
        ownerId: techAdmin.id,
        assignedToId: techUsers[i % techUsers.length].id,
      },
    });
    techLeads.push(lead);
  }

  for (let i = 0; i < 6; i++) {
    await prisma.deal.create({
      data: {
        name: `${techLeads[i].company} Deal`,
        value: techLeads[i].value,
        currency: Currency.EUR,
        stage: dealStages[i % 4],
        probability: probs[dealStages[i % 4]],
        expectedCloseDate: new Date(2026, 2, 15 + i),
        orgId: techStart.id,
        leadId: techLeads[i].id,
        ownerId: techAdmin.id,
        assignedToId: techUsers[i % techUsers.length].id,
      },
    });
  }

  for (const user of techUsers) {
    for (let i = 0; i < 2; i++) {
      await prisma.task.create({
        data: { title: `TechStart Task ${i + 1}`, description: `Task for ${user.name}`, status: taskStatuses[i % 3], priority: TaskPriority.HIGH, dueDate: new Date(2026, 1, 15 + i), orgId: techStart.id, assignedToId: user.id, createdById: techAdmin.id },
      });
    }
    await prisma.notification.create({
      data: { title: 'Welcome', message: 'Welcome to TechStart', type: NotificationType.SYSTEM, userId: user.id, orgId: techStart.id },
    });
  }
  console.log('✅ Created TechStart data (8 leads, 6 deals, 10 tasks)');

  // ==================== GLOBAL SOLUTIONS DATA ====================
  const globalLeads = [];
  for (let i = 0; i < 6; i++) {
    const lead = await prisma.lead.create({
      data: {
        name: `Global Lead ${i + 1}`,
        email: `lead${i + 1}@globalclient.co.uk`,
        phone: `+44-555-${100 + i}-${3000 + i}`,
        company: `Global Client ${i + 1}`,
        source: sources[i % sources.length],
        status: [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED, LeadStatus.PROPOSAL, LeadStatus.WON, LeadStatus.LOST][i],
        value: [30000, 50000, 75000, 100000, 150000, 200000][i],
        currency: Currency.GBP,
        score: randomInt(60, 95),
        orgId: globalSolutions.id,
        ownerId: globalAdmin.id,
        assignedToId: globalUsers[i % globalUsers.length].id,
      },
    });
    globalLeads.push(lead);
  }

  for (let i = 0; i < 5; i++) {
    await prisma.deal.create({
      data: {
        name: `${globalLeads[i].company} Enterprise Deal`,
        value: globalLeads[i].value,
        currency: Currency.GBP,
        stage: ['QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'WON', 'DISCOVERY'][i],
        probability: [20, 60, 80, 100, 40][i],
        expectedCloseDate: new Date(2026, 2, 20 + i),
        orgId: globalSolutions.id,
        leadId: globalLeads[i].id,
        ownerId: globalAdmin.id,
        assignedToId: globalUsers[i % globalUsers.length].id,
      },
    });
  }

  for (const user of globalUsers) {
    for (let i = 0; i < 2; i++) {
      await prisma.task.create({
        data: { title: `Global Task ${i + 1}`, description: `Enterprise task for ${user.name}`, status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, dueDate: new Date(2026, 1, 20 + i), orgId: globalSolutions.id, assignedToId: user.id, createdById: globalAdmin.id },
      });
    }
    await prisma.notification.create({
      data: { title: 'Q1 Targets', message: 'Q1 targets have been released', type: NotificationType.SYSTEM, userId: user.id, orgId: globalSolutions.id },
    });
  }
  console.log('✅ Created Global Solutions data (6 leads, 5 deals, 8 tasks)');

  // ==================== SUMMARY ====================
  const counts = {
    organizations: await prisma.organization.count(),
    users: await prisma.user.count(),
    leads: await prisma.lead.count(),
    deals: await prisma.deal.count(),
    tasks: await prisma.task.count(),
    activities: await prisma.activity.count(),
    notifications: await prisma.notification.count(),
    callLogs: await prisma.callLog.count(),
    calendarEvents: await prisma.calendarEvent.count(),
    chatRooms: await prisma.chatRoom.count(),
    customFields: await prisma.customField.count(),
    sequences: await prisma.followUpSequence.count(),
    auditLogs: await prisma.auditLog.count(),
  };

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('           ✅ DATABASE SEEDED SUCCESSFULLY!                 ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('📊 Data Summary:');
  console.log('   ─────────────────────────────────────────────────────');
  console.log(`   Organizations:     ${counts.organizations}`);
  console.log(`   Users:             ${counts.users} (1 OWNER, rest are ADMIN/MANAGER/SALES)`);
  console.log(`   Leads:             ${counts.leads}`);
  console.log(`   Deals:             ${counts.deals}`);
  console.log(`   Tasks:             ${counts.tasks}`);
  console.log(`   Activities:        ${counts.activities}`);
  console.log(`   Notifications:     ${counts.notifications}`);
  console.log(`   Call Logs:         ${counts.callLogs}`);
  console.log(`   Calendar Events:   ${counts.calendarEvents}`);
  console.log(`   Chat Rooms:        ${counts.chatRooms}`);
  console.log(`   Custom Fields:     ${counts.customFields}`);
  console.log(`   Follow-up Seq:     ${counts.sequences}`);
  console.log(`   Audit Logs:        ${counts.auditLogs}`);
  console.log('   ─────────────────────────────────────────────────────');
  console.log('');
  console.log('🔑 Login Credentials (ALL passwords: password)');
  console.log('');
  console.log('   📌 FlowCRM (Platform Owner\'s Organization) - 10 users');
  console.log('   ────────────────────────────────────────────────────');
  console.log('   • admin@flowcrm.com ────────────── OWNER (Platform Owner)');
  console.log('   • sarah.johnson@flowcrm.com ────── ADMIN');
  console.log('   • david.kim@flowcrm.com ────────── ADMIN');
  console.log('   • mike.chen@flowcrm.com ────────── MANAGER');
  console.log('   • jessica.martinez@flowcrm.com ── MANAGER');
  console.log('   • emma.wilson@flowcrm.com ──────── SALES');
  console.log('   • (+ 4 more SALES users)');
  console.log('');
  console.log('   📌 Acme Corporation (Customer) - 6 users');
  console.log('   ────────────────────────────────────────────────────');
  console.log('   • ceo@acme.com ─────────────────── ADMIN (Company Owner)');
  console.log('   • manager@acme.com ────────────── MANAGER');
  console.log('   • team.lead@acme.com ──────────── MANAGER');
  console.log('   • peter.parker@acme.com ───────── SALES');
  console.log('');
  console.log('   📌 TechStart Inc (Customer) - 5 users');
  console.log('   ────────────────────────────────────────────────────');
  console.log('   • founder@techstart.io ────────── ADMIN (Company Owner)');
  console.log('   • cto@techstart.io ────────────── MANAGER');
  console.log('   • nikola@techstart.io ─────────── SALES');
  console.log('');
  console.log('   📌 Global Solutions Ltd (Customer) - 4 users');
  console.log('   ────────────────────────────────────────────────────');
  console.log('   • director@globalsolutions.co.uk ─ ADMIN (Company Owner)');
  console.log('   • ops@globalsolutions.co.uk ────── MANAGER');
  console.log('   • eve@globalsolutions.co.uk ────── SALES');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   NOTE: OWNER role is ONLY for FlowCRM platform owner.    ');
  console.log('   Customer company owners use ADMIN role.                 ');
  console.log('═══════════════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
