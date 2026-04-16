import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import crypto from 'crypto'

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 100_000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.auditLog.deleteMany({})
  await prisma.opportunityTag.deleteMany({})
  await prisma.contactTag.deleteMany({})
  await prisma.companyTag.deleteMany({})
  await prisma.tag.deleteMany({})
  await prisma.note.deleteMany({})
  await prisma.task.deleteMany({})
  await prisma.activity.deleteMany({})
  await prisma.opportunityContact.deleteMany({})
  await prisma.opportunity.deleteMany({})
  await prisma.contact.deleteMany({})
  await prisma.company.deleteMany({})
  await prisma.user.deleteMany({})

  const adminEmail = process.env.ADMIN_EMAIL || 'fraser@solocrm.local'
  const adminPassword = process.env.ADMIN_PASSWORD || process.env.AUTH_PASSWORD || 'changeme123'

  // Create admin user
  const user = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'Fraser',
      passwordHash: hashPassword(adminPassword),
      role: 'ADMIN',
      isActive: true,
    },
  })

  // Create companies
  const altitudeSystems = await prisma.company.create({
    data: {
      userId: user.id,
      name: 'Altitude Systems Ltd',
      website: 'https://altitudesystems.com',
      country: 'United Kingdom',
      city: 'Bristol',
      industry: 'AEROSPACE',
      companyType: 'OEM',
      regulatoryEnvironment: ['EASA', 'ARP_4761'],
      notes: 'Leading aerospace systems manufacturer. Focus on avionics and flight control systems.',
    },
  })

  const medSafeTech = await prisma.company.create({
    data: {
      userId: user.id,
      name: 'MedSafe Technologies',
      website: 'https://medsafetech.ie',
      country: 'Ireland',
      city: 'Dublin',
      industry: 'MEDICAL_DEVICE',
      companyType: 'STARTUP',
      regulatoryEnvironment: ['EU_MDR', 'IEC_60601'],
      notes: 'Early-stage medical device company focusing on surgical monitoring systems.',
    },
  })

  const neptuneDefence = await prisma.company.create({
    data: {
      userId: user.id,
      name: 'Neptune Defence Systems',
      website: 'https://neptunedefence.co.uk',
      country: 'United Kingdom',
      city: 'Portsmouth',
      industry: 'MARINE',
      companyType: 'SYSTEM_INTEGRATOR',
      regulatoryEnvironment: ['DEF_STAN_00_600', 'DEF_STAN_00_56'],
      notes: 'Naval systems integrator with strong MoD relationships.',
    },
  })

  const vitaflow = await prisma.company.create({
    data: {
      userId: user.id,
      name: 'Vitaflow Medical',
      website: 'https://vitaflowmedical.de',
      country: 'Germany',
      city: 'Heidelberg',
      industry: 'MEDICAL_DEVICE',
      companyType: 'OEM',
      regulatoryEnvironment: ['EU_MDR', 'IEC_60601'],
      notes: 'Established medical device manufacturer with multiple products in market.',
    },
  })

  const gridEdge = await prisma.company.create({
    data: {
      userId: user.id,
      name: 'GridEdge Renewables',
      website: 'https://gridedgerenewables.uk',
      country: 'United Kingdom',
      city: 'Edinburgh',
      industry: 'RENEWABLE_ENERGY',
      companyType: 'OPERATOR',
      regulatoryEnvironment: ['IEC_61508'],
      notes: 'Offshore wind farm operator with expanding SCADA infrastructure.',
    },
  })

  // Create contacts
  const marcus = await prisma.contact.create({
    data: {
      userId: user.id,
      companyId: altitudeSystems.id,
      firstName: 'Marcus',
      lastName: 'Webb',
      fullName: 'Marcus Webb',
      email: 'marcus.webb@altitudesystems.com',
      phone: '+44 117 946 0500',
      linkedinUrl: 'https://linkedin.com/in/marcuswebb',
      jobTitle: 'Chief Engineer',
      department: 'Engineering',
      influenceLevel: 'DECISION_MAKER',
      relationshipType: 'WARM',
      technicalFocus: 'Flight control systems, FHA & FMEA',
      notes: 'Very experienced, responsive. Previous positive project. Best contact for technical discussions.',
      lastContactDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      nextFollowUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  })

  const sarah = await prisma.contact.create({
    data: {
      userId: user.id,
      companyId: medSafeTech.id,
      firstName: 'Sarah',
      lastName: 'Chen',
      fullName: 'Sarah Chen',
      email: 'sarah.chen@medsafetech.ie',
      phone: '+353 1 234 5678',
      linkedinUrl: 'https://linkedin.com/in/sarahchen',
      jobTitle: 'Head of Regulatory Affairs',
      department: 'Regulatory',
      influenceLevel: 'INFLUENCER',
      relationshipType: 'WARM',
      technicalFocus: 'EU MDR compliance, IEC 60601 standards',
      notes: 'Key gatekeeper for regulatory work. Very organized. Prefers email communication.',
      lastContactDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      nextFollowUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  const james = await prisma.contact.create({
    data: {
      userId: user.id,
      companyId: neptuneDefence.id,
      firstName: 'James',
      lastName: 'Thornton',
      fullName: 'James Thornton',
      email: 'j.thornton@neptunedefence.co.uk',
      phone: '+44 23 9387 7000',
      linkedinUrl: 'https://linkedin.com/in/jamesthornton',
      jobTitle: 'Technical Director',
      department: 'Engineering',
      influenceLevel: 'DECISION_MAKER',
      relationshipType: 'PAST_CLIENT',
      technicalFocus: 'ILS, supportability, naval systems',
      notes: 'Former client from OPV programme. Excellent relationship. Likely to recommend.',
      lastContactDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      nextFollowUpDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  const anna = await prisma.contact.create({
    data: {
      userId: user.id,
      companyId: vitaflow.id,
      firstName: 'Anna',
      lastName: 'Hofmann',
      fullName: 'Anna Hofmann',
      email: 'a.hofmann@vitaflowmedical.de',
      phone: '+49 6221 123456',
      linkedinUrl: 'https://linkedin.com/in/annahofmann',
      jobTitle: 'VP Engineering',
      department: 'Engineering',
      influenceLevel: 'TECHNICAL_EVALUATOR',
      relationshipType: 'COLD',
      technicalFocus: 'RAMS, FMEA, reliability engineering',
      notes: 'Recently connected via LinkedIn. Appears interested in reliability work. Not yet engaged.',
      lastContactDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      nextFollowUpDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    },
  })

  const callum = await prisma.contact.create({
    data: {
      userId: user.id,
      companyId: gridEdge.id,
      firstName: 'Callum',
      lastName: 'Ross',
      fullName: 'Callum Ross',
      email: 'callum.ross@gridedgerenewables.uk',
      phone: '+44 131 456 7890',
      linkedinUrl: 'https://linkedin.com/in/callumross',
      jobTitle: 'Safety Manager',
      department: 'Safety & Compliance',
      influenceLevel: 'INFLUENCER',
      relationshipType: 'WARM',
      technicalFocus: 'Offshore safety, IEC 61508, functional safety',
      notes: 'Very engaged. Attended workshop. Strong interest in offshore safety analysis.',
      lastContactDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      nextFollowUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  })

  // Create opportunities
  const oppAileron = await prisma.opportunity.create({
    data: {
      userId: user.id,
      companyId: altitudeSystems.id,
      primaryContactId: marcus.id,
      title: 'FHA & FMECA for Aileron Control System',
      description:
        'Functional Hazard Analysis and FMEA for new aileron control system. Includes certification support for CS-23.',
      stage: 'TECHNICAL_DISCUSSION',
      industry: 'AEROSPACE',
      systemType: 'Flight Control System',
      projectPhase: 'DESIGN',
      regulatoryDrivers: ['EASA', 'ARP_4761'],
      services: ['FHA', 'FMECA', 'SAFETY_ANALYSIS'],
      estimatedValue: new Decimal('45000'),
      currency: 'GBP',
      probabilityPercent: 60,
      urgency: 'HIGH',
      source: 'Existing customer',
      painPoints: 'Certification timeline pressure, need experienced FHA facilitator',
      competitor: 'TÜV SÜD',
      expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      nextAction: 'Send detailed scope document and team CV',
    },
  })

  const oppIEC60601 = await prisma.opportunity.create({
    data: {
      userId: user.id,
      companyId: medSafeTech.id,
      primaryContactId: sarah.id,
      title: 'IEC 60601 Compliance Review',
      description:
        'Full compliance review of surgical monitoring system against EU MDR and IEC 60601 standards. Preparation for notified body audit.',
      stage: 'PROPOSAL_SENT',
      industry: 'MEDICAL_DEVICE',
      systemType: 'Surgical Monitoring Device',
      projectPhase: 'VERIFICATION',
      regulatoryDrivers: ['EU_MDR', 'IEC_60601'],
      services: ['REGULATORY_COMPLIANCE', 'CERTIFICATION_SUPPORT'],
      estimatedValue: new Decimal('28000'),
      currency: 'EUR',
      probabilityPercent: 70,
      urgency: 'CRITICAL',
      source: 'Inbound inquiry',
      painPoints: 'First regulatory submission, complex supply chain',
      competitor: 'None yet identified',
      expectedCloseDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      nextAction: 'Follow up on proposal, schedule kick-off call',
      lastActivityDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  })

  const oppILS = await prisma.opportunity.create({
    data: {
      userId: user.id,
      companyId: neptuneDefence.id,
      primaryContactId: james.id,
      title: 'ILS Programme Support - OPV Programme',
      description:
        'Integrated Logistics Support for Offshore Patrol Vessel programme. Full lifecycle maintenance planning, spares analysis, and obsolescence management.',
      stage: 'NEGOTIATION',
      industry: 'MARINE',
      systemType: 'Naval vessel systems',
      projectPhase: 'DESIGN',
      regulatoryDrivers: ['DEF_STAN_00_600', 'DEF_STAN_00_56'],
      services: ['ILS', 'SUPPORTABILITY', 'MAINTENANCE_ANALYSIS', 'SPARES_ANALYSIS'],
      estimatedValue: new Decimal('85000'),
      currency: 'GBP',
      probabilityPercent: 80,
      urgency: 'HIGH',
      source: 'Repeat customer',
      painPoints: 'Aggressive schedule, multiple stakeholders',
      competitor: 'DRS Technologies',
      expectedCloseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      nextAction: 'Review contract terms and insurance requirements',
      lastActivityDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  })

  const oppRAMS = await prisma.opportunity.create({
    data: {
      userId: user.id,
      companyId: vitaflow.id,
      primaryContactId: anna.id,
      title: 'RAMS Study for Insulin Delivery Device',
      description:
        'Comprehensive RAMS (Reliability, Availability, Maintainability, Safety) analysis for next-generation insulin delivery system. Includes probabilistic modelling.',
      stage: 'NEW_LEAD',
      industry: 'MEDICAL_DEVICE',
      systemType: 'Medical infusion device',
      projectPhase: 'CONCEPT',
      regulatoryDrivers: ['EU_MDR', 'IEC_60601'],
      services: ['RAMS', 'RELIABILITY_ENGINEERING', 'FMECA'],
      estimatedValue: new Decimal('35000'),
      currency: 'EUR',
      probabilityPercent: 25,
      urgency: 'MEDIUM',
      source: 'LinkedIn outreach',
      painPoints: 'Budget constraints, competitive market',
      competitor: 'Multiple local consultancies',
      expectedCloseDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      nextAction: 'Schedule introductory call with Anna',
    },
  })

  const oppOffshoreWind = await prisma.opportunity.create({
    data: {
      userId: user.id,
      companyId: gridEdge.id,
      primaryContactId: callum.id,
      title: 'Safety Case for Offshore Wind SCADA',
      description:
        'Functional safety analysis and safety case development for upgraded SCADA system controlling offshore wind farm. IEC 61508 SIL analysis.',
      stage: 'PROBLEM_DEFINED',
      industry: 'RENEWABLE_ENERGY',
      systemType: 'Wind farm SCADA system',
      projectPhase: 'DESIGN',
      regulatoryDrivers: ['IEC_61508'],
      services: ['SAFETY_ANALYSIS', 'RISK_ASSESSMENT', 'CERTIFICATION_SUPPORT'],
      estimatedValue: new Decimal('32000'),
      currency: 'GBP',
      probabilityPercent: 45,
      urgency: 'MEDIUM',
      source: 'Workshop attendee follow-up',
      painPoints: 'Regulatory pressure, need for independent assessment',
      competitor: 'None yet identified',
      expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      nextAction: 'Request meeting to discuss detailed scope and approach',
      lastActivityDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  })

  // Create tasks
  await prisma.task.create({
    data: {
      userId: user.id,
      title: 'Send FMECA scope document to Marcus Webb',
      description: 'Include team CVs and example deliverables from similar projects.',
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      priority: 'HIGH',
      status: 'OPEN',
      contactId: marcus.id,
      opportunityId: oppAileron.id,
    },
  })

  await prisma.task.create({
    data: {
      userId: user.id,
      title: 'Follow up on IEC 60601 proposal',
      description: 'Check if Sarah has reviewed the proposal. Offer to schedule kick-off call.',
      dueDate: new Date(Date.now()),
      priority: 'HIGH',
      status: 'OPEN',
      contactId: sarah.id,
      opportunityId: oppIEC60601.id,
    },
  })

  await prisma.task.create({
    data: {
      userId: user.id,
      title: 'Review ILS contract terms from Neptune',
      description: 'Check insurance requirements and liability caps. Consult with accountant.',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      priority: 'URGENT',
      status: 'OPEN',
      contactId: james.id,
      opportunityId: oppILS.id,
    },
  })

  await prisma.task.create({
    data: {
      userId: user.id,
      title: 'Research Vitaflow existing FMECA documentation',
      description: 'Search for any previous reliability studies or documented failure modes.',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      priority: 'MEDIUM',
      status: 'OPEN',
      contactId: anna.id,
      opportunityId: oppRAMS.id,
    },
  })

  await prisma.task.create({
    data: {
      userId: user.id,
      title: 'Request meeting with Callum Ross',
      description: 'Schedule 1-hour technical discussion about offshore wind safety requirements.',
      dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      priority: 'MEDIUM',
      status: 'OPEN',
      contactId: callum.id,
      opportunityId: oppOffshoreWind.id,
    },
  })

  await prisma.task.create({
    data: {
      userId: user.id,
      title: 'Update LinkedIn after Neptune win',
      description: 'Post about ILS engagement. Tag James and Neptune.',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      priority: 'LOW',
      status: 'OPEN',
    },
  })

  // Create activities
  await prisma.activity.create({
    data: {
      userId: user.id,
      type: 'CALL',
      subject: 'Technical discussion - FHA scope and schedule',
      summary: 'Discussed aileron control system FHA scope. Marcus confirmed EASA certification timeline.',
      happenedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      contactId: marcus.id,
      opportunityId: oppAileron.id,
      companyId: altitudeSystems.id,
      nextStep: 'Send detailed scope and team information',
    },
  })

  await prisma.activity.create({
    data: {
      userId: user.id,
      type: 'EMAIL',
      subject: 'IEC 60601 Compliance Review - Formal Proposal',
      summary: 'Sent detailed proposal with methodology, timeline, and pricing to Sarah.',
      happenedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      contactId: sarah.id,
      opportunityId: oppIEC60601.id,
      companyId: medSafeTech.id,
      nextStep: 'Follow up within 5 working days',
    },
  })

  await prisma.activity.create({
    data: {
      userId: user.id,
      type: 'MEETING',
      subject: 'DSEI Exhibition meeting - Naval systems and ILS',
      summary:
        'Met James at DSEI. Discussed OPV programme schedule and ILS approach. Strong interest confirmed.',
      happenedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      contactId: james.id,
      opportunityId: oppILS.id,
      companyId: neptuneDefence.id,
      nextStep: 'Send formal proposal by end of month',
    },
  })

  await prisma.activity.create({
    data: {
      userId: user.id,
      type: 'LINKEDIN_MESSAGE',
      subject: 'Connection request and brief introduction',
      summary: 'Reached out to Anna regarding medical device RAMS analysis. Initial response positive.',
      happenedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      contactId: anna.id,
      opportunityId: oppRAMS.id,
      companyId: vitaflow.id,
      nextStep: 'Schedule exploratory call',
    },
  })

  await prisma.activity.create({
    data: {
      userId: user.id,
      type: 'CALL',
      subject: 'Follow-up on offshore wind safety requirements',
      summary: 'Callum provided detailed requirements for SCADA safety case. Very interested in our SIL analysis approach.',
      happenedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      contactId: callum.id,
      opportunityId: oppOffshoreWind.id,
      companyId: gridEdge.id,
      nextStep: 'Schedule formal technical meeting to define scope',
    },
  })

  // Create a couple of notes
  await prisma.note.create({
    data: {
      userId: user.id,
      content:
        'Marcus mentioned they are under pressure from regulators to complete FHA by Q2. This is a key constraint on the project.',
      contactId: marcus.id,
      opportunityId: oppAileron.id,
    },
  })

  await prisma.note.create({
    data: {
      userId: user.id,
      content:
        'Callum has good technical knowledge but needs buy-in from his management team. May take longer than expected to close.',
      contactId: callum.id,
      opportunityId: oppOffshoreWind.id,
    },
  })

  console.log('Seed data created successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
