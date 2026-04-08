import { User, Procedure, FinancialItem, ProcedureLog, ProcedureFile, ProcedureType, Account } from '../types';

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
    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error("Response is not JSON:", text);
      throw new Error("La respuesta del servidor no es válida. Verifique la configuración de Google Apps Script.");
    }
    
    const isSuccess = result.success === true || result.status === 'success' || result.status === 'ok';
    
    if (!isSuccess) {
      throw new Error(result.error || result.message || 'Error en la base de datos');
    }
    
    return result.data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error("La conexión con Google Sheets tardó demasiado (más de 30 segundos).");
    }
    console.error("API Error:", error);
    throw new Error(error.message || "Error de conexión con Google Sheets");
  }
};

const mockApi = async (action: string, data: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const mockUsers: User[] = [
    { id: '1', name: 'Admin Legarq', username: 'admin', role: 'admin', phone: '0999999999', address: 'Quito', idNumber: '1700000001' },
    { id: '2', name: 'Técnico Juan', username: 'tecnico', role: 'tech', phone: '0988888888', address: 'Valle', idNumber: '1700000002' },
    { id: '3', name: 'Cliente Demo', username: 'cliente', role: 'client', phone: '0977777777', address: 'Cumbayá', idNumber: '1700000003' }
  ];

  const mockProcedures: Procedure[] = [
    { id: 'p1', title: 'Residencia Los Olivos', clientUsername: 'cliente', status: 'En Curso', description: 'Diseño y legalización de vivienda unifamiliar.', createdAt: new Date().toISOString() },
    { id: 'p2', title: 'Local Comercial Centro', clientUsername: 'cliente', status: 'Nuevo', description: 'Remodelación de local para restaurante.', createdAt: new Date().toISOString() }
  ];

  switch (action) {
    case 'login':
      return mockUsers.find(u => u.username === data.username) || mockUsers[0];
    case 'getProcedures':
      return data.role === 'client' ? mockProcedures.filter(p => p.clientUsername === data.username) : mockProcedures;
    case 'getLogs':
      return [{ id: 'l1', procedureId: data.procedureId, date: new Date().toISOString(), technicianUsername: 'tecnico', note: 'Visita técnica inicial realizada.' }];
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
  getProcedures: (data: { role: string, username: string }) => apiCall<Procedure[]>('getProcedures', data),
  createProcedure: (data: any) => apiCall<{ id: string, driveUrl?: string }>('createProcedure', data),
  updateProcedureStatus: (data: { id: string, status: string }) => apiCall<{ success: true }>('updateProcedureStatus', data),
  assignTechnician: (data: { procedureId: string, technicianUsername: string }) => apiCall<{ success: true }>('assignTechnician', data),
  updateProcedureSteps: (data: { procedureId: string, completedSteps: string }) => apiCall<{ success: true }>('updateProcedureSteps', data),
  getProcedureByClientId: (idNumber: string) => apiCall<Procedure[]>('getProcedureByClientId', { idNumber }),
  getLogs: (procedureId: string) => apiCall<ProcedureLog[]>('getLogs', { procedureId }),
  addLog: (data: any) => apiCall<{ id: string }>('addLog', data),
  getUsers: (role: string) => apiCall<User[]>('getUsers', { role }),
  createUser: (data: any) => apiCall<{ id: string }>('createUser', data),
  updateUser: (data: Partial<User> & { username: string }) => apiCall<{ success: true }>('updateUser', data),
  getFinancials: (procedureId: string) => apiCall<FinancialItem[]>('getFinancials', { procedureId }),
  addFinancialItem: (data: Partial<FinancialItem>) => apiCall<{ id: string }>('addFinancialItem', data),
  updateFinancialItem: (data: Partial<FinancialItem> & { id: string }) => apiCall<{ success: true }>('updateFinancialItem', data),
  deleteFinancialItem: (id: string) => apiCall<{ success: true }>('deleteFinancialItem', { id }),
  getFinancialSummary: () => apiCall<{ transactions: FinancialItem[], procedures: Procedure[] }>('getFinancialSummary'),
  getAccounts: () => apiCall<Account[]>('getAccounts'),
  createAccount: (name: string) => apiCall<{ id: string }>('createAccount', { name }),
  deleteAccount: (id: string) => apiCall<{ success: true }>('deleteAccount', { id }),
  getFiles: (procedureId: string) => apiCall<ProcedureFile[]>('getFiles', { procedureId }),
  uploadFile: (data: { procedureId: string, name: string, base64: string }) => apiCall<{ id: string, url: string }>('uploadFile', data),
  getProcedureTypes: () => apiCall<ProcedureType[]>('getProcedureTypes'),
  createProcedureType: (data: { name: string, steps: string }) => apiCall<{ id: string }>('createProcedureType', data),
  updateProcedureType: (data: { id: string, name?: string, steps?: string }) => apiCall<{ success: true }>('updateProcedureType', data),
  deleteProcedureType: (id: string) => apiCall<{ success: true }>('deleteProcedureType', { id }),
  updateProcedure: (data: Partial<Procedure> & { id: string }) => apiCall<{ success: true }>('updateProcedure', data),
  deleteProcedure: (id: string) => apiCall<{ success: true }>('deleteProcedure', { id }),
  deleteUser: (username: string) => apiCall<{ success: true }>('deleteUser', { username }),
  createDriveFolder: (procedureId: string, title: string) => apiCall<{ driveUrl: string }>('createDriveFolder', { procedureId, title }),
  getTechnicianActivityReport: (role: string) => apiCall<{ logs: ProcedureLog[], procedures: Procedure[], technicians: { id: string, name: string, username: string }[] }>('getTechnicianActivityReport', { role }),
};
