export enum FamilyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  MERGED = 'merged',
}

export enum MemberType {
  HEAD = 'head',
  ADULT = 'adult',
  DEPENDENT = 'dependent',
}

export enum MemberStatus {
  ACTIVE = 'active',
  INVITED = 'invited',
  SUSPENDED = 'suspended',
  REMOVED = 'removed',
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum RelationshipType {
  HUSBAND = 'husband',
  WIFE = 'wife',
  FATHER = 'father',
  MOTHER = 'mother',
  SON = 'son',
  DAUGHTER = 'daughter',
  BROTHER = 'brother',
  SISTER = 'sister',
  GUARDIAN = 'guardian',
  WARD = 'ward',
  GRANDFATHER = 'grandfather',
  GRANDMOTHER = 'grandmother',
  GRANDSON = 'grandson',
  GRANDDAUGHTER = 'granddaughter',
  UNCLE = 'uncle',
  AUNT = 'aunt',
  COUSIN = 'cousin',
  OTHER = 'other',
}

export enum DocumentType {
  MARRIAGE_CERTIFICATE = 'marriage_certificate',
  BIRTH_CERTIFICATE = 'birth_certificate',
  FAMILY_PHOTOGRAPH = 'family_photograph',
  UTILITY_BILL = 'utility_bill',
  PROOF_OF_ADDRESS = 'proof_of_address',
  OTHER = 'other',
}

export enum AuditAction {
  MEMBER_ADDED = 'member_added',
  MEMBER_REMOVED = 'member_removed',
  INVITATION_SENT = 'invitation_sent',
  INVITATION_ACCEPTED = 'invitation_accepted',
  INVITATION_REJECTED = 'invitation_rejected',
  INVITATION_CANCELLED = 'invitation_cancelled',
  ROLE_CHANGED = 'role_changed',
  HEADSHIP_TRANSFERRED = 'headship_transferred',
  DOCUMENT_UPLOADED = 'document_uploaded',
  DOCUMENT_DELETED = 'document_deleted',
  DOCUMENT_VERIFIED = 'document_verified',
  APPLICATION_SUBMITTED = 'application_submitted',
  PAYMENT_MADE = 'payment_made',
  MEMBER_SUSPENDED = 'member_suspended',
  MEMBER_ACTIVATED = 'member_activated',
  FAMILY_UPDATED = 'family_updated',
  DEPENDENT_ADDED = 'dependent_added',
  DEPENDENT_UPDATED = 'dependent_updated',
  DEPENDENT_REMOVED = 'dependent_removed',
}

export enum DependentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  REMOVED = 'removed',
}

export const RELATIONSHIPS_VALID = Object.values(RelationshipType);
