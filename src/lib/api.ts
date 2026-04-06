import { User, Procedure, FinancialItem, ProcedureLog, ProcedureFile, ProcedureType } from '../types';

export const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbwXb4_BCCcvhiOg4ic1vq9FzbuafQ5I-MTz1LpJ1VWUg1-5rhgcXV0Y5AkocyOj0a6G5Q/exec";

export const apiCall = async <T>(action: string, data: any = {}): Promise<T> => {
  const url = APPS_SCRIPT_URL;
  
  if (!url) {
    console.warn("VITE_APPS_SCRIPT_URL no configurada. Usando modo demostración.");
    return mockApi(action, data);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action, data }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const result = await response.json();
    
    const isSuccess = result.success === true || result.status === 'success' || result.status === 'ok';
    
    if (!isSuccess) {
      throw new Error(result.error || result.message || 'Error en la base de datos');
    }
    
    return result.data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error("La conexión con Google Sheets tardó demasiado.");
    }
    console.error("API Error:", error);
    throw new Error(error.message || "Error de conexión con Google Sheets");
  }
};

const mockApi = async (action: string, data: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const mockUsers: User[] = [
    { id: '1', name: 'Admin Legarq', email: 'admin@legarconstructora.com', role: 'admin', phone: '0999999999', address: 'Quito', idNumber: '1700000001' },
    { id: '2', name: 'Técnico Juan', email: 'tecnico@legarconstructora.com', role: 'tech', phone: '0988888888', address: 'Valle', idNumber: '1700000002' },
    { id: '3', name: 'Cliente Demo', email: 'cliente@legarconstructora.com', role: 'client', phone: '0977777777', address: 'Cumbayá', idNumber: '1700000003' }
  ];

  const mockProcedures: Procedure[] = [
    { id: 'p1', title: 'Residencia Los Olivos', clientEmail: 'cliente@legarconstructora.com', status: 'En Curso', description: 'Diseño y legalización de vivienda unifamiliar.', createdAt: new Date().toISOString() },
    { id: 'p2', title: 'Local Comercial Centro', clientEmail: 'cliente@legarconstructora.com', status: 'Nuevo', description: 'Remodelación de local para restaurante.', createdAt: new Date().toISOString() }
  ];

  switch (action) {
    case 'login':
      return mockUsers.find(u => u.email === data.email) || mockUsers[0];
    case 'getProcedures':
      return data.role === 'client' ? mockProcedures.filter(p => p.clientEmail === data.email) : mockProcedures;
    case 'getLogs':
      return [{ id: 'l1', procedureId: data.procedureId, date: new Date().toISOString(), technicianEmail: 'tecnico@legarconstructora.com', note: 'Visita técnica inicial realizada.' }];
    case 'getUsers':
      return mockUsers;
    case 'getFinancials':
      return [{ id: 'f1', procedureId: data.procedureId, item: 'Honorarios Diseño', totalValue: 1500, paidAmount: 500, date: new Date().toISOString() }];
    case 'deleteProcedure':
      return { success: true };
    default:
      return { success: true };
  }
};

export const api = {
  login: (data: any) => apiCall<User>('login', data),
  getProcedures: (data: { role: string, email: string }) => apiCall<Procedure[]>('getProcedures', data),
  createProcedure: (data: any) => apiCall<{ id: string, driveUrl?: string }>('createProcedure', data),
  updateProcedureStatus: (data: { id: string, status: string }) => apiCall<{ success: true }>('updateProcedureStatus', data),
  assignTechnician: (data: { procedureId: string, technicianEmail: string }) => apiCall<{ success: true }>('assignTechnician', data),
  updateProcedureSteps: (data: { procedureId: string, completedSteps: string }) => apiCall<{ success: true }>('updateProcedureSteps', data),
  getProcedureByClientId: (idNumber: string) => apiCall<Procedure[]>('getProcedureByClientId', { idNumber }),
  getLogs: (procedureId: string) => apiCall<ProcedureLog[]>('getLogs', { procedureId }),
  addLog: (data: any) => apiCall<{ id: string }>('addLog', data),
  getUsers: (role: string) => apiCall<User[]>('getUsers', { role }),
  createUser: (data: any) => apiCall<{ id: string }>('createUser', data),
  updateUser: (data: Partial<User> & { email: string }) => apiCall<{ success: true }>('updateUser', data),
  getFinancials: (procedureId: string) => apiCall<FinancialItem[]>('getFinancials', { procedureId }),
  addFinancialItem: (data: Partial<FinancialItem>) => apiCall<{ id: string }>('addFinancialItem', data),
  updateFinancialItem: (data: Partial<FinancialItem> & { id: string }) => apiCall<{ success: true }>('updateFinancialItem', data),
  deleteFinancialItem: (id: string) => apiCall<{ success: true }>('deleteFinancialItem', { id }),
  getFinancialSummary: () => apiCall<any[]>('getFinancialSummary'),
  getFiles: (procedureId: string) => apiCall<ProcedureFile[]>('getFiles', { procedureId }),
  uploadFile: (data: { procedureId: string, name: string, base64: string }) => apiCall<{ id: string, url: string }>('uploadFile', data),
  getProcedureTypes: () => apiCall<ProcedureType[]>('getProcedureTypes'),
  createProcedureType: (name: string) => apiCall<{ id: string }>('createProcedureType', { name }),
  updateProcedure: (data: Partial<Procedure> & { id: string }) => apiCall<{ success: true }>('updateProcedure', data),
  deleteProcedure: (id: string) => apiCall<{ success: true }>('deleteProcedure', { id }),
  createDriveFolder: (procedureId: string, title: string) => apiCall<{ driveUrl: string }>('createDriveFolder', { procedureId, title }),
};
