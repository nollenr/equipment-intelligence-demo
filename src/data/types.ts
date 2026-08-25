export interface FleetSummary {
  assetsOnWatchCount: number;
  facilityCount: number;
  monitoredAssetCount: number;
  openIncidentCount: number;
}

export interface FacilitySummary {
  assetCount: number;
  latestEventTime: string | null;
  normalAssetCount: number;
  openIncidentCount: number;
  plantCode: string;
  plantId: string;
  plantName: string;
  stateCode: string | null;
  timezoneName: string;
  watchAssetCount: number;
}

export interface IncidentSummary {
  equipmentCode: string;
  equipmentId: string;
  equipmentName: string;
  eventStatus: string;
  eventTime: string;
  faultCode: string;
  faultEventId: string;
  faultName: string;
  operatingStateAfter: string | null;
  operatingStatus: string;
  plantCode: string;
  plantId: string;
  plantName: string;
  severity: string;
  summary: string;
}

export interface FleetOverview {
  facilities: FacilitySummary[];
  incidents: IncidentSummary[];
  refreshedAt: string;
  summary: FleetSummary;
}

export interface FleetCorrelationEvent {
  ambientMetricId: string;
  ambientPeak: number;
  controllerMetricId: string;
  controllerPeak: number;
  controllerThreshold: number;
  equipmentCode: string;
  equipmentId: string;
  equipmentName: string;
  eventStatus: string;
  eventTime: string;
  faultEventId: string;
  highAmbientContext: boolean;
  model: string;
  plantCode: string;
  plantId: string;
  plantName: string;
  severity: string;
}

export interface FleetCorrelationSummary {
  averageAmbientPeak: number;
  averageControllerPeak: number;
  belowContextEventCount: number;
  equipmentCount: number;
  eventCount: number;
  facilityCount: number;
  highAmbientEventCount: number;
  highAmbientSharePercent: number;
}

export interface FleetCorrelationData {
  anchorFaultEventId: string;
  contextThresholdCelsius: number;
  events: FleetCorrelationEvent[];
  lookbackDays: number;
  model: string;
  summary: FleetCorrelationSummary;
}

export interface FleetCorrelationEventSource {
  equipmentCode: string;
  eventTime: string;
  faultEventId: string;
  ordinal: number;
  plantName: string;
  purpose: string;
}

export interface FleetCorrelationAnalysis extends IncidentAnalysis {
  eventSources: FleetCorrelationEventSource[];
}

export interface AssetInventoryItem {
  commissionedOn: string | null;
  equipmentCode: string;
  equipmentId: string;
  equipmentName: string;
  equipmentType: string;
  eventStatus: string | null;
  eventTime: string | null;
  faultCode: string | null;
  faultEventId: string | null;
  faultName: string | null;
  firmwareVersion: string | null;
  manufacturer: string;
  model: string;
  operatingStatus: string;
  plantCode: string;
  plantId: string;
  plantName: string;
  serialNumber: string;
  stateCode: string | null;
}

export interface AssetInventory {
  assets: AssetInventoryItem[];
  refreshedAt: string;
}

export interface IncidentMetric {
  aggregationMethod: string;
  averageValue: number | null;
  diagnosticVersion: string;
  latestValue: number | null;
  maximumValue: number | null;
  metricName: string;
  metricSummaryId: string;
  minimumValue: number | null;
  sourceSystem: string;
  thresholdExceedance: number | null;
  thresholdOperator: string | null;
  thresholdValue: number | null;
  unit: string;
  windowEnd: string;
  windowStart: string;
}

export interface IncidentDetail {
  clearedTime: string | null;
  commissionedOn: string | null;
  equipmentCode: string;
  equipmentId: string;
  equipmentName: string;
  equipmentType: string;
  eventStatus: string;
  eventTime: string;
  faultCode: string;
  faultEventId: string;
  faultName: string;
  firmwareVersion: string | null;
  manufacturer: string;
  metrics: IncidentMetric[];
  model: string;
  operatingStateAfter: string | null;
  operatingStateBefore: string | null;
  operatingStatus: string;
  operatorName: string;
  plantCode: string;
  plantId: string;
  plantName: string;
  severity: string;
  serialNumber: string;
  sourceEventId: string;
  sourceSystem: string;
  stateCode: string | null;
  summary: string;
  timezoneName: string;
}

export interface EvidenceDocumentSource {
  chunkContentSha256: string;
  citationLabel?: string;
  contentText: string;
  cosineDistance?: number;
  diagnosticDocumentSourceId?: string;
  documentChunkId: string;
  documentCode: string;
  documentId: string;
  documentType: string;
  documentVersionId: string;
  effectiveDate: string;
  includedInGeneration?: boolean;
  owningOrganization: string;
  pageEnd: number;
  pageStart: number;
  principalId?: string | undefined;
  relevanceNote?: string | undefined;
  retrievalMethod?: string;
  retrievalRank?: number;
  retrievalScopeId: string;
  retrievalScopeName: string;
  scopeCode: string;
  scopeType: string;
  sectionHeading: string | null;
  snapshotUri: string | null;
  sourceAnchor: string | null;
  sourceSystem: string;
  sourceUri: string | null;
  sourceVersionId: string | null;
  title: string;
  versionContentSha256: string;
  versionLabel: string;
}

export interface DiagnosticFinding {
  calculationExpression: string | null;
  comparisonOperator: string | null;
  diagnosticFindingId: string;
  explanation: string;
  findingCode: string;
  observedValue: number | null;
  ordinal: number;
  severity: string;
  thresholdValue: number | null;
  title: string;
  unit: string | null;
}

export interface IncidentAnalysis {
  answerId: string;
  answerStatus: string;
  answerText: string;
  completedAt: string;
  confidenceBasis: string;
  confidenceLabel: string;
  diagnosticRuleCode: string;
  diagnosticRuleVersion: string;
  diagnosticRunId: string;
  embeddingModel: string | null;
  evidenceState: string;
  findings: DiagnosticFinding[];
  generatedAt: string;
  generationModel: string;
  generationProvider: string;
  isFallback: boolean;
  promptTemplateVersion: string;
  questionText: string;
  recommendedAction: string | null;
  responseDurationMs: number;
  runStatus: string;
  sources: EvidenceDocumentSource[];
  startedAt: string;
}
