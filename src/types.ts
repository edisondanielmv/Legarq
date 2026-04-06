export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'tech' | 'client';
  phone?: string;
  address?: string;
  idNumber?: string;
}

export interface Procedure {
  id: string;
  title: string;
  clientEmail: string;
  clientName?: string;
  clientPhone?: string;
  clientAddress?: string;
  idNumber?: string;
  procedureType?: string;
  propertyNumber?: string;
  technicianEmail?: string;
  driveUrl?: string;
  status: 'Nuevo' | 'En Curso' | 'Finalizado';
  description: string;
  createdAt: string;
  completedSteps?: string; // Comma separated list of completed step indices
  expectedValue?: number;
  otherAgreements?: string;
}

export interface ProcedureType {
  id: string;
  name: string;
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
}

export interface ProcedureLog {
  id: string;
  procedureId: string;
  date: string;
  technicianEmail: string;
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
