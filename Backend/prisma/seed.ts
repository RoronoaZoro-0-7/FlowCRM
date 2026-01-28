import { PrismaClient, Role, LeadStatus, TaskStatus, TaskPriority, ActivityType, NotificationType } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// All users will have the same password: "password"
const DEFAULT_PASSWORD = 'password'

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Helper to get random item from array
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Helper to get random number in range
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Helper to get random date in past N days
function randomPastDate(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - randomInt(0, days))
  return date
}

// Helper to get random future date in N days
function randomFutureDate(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + randomInt(1, days))
  return date
}

async function main() {
  console.log('🌱 Starting seed...')
  
  const hashedPassword = await hashPassword(DEFAULT_PASSWORD)
  
  // ==================== ORGANIZATION 1: TechCorp ====================
  console.log('Creating TechCorp organization...')
  
  const techCorp = await prisma.organization.upsert({
    where: { id: 'org-techcorp-001' },
    update: {},
    create: {
      id: 'org-techcorp-001',
      name: 'TechCorp Solutions',
    },
  })

  // TechCorp Users
  const techCorpOwner = await prisma.user.upsert({
    where: { email: 'owner@techcorp.com' },
    update: { password: hashedPassword },
    create: {
      id: 'user-tc-owner',
      email: 'owner@techcorp.com',
      name: 'John Anderson',
      password: hashedPassword,
      role: Role.OWNER,
      orgId: techCorp.id,
    },
  })

  const techCorpAdmin = await prisma.user.upsert({
    where: { email: 'admin@techcorp.com' },
    update: { password: hashedPassword },
    create: {
      id: 'user-tc-admin',
      email: 'admin@techcorp.com',
      name: 'Sarah Williams',
      password: hashedPassword,
      role: Role.ADMIN,
      orgId: techCorp.id,
    },
  })

  const techCorpManager = await prisma.user.upsert({
    where: { email: 'manager@techcorp.com' },
    update: { password: hashedPassword },
    create: {
      id: 'user-tc-manager',
      email: 'manager@techcorp.com',
      name: 'Mike Johnson',
      password: hashedPassword,
      role: Role.MANAGER,
      orgId: techCorp.id,
    },
  })

  const techCorpSales1 = await prisma.user.upsert({
    where: { email: 'emily@techcorp.com' },
    update: { password: hashedPassword },
    create: {
      id: 'user-tc-sales1',
      email: 'emily@techcorp.com',
      name: 'Emily Davis',
      password: hashedPassword,
      role: Role.SALES,
      orgId: techCorp.id,
    },
  })

  const techCorpSales2 = await prisma.user.upsert({
    where: { email: 'james@techcorp.com' },
    update: { password: hashedPassword },
    create: {
      id: 'user-tc-sales2',
      email: 'james@techcorp.com',
      name: 'James Wilson',
      password: hashedPassword,
      role: Role.SALES,
      orgId: techCorp.id,
    },
  })

  const techCorpSales3 = await prisma.user.upsert({
    where: { email: 'lisa@techcorp.com' },
    update: { password: hashedPassword },
    create: {
      id: 'user-tc-sales3',
      email: 'lisa@techcorp.com',
      name: 'Lisa Brown',
      password: hashedPassword,
      role: Role.SALES,
      orgId: techCorp.id,
    },
  })

  const techCorpUsers = [techCorpOwner, techCorpAdmin, techCorpManager, techCorpSales1, techCorpSales2, techCorpSales3]
  const techCorpSalesUsers = [techCorpSales1, techCorpSales2, techCorpSales3, techCorpManager]

  // ==================== ORGANIZATION 2: StartupHub ====================
  console.log('Creating StartupHub organization...')
  
  const startupHub = await prisma.organization.upsert({
    where: { id: 'org-startuphub-001' },
    update: {},
    create: {
      id: 'org-startuphub-001',
      name: 'StartupHub Inc',
    },
  })

  const startupOwner = await prisma.user.upsert({
    where: { email: 'owner@startuphub.com' },
    update: { password: hashedPassword },
    create: {
      id: 'user-sh-owner',
      email: 'owner@startuphub.com',
      name: 'Alex Chen',
      password: hashedPassword,
      role: Role.OWNER,
      orgId: startupHub.id,
    },
  })

  const startupAdmin = await prisma.user.upsert({
    where: { email: 'admin@startuphub.com' },
    update: { password: hashedPassword },
    create: {
      id: 'user-sh-admin',
      email: 'admin@startuphub.com',
      name: 'Rachel Kim',
      password: hashedPassword,
      role: Role.ADMIN,
      orgId: startupHub.id,
    },
  })

  const startupSales1 = await prisma.user.upsert({
    where: { email: 'david@startuphub.com' },
    update: { password: hashedPassword },
    create: {
      id: 'user-sh-sales1',
      email: 'david@startuphub.com',
      name: 'David Park',
      password: hashedPassword,
      role: Role.SALES,
      orgId: startupHub.id,
    },
  })

  // ==================== DEMO USERS (from your original setup) ====================
  console.log('Creating demo users...')
  
  // Create demo organization if it doesn't exist
  const demoOrg = await prisma.organization.upsert({
    where: { id: 'demo-org-001' },
    update: {},
    create: {
      id: 'demo-org-001',
      name: 'Demo Company',
    },
  })

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      role: Role.ADMIN,
      orgId: demoOrg.id,
    },
  })

  await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: { password: hashedPassword },
    create: {
      email: 'manager@example.com',
      name: 'Manager User',
      password: hashedPassword,
      role: Role.MANAGER,
      orgId: demoOrg.id,
    },
  })

  await prisma.user.upsert({
    where: { email: 'sales@example.com' },
    update: { password: hashedPassword },
    create: {
      email: 'sales@example.com',
      name: 'Sales User',
      password: hashedPassword,
      role: Role.SALES,
      orgId: demoOrg.id,
    },
  })

  // ==================== LEADS FOR TECHCORP ====================
  console.log('Creating leads for TechCorp...')
  
  const leadSources = ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Trade Show', 'Email Campaign', 'Partner']
  const companies = [
    'Acme Corporation', 'Global Dynamics', 'Initech', 'Umbrella Corp', 'Wayne Enterprises',
    'Stark Industries', 'Cyberdyne Systems', 'Weyland-Yutani', 'Oscorp', 'LexCorp',
    'Massive Dynamic', 'Soylent Corp', 'Tyrell Corporation', 'Aperture Science', 'Black Mesa',
    'Buy N Large', 'Gekko & Co', 'Hooli', 'Pied Piper', 'Raviga Capital'
  ]
  
  const firstNames = ['Michael', 'Jennifer', 'Robert', 'Linda', 'William', 'Elizabeth', 'David', 'Susan', 'Richard', 'Jessica', 'Thomas', 'Karen', 'Charles', 'Nancy', 'Daniel', 'Betty', 'Matthew', 'Margaret', 'Anthony', 'Sandra']
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin']

  const techCorpLeads: any[] = []
  
  for (let i = 0; i < 50; i++) {
    const firstName = randomItem(firstNames)
    const lastName = randomItem(lastNames)
    const company = randomItem(companies)
    const owner = randomItem(techCorpSalesUsers)
    const assignedTo = Math.random() > 0.3 ? randomItem(techCorpSalesUsers) : null
    
    const lead = await prisma.lead.upsert({
      where: { id: `lead-tc-${i.toString().padStart(3, '0')}` },
      update: {},
      create: {
        id: `lead-tc-${i.toString().padStart(3, '0')}`,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/[^a-z]/g, '')}.com`,
        phone: `+1 ${randomInt(200, 999)}-${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
        company,
        source: randomItem(leadSources),
        status: randomItem([LeadStatus.NEW, LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.CONTACTED, LeadStatus.QUALIFIED, LeadStatus.PROPOSAL, LeadStatus.WON, LeadStatus.LOST]),
        value: randomInt(5000, 500000),
        orgId: techCorp.id,
        ownerId: owner.id,
        assignedToId: assignedTo?.id || null,
        createdAt: randomPastDate(90),
      },
    })
    techCorpLeads.push(lead)
  }

  // ==================== DEALS FOR TECHCORP ====================
  console.log('Creating deals for TechCorp...')
  
  const dealStages = ['QUALIFICATION', 'DISCOVERY', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']
  const dealNames = [
    'Enterprise License Deal', 'Annual Subscription', 'Professional Services', 'Custom Development',
    'Platform Integration', 'Support Contract', 'Training Package', 'Consulting Engagement',
    'Cloud Migration', 'Security Audit', 'Data Analytics Suite', 'API Access License'
  ]

  const techCorpDeals: any[] = []
  const qualifiedLeads = techCorpLeads.filter(l => ['QUALIFIED', 'PROPOSAL', 'WON'].includes(l.status))

  for (let i = 0; i < 30; i++) {
    const stage = randomItem(dealStages)
    const lead = i < qualifiedLeads.length ? qualifiedLeads[i] : null
    const assignedTo = randomItem(techCorpSalesUsers)
    
    const deal = await prisma.deal.upsert({
      where: { id: `deal-tc-${i.toString().padStart(3, '0')}` },
      update: {},
      create: {
        id: `deal-tc-${i.toString().padStart(3, '0')}`,
        name: `${lead?.company || randomItem(companies)} - ${randomItem(dealNames)}`,
        value: randomInt(10000, 500000),
        stage,
        expectedCloseDate: stage.includes('CLOSED') ? null : randomFutureDate(90),
        closeDate: stage.includes('CLOSED') ? randomPastDate(30) : null,
        orgId: techCorp.id,
        leadId: lead?.id || null,
        assignedToId: assignedTo.id,
        createdAt: randomPastDate(60),
      },
    })
    techCorpDeals.push(deal)
  }

  // ==================== TASKS FOR TECHCORP ====================
  console.log('Creating tasks for TechCorp...')
  
  const taskTitles = [
    'Follow up with client', 'Send proposal', 'Schedule demo', 'Review contract',
    'Prepare presentation', 'Update CRM records', 'Send pricing information',
    'Conduct discovery call', 'Get approval from legal', 'Finalize deal terms',
    'Send thank you email', 'Research competitor pricing', 'Create case study',
    'Update pipeline forecast', 'Prepare quarterly report', 'Send referral request'
  ]

  for (let i = 0; i < 40; i++) {
    const assignedTo = randomItem(techCorpSalesUsers)
    const createdBy = randomItem([techCorpManager, techCorpAdmin, ...techCorpSalesUsers])
    const lead = Math.random() > 0.5 ? randomItem(techCorpLeads) : null
    const deal = !lead && Math.random() > 0.5 ? randomItem(techCorpDeals) : null
    const dueDate = randomFutureDate(14)
    const status = randomItem([TaskStatus.TODO, TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE])
    
    // Determine if task is overdue
    const isOverdue = status !== TaskStatus.DONE && new Date() > dueDate
    
    await prisma.task.upsert({
      where: { id: `task-tc-${i.toString().padStart(3, '0')}` },
      update: {},
      create: {
        id: `task-tc-${i.toString().padStart(3, '0')}`,
        title: randomItem(taskTitles),
        description: `Task description for ${randomItem(taskTitles).toLowerCase()}`,
        status,
        priority: randomItem([TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.MEDIUM, TaskPriority.HIGH]),
        dueDate: isOverdue ? randomPastDate(7) : dueDate,
        leadId: lead?.id || null,
        dealId: deal?.id || null,
        assignedToId: assignedTo.id,
        createdById: createdBy.id,
        orgId: techCorp.id,
        createdAt: randomPastDate(30),
      },
    })
  }

  // ==================== ACTIVITIES FOR TECHCORP ====================
  console.log('Creating activities for TechCorp...')
  
  const activityContents = {
    [ActivityType.NOTE]: [
      'Client expressed interest in premium features',
      'Budget approved for Q2',
      'Decision maker identified: CFO',
      'Competitor mentioned in conversation',
      'Positive feedback on demo',
      'Needs custom integration',
      'Timeline: Looking to implement within 3 months',
    ],
    [ActivityType.CALL]: [
      'Discussed pricing and timeline',
      'Followed up on proposal sent last week',
      'Introduced new product features',
      'Addressed technical concerns',
      'Scheduled next steps meeting',
      'Left voicemail, will try again tomorrow',
    ],
    [ActivityType.EMAIL]: [
      'Sent product brochure and case studies',
      'Followed up after trade show meeting',
      'Shared ROI calculator',
      'Sent contract for review',
      'Confirmation of next meeting',
    ],
    [ActivityType.MEETING]: [
      'Product demo with stakeholders',
      'Discovery meeting - identified key pain points',
      'Contract negotiation session',
      'Onboarding kickoff meeting',
      'Quarterly business review',
    ],
  }

  for (let i = 0; i < 100; i++) {
    const lead = randomItem(techCorpLeads)
    const user = randomItem(techCorpSalesUsers)
    const activityType = randomItem([ActivityType.NOTE, ActivityType.CALL, ActivityType.EMAIL, ActivityType.MEETING])
    
    await prisma.activity.upsert({
      where: { id: `activity-tc-${i.toString().padStart(3, '0')}` },
      update: {},
      create: {
        id: `activity-tc-${i.toString().padStart(3, '0')}`,
        type: activityType,
        content: randomItem(activityContents[activityType]),
        leadId: lead.id,
        userId: user.id,
        createdAt: randomPastDate(60),
      },
    })
  }

  // ==================== NOTIFICATIONS FOR TECHCORP ====================
  console.log('Creating notifications for TechCorp...')
  
  const notificationTemplates = [
    { type: NotificationType.TASK_ASSIGNED, title: 'New Task Assigned', message: 'You have been assigned a new task' },
    { type: NotificationType.LEAD_ASSIGNED, title: 'New Lead Assigned', message: 'A new lead has been assigned to you' },
    { type: NotificationType.DEAL_UPDATED, title: 'Deal Updated', message: 'A deal you\'re tracking has been updated' },
    { type: NotificationType.USER_ADDED, title: 'Welcome to the Team', message: 'A new team member has joined' },
    { type: NotificationType.SYSTEM, title: 'System Update', message: 'New features are available' },
  ]

  for (const user of techCorpUsers) {
    for (let i = 0; i < 5; i++) {
      const template = randomItem(notificationTemplates)
      await prisma.notification.upsert({
        where: { id: `notif-${user.id}-${i}` },
        update: {},
        create: {
          id: `notif-${user.id}-${i}`,
          title: template.title,
          message: template.message,
          type: template.type,
          isRead: Math.random() > 0.6,
          userId: user.id,
          orgId: techCorp.id,
          createdAt: randomPastDate(14),
        },
      })
    }
  }

  // ==================== EVENTS FOR TECHCORP ====================
  console.log('Creating events for TechCorp...')
  
  const eventTypes = ['LEAD_CREATED', 'LEAD_UPDATED', 'DEAL_CREATED', 'DEAL_WON', 'DEAL_LOST', 'TASK_COMPLETED', 'USER_LOGIN']
  
  for (let i = 0; i < 50; i++) {
    const user = randomItem(techCorpUsers)
    const eventType = randomItem(eventTypes)
    
    await prisma.event.upsert({
      where: { id: `event-tc-${i.toString().padStart(3, '0')}` },
      update: {},
      create: {
        id: `event-tc-${i.toString().padStart(3, '0')}`,
        type: eventType,
        payload: {
          eventType,
          timestamp: new Date().toISOString(),
          details: `${eventType} event triggered`,
        },
        userId: user.id,
        orgId: techCorp.id,
        createdAt: randomPastDate(30),
      },
    })
  }

  // ==================== AUDIT LOGS FOR TECHCORP ====================
  console.log('Creating audit logs for TechCorp...')
  
  const auditActions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT']
  const entityTypes = ['Lead', 'Deal', 'Task', 'User', 'Settings']
  
  for (let i = 0; i < 30; i++) {
    const user = randomItem(techCorpUsers)
    
    await prisma.auditLog.upsert({
      where: { id: `audit-tc-${i.toString().padStart(3, '0')}` },
      update: {},
      create: {
        id: `audit-tc-${i.toString().padStart(3, '0')}`,
        action: randomItem(auditActions),
        entityType: randomItem(entityTypes),
        entityId: `entity-${randomInt(1, 100)}`,
        changes: { field: 'status', oldValue: 'NEW', newValue: 'CONTACTED' },
        ipAddress: `192.168.1.${randomInt(1, 255)}`,
        userId: user.id,
        orgId: techCorp.id,
        createdAt: randomPastDate(30),
      },
    })
  }

  // ==================== SUMMARY ====================
  console.log('\n✅ Seed completed successfully!')
  console.log('\n📊 Data Summary:')
  console.log('================')
  
  const orgCount = await prisma.organization.count()
  const userCount = await prisma.user.count()
  const leadCount = await prisma.lead.count()
  const dealCount = await prisma.deal.count()
  const taskCount = await prisma.task.count()
  const activityCount = await prisma.activity.count()
  const notificationCount = await prisma.notification.count()
  
  console.log(`Organizations: ${orgCount}`)
  console.log(`Users: ${userCount}`)
  console.log(`Leads: ${leadCount}`)
  console.log(`Deals: ${dealCount}`)
  console.log(`Tasks: ${taskCount}`)
  console.log(`Activities: ${activityCount}`)
  console.log(`Notifications: ${notificationCount}`)
  
  console.log('\n🔑 Login Credentials (all passwords are "password"):')
  console.log('====================================================')
  console.log('\n📌 TechCorp Solutions:')
  console.log('  Owner:   owner@techcorp.com')
  console.log('  Admin:   admin@techcorp.com')
  console.log('  Manager: manager@techcorp.com')
  console.log('  Sales:   emily@techcorp.com, james@techcorp.com, lisa@techcorp.com')
  console.log('\n📌 StartupHub Inc:')
  console.log('  Owner:   owner@startuphub.com')
  console.log('  Admin:   admin@startuphub.com')
  console.log('  Sales:   david@startuphub.com')
  console.log('\n📌 Demo Company:')
  console.log('  Admin:   admin@example.com')
  console.log('  Manager: manager@example.com')
  console.log('  Sales:   sales@example.com')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
