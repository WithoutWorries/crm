export const STAGE_LABELS: Record<string, string> = {
  NEW_LEAD: 'New Lead',
  INITIAL_CONTACT: 'Initial Contact',
  TECHNICAL_DISCUSSION: 'Technical Discussion',
  PROBLEM_DEFINED: 'Problem Defined',
  PROPOSAL_SENT: 'Proposal Sent',
  NEGOTIATION: 'Negotiation',
  WON: 'Won',
  LOST: 'Lost',
}

export const STAGE_COLORS: Record<string, string> = {
  NEW_LEAD: 'bg-slate-100 text-slate-800',
  INITIAL_CONTACT: 'bg-blue-100 text-blue-800',
  TECHNICAL_DISCUSSION: 'bg-indigo-100 text-indigo-800',
  PROBLEM_DEFINED: 'bg-purple-100 text-purple-800',
  PROPOSAL_SENT: 'bg-orange-100 text-orange-800',
  NEGOTIATION: 'bg-yellow-100 text-yellow-800',
  WON: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800',
}

export const RELATIONSHIP_LABELS: Record<string, string> = {
  COLD: 'Cold',
  WARM: 'Warm',
  REFERRAL: 'Referral',
  PAST_CLIENT: 'Past Client',
  CURRENT_CLIENT: 'Current Client',
  PARTNER: 'Partner',
}

export const RELATIONSHIP_COLORS: Record<string, string> = {
  COLD: 'bg-slate-100 text-slate-800',
  WARM: 'bg-orange-100 text-orange-800',
  REFERRAL: 'bg-blue-100 text-blue-800',
  PAST_CLIENT: 'bg-purple-100 text-purple-800',
  CURRENT_CLIENT: 'bg-green-100 text-green-800',
  PARTNER: 'bg-indigo-100 text-indigo-800',
}

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
}

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
}

export const TASK_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export const TASK_STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-slate-100 text-slate-800',
}

export const INDUSTRY_LABELS: Record<string, string> = {
  AEROSPACE: 'Aerospace',
  DEFENCE: 'Defence',
  MARINE: 'Marine',
  MEDICAL_DEVICE: 'Medical Device',
  PHARMACEUTICAL: 'Pharmaceutical',
  OIL_AND_GAS: 'Oil & Gas',
  RENEWABLE_ENERGY: 'Renewable Energy',
  RAIL: 'Rail',
  AUTOMOTIVE: 'Automotive',
  INDUSTRIAL: 'Industrial',
  OTHER: 'Other',
}

export const COMPANY_TYPE_LABELS: Record<string, string> = {
  OEM: 'OEM',
  STARTUP: 'Startup',
  CONSULTANCY: 'Consultancy',
  SYSTEM_INTEGRATOR: 'System Integrator',
  OPERATOR: 'Operator',
  GOVERNMENT: 'Government',
  OTHER: 'Other',
}

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  EMAIL: 'Email',
  CALL: 'Call',
  MEETING: 'Meeting',
  LINKEDIN_MESSAGE: 'LinkedIn Message',
  INTRO: 'Intro',
  PROPOSAL_SENT: 'Proposal Sent',
  PROPOSAL_REVIEW: 'Proposal Review',
  FOLLOW_UP: 'Follow-up',
  NOTE: 'Note',
  WORKSHOP: 'Workshop',
  OTHER: 'Other',
}

export const INFLUENCE_LEVEL_LABELS: Record<string, string> = {
  DECISION_MAKER: 'Decision Maker',
  INFLUENCER: 'Influencer',
  TECHNICAL_EVALUATOR: 'Technical Evaluator',
  PROCUREMENT: 'Procurement',
  UNKNOWN: 'Unknown',
}

export const INFLUENCE_LEVEL_COLORS: Record<string, string> = {
  DECISION_MAKER: 'bg-red-100 text-red-800',
  INFLUENCER: 'bg-orange-100 text-orange-800',
  TECHNICAL_EVALUATOR: 'bg-blue-100 text-blue-800',
  PROCUREMENT: 'bg-purple-100 text-purple-800',
  UNKNOWN: 'bg-slate-100 text-slate-800',
}

export const PROJECT_PHASE_LABELS: Record<string, string> = {
  CONCEPT: 'Concept',
  FEASIBILITY: 'Feasibility',
  DESIGN: 'Design',
  DEVELOPMENT: 'Development',
  VERIFICATION: 'Verification',
  VALIDATION: 'Validation',
  CERTIFICATION: 'Certification',
  DEPLOYMENT: 'Deployment',
  IN_SERVICE: 'In Service',
  SUPPORT: 'Support',
  UNKNOWN: 'Unknown',
}

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  RELIABILITY_ENGINEERING: 'Reliability Engineering',
  SAFETY_ANALYSIS: 'Safety Analysis',
  RAMS: 'RAMS',
  ILS: 'ILS/Supportability',
  SUPPORTABILITY: 'Supportability',
  MAINTENANCE_ANALYSIS: 'Maintenance Analysis',
  SPARES_ANALYSIS: 'Spares Analysis',
  OBSOLESCENCE_MANAGEMENT: 'Obsolescence Management',
  FMEA: 'FMEA',
  FMECA: 'FMECA',
  FTA: 'FTA',
  FHA: 'FHA',
  EVENT_TREE_ANALYSIS: 'Event Tree Analysis',
  RBD: 'RBD',
  WEIBULL_ANALYSIS: 'Weibull Analysis',
  MONTE_CARLO: 'Monte Carlo',
  RISK_ASSESSMENT: 'Risk Assessment',
  CERTIFICATION_SUPPORT: 'Certification Support',
  REGULATORY_COMPLIANCE: 'Regulatory Compliance',
  WHOLE_LIFE_COST: 'Whole Life Cost',
  TRAINING: 'Training',
  OTHER: 'Other',
}

export const REGULATORY_FRAMEWORK_LABELS: Record<string, string> = {
  EASA: 'EASA',
  FAA: 'FAA',
  FDA: 'FDA',
  EU_MDR: 'EU MDR',
  IEC_60812: 'IEC 60812',
  IEC_61508: 'IEC 61508',
  IEC_60601: 'IEC 60601',
  EN_50126: 'EN 50126',
  DEF_STAN_00_600: 'DEF STAN 00-600',
  DEF_STAN_00_56: 'DEF STAN 00-56',
  DEF_STAN_00_40: 'DEF STAN 00-40',
  ARP_4761: 'ARP 4761',
  ARP_5580: 'ARP 5580',
  ASD_S2000M: 'ASD S2000M',
  API_RP_17N: 'API RP 17N',
  ISO_26262: 'ISO 26262',
  OTHER: 'Other',
}

export const URGENCY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
}

export const URGENCY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
}
