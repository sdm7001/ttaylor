import {
  UserStatus,
  RoleLevel,
  MatterStatus,
  DocumentLifecycle,
  FilingPacketStatus,
  ChecklistItemStatus,
  LeadStatus,
  PartyRole,
  AuditEventType,
  MatterSensitivity,
} from './enums';

// ---- Auth & Users ----

export interface Permission {
  id: string;
  key: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  level: RoleLevel;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  roleId: string;
  role?: Role;
  barNumber?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---- Leads & Intake ----

export interface Lead {
  id: string;
  status: LeadStatus;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  source?: string;
  referralSource?: string;
  notes?: string;
  assignedToId?: string;
  assignedTo?: User;
  intakeQuestionnaire?: IntakeQuestionnaire;
  conflictCheck?: ConflictCheck;
  convertedMatterId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntakeQuestionnaire {
  id: string;
  leadId: string;
  responses: Record<string, unknown>;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConflictCheck {
  id: string;
  leadId: string;
  status: 'PENDING' | 'CLEAR' | 'CONFLICT_FOUND';
  checkedBy?: string;
  matches: ConflictMatch[];
  resolvedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConflictMatch {
  matterId: string;
  contactId: string;
  contactName: string;
  relationship: string;
  confidence: number;
}

// ---- Contacts & Addresses ----

export interface Address {
  id: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  county?: string;
  country?: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  dateOfBirth?: Date;
  ssn?: string;
  driversLicense?: string;
  addresses?: Address[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---- Matters ----

export interface Matter {
  id: string;
  causeNumber?: string;
  title: string;
  matterType: string;
  status: MatterStatus;
  sensitivity: MatterSensitivity;
  county?: string;
  court?: string;
  judge?: string;
  openedDate: Date;
  closedDate?: Date;
  statuteOfLimitations?: Date;
  assignments?: MatterAssignment[];
  parties?: MatterParty[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MatterAssignment {
  id: string;
  matterId: string;
  userId: string;
  user?: User;
  role: 'LEAD_ATTORNEY' | 'ASSOCIATE' | 'PARALEGAL' | 'LEGAL_ASSISTANT';
  assignedAt: Date;
  unassignedAt?: Date;
}

export interface MatterParty {
  id: string;
  matterId: string;
  contactId: string;
  contact?: Contact;
  role: PartyRole;
  isPrimary: boolean;
  representedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---- Documents ----

export interface Document {
  id: string;
  matterId: string;
  title: string;
  templateId?: string;
  status: DocumentLifecycle;
  currentVersionId?: string;
  currentVersion?: DocumentVersion;
  versions?: DocumentVersion[];
  approvals?: DocumentApproval[];
  createdById: string;
  createdBy?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  fileAssetId: string;
  fileAsset?: FileAsset;
  contentHash: string;
  changeDescription?: string;
  createdById: string;
  createdBy?: User;
  createdAt: Date;
}

export interface DocumentApproval {
  id: string;
  documentId: string;
  versionId: string;
  reviewerId: string;
  reviewer?: User;
  decision: 'APPROVED' | 'REJECTED' | 'REVISION_NEEDED';
  comments?: string;
  decidedAt: Date;
}

// ---- Filing ----

export interface FilingPacket {
  id: string;
  matterId: string;
  matter?: Matter;
  title: string;
  status: FilingPacketStatus;
  filingCode?: string;
  courtId?: string;
  items?: FilingPacketItem[];
  submissions?: FilingSubmission[];
  preparedById: string;
  preparedBy?: User;
  approvedById?: string;
  approvedBy?: User;
  approvedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FilingPacketItem {
  id: string;
  packetId: string;
  documentId: string;
  document?: Document;
  sortOrder: number;
  isRequired: boolean;
  notes?: string;
}

export interface FilingSubmission {
  id: string;
  packetId: string;
  submittedById: string;
  submittedBy?: User;
  submittedAt: Date;
  envelopeId?: string;
  courtResponse?: string;
  courtResponseAt?: Date;
  accepted: boolean | null;
  rejectionReason?: string;
}

// ---- Checklists ----

export interface ChecklistTemplate {
  id: string;
  name: string;
  matterType: string;
  description?: string;
  items: ChecklistTemplateItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistTemplateItem {
  id: string;
  templateId: string;
  title: string;
  description?: string;
  sortOrder: number;
  isRequired: boolean;
  defaultAssigneeRole?: string;
  dueDaysFromOpen?: number;
  dependsOnItemId?: string;
}

export interface ChecklistInstance {
  id: string;
  templateId: string;
  template?: ChecklistTemplate;
  matterId: string;
  items: ChecklistItemInstance[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistItemInstance {
  id: string;
  instanceId: string;
  templateItemId: string;
  title: string;
  status: ChecklistItemStatus;
  assignedToId?: string;
  assignedTo?: User;
  dueDate?: Date;
  completedAt?: Date;
  completedById?: string;
  notes?: string;
}

// ---- Calendar ----

export interface CalendarEvent {
  id: string;
  matterId?: string;
  matter?: Matter;
  title: string;
  description?: string;
  eventType: 'HEARING' | 'DEADLINE' | 'MEETING' | 'MEDIATION' | 'DEPOSITION' | 'OTHER';
  startAt: Date;
  endAt?: Date;
  allDay: boolean;
  location?: string;
  createdById: string;
  createdBy?: User;
  attendeeIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Deadline {
  id: string;
  matterId: string;
  matter?: Matter;
  title: string;
  description?: string;
  dueDate: Date;
  isStatutory: boolean;
  completedAt?: Date;
  completedById?: string;
  assignedToId?: string;
  assignedTo?: User;
  calendarEventId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---- Audit ----

export interface AuditEvent {
  id: string;
  eventType: AuditEventType;
  userId: string;
  user?: User;
  matterId?: string;
  documentId?: string;
  entityType?: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

// ---- File Assets ----

export interface FileAsset {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  storageProvider: 'S3' | 'MINIO' | 'LOCAL';
  contentHash: string;
  uploadedById: string;
  uploadedBy?: User;
  createdAt: Date;
}
