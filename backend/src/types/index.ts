export const ROLES = ['producer', 'provider', 'admin'] as const;
export type Role = (typeof ROLES)[number];
export type ActorRole = Role | 'system';
export type UserStatus = 'active' | 'suspended' | 'deleted';

export const VERIFICATION_STATUSES = ['not_sent', 'under_review', 'approved', 'rejected'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const CATEGORY_ICONS = [
  'sprout', 'wheat', 'droplets', 'spray-can', 'flask-conical', 'truck', 'wrench',
  'tractor', 'leaf', 'shovel', 'warehouse', 'sun', 'tree-pine', 'beef',
] as const;
export type CategoryIcon = (typeof CATEGORY_ICONS)[number];

export const PRICE_UNITS = ['hectare', 'hour', 'day', 'trip'] as const;
export type PriceUnit = (typeof PRICE_UNITS)[number];

export const SERVICE_STATUSES = ['active', 'paused', 'hidden'] as const;
export type ServiceStatus = (typeof SERVICE_STATUSES)[number];

export const EQUIPMENT_TYPES = [
  'tractor', 'harvester', 'sprayer', 'drone', 'truck', 'implement', 'other',
] as const;
export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

export const REQUEST_STATUSES = [
  'pending', 'counter_offer', 'accepted', 'in_progress', 'completed', 'rejected', 'cancelled',
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export const OPEN_STATUSES: RequestStatus[] = ['pending', 'counter_offer', 'accepted', 'in_progress'];

export type RequestEventType =
  | 'created' | 'accepted' | 'rejected' | 'counter_offer'
  | 'counter_offer_accepted' | 'counter_offer_declined'
  | 'started' | 'completed' | 'cancelled';

export type RequestAction =
  | 'cancel' | 'accept_counter_offer' | 'decline_counter_offer' | 'review' | 'edit_review'
  | 'accept' | 'reject' | 'counter_offer' | 'start' | 'complete'
  | 'message' | 'report';

export type NotificationType =
  | 'request_created' | 'request_status' | 'counter_offer' | 'message'
  | 'review' | 'review_reply' | 'verification' | 'service_hidden'
  | 'warning' | 'report_resolved' | 'report_created' | 'verification_submitted';

export const REPORT_TARGET_TYPES = ['service', 'review', 'user', 'request'] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];
export const REPORT_REASONS = ['offensive', 'false_info', 'fraud', 'service_not_done', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export const REPORT_STATUSES = ['open', 'resolved', 'dismissed'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export const REPORT_ACTIONS = ['hide_service', 'hide_review', 'warn', 'suspend', 'archive'] as const;
export type ReportResolutionAction = (typeof REPORT_ACTIONS)[number];

export const UPLOAD_PURPOSES = ['public', 'verification'] as const;
export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];

export const ADMIN_ACTION_TYPES = [
  'suspend_user', 'reactivate_user', 'create_admin',
  'approve_verification', 'reject_verification',
  'hide_service', 'show_service', 'delete_service',
  'hide_review', 'warn_user', 'resolve_report', 'dismiss_report',
  'create_category', 'update_category', 'delete_category',
] as const;
export type AdminActionType = (typeof ADMIN_ACTION_TYPES)[number];
export type AdminTargetType = 'user' | 'service' | 'review' | 'report' | 'category' | 'verification';

export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;
