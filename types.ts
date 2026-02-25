
export enum JobStatus {
  PENDING = 'PENDING',
  INSPECTING = 'INSPECTING',
  AWAITING_APPROVAL = 'AWAITING_APPROVAL',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID'
}

export interface Part {
  id: string;
  name: string;
  price: number;
  laborEstimate: number;
  condition: 'new' | 'used' | 'refurbished';
  source: string;
  photoUrl?: string;
}

export interface CommunicationLogEntry {
  id: string;
  timestamp: string;
  type: 'QUOTE_SENT' | 'APPROVAL_RECEIVED' | 'JOB_COMPLETED' | 'CHECK_IN' | 'REMINDER_SENT' | 'STATUS_UPDATE' | 'OTHER';
  message: string;
}

export interface InventoryPart extends Part {
  stockQuantity: number;
  lowStockThreshold: number;
}

export interface VehicleRecord {
  id: string;
  licensePlate: string;
  clientName: string;
  contactInfo: string;
  make: string;
  model: string;
  complaint: string;
  status: JobStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  mechanicName?: string;
  damagedPartPhoto?: string;
  identifiedPart?: Part;
  hoursSpent?: number;
  jobDescription?: string;
  finalAmount?: number;
  communicationLog?: CommunicationLogEntry[];
}

export interface Quote {
  id: string;
  vehicleId: string;
  parts: Part[];
  totalLabor: number;
  totalPrice: number;
}
