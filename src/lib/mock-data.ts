export type SystemStatus = "healthy" | "degraded" | "critical";
export type AlertSeverity = "info" | "warning" | "critical";
export type ExecutionStatus = "running" | "pending" | "completed" | "failed";

export interface SystemMetrics {
  systemStatus: SystemStatus;
  activeExecutions: number;
  pendingDecisions: number;
  complianceScore: number;
  recentReceipts24h: number;
  alerts: {
    critical: number;
    warning: number;
    info: number;
  };
}

export interface Receipt {
  id: string;
  timestamp: string;
  action: string;
  agent: string;
  status: SystemStatus;
  decisionsRequired: number;
}

export interface Execution {
  id: string;
  agent: string;
  operation: string;
  status: ExecutionStatus;
  startedAt: string;
  progress: number;
  receiptsGenerated: number;
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  subsystem: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: "execution" | "decision" | "alert" | "receipt";
  description: string;
  status: SystemStatus;
  signer?: string;
  policyRef?: string;
  hashPrefix?: string;
}

export interface Subsystem {
  id: string;
  name: string;
  status: SystemStatus;
  uptime: string;
  lastCheck: string;
  load?: number; // 0-100, shows pressure/stress level
}

export interface Decision {
  id: string;
  timestamp: string;
  agent: string;
  action: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  requiresApproval: boolean;
  autoApproved: boolean;
}

export interface ComplianceEvidence {
  id: string;
  packName: string;
  status: "complete" | "partial" | "missing";
  lastUpdated: string;
  itemCount: number;
}

export interface AccessLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  result: "allowed" | "denied";
}

// Mock System Metrics
export const mockSystemMetrics: SystemMetrics = {
  systemStatus: "healthy",
  activeExecutions: 12,
  pendingDecisions: 3,
  complianceScore: 98.7,
  recentReceipts24h: 247,
  alerts: {
    critical: 0,
    warning: 2,
    info: 5,
  },
};

// Mock Recent Receipts
export const mockReceipts: Receipt[] = [
  {
    id: "RCP-2026-001",
    timestamp: "2026-01-04T14:32:18Z",
    action: "FileSystemAccess",
    agent: "DataProcessor-Alpha",
    status: "healthy",
    decisionsRequired: 0,
  },
  {
    id: "RCP-2026-002",
    timestamp: "2026-01-04T14:31:45Z",
    action: "NetworkRequest",
    agent: "ApiGateway-01",
    status: "healthy",
    decisionsRequired: 1,
  },
  {
    id: "RCP-2026-003",
    timestamp: "2026-01-04T14:30:22Z",
    action: "DatabaseWrite",
    agent: "StorageHandler-Beta",
    status: "degraded",
    decisionsRequired: 2,
  },
  {
    id: "RCP-2026-004",
    timestamp: "2026-01-04T14:29:10Z",
    action: "CredentialAccess",
    agent: "AuthService-02",
    status: "healthy",
    decisionsRequired: 0,
  },
  {
    id: "RCP-2026-005",
    timestamp: "2026-01-04T14:28:33Z",
    action: "ProcessExecution",
    agent: "WorkflowEngine-Gamma",
    status: "healthy",
    decisionsRequired: 1,
  },
];

// Mock Active Executions
export const mockExecutions: Execution[] = [
  {
    id: "EXE-2026-A12",
    agent: "DataProcessor-Alpha",
    operation: "BulkDataTransform",
    status: "running",
    startedAt: "2026-01-04T14:15:00Z",
    progress: 67,
    receiptsGenerated: 45,
  },
  {
    id: "EXE-2026-B08",
    agent: "ApiGateway-01",
    operation: "RequestBatchProcessing",
    status: "running",
    startedAt: "2026-01-04T14:20:00Z",
    progress: 42,
    receiptsGenerated: 23,
  },
  {
    id: "EXE-2026-C15",
    agent: "WorkflowEngine-Gamma",
    operation: "MultiStepWorkflow",
    status: "running",
    startedAt: "2026-01-04T13:45:00Z",
    progress: 89,
    receiptsGenerated: 78,
  },
  {
    id: "EXE-2026-D03",
    agent: "StorageHandler-Beta",
    operation: "DatabaseMigration",
    status: "pending",
    startedAt: "2026-01-04T14:30:00Z",
    progress: 0,
    receiptsGenerated: 0,
  },
];

// Mock Alerts
export const mockAlerts: Alert[] = [
  {
    id: "ALT-WARN-001",
    severity: "warning",
    message: "High decision queue latency detected (avg 2.3s)",
    timestamp: "2026-01-04T14:25:00Z",
    subsystem: "DecisionEngine",
  },
  {
    id: "ALT-WARN-002",
    severity: "warning",
    message: "Storage capacity at 78% - consider scaling",
    timestamp: "2026-01-04T13:15:00Z",
    subsystem: "StorageHandler",
  },
  {
    id: "ALT-INFO-001",
    severity: "info",
    message: "Compliance evidence pack 2026-01 completed",
    timestamp: "2026-01-04T12:00:00Z",
    subsystem: "ComplianceEngine",
  },
  {
    id: "ALT-INFO-002",
    severity: "info",
    message: "Automatic policy update deployed successfully",
    timestamp: "2026-01-04T11:30:00Z",
    subsystem: "PolicyManager",
  },
  {
    id: "ALT-INFO-003",
    severity: "info",
    message: "Daily audit report generated",
    timestamp: "2026-01-04T10:00:00Z",
    subsystem: "AuditTrail",
  },
];

// Mock Activity Events
export const mockActivityEvents: ActivityEvent[] = [
  {
    id: "ACT-001",
    timestamp: "2026-01-04T14:32:18Z",
    type: "receipt",
    description: "FileSystemAccess receipt generated by DataProcessor-Alpha",
    status: "healthy",
    signer: "DataProcessor-Alpha",
    policyRef: "keon-core/fs-access-v2",
    hashPrefix: "0x7a3f9e2b",
  },
  {
    id: "ACT-002",
    timestamp: "2026-01-04T14:31:45Z",
    type: "decision",
    description: "Network request decision pending for ApiGateway-01",
    status: "healthy",
    signer: "ApiGateway-01",
    policyRef: "keon-core/network-req-v1",
    hashPrefix: "0x4c8d1a5f",
  },
  {
    id: "ACT-003",
    timestamp: "2026-01-04T14:30:22Z",
    type: "alert",
    description: "Decision queue latency warning triggered",
    status: "degraded",
    signer: "SystemMonitor",
    policyRef: "keon-core/latency-threshold-v3",
    hashPrefix: "0x9b2e6c1d",
  },
  {
    id: "ACT-004",
    timestamp: "2026-01-04T14:29:10Z",
    type: "execution",
    description: "MultiStepWorkflow reached 89% completion",
    status: "healthy",
  },
  {
    id: "ACT-005",
    timestamp: "2026-01-04T14:28:33Z",
    type: "receipt",
    description: "ProcessExecution receipt from WorkflowEngine-Gamma",
    status: "healthy",
  },
  {
    id: "ACT-006",
    timestamp: "2026-01-04T14:27:15Z",
    type: "decision",
    description: "Auto-approved low-risk database write operation",
    status: "healthy",
  },
  {
    id: "ACT-007",
    timestamp: "2026-01-04T14:26:40Z",
    type: "execution",
    description: "BulkDataTransform execution started",
    status: "healthy",
  },
  {
    id: "ACT-008",
    timestamp: "2026-01-04T14:25:00Z",
    type: "alert",
    description: "Storage capacity warning at 78%",
    status: "degraded",
  },
];

// Mock Subsystems
export const mockSubsystems: Subsystem[] = [
  {
    id: "sys-decision-engine",
    name: "DecisionEngine",
    status: "healthy",
    uptime: "99.97%",
    lastCheck: "2026-01-04T14:32:00Z",
    load: 34, // Light load
  },
  {
    id: "sys-receipt-store",
    name: "ReceiptStore",
    status: "healthy",
    uptime: "99.99%",
    lastCheck: "2026-01-04T14:32:00Z",
    load: 12, // Very light
  },
  {
    id: "sys-policy-manager",
    name: "PolicyManager",
    status: "healthy",
    uptime: "99.95%",
    lastCheck: "2026-01-04T14:32:00Z",
    load: 56, // Moderate
  },
  {
    id: "sys-compliance-engine",
    name: "ComplianceEngine",
    status: "healthy",
    uptime: "99.98%",
    lastCheck: "2026-01-04T14:32:00Z",
    load: 23, // Light
  },
  {
    id: "sys-storage-handler",
    name: "StorageHandler",
    status: "degraded",
    uptime: "98.20%",
    lastCheck: "2026-01-04T14:32:00Z",
    load: 87, // High pressure - explains degraded status
  },
  {
    id: "sys-audit-trail",
    name: "AuditTrail",
    status: "healthy",
    uptime: "99.99%",
    lastCheck: "2026-01-04T14:32:00Z",
    load: 18, // Very light
  },
  {
    id: "sys-agent-runtime",
    name: "AgentRuntime",
    status: "healthy",
    uptime: "99.92%",
    lastCheck: "2026-01-04T14:32:00Z",
    load: 67, // Moderate-high but stable
  },
  {
    id: "sys-api-gateway",
    name: "ApiGateway",
    status: "healthy",
    uptime: "99.96%",
    lastCheck: "2026-01-04T14:32:00Z",
    load: 41, // Moderate
  },
];

// Mock Decisions
export const mockDecisions: Decision[] = [
  {
    id: "DEC-2026-047",
    timestamp: "2026-01-04T14:31:45Z",
    agent: "ApiGateway-01",
    action: "NetworkRequest to external API",
    riskLevel: "medium",
    requiresApproval: true,
    autoApproved: false,
  },
  {
    id: "DEC-2026-048",
    timestamp: "2026-01-04T14:30:22Z",
    agent: "StorageHandler-Beta",
    action: "Database schema modification",
    riskLevel: "high",
    requiresApproval: true,
    autoApproved: false,
  },
  {
    id: "DEC-2026-049",
    timestamp: "2026-01-04T14:28:33Z",
    agent: "WorkflowEngine-Gamma",
    action: "Process execution in sandbox",
    riskLevel: "low",
    requiresApproval: false,
    autoApproved: true,
  },
];

// Mock Compliance Evidence
export const mockComplianceEvidence: ComplianceEvidence[] = [
  {
    id: "EVID-2026-01",
    packName: "January 2026 Audit Pack",
    status: "complete",
    lastUpdated: "2026-01-04T12:00:00Z",
    itemCount: 247,
  },
  {
    id: "EVID-2025-12",
    packName: "December 2025 Audit Pack",
    status: "complete",
    lastUpdated: "2026-01-01T00:00:00Z",
    itemCount: 1823,
  },
  {
    id: "EVID-2025-11",
    packName: "November 2025 Audit Pack",
    status: "complete",
    lastUpdated: "2025-12-01T00:00:00Z",
    itemCount: 1654,
  },
];

// Mock Access Logs
export const mockAccessLogs: AccessLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-01-04T14:32:00Z",
    user: "operator.smith",
    action: "VIEW_DASHBOARD",
    resource: "/dashboard",
    result: "allowed",
  },
  {
    id: "LOG-002",
    timestamp: "2026-01-04T14:30:15Z",
    user: "admin.jones",
    action: "APPROVE_DECISION",
    resource: "/governance/decision/DEC-2026-046",
    result: "allowed",
  },
  {
    id: "LOG-003",
    timestamp: "2026-01-04T14:28:30Z",
    user: "auditor.chen",
    action: "EXPORT_EVIDENCE_PACK",
    resource: "/compliance/evidence/EVID-2026-01",
    result: "allowed",
  },
  {
    id: "LOG-004",
    timestamp: "2026-01-04T14:25:00Z",
    user: "analyst.kumar",
    action: "VIEW_EXECUTION_LOGS",
    resource: "/runtime/execution/EXE-2026-A12",
    result: "allowed",
  },
  {
    id: "LOG-005",
    timestamp: "2026-01-04T14:20:00Z",
    user: "external.user",
    action: "MODIFY_POLICY",
    resource: "/governance/policy/POL-001",
    result: "denied",
  },
];

// Mock Break-Glass Status
export const mockBreakGlassStatus = {
  active: false,
  lastActivation: "2025-12-15T03:22:00Z",
  activationCount: 2,
  currentApprovers: ["admin.jones", "admin.smith"],
  autoExpiry: "disabled",
};

// === AGENT 5 — CONTRACTS / SECURITY / AUDIT / INCIDENT FIXTURES ===

// Incidents
export const mockIncidents = [
  {
    id: "INC-2026-001",
    title: "StorageHandler degraded throughput",
    severity: "sev2",
    status: "investigating",
    startedAt: "2026-03-06T08:15:00Z",
    resolvedAt: null,
    tenantIds: ["tenant-keon", "tenant-omega"],
    affectedSubsystems: ["StorageHandler", "DecisionEngine"],
    incidentCommander: "admin.jones",
    receiptId: "RCP-2026-001",
  },
  {
    id: "INC-2026-002",
    title: "Decision queue latency spike",
    severity: "sev3",
    status: "mitigated",
    startedAt: "2026-03-05T14:00:00Z",
    resolvedAt: "2026-03-05T16:30:00Z",
    tenantIds: ["tenant-audit"],
    affectedSubsystems: ["DecisionEngine"],
    incidentCommander: "operator.smith",
    receiptId: null,
  },
  {
    id: "INC-2026-003",
    title: "API gateway 502 spike",
    severity: "sev1",
    status: "resolved",
    startedAt: "2026-03-04T22:10:00Z",
    resolvedAt: "2026-03-04T23:55:00Z",
    tenantIds: ["tenant-keon", "tenant-omega", "tenant-audit"],
    affectedSubsystems: ["ApiGateway"],
    incidentCommander: "admin.jones",
    receiptId: "RCP-2026-003",
  },
];

// SLO Burn Rates
export const mockSloBurnRates = [
  {
    sloId: "slo-api-availability",
    sloName: "API Availability",
    target: 0.999,
    window: "30d",
    burnRate: 1.2,
    errorBudgetRemaining: 0.65,
    errorBudgetTotal: 1.0,
    currentErrorRate: 0.0012,
    status: "at_risk",
    calculatedAt: "2026-03-06T09:00:00Z",
  },
  {
    sloId: "slo-decision-latency",
    sloName: "Decision Engine p99",
    target: 0.995,
    window: "7d",
    burnRate: 0.8,
    errorBudgetRemaining: 0.88,
    errorBudgetTotal: 1.0,
    currentErrorRate: 0.004,
    status: "healthy",
    calculatedAt: "2026-03-06T09:00:00Z",
  },
  {
    sloId: "slo-receipt-store",
    sloName: "Receipt Store Availability",
    target: 0.9999,
    window: "30d",
    burnRate: 0.1,
    errorBudgetRemaining: 0.98,
    errorBudgetTotal: 1.0,
    currentErrorRate: 0.00005,
    status: "healthy",
    calculatedAt: "2026-03-06T09:00:00Z",
  },
];

// Job Queues
export const mockJobQueues = [
  {
    queueName: "evidence-packaging",
    depth: 12,
    processingRate: 4.5,
    failureRate: 0.02,
    oldestPendingAge: 180,
    stuckCount: 0,
    status: "healthy",
  },
  {
    queueName: "billing-webhooks",
    depth: 3,
    processingRate: 10.0,
    failureRate: 0.0,
    oldestPendingAge: 30,
    stuckCount: 0,
    status: "healthy",
  },
  {
    queueName: "compliance-scans",
    depth: 48,
    processingRate: 2.1,
    failureRate: 0.12,
    oldestPendingAge: 720,
    stuckCount: 3,
    status: "degraded",
  },
];

// Delivery Channels
export const mockDeliveryChannels = [
  {
    channel: "email",
    successRate: 0.984,
    bounceCount: 14,
    retryQueueDepth: 3,
    last24hSent: 842,
    last24hFailed: 13,
    avgDeliveryMs: 1200,
    status: "healthy",
    lastCheckedAt: "2026-03-06T09:00:00Z",
  },
  {
    channel: "webhook",
    successRate: 0.997,
    bounceCount: 2,
    retryQueueDepth: 1,
    last24hSent: 3210,
    last24hFailed: 10,
    avgDeliveryMs: 180,
    status: "healthy",
    lastCheckedAt: "2026-03-06T09:00:00Z",
  },
];

// Security — Threat Signals
export const mockThreatSignals = [
  {
    signalId: "SIG-2026-001",
    type: "intrusion_attempt",
    severity: "high",
    tenantId: "tenant-omega",
    actorId: null,
    ip: "185.220.101.45",
    timestamp: "2026-03-06T07:30:00Z",
    description: "Multiple failed SSH attempts from Tor exit node",
    mitigated: true,
    mitigatedAt: "2026-03-06T07:35:00Z",
  },
  {
    signalId: "SIG-2026-002",
    type: "anomaly",
    severity: "medium",
    tenantId: "tenant-keon",
    actorId: "operator.smith",
    ip: null,
    timestamp: "2026-03-06T06:00:00Z",
    description: "Unusual data export volume detected",
    mitigated: false,
    mitigatedAt: null,
  },
  {
    signalId: "SIG-2026-003",
    type: "policy_violation",
    severity: "low",
    tenantId: "tenant-audit",
    actorId: null,
    ip: null,
    timestamp: "2026-03-05T18:00:00Z",
    description: "API key used outside approved IP range",
    mitigated: true,
    mitigatedAt: "2026-03-05T18:10:00Z",
  },
];

// Security — Auth Anomalies
export const mockAuthAnomalies = [
  {
    anomalyId: "AUTH-2026-001",
    type: "geo_jump",
    confidence: 0.94,
    tenantId: "tenant-keon",
    actorId: "user.anderson",
    detectedAt: "2026-03-06T05:15:00Z",
    sourceIp: "41.180.22.3",
    userAgent: "Mozilla/5.0 (Windows NT 10.0)",
    reviewStatus: "pending",
  },
  {
    anomalyId: "AUTH-2026-002",
    type: "credential_spray",
    confidence: 0.99,
    tenantId: null,
    actorId: null,
    detectedAt: "2026-03-05T23:00:00Z",
    sourceIp: "198.51.100.42",
    userAgent: "python-requests/2.28.0",
    reviewStatus: "confirmed",
  },
];

// Security — Abuse Events
export const mockAbuseEvents = [
  {
    abuseId: "ABUSE-2026-001",
    type: "rate_limit_breach",
    tenantId: "tenant-omega",
    actorId: null,
    severity: "medium",
    detectedAt: "2026-03-06T04:00:00Z",
    description: "API endpoint /api/decisions called 10,000x in 60s",
    actionTaken: "throttled",
  },
  {
    abuseId: "ABUSE-2026-002",
    type: "api_scraping",
    tenantId: "tenant-audit",
    actorId: "user.external",
    severity: "low",
    detectedAt: "2026-03-05T16:30:00Z",
    description: "Sequential enumeration of receipt IDs detected",
    actionTaken: "warned",
  },
];

// Security — Compliance Checks
export const mockComplianceChecks = [
  {
    checkId: "CC-SOC2-001",
    name: "Encryption at rest enabled",
    category: "soc2",
    status: "passing",
    lastCheckedAt: "2026-03-06T02:00:00Z",
    description: "All data stores use AES-256 encryption at rest",
  },
  {
    checkId: "CC-SOC2-002",
    name: "MFA enforcement",
    category: "soc2",
    status: "warning",
    lastCheckedAt: "2026-03-06T02:00:00Z",
    description: "3 operator accounts have MFA disabled",
    remediationSteps: ["Enforce MFA for all operator accounts", "Set MFA grace period to 0 days"],
  },
  {
    checkId: "CC-GDPR-001",
    name: "Data retention policy active",
    category: "gdpr",
    status: "passing",
    lastCheckedAt: "2026-03-06T02:00:00Z",
    description: "Retention runs are scheduled and executing successfully",
  },
];

// Finance — MRR Summary
export const mockMrrSummary = {
  mrr: 148500,
  arr: 1782000,
  activeSubscriptions: 94,
  trialSubscriptions: 12,
  newMrr30d: 12300,
  churned30d: 4200,
  expansionMrr30d: 6800,
  contractionMrr30d: 1100,
  netMrrGrowth30d: 13800,
  calculatedAt: "2026-03-06T00:00:00Z",
};

// Finance — Collections (failed charges)
export const mockCollections = [
  {
    tenantId: "tenant-omega",
    tenantName: "Omega Labs",
    invoiceId: "INV-2026-0231",
    amountCents: 149900,
    currency: "usd",
    failedAt: "2026-03-01T00:00:00Z",
    nextRetryAt: "2026-03-08T00:00:00Z",
    dunningStep: 2,
    status: "open",
    planTier: "growth",
  },
  {
    tenantId: "tenant-audit",
    tenantName: "Audit Sandbox",
    invoiceId: "INV-2026-0219",
    amountCents: 29900,
    currency: "usd",
    failedAt: "2026-02-28T00:00:00Z",
    nextRetryAt: null,
    dunningStep: 4,
    status: "open",
    planTier: "starter",
  },
];

// Finance — Azure Spend
export const mockAzureSpend = {
  period: "30d",
  totalSpend: 28450,
  budgetAmount: 32000,
  forecastSpend: 30100,
  byService: [
    { service: "Azure Kubernetes Service", spendUsd: 11200, budgetUsd: 12000, percentOfTotal: 39.4 },
    { service: "Azure Cosmos DB", spendUsd: 7800, budgetUsd: 9000, percentOfTotal: 27.4 },
    { service: "Azure Blob Storage", spendUsd: 3200, budgetUsd: 4000, percentOfTotal: 11.2 },
    { service: "Azure Monitor", spendUsd: 2100, budgetUsd: 2500, percentOfTotal: 7.4 },
    { service: "Other", spendUsd: 4150, budgetUsd: 4500, percentOfTotal: 14.6 },
  ],
  anomalies: [
    {
      service: "Azure Cosmos DB",
      description: "30% spike vs prior 30-day average",
      deltaUsd: 1800,
      detectedAt: "2026-03-04T00:00:00Z",
    },
  ],
  calculatedAt: "2026-03-06T00:00:00Z",
};

// Finance — Budget Alerts
export const mockBudgetAlerts = [
  {
    alertId: "BUDGET-2026-001",
    budgetName: "Monthly Azure Budget",
    severity: "warning",
    currentSpendUsd: 28450,
    budgetAmountUsd: 32000,
    percentUsed: 88.9,
    delta: 1800,
    triggeredAt: "2026-03-05T00:00:00Z",
    period: "2026-03",
  },
];

// Infrastructure — Azure Resources
export const mockAzureResources = [
  {
    resourceId: "/subscriptions/xxx/resourceGroups/keon-prod/providers/Microsoft.ContainerService/managedClusters/keon-aks",
    name: "keon-aks",
    type: "Microsoft.ContainerService/managedClusters",
    resourceGroup: "keon-prod",
    location: "eastus2",
    status: "healthy",
    monthlyCostUsd: 4200,
    lastUpdatedAt: "2026-03-06T08:00:00Z",
  },
  {
    resourceId: "/subscriptions/xxx/resourceGroups/keon-prod/providers/Microsoft.DocumentDB/databaseAccounts/keon-cosmos",
    name: "keon-cosmos",
    type: "Microsoft.DocumentDB/databaseAccounts",
    resourceGroup: "keon-prod",
    location: "eastus2",
    status: "healthy",
    monthlyCostUsd: 3100,
    lastUpdatedAt: "2026-03-06T08:00:00Z",
  },
  {
    resourceId: "/subscriptions/xxx/resourceGroups/keon-staging/providers/Microsoft.ContainerService/managedClusters/keon-aks-staging",
    name: "keon-aks-staging",
    type: "Microsoft.ContainerService/managedClusters",
    resourceGroup: "keon-staging",
    location: "westus2",
    status: "degraded",
    monthlyCostUsd: 1800,
    lastUpdatedAt: "2026-03-06T07:45:00Z",
  },
];

// Infrastructure — Resource Group Health
export const mockResourceGroupHealth = [
  {
    resourceGroup: "keon-prod",
    region: "eastus2",
    status: "healthy",
    resourceCount: 18,
    unhealthyCount: 0,
    totalMonthlyCostUsd: 16200,
    lastCheckedAt: "2026-03-06T09:00:00Z",
  },
  {
    resourceGroup: "keon-staging",
    region: "westus2",
    status: "degraded",
    resourceCount: 8,
    unhealthyCount: 1,
    totalMonthlyCostUsd: 4800,
    lastCheckedAt: "2026-03-06T09:00:00Z",
  },
  {
    resourceGroup: "keon-shared",
    region: "eastus2",
    status: "healthy",
    resourceCount: 5,
    unhealthyCount: 0,
    totalMonthlyCostUsd: 1200,
    lastCheckedAt: "2026-03-06T09:00:00Z",
  },
];

// Communications — Messages
export const mockCommMessages = [
  {
    messageId: "MSG-2026-001",
    subject: "Scheduled Maintenance – March 10",
    body: "We will be performing scheduled maintenance on March 10, 2026 from 02:00–04:00 UTC.",
    tenantIds: "all",
    channel: "email",
    status: "sent",
    templateId: "tmpl-maintenance",
    sentAt: "2026-03-05T14:00:00Z",
    sentBy: "admin.jones",
    recipientCount: 94,
    openRate: 0.72,
  },
  {
    messageId: "MSG-2026-002",
    subject: "New Feature: Evidence Pack Export",
    body: "You can now export compliance evidence packs as ZIP archives.",
    tenantIds: ["tenant-keon", "tenant-omega"],
    channel: "in-app",
    status: "sent",
    sentAt: "2026-03-01T10:00:00Z",
    sentBy: "operator.smith",
    recipientCount: 2,
  },
];

// Communications — Templates
export const mockCommTemplates = [
  {
    templateId: "tmpl-maintenance",
    name: "Scheduled Maintenance",
    description: "Standard maintenance notification",
    subject: "Scheduled Maintenance – {{date}}",
    body: "We will be performing scheduled maintenance on {{date}} from {{startTime}}–{{endTime}} UTC.\n\nAffected services: {{services}}",
    channel: "email",
    variables: ["date", "startTime", "endTime", "services"],
    lastUpdatedAt: "2026-02-15T00:00:00Z",
    createdBy: "admin.jones",
  },
  {
    templateId: "tmpl-incident-update",
    name: "Incident Status Update",
    description: "Incident update for affected tenants",
    subject: "Incident Update: {{incidentTitle}}",
    body: "We are currently investigating an issue affecting {{services}}. Current status: {{status}}.",
    channel: "both",
    variables: ["incidentTitle", "services", "status"],
    lastUpdatedAt: "2026-02-20T00:00:00Z",
    createdBy: "admin.jones",
  },
];

// Rollouts
export const mockRollouts = [
  {
    rolloutId: "ROLLOUT-2026-001",
    name: "Decision Engine v2.4.0",
    description: "Performance improvements and bug fixes",
    status: "active",
    canaryPercentage: 25,
    startedAt: "2026-03-05T10:00:00Z",
    targetVersion: "2.4.0",
    currentVersion: "2.3.8",
    affectedServices: ["DecisionEngine"],
    createdBy: "admin.jones",
  },
  {
    rolloutId: "ROLLOUT-2026-002",
    name: "Receipt Store v1.9.0",
    description: "Improved hashing algorithm",
    status: "scheduled",
    canaryPercentage: 0,
    scheduledFor: "2026-03-10T02:00:00Z",
    targetVersion: "1.9.0",
    currentVersion: "1.8.5",
    affectedServices: ["ReceiptStore"],
    createdBy: "operator.smith",
  },
];

// Rollouts — Feature Flags
export const mockFeatureFlags = [
  {
    flagId: "flag-evidence-export",
    name: "evidence_export_v2",
    description: "New ZIP-based evidence export",
    enabled: true,
    rolloutPercentage: 100,
    tenantOverrides: [],
    createdAt: "2026-02-01T00:00:00Z",
    updatedAt: "2026-03-01T00:00:00Z",
    tags: ["evidence", "export"],
  },
  {
    flagId: "flag-ai-triage",
    name: "ai_incident_triage",
    description: "AI-assisted incident root cause suggestion",
    enabled: false,
    rolloutPercentage: 0,
    tenantOverrides: [
      { tenantId: "tenant-keon", value: true, setBy: "admin.jones", setAt: "2026-03-04T00:00:00Z" },
    ],
    createdAt: "2026-02-15T00:00:00Z",
    updatedAt: "2026-03-04T00:00:00Z",
    tags: ["ai", "incidents"],
  },
  {
    flagId: "flag-new-billing-ui",
    name: "new_billing_ui",
    description: "Redesigned billing dashboard",
    enabled: true,
    rolloutPercentage: 50,
    tenantOverrides: [],
    createdAt: "2026-02-20T00:00:00Z",
    updatedAt: "2026-02-28T00:00:00Z",
    tags: ["billing", "ui"],
  },
];

// Rollouts — Maintenance Windows
export const mockMaintenanceWindows = [
  {
    windowId: "MW-2026-001",
    name: "AKS Node Pool Upgrade",
    scheduledStart: "2026-03-10T02:00:00Z",
    scheduledEnd: "2026-03-10T04:00:00Z",
    affectedServices: ["ApiGateway", "DecisionEngine", "AgentRuntime"],
    status: "scheduled",
    createdBy: "admin.jones",
    tenantNotified: true,
  },
];

// Audit — Audit Entries
export const mockAuditEntries = [
  {
    entryId: "AUDIT-2026-001",
    actorId: "admin.jones",
    actorDisplay: "Admin Jones",
    action: "APPROVE_OVERRIDE",
    target: "tenant-omega / feature_flag / ai_incident_triage",
    privilegeLevel: "ADMIN",
    timestamp: "2026-03-04T00:00:00Z",
    receiptId: "RCP-2026-001",
    rationale: "Customer requested early access for beta testing",
    result: "allowed",
  },
  {
    entryId: "AUDIT-2026-002",
    actorId: "operator.smith",
    actorDisplay: "Operator Smith",
    action: "VIEW_FINANCE_DASHBOARD",
    target: "/finance",
    privilegeLevel: "OPERATOR",
    timestamp: "2026-03-05T14:30:00Z",
    receiptId: null,
    rationale: null,
    result: "denied",
  },
  {
    entryId: "AUDIT-2026-003",
    actorId: "admin.jones",
    actorDisplay: "Admin Jones",
    action: "DECLARE_INCIDENT",
    target: "INC-2026-001",
    privilegeLevel: "ADMIN",
    timestamp: "2026-03-06T08:15:00Z",
    receiptId: "RCP-2026-003",
    rationale: null,
    result: "allowed",
  },
];

// Overrides — Override Receipts
export const mockOverrideReceipts = [
  {
    receiptId: "OVR-RCP-2026-001",
    overrideId: "OVR-2026-001",
    tenantId: "tenant-keon",
    targetType: "feature_flag",
    targetId: "flag-ai-triage",
    appliedValue: true,
    previousValue: false,
    appliedBy: "admin.jones",
    appliedAt: "2026-03-04T00:00:00Z",
    expiresAt: "2026-04-04T00:00:00Z",
    rationale: "Customer requested early access for beta testing",
    status: "active",
  },
];

// Operators
export const mockOperators = [
  {
    operatorId: "op-admin-jones",
    displayName: "Admin Jones",
    email: "admin.jones@keon.systems",
    role: "admin",
    privilegeLevel: "ADMIN",
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
    lastActiveAt: "2026-03-06T09:00:00Z",
    mfaEnabled: true,
    teams: ["platform", "security"],
  },
  {
    operatorId: "op-smith",
    displayName: "Operator Smith",
    email: "operator.smith@keon.systems",
    role: "operator",
    privilegeLevel: "OPERATOR",
    status: "active",
    createdAt: "2026-01-15T00:00:00Z",
    lastActiveAt: "2026-03-06T08:30:00Z",
    mfaEnabled: true,
    teams: ["platform"],
  },
  {
    operatorId: "op-auditor-chen",
    displayName: "Auditor Chen",
    email: "auditor.chen@keon.systems",
    role: "readonly",
    privilegeLevel: "OPERATOR",
    status: "active",
    createdAt: "2026-02-01T00:00:00Z",
    lastActiveAt: "2026-03-05T16:00:00Z",
    mfaEnabled: false,
    teams: ["compliance"],
  },
];

// API Keys
export const mockApiKeys = [
  {
    keyId: "key-prod-001",
    name: "Production Integration",
    prefix: "keon_prod_a1b2",
    operatorId: "op-admin-jones",
    scopes: ["receipts:read", "decisions:read", "evidence:read"],
    createdAt: "2026-01-10T00:00:00Z",
    lastUsedAt: "2026-03-06T08:55:00Z",
    expiresAt: null,
    status: "active",
  },
  {
    keyId: "key-ci-002",
    name: "CI Pipeline",
    prefix: "keon_ci_c3d4",
    operatorId: "op-smith",
    scopes: ["receipts:read", "runs:read"],
    createdAt: "2026-02-01T00:00:00Z",
    lastUsedAt: "2026-03-06T07:00:00Z",
    expiresAt: "2026-12-31T23:59:59Z",
    status: "active",
  },
];

// === AGENT 2 — TENANT / SUPPORT FIXTURES ===

export const mockTenantDetails: Record<string, {
  tenantId: string;
  displayName: string;
  plan: string;
  status: string;
  mrr: number;
  seats: number;
  usedSeats: number;
  storageQuotaGb: number;
  usedStorageGb: number;
  apiCallsQuota: number;
  apiCallsUsed: number;
  trialEndDate: string | null;
  billingCycleAnchor: number;
  createdAt: string;
  churnRiskScore: number;
  healthScore: number;
}> = {
  "tenant-acme": {
    tenantId: "tenant-acme",
    displayName: "Acme Corporation",
    plan: "enterprise",
    status: "active",
    mrr: 1499,
    seats: 47,
    usedSeats: 38,
    storageQuotaGb: 500,
    usedStorageGb: 112,
    apiCallsQuota: 1000000,
    apiCallsUsed: 642300,
    trialEndDate: null,
    billingCycleAnchor: 1,
    createdAt: "2024-01-15T00:00:00Z",
    churnRiskScore: 0.12,
    healthScore: 0.88,
  },
  "tenant-globex": {
    tenantId: "tenant-globex",
    displayName: "Globex Industries",
    plan: "business",
    status: "active",
    mrr: 399,
    seats: 23,
    usedSeats: 21,
    storageQuotaGb: 100,
    usedStorageGb: 67,
    apiCallsQuota: 200000,
    apiCallsUsed: 188000,
    trialEndDate: null,
    billingCycleAnchor: 15,
    createdAt: "2024-06-01T00:00:00Z",
    churnRiskScore: 0.38,
    healthScore: 0.61,
  },
  "tenant-initech": {
    tenantId: "tenant-initech",
    displayName: "Initech",
    plan: "starter",
    status: "suspended",
    mrr: 0,
    seats: 8,
    usedSeats: 0,
    storageQuotaGb: 10,
    usedStorageGb: 3,
    apiCallsQuota: 10000,
    apiCallsUsed: 0,
    trialEndDate: null,
    billingCycleAnchor: 1,
    createdAt: "2025-03-10T00:00:00Z",
    churnRiskScore: 0.95,
    healthScore: 0.05,
  },
};

export const mockSupportTickets = [
  {
    ticketId: "TKT-2026-001",
    tenantId: "tenant-globex",
    tenantName: "Globex Industries",
    subject: "API rate limit errors in production",
    status: "open",
    priority: "high",
    createdAt: "2026-03-05T09:30:00Z",
    lastReplyAt: "2026-03-05T14:22:00Z",
    assignee: "support.agent.kelly",
  },
  {
    ticketId: "TKT-2026-002",
    tenantId: "tenant-acme",
    tenantName: "Acme Corporation",
    subject: "Billing cycle questions",
    status: "pending",
    priority: "normal",
    createdAt: "2026-03-04T16:00:00Z",
    lastReplyAt: "2026-03-05T10:00:00Z",
    assignee: null,
  },
  {
    ticketId: "TKT-2026-003",
    tenantId: "tenant-initech",
    tenantName: "Initech",
    subject: "Account suspended — need reinstatement",
    status: "open",
    priority: "urgent",
    createdAt: "2026-03-06T07:00:00Z",
    lastReplyAt: "2026-03-06T07:00:00Z",
    assignee: null,
  },
];

export const mockChurnRiskTenants = [
  {
    tenantId: "tenant-initech",
    displayName: "Initech",
    churnRiskScore: 0.95,
    trend: "worsening",
    signals: ["account_suspended", "zero_api_calls_30d", "billing_failure"],
    lastActiveAt: "2025-12-01T00:00:00Z",
  },
  {
    tenantId: "tenant-globex",
    displayName: "Globex Industries",
    churnRiskScore: 0.38,
    trend: "stable",
    signals: ["quota_near_limit", "high_support_volume"],
    lastActiveAt: "2026-03-05T18:00:00Z",
  },
];

// === AGENT 1 — FLEET COMMAND SURFACE FIXTURES ===

// Fleet — SLO summary for burn banner (mirrors mockSloBurnRates shape but re-exported for fleet)
export const mockFleetSloBurnRates = [
  {
    sloId: "slo-api-availability",
    sloName: "API Availability",
    target: 0.999,
    window: "30d",
    burnRate: 1.2,
    errorBudgetRemaining: 0.65,
    errorBudgetTotal: 1.0,
    currentErrorRate: 0.0012,
    status: "at_risk",
    calculatedAt: "2026-03-06T09:00:00Z",
  },
  {
    sloId: "slo-decision-latency",
    sloName: "Decision Engine p99",
    target: 0.995,
    window: "7d",
    burnRate: 0.8,
    errorBudgetRemaining: 0.88,
    errorBudgetTotal: 1.0,
    currentErrorRate: 0.004,
    status: "healthy",
    calculatedAt: "2026-03-06T09:00:00Z",
  },
];

// Fleet — At-risk collections (normalized shape for collections fleet panel)
export const mockFleetCollections = [
  {
    tenantId: "tenant-omega",
    invoiceId: "INV-2026-0231",
    amount: 1499,
    dunningStep: 2,
    status: "open",
    failedAt: "2026-03-01T00:00:00Z",
  },
  {
    tenantId: "tenant-audit",
    invoiceId: "INV-2026-0219",
    amount: 299,
    dunningStep: 4,
    status: "open",
    failedAt: "2026-02-28T00:00:00Z",
  },
];

// === AGENT 4 — FINANCE / INFRA / COMMS / ROLLOUTS FIXTURES ===
// Note: mockMrrSummary and mockAzureSpend already defined above with richer shapes.
// Exporting additional named aliases for Agent 4 compatibility.

export const mockInfraResources = [
  { resourceId: "aks-prod-001", name: "aks-prod", type: "AKS", resourceGroup: "keon-prod-rg", location: "eastus2", status: "healthy", monthlyCost: 7200 },
  { resourceId: "sql-prod-001", name: "keon-db-prod", type: "Azure SQL", resourceGroup: "keon-prod-rg", location: "eastus2", status: "healthy", monthlyCost: 4100 },
  { resourceId: "stor-001", name: "keonprodblob", type: "Storage Account", resourceGroup: "keon-prod-rg", location: "eastus2", status: "healthy", monthlyCost: 2300 },
];

export const mockRolloutFlags = [
  { flagId: "flag-ai-assist", name: "AI Assistant", enabled: true, rolloutPercentage: 100, tenantOverrides: [] },
  { flagId: "flag-new-dashboard", name: "New Dashboard", enabled: true, rolloutPercentage: 25, tenantOverrides: [{ tenantId: "tenant-beta", enabled: true }] },
  { flagId: "flag-bulk-export", name: "Bulk Export", enabled: false, rolloutPercentage: 0, tenantOverrides: [] },
];

export const mockCommHistory = [
  { messageId: "msg-001", subject: "Scheduled Maintenance — March 8", tenantIds: ["all"], channel: "email", status: "sent", sentAt: "2026-03-05T18:00:00Z" },
  { messageId: "msg-002", subject: "New Feature: AI Assistant", tenantIds: ["tenant-omega", "tenant-beta"], channel: "in-app", status: "sent", sentAt: "2026-03-01T12:00:00Z" },
];

// === AGENT 3 — OBSERVABILITY / INCIDENT WORKSPACE FIXTURES ===
export const mockSloEntries = [
  { sloId: "slo-api-availability", name: "API Availability", target: 0.999, burnRate: 0.12, errorBudgetRemaining: 0.94, errorBudgetTotal: 1.0, currentErrorRate: 0.0001, status: "healthy", window: "30d" },
  { sloId: "slo-api-latency-p99", name: "API Latency p99", target: 0.995, burnRate: 1.4, errorBudgetRemaining: 0.38, errorBudgetTotal: 1.0, currentErrorRate: 0.0052, status: "burning", window: "30d" },
  { sloId: "slo-ingestion-pipeline", name: "Ingestion Pipeline", target: 0.99, burnRate: 0.08, errorBudgetRemaining: 0.97, errorBudgetTotal: 1.0, currentErrorRate: 0.00008, status: "healthy", window: "30d" },
];

export const mockJobHealth = {
  depth: 142,
  processingRate: 38.4,
  failureRate: 2.1,
  oldestPendingAge: 45,
  stuckCount: 2,
};

export const mockJobRuns = [
  { jobId: "job-001", queue: "notifications", name: "SendWelcomeEmail", status: "succeeded", attempts: 1 },
  { jobId: "job-002", queue: "billing", name: "ProcessSubscriptionRenewal", status: "stuck", attempts: 5 },
  { jobId: "job-003", queue: "ingestion", name: "ProcessTenantDataIngestion", status: "running", attempts: 1 },
  { jobId: "job-004", queue: "notifications", name: "SendUsageAlert", status: "failed", attempts: 3 },
];

export const mockDeliveryChannelsSimple = [
  { channel: "email", successRate: 98.2, bounceCount: 14, retryQueueDepth: 3, last24hSent: 847 },
  { channel: "webhook", successRate: 91.4, bounceCount: 0, retryQueueDepth: 22, last24hSent: 2341 },
];
