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

export interface DonorProfile {
  _id: string;
  userId: string;
  organType: OrganType;
  bloodGroup: BloodGroup;
  availability: boolean;
  location: GeoLocation;
  weight: number;
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
  matchedAt: string;
  createdAt: string;
  updatedAt: string;
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
