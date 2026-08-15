export type UserRole = "donor" | "recipient" | "admin";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  profile: DonorProfile | RecipientProfile | null;
}

export type OrganType = "Kidney" | "Liver" | "Heart" | "Lung" | "Pancreas";
export type BloodGroup = "O-" | "O+" | "A-" | "A+" | "B-" | "B+" | "AB-" | "AB+";
export type UrgencyLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface GeoLocation {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface VerificationDocument {
  fileUrl: string;
  docType: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  rejectionReason?: string;
}

export interface HlaTyping {
  a1: string;
  a2: string;
  b1: string;
  b2: string;
  dr1: string;
  dr2: string;
}

export interface DonorProfile {
  _id: string;
  userId: string;
  organType?: OrganType; // legacy, keeping for backward compatibility
  organs: OrganType[];
  explicitConsent?: boolean;
  bloodGroup: BloodGroup;
  availability: boolean;
  location: GeoLocation;
  weight: number;
  age?: number;
  hla?: HlaTyping;
  verificationDocuments?: VerificationDocument[];
  status?: "active" | "inactive" | "matched";
  donorType?: string;
  medicalHistory?: string;
  hospital?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecipientProfile {
  _id: string;
  userId: string;
  organNeeded: OrganType;
  bloodGroup: BloodGroup;
  urgencyLevel: UrgencyLevel;
  location: GeoLocation;
  weight: number;
  age?: number;
  hla?: HlaTyping;
  hospital?: string;
  medicalHistory?: string;
  verificationDocuments?: VerificationDocument[];
  registrationDate: string;
  createdAt: string;
  updatedAt: string;
}

export type MatchStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "COMPLETED";

export interface Match {
  _id: string;
  donorId: string | DonorProfile;
  recipientId: string | RecipientProfile;
  score: number;
  status: MatchStatus;
  responseDeadline?: string;
  proposedBy?: string;
  donorStatus?: "PENDING" | "ACCEPTED" | "DECLINED";
  recipientStatus?: "PENDING" | "ACCEPTED" | "DECLINED";
  declineReason?: string;
  matchedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: string;
  createdAt: string;
}

export interface Message {
  _id: string;
  recipientId: string;
  text: string;
  response?: string;
  status: "PENDING" | "RESOLVED";
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    errors?: Record<string, string>;
    code?: string;
  };
}
