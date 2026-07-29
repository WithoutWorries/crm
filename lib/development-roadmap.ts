export type RoadmapStatus = 'COMPLETE' | 'IN_PROGRESS' | 'PLANNED'

export interface RoadmapStage {
  number: number
  title: string
  status: RoadmapStatus
  summary: string
  outcomes: string[]
}

export interface ProgressEntry {
  date: string
  title: string
  detail: string
  stage: number | null
}

export const ROADMAP_UPDATED_AT = '29 July 2026'

export const ROADMAP_STAGES: RoadmapStage[] = [
  {
    number: 0,
    title: 'Security stabilisation',
    status: 'IN_PROGRESS',
    summary:
      'Establish a safe internal workspace boundary before introducing engineering projects or customer access.',
    outcomes: [
      'Supported, security-patched application dependencies',
      'Revocable database-backed sessions and stronger password storage',
      'Persistent login throttling and security-event records',
      'Explicit internal-workspace and record-access boundaries',
      'Request limits, cross-site request protection and hardened response headers',
      'Auditable backup and restore arrangements',
    ],
  },
  {
    number: 1,
    title: 'Analysis project foundation',
    status: 'PLANNED',
    summary:
      'Create engineering projects from enquiries with sources, operating context, assumptions and controlled baselines.',
    outcomes: [
      'Engineering project and work-package records',
      'Project roles and membership boundaries',
      'Source evidence and configuration baseline records',
      'Assumption, question and data-gap registers',
    ],
  },
  {
    number: 2,
    title: 'Intake and data rationalisation',
    status: 'PLANNED',
    summary:
      'Import and rationalise BOM and usage information before analysis begins.',
    outcomes: [
      'CSV and spreadsheet staging imports',
      'Column mapping and hierarchy validation',
      'Engineer-controlled AI suggestions',
      'Customer clarification and baseline confirmation',
    ],
  },
  {
    number: 3,
    title: 'First analysis: FMECA',
    status: 'PLANNED',
    summary:
      'Deliver the first complete, evidence-led analysis workflow with deterministic risk calculations.',
    outcomes: [
      'Functions, failures, causes and effects',
      'Contract-selected severity and likelihood schemes',
      'Corrective actions and verification',
      'Immutable analysis revisions and review states',
    ],
  },
  {
    number: 4,
    title: 'Controlled deliverables',
    status: 'PLANNED',
    summary:
      'Populate the first version-controlled in-house DOCX template from approved analysis data.',
    outcomes: [
      'Versioned template registry',
      'FMEA/FMECA and CCA report generation',
      'Input-baseline and reviewer traceability',
      'Rendered document quality checks',
    ],
  },
  {
    number: 5,
    title: 'Expanded analysis chain',
    status: 'PLANNED',
    summary:
      'Add reliability, MTA, LORA, provisioning, PHS&T, TNA and related analyses one vertical slice at a time.',
    outcomes: [
      'Versioned deterministic calculation methods',
      'Traceable dependencies between analyses',
      'Reusable data across engineering deliverables',
      'Engineering review and approval gates',
    ],
  },
  {
    number: 6,
    title: 'S-Series exchange',
    status: 'PLANNED',
    summary:
      'Map approved project data to contract-selected S-Series issues and business rules.',
    outcomes: [
      'S3000L and S2000M exchange adapters',
      'S5000F and S6000T mappings',
      'S1000D publication integration',
      'Schema and project-business-rule validation',
    ],
  },
  {
    number: 7,
    title: 'Customer portal and FRACAS/DRACAS',
    status: 'PLANNED',
    summary:
      'Introduce strongly isolated customer project access and controlled in-service feedback.',
    outcomes: [
      'Managed identity and strong authentication',
      'Project-specific customer permissions',
      'Failure reporting, investigation and corrective action',
      'Validated feedback into new engineering baselines',
    ],
  },
]

export const PROGRESS_ENTRIES: ProgressEntry[] = [
  {
    date: '29 July 2026',
    title: 'Offline Knowledge capture secured',
    detail:
      'Drafts and submitted notes are now stored on the device before network access is attempted, then synchronised with user-scoped duplicate protection when connectivity returns.',
    stage: 0,
  },
  {
    date: '29 July 2026',
    title: 'Access boundary made visible',
    detail:
      'The Development panel now shows the current and planned visibility boundary for administrators, internal members and future customers.',
    stage: 0,
  },
  {
    date: '29 July 2026',
    title: 'Stage 0 implementation ready for rollout',
    detail:
      'The security code, database migration, workspace-scoped backup and production build have passed local validation. Deployment and an isolated restore drill remain before the stage is complete.',
    stage: 0,
  },
  {
    date: '29 July 2026',
    title: 'Stage 0 implementation started',
    detail:
      'Security stabilisation began with an explicit internal workspace boundary, revocable sessions, login throttling, request protection and dependency remediation.',
    stage: 0,
  },
  {
    date: '29 July 2026',
    title: 'Implementation plan approved',
    detail:
      'The staged evidence-led engineering architecture was accepted. A permanent in-app development record was requested.',
    stage: null,
  },
  {
    date: '28 July 2026',
    title: 'Architecture and source review completed',
    detail:
      'The existing application, ILS prompt library, naval reference, CV, FMECA prototype, S-Series prototype and thirteen controlled templates were reviewed.',
    stage: null,
  },
]
