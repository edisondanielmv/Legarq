export interface User {
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'tech' | 'client';
  phone?: string;
  address?: string;
  idNumber?: string;
}

export interface Procedure {
  id: string;
  code?: string;
  title: string;
  clientUsername: string;
  clientName?: string;
  clientPhone?: string;
  clientAddress?: string;
  idNumber?: string;
  procedureType?: string;
  propertyNumber?: string;
  technicianUsername?: string;
  technicianName?: string; // Added to show technician name in lists
  driveUrl?: string;
  status: 'Nuevo' | 'En Curso' | 'Finalizado';
  description: string;
  createdAt: string;
  completedSteps?: string; // Comma separated list of completed step IDs or indices
  expectedValue?: number;
  otherAgreements?: string;
}

export interface ProcedureType {
  id: string;
  name: string;
  steps?: string; // JSON string of steps or comma-separated
}

export interface FinancialItem {
  id: string;
  procedureId?: string;
  type: 'Ingreso' | 'Egreso';
  category: string;
  description: string;
  amount: number;
  date: string;
  fileUrl?: string;
  isReimbursable?: boolean;
  reimburseTo?: string;
}

export interface Account {
  id: string;
  name: string;
}

export interface ProcedureLog {
  id: string;
  procedureId: string;
  date: string;
  technicianUsername: string;
  note: string;
}

export interface ProcedureFile {
  id: string;
  procedureId: string;
  name: string;
  driveId: string;
  mimeType: string;
  url: string;
  date: string;
}
