import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { ArrowLeft, Plus, FileText, Calendar, DollarSign, User as UserIcon, Loader2, Phone, MapPin, Mail, Save, Edit2, CheckCircle2, XCircle, Upload, ExternalLink, Download, Trash2, Circle, Briefcase, Eye, Check, ArrowUpRight, ArrowDownRight, Folder, MessageSquare, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import { Procedure, ProcedureLog, FinancialItem, User, ProcedureFile, ProcedureType, Account } from '../../types';
import LoadingOverlay from '../../components/LoadingOverlay';

export default function ProcedureDetails() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [logs, setLogs] = useState<ProcedureLog[]>([]);
  const [financials, setFinancials] = useState<FinancialItem[]>([]);
  const [files, setFiles] = useState<ProcedureFile[]>([]);
  const [client, setClient] = useState<User | null>(null);
  const [procedureTypes, setProcedureTypes] = useState<ProcedureType[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [slowLoading, setSlowLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [newNote, setNewNote] = useState('');
  const [isExternal, setIsExternal] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [saving, setSaving] = useState(false);

  // Client Edit State
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editClientData, setEditClientData] = useState<Partial<Procedure>>({});

  // Technician Assignment
  const [techs, setTechs] = useState<User[]>([]);
  const [staff, setStaff] = useState<User[]>([]);

  // Financial Item State
  const [showFinancialForm, setShowFinancialForm] = useState(false);
  const [newFinancial, setNewFinancial] = useState<Partial<FinancialItem>>({ 
    type: 'Ingreso', 
    category: 'Abono Cliente', 
    description: '', 
    amount: 0 
  });
  const [editingFinancial, setEditingFinancial] = useState<FinancialItem | null>(null);
  const [deletingFinancialId, setDeletingFinancialId] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editHeaderData, setEditHeaderData] = useState({ title: '', procedureType: '', expectedValue: 0, otherAgreements: '' });
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isBulkEditingSteps, setIsBulkEditingSteps] = useState(false);
  const [tempSteps, setTempSteps] = useState<string[]>([]);

  useEffect(() => {
    let timer: any;
    if (currentUser) {
      setSlowLoading(false);
      timer = setTimeout(() => {
        if (loading) setSlowLoading(true);
      }, 5000);
      fetchData();
    }
    return () => clearTimeout(timer);
  }, [id, currentUser]);

  const fetchData = async () => {
    if (!id || !currentUser) return;
    setLoading(true);
    setError(null);
    
    try {
      const procs = await api.getProcedures({ username: currentUser.username, role: currentUser.role });
      if (!Array.isArray(procs)) throw new Error('La respuesta del servidor no es una lista de trámites');
      
      const proc = procs.find((p: Procedure) => String(p.id) === String(id));
      if (!proc) throw new Error('Trámite no encontrado o sin acceso');
      
      let logsData: ProcedureLog[] = [];
      let financialsData: FinancialItem[] = [];
      let usersData: User[] = [];
      let filesData: ProcedureFile[] = [];
      let typesData: ProcedureType[] = [];
      let accountsData: Account[] = [];

      try {
        const results = await Promise.allSettled([
          api.getLogs(id),
          currentUser.role === 'admin' ? api.getFinancials(id) : Promise.resolve([]),
          (currentUser.role === 'admin' || currentUser.role === 'tech') ? api.getUsers(currentUser.role) : Promise.resolve([]),
          api.getFiles(id),
          api.getProcedureTypes(),
          api.getAccounts()
        ]);

        if (results[0].status === 'fulfilled') logsData = results[0].value as ProcedureLog[];
        if (results[1].status === 'fulfilled') financialsData = results[1].value as FinancialItem[];
        if (results[2].status === 'fulfilled') usersData = results[2].value as User[];
        if (results[3].status === 'fulfilled') filesData = results[3].value as ProcedureFile[];
        if (results[4].status === 'fulfilled') typesData = results[4].value as ProcedureType[];
        if (results[5].status === 'fulfilled') accountsData = results[5].value as Account[];
      } catch (e) {
        console.error("Error fetching additional data", e);
      }

      const foundClient = Array.isArray(usersData) ? usersData.find((u: any) => u.username === proc.clientUsername) : null;
      
      const updatedProcedure = {
        ...proc,
        clientName: foundClient?.name || proc.clientName || 'Cliente',
        clientPhone: foundClient?.phone || proc.clientPhone || '',
        clientAddress: foundClient?.address || proc.clientAddress || '',
        idNumber: foundClient?.idNumber || proc.idNumber || '',
        clientEmail: foundClient?.email || proc.clientEmail || '',
        completedSteps: proc.completedSteps || ''
      };

      setProcedure(updatedProcedure);
      setClient(foundClient || null);
      setLogs(Array.isArray(logsData) ? logsData.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()) : []);
      setFinancials(Array.isArray(financialsData) ? financialsData : []);
      setFiles(Array.isArray(filesData) ? filesData.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()) : []);
      setTechs(Array.isArray(usersData) ? usersData.filter((u: any) => u.role === 'tech') : []);
      setStaff(Array.isArray(usersData) ? usersData.filter((u: any) => u.role === 'tech' || u.role === 'admin') : []);
      setProcedureTypes(Array.isArray(typesData) ? typesData : []);
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
      
      if (Array.isArray(accountsData) && accountsData.length > 0) {
        const operativoAcc = accountsData.find(a => a.name.toLowerCase() === 'operativo');
        setNewFinancial(prev => ({ 
          ...prev, 
          category: operativoAcc ? operativoAcc.name : accountsData[0].name 
        }));
      }
      
      setEditClientData({
        clientName: updatedProcedure.clientName,
        clientUsername: updatedProcedure.clientUsername,
        clientPhone: updatedProcedure.clientPhone,
        clientAddress: updatedProcedure.clientAddress,
        idNumber: updatedProcedure.idNumber,
        propertyNumber: updatedProcedure.propertyNumber,
        driveUrl: updatedProcedure.driveUrl,
        clientEmail: updatedProcedure.clientEmail
      });

      setEditHeaderData({ 
        title: updatedProcedure.title, 
        procedureType: updatedProcedure.procedureType || '',
        expectedValue: Number(updatedProcedure.expectedValue) || 0,
        otherAgreements: updatedProcedure.otherAgreements || ''
      });
    } catch (err: any) {
      console.error("Error in fetchData:", err);
      setError(err.message || 'Error al cargar los datos del trámite');
    } finally {
      setLoading(false);
      setSlowLoading(false);
    }
  };

  const handleLinkDrive = async () => {
    if (!id) return;
    const url = prompt('Ingrese el enlace de la carpeta de Google Drive:');
    if (!url) return;
    
    setSaving(true);
    try {
      await api.updateProcedure({ id, driveUrl: url });
      showSuccess('Carpeta vinculada correctamente');
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      await api.addLog({ 
        procedureId: id, 
        technicianUsername: currentUser?.username, 
        note: newNote,
        isExternal: isExternal
      });
      setNewNote('');
      setIsExternal(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddingNote(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setSaving(true);
    try {
      await api.updateProcedureStatus({ id: id!, status: newStatus as any });
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAssignTechnician = async (techUsername: string) => {
    setSaving(true);
    // Optimistic update
    if (procedure) {
      setProcedure({ ...procedure, technicianUsername: techUsername });
    }
    try {
      await api.assignTechnician({ procedureId: id!, technicianUsername: techUsername });
      showSuccess('Técnico asignado correctamente');
      await fetchData();
    } catch (err: any) {
      setError(err.message);
      await fetchData(); // Rollback on error
    } finally {
      setSaving(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleToggleStep = async (stepIndex: number) => {
    if (!procedure) return;
    const currentSteps = procedure.completedSteps ? procedure.completedSteps.split(',').filter(Boolean) : [];
    const stepStr = stepIndex.toString();
    
    if (isBulkEditingSteps) {
      if (tempSteps.includes(stepStr)) {
        setTempSteps(tempSteps.filter(s => s !== stepStr));
      } else {
        setTempSteps([...tempSteps, stepStr]);
      }
      return;
    }

    let newSteps;
    if (currentSteps.includes(stepStr)) {
      newSteps = currentSteps.filter(s => s !== stepStr);
    } else {
      newSteps = [...currentSteps, stepStr];
    }

    const newStepsStr = newSteps.join(',');
    
    // Optimistic update
    if (procedure) {
      setProcedure({ ...procedure, completedSteps: newStepsStr });
    }

    try {
      await api.updateProcedureSteps({ procedureId: id!, completedSteps: newStepsStr });
      showSuccess('Progreso guardado');
      fetchData();
    } catch (err: any) {
      setError(err.message);
      // Rollback if error
      fetchData();
    }
  };

  const handleSaveBulkSteps = async () => {
    setSaving(true);
    const newStepsStr = tempSteps.join(',');
    
    // Optimistic update
    if (procedure) {
      setProcedure({ ...procedure, completedSteps: newStepsStr });
    }

    try {
      await api.updateProcedureSteps({ procedureId: id!, completedSteps: newStepsStr });
      setIsBulkEditingSteps(false);
      showSuccess('Progreso guardado');
      fetchData();
    } catch (err: any) {
      setError(err.message);
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateHeader = async () => {
    setSaving(true);
    try {
      await api.updateProcedure({ id: id!, ...editHeaderData });
      setIsEditingHeader(false);
      showSuccess('Información actualizada');
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProcedure = async () => {
    setDeleting(true);
    try {
      await api.deleteProcedure(id!);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const [creatingDriveFolder, setCreatingDriveFolder] = useState(false);

  const handleCreateDriveFolder = async () => {
    setCreatingDriveFolder(true);
    try {
      const result = await api.createDriveFolder(id!, procedure?.title || 'Trámite');
      showSuccess('Carpeta de Drive creada');
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingDriveFolder(false);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Update user info
      await api.updateUser({
        username: procedure!.clientUsername,
        name: editClientData.clientName,
        phone: editClientData.clientPhone,
        address: editClientData.clientAddress,
        idNumber: editClientData.idNumber,
        email: editClientData.clientEmail
      });

      // Update procedure info (to keep it in sync and for searchability)
      await api.updateProcedure({
        id: id!,
        clientName: editClientData.clientName,
        clientPhone: editClientData.clientPhone,
        clientAddress: editClientData.clientAddress,
        idNumber: editClientData.idNumber,
        propertyNumber: editClientData.propertyNumber,
        driveUrl: editClientData.driveUrl
      });

      showSuccess('Información del cliente y trámite actualizada');
      setIsEditingClient(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const unusedOldHandleUpdateClient = async () => {
    setSaving(true);
    try {
      // If the title matches the pattern "Type - OldClientName", update it to "Type - NewClientName"
      let newTitle = procedure?.title;
      if (procedure && editClientData.clientName && procedure.clientName !== editClientData.clientName) {
        const expectedOldTitle = `${procedure.procedureType} - ${procedure.clientName}`;
        if (procedure.title === expectedOldTitle) {
          newTitle = `${procedure.procedureType} - ${editClientData.clientName}`;
        }
      }

      await api.updateProcedure({ 
        id: id!,
        title: newTitle,
        clientName: editClientData.clientName,
        clientUsername: editClientData.clientUsername,
        clientPhone: editClientData.clientPhone,
        clientAddress: editClientData.clientAddress,
        propertyNumber: editClientData.propertyNumber,
        idNumber: editClientData.idNumber,
        driveUrl: editClientData.driveUrl
      });
      setIsEditingClient(false);
      showSuccess('Datos del cliente guardados');
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddFinancial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingFinancial) {
        await api.updateFinancialItem({ 
          id: editingFinancial.id, 
          ...newFinancial
        });
        showSuccess('Registro actualizado');
      } else {
        await api.addFinancialItem({ ...newFinancial, procedureId: id! });
        showSuccess('Registro añadido');
      }
      setShowFinancialForm(false);
      setEditingFinancial(null);
      const operativoAcc = accounts.find(a => a.name.toLowerCase() === 'operativo');
      setNewFinancial({ 
        type: 'Ingreso', 
        category: operativoAcc ? operativoAcc.name : (accounts.length > 0 ? accounts[0].name : 'Operativo'), 
        description: '', 
        amount: 0,
        isReimbursable: false,
        reimburseTo: ''
      });
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleUploadReceipt = async (financialId: string, file: File) => {
    setUploadingReceipt(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await api.uploadFile({ procedureId: id!, name: `Respaldo_${file.name}`, base64 });
      
      const itemToUpdate = financials.find(f => f.id === financialId);
      if (itemToUpdate) {
        await api.updateFinancialItem({ ...itemToUpdate, fileUrl: result.url });
        showSuccess('Comprobante subido y guardado');
        await fetchData();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await api.uploadFile({ procedureId: id!, name: `Respaldo_${file.name}`, base64 });
      setNewFinancial({ ...newFinancial, fileUrl: result.url });
      showSuccess('Respaldo cargado');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingReceipt(false);
      e.target.value = '';
    }
  };

  const handleDeleteFinancial = async (financialId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este rubro?')) return;
    setSaving(true);
    setDeletingFinancialId(financialId);
    try {
      await api.deleteFinancialItem(financialId);
      showSuccess('Rubro eliminado');
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
      setDeletingFinancialId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#E3000F]" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Cargando detalles...</p>
        {slowLoading && (
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">
            La conexión con Google Sheets está tardando más de lo habitual...
          </p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-[32px] border border-red-100 flex items-center gap-4 max-w-2xl mx-auto mt-12">
        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center shrink-0">
          <XCircle className="w-6 h-6 text-red-600" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{error}</p>
      </div>
    );
  }

  if (!procedure) {
    return (
      <div className="text-center py-20 bg-white rounded-[32px] border border-gray-100 shadow-sm max-w-2xl mx-auto mt-12">
        <div className="w-20 h-20 bg-gray-50 rounded-[24px] flex items-center justify-center mx-auto mb-6">
          <FileText className="w-10 h-10 text-gray-200" />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">Trámite no encontrado</h3>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">El registro solicitado no existe o no tiene permisos.</p>
      </div>
    );
  }

  const totalIncome = financials.filter(f => f.type === 'Ingreso').reduce((sum, f) => sum + Number(f.amount), 0);
  const totalExpense = financials.filter(f => f.type === 'Egreso').reduce((sum, f) => sum + Number(f.amount), 0);
  const balance = totalIncome - totalExpense;

  const currentType = procedureTypes.find(t => t.name === procedure.procedureType);
  let steps: string[] = [];
  try {
    if (currentType?.steps) {
      const parsed = JSON.parse(currentType.steps);
      steps = Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.error("Error parsing steps:", e);
    steps = [];
  }

  const completedStepsCount = (procedure.completedSteps || '').split(',').filter(Boolean).length;
  const progressPercentage = steps.length > 0 ? Math.round((completedStepsCount / steps.length) * 100) : 0;

  const formatDate = (dateStr: string, formatStr: string = "d 'de' MMMM, yyyy") => {
    try {
      if (!dateStr) return 'Fecha no disponible';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return format(date, formatStr, { locale: es });
    } catch (e) {
      return 'Error en fecha';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative">
      {saving && <LoadingOverlay />}
      
      {/* Success Message Toast */}
      {successMessage && (
        <div className="fixed bottom-8 right-8 bg-[#1A1A1A] text-white px-6 py-4 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300 border border-white/10">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">{successMessage}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="flex items-center text-gray-400 hover:text-[#E3000F] transition-colors text-[9px] font-black uppercase tracking-widest group"
        >
          <ArrowLeft className="w-3 h-3 mr-1.5 group-hover:-translate-x-1 transition-transform" /> Volver a Trámites
        </button>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <a
            href={`/consulta?idNumber=${procedure?.idNumber || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-none bg-white text-gray-900 border border-gray-100 px-4 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-all font-black text-[9px] uppercase tracking-widest shadow-sm active:scale-95"
          >
            <Eye className="w-3.5 h-3.5 text-[#E3000F]" /> Ver como Cliente
          </a>
          {currentUser?.role === 'admin' && (
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="flex-1 md:flex-none bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-all font-black text-[9px] uppercase tracking-widest active:scale-95"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Eliminar
            </button>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 bg-red-600 text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Trash2 className="w-6 h-6" />
                Confirmar Eliminación
              </h3>
              <p className="text-red-100 text-sm mt-1">Esta acción es irreversible.</p>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                ¿Está seguro de que desea eliminar el trámite <span className="font-bold text-gray-900">"{procedure?.title}"</span>?
              </p>
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <div className="text-xs text-red-700 font-medium leading-relaxed">
                  Se eliminará permanentemente toda la información relacionada:
                  <ul className="list-disc ml-4 mt-1">
                    <li>Bitácora de seguimiento</li>
                    <li>Registros financieros</li>
                    <li>Archivos adjuntos</li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDeleteProcedure}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sí, Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sidebar (Client Info first) */}
        <div className="space-y-4 lg:col-span-1">
          {/* Client Info Card */}
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <div className="w-1 h-5 bg-[#E3000F] rounded-full" />
                Cliente
              </h3>
              {(currentUser?.role === 'admin' || (currentUser?.role === 'tech' && procedure.technicianUsername === currentUser.username)) && (
                <button 
                  onClick={() => {
                    setEditClientData({
                      clientName: procedure.clientName,
                      clientUsername: procedure.clientUsername,
                      clientPhone: procedure.clientPhone,
                      clientAddress: procedure.clientAddress,
                      idNumber: procedure.idNumber,
                      propertyNumber: procedure.propertyNumber,
                      driveUrl: procedure.driveUrl,
                      clientEmail: procedure.clientEmail
                    });
                    setIsEditingClient(!isEditingClient);
                  }}
                  className="p-2 text-gray-400 hover:text-[#E3000F] hover:bg-red-50 rounded-xl transition-all"
                >
                  {isEditingClient ? <XCircle className="w-5 h-5" /> : <Edit2 className="w-4 h-4" />}
                </button>
              )}
            </div>
            <div className="p-4 md:p-6">
              {isEditingClient ? (
                <form onSubmit={handleUpdateClient} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nombre Completo</label>
                    <input 
                      type="text" 
                      value={editClientData.clientName || ''} 
                      onChange={e => setEditClientData({...editClientData, clientName: e.target.value})}
                      className="w-full text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl p-2 focus:ring-2 focus:ring-[#E3000F]/20 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Correo Electrónico</label>
                    <input 
                      type="email" 
                      value={editClientData.clientEmail || ''} 
                      onChange={e => setEditClientData({...editClientData, clientEmail: e.target.value})}
                      className="w-full text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl p-2 focus:ring-2 focus:ring-[#E3000F]/20 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Teléfono</label>
                      <input 
                        type="text" 
                        value={editClientData.clientPhone || ''} 
                        onChange={e => setEditClientData({...editClientData, clientPhone: e.target.value})}
                        className="w-full text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl p-2 focus:ring-2 focus:ring-[#E3000F]/20 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Cédula</label>
                      <input 
                        type="text" 
                        value={editClientData.idNumber || ''} 
                        onChange={e => setEditClientData({...editClientData, idNumber: e.target.value})}
                        className="w-full text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl p-2 focus:ring-2 focus:ring-[#E3000F]/20 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Dirección</label>
                    <input 
                      type="text" 
                      value={editClientData.clientAddress || ''} 
                      onChange={e => setEditClientData({...editClientData, clientAddress: e.target.value})}
                      className="w-full text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl p-2 focus:ring-2 focus:ring-[#E3000F]/20 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Número de Predio</label>
                    <input 
                      type="text" 
                      value={editClientData.propertyNumber || ''} 
                      onChange={e => setEditClientData({...editClientData, propertyNumber: e.target.value})}
                      className="w-full text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl p-2 focus:ring-2 focus:ring-[#E3000F]/20 outline-none"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="w-full bg-[#1A1A1A] text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#E3000F] transition-all active:scale-95 shadow-lg shadow-gray-200"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <Save className="w-3.5 h-3.5 mr-1.5 inline" />}
                    {saving ? '' : 'Guardar Cambios'}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                        <UserIcon className="w-4 h-4 text-[#E3000F]" />
                      </div>
                      <div className="flex-1">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Nombre Completo</span>
                        <span className="text-xs font-black text-gray-900 leading-tight block">{procedure.clientName || procedure.clientUsername}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                        <Mail className="w-4 h-4 text-[#E3000F]" />
                      </div>
                      <div className="flex-1">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Correo Electrónico</span>
                        <span className="text-xs font-black text-gray-900 leading-tight block break-all">{procedure.clientUsername}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                        <Phone className="w-4 h-4 text-[#E3000F]" />
                      </div>
                      <div className="flex-1">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Teléfono</span>
                        <span className="text-xs font-black text-gray-900 leading-tight block">{procedure.clientPhone || 'No registrado'}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                        <MapPin className="w-4 h-4 text-[#E3000F]" />
                      </div>
                      <div className="flex-1">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Dirección</span>
                        <span className="text-xs font-black text-gray-900 leading-tight block">{procedure.clientAddress || 'No registrada'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">N° Cédula</span>
                      <span className="text-[10px] font-black text-gray-900 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{procedure.idNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">N° Predio</span>
                      <span className="text-[10px] font-black text-gray-900 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{procedure.propertyNumber || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    {procedure.driveUrl || procedure.driveFolderUrl ? (
                      currentUser?.role !== 'client' && (
                        <a 
                          href={procedure.driveUrl || procedure.driveFolderUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center justify-center gap-2 border border-blue-100"
                        >
                          <Folder className="w-3.5 h-3.5" />
                          Carpeta Virtual
                        </a>
                      )
                    ) : (
                      currentUser?.role === 'admin' && (
                        <button
                          onClick={handleCreateDriveFolder}
                          disabled={creatingDriveFolder}
                          className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-50 text-gray-600 text-[9px] font-black uppercase tracking-widest rounded-xl border border-gray-200 hover:bg-gray-100 transition-all disabled:opacity-50"
                        >
                          {creatingDriveFolder ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
                          Crear Carpeta Virtual
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary (Admin Only) */}
          {currentUser?.role === 'admin' && (
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-900 flex justify-between items-center">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-[#E3000F] rounded-full" />
                  Finanzas
                </h3>
                <button 
                  onClick={() => {
                    setEditingFinancial(null);
                    const operativoAcc = accounts.find(a => a.name.toLowerCase() === 'operativo');
                    setNewFinancial({ 
                      type: 'Ingreso', 
                      category: operativoAcc ? operativoAcc.name : (accounts.length > 0 ? accounts[0].name : 'Operativo'), 
                      description: '', 
                      amount: 0,
                      isReimbursable: false,
                      reimburseTo: ''
                    });
                    setShowFinancialForm(!showFinancialForm);
                  }}
                  className="p-2 text-white hover:text-[#E3000F] hover:bg-white/10 rounded-xl transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 md:p-8">
                {showFinancialForm && (
                  <form onSubmit={handleAddFinancial} className="mb-6 space-y-4 bg-gray-50 p-6 rounded-[24px] border border-gray-100 shadow-inner">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{editingFinancial ? 'Editar Registro' : 'Nuevo Registro'}</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <select 
                        value={newFinancial.type} 
                        onChange={e => setNewFinancial({...newFinancial, type: e.target.value as any})}
                        className="w-full text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-[#E3000F]/20 outline-none"
                      >
                        <option value="Ingreso">Ingreso</option>
                        <option value="Egreso">Egreso</option>
                      </select>
                      <select 
                        value={newFinancial.category} 
                        onChange={e => setNewFinancial({...newFinancial, category: e.target.value})}
                        className="w-full text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-[#E3000F]/20 outline-none"
                      >
                        {newFinancial.type === 'Ingreso' ? (
                          <option value="Abono Cliente">Abono Cliente</option>
                        ) : (
                          accounts.map(acc => (
                            <option key={acc.id} value={acc.name}>{acc.name}</option>
                          ))
                        )}
                      </select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descripción</label>
                      <input 
                        type="text" 
                        required
                        value={newFinancial.description} 
                        onChange={e => setNewFinancial({...newFinancial, description: e.target.value})}
                        className="w-full text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-[#E3000F]/20 outline-none"
                        placeholder="Detalle del movimiento"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monto ($)</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        step="0.01"
                        value={newFinancial.amount || ''} 
                        onChange={e => setNewFinancial({...newFinancial, amount: Number(e.target.value)})}
                        className="w-full text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-[#E3000F]/20 outline-none"
                      />
                    </div>

                    {newFinancial.type === 'Egreso' && (
                      <div className="space-y-3 pt-3 border-t border-gray-200">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={newFinancial.isReimbursable || false}
                            onChange={e => setNewFinancial({...newFinancial, isReimbursable: e.target.checked})}
                            className="w-4 h-4 text-[#E3000F] rounded border-gray-300 focus:ring-[#E3000F]"
                          />
                          <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Es Reembolsable</span>
                        </label>
                        
                        {newFinancial.isReimbursable && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reembolsar a</label>
                            <select 
                              value={newFinancial.reimburseTo || ''} 
                              onChange={e => setNewFinancial({...newFinancial, reimburseTo: e.target.value})}
                              className="w-full text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-[#E3000F]/20 outline-none"
                            >
                              <option value="">Seleccione un usuario...</option>
                              {staff.map(user => (
                                <option key={user.id} value={user.name}>{user.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button 
                        type="button"
                        onClick={() => setShowFinancialForm(false)}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-xs font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        disabled={saving}
                        className="flex-1 px-4 py-2.5 bg-[#1A1A1A] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#E3000F] transition-colors shadow-lg shadow-gray-200 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Ingresos</span>
                    <span className="text-xl font-black text-emerald-700">${totalIncome.toFixed(2)}</span>
                  </div>
                  <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest block mb-1">Egresos</span>
                    <span className="text-xl font-black text-red-700">${totalExpense.toFixed(2)}</span>
                  </div>
                  <div className="col-span-2 bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Balance Total</span>
                    <span className={clsx("text-2xl font-black", balance >= 0 ? "text-emerald-600" : "text-red-600")}>
                      ${balance.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {financials.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-md transition-all gap-4">
                      <div className="flex items-start gap-3">
                        <div className={clsx(
                          "p-2 rounded-xl shrink-0",
                          item.type === 'Ingreso' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                        )}>
                          {item.type === 'Ingreso' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900">{item.description}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{formatDate(item.date, "dd MMM yyyy")}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">{item.category}</span>
                            {item.isReimbursable && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                  Reembolsable: {item.reimburseTo}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                        <span className={clsx(
                          "text-base font-black",
                          item.type === 'Ingreso' ? "text-emerald-600" : "text-red-600"
                        )}>
                          {item.type === 'Ingreso' ? '+' : '-'}${Number(item.amount).toFixed(2)}
                        </span>
                        <div className="flex items-center gap-1">
                          {item.fileUrl ? (
                            <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver Comprobante">
                              <FileText className="w-4 h-4" />
                            </a>
                          ) : (
                            <label className="p-2 text-gray-400 hover:text-[#E3000F] hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Subir Comprobante">
                              <Upload className="w-4 h-4" />
                              <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadReceipt(item.id, file);
                              }} />
                            </label>
                          )}
                          <button onClick={() => { setEditingFinancial(item); setNewFinancial(item); setShowFinancialForm(true); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeletingFinancialId(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {financials.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                      <DollarSign className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No hay registros financieros</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Information Card */}
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50/50">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex-1 w-full">
                  {isEditingHeader ? (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Título del Proyecto</label>
                        <input 
                          type="text" 
                          value={editHeaderData.title} 
                          onChange={e => setEditHeaderData({...editHeaderData, title: e.target.value})}
                          className="w-full text-xl md:text-2xl font-black text-gray-900 border-b-2 border-gray-200 focus:border-[#E3000F] outline-none bg-transparent transition-colors"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo de Trámite</label>
                          <select 
                            value={editHeaderData.procedureType} 
                            onChange={e => setEditHeaderData({...editHeaderData, procedureType: e.target.value})}
                            className="w-full text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-[#E3000F]/20 outline-none"
                          >
                            <option value="">Seleccionar Tipo</option>
                            {procedureTypes.map(t => (
                              <option key={t.id} value={t.name}>{t.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor Acordado ($)</label>
                          <input 
                            type="number" 
                            value={editHeaderData.expectedValue} 
                            onChange={e => setEditHeaderData({...editHeaderData, expectedValue: Number(e.target.value)})}
                            className="w-full text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-[#E3000F]/20 outline-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Otros Acuerdos</label>
                        <input 
                          type="text" 
                          value={editHeaderData.otherAgreements} 
                          onChange={e => setEditHeaderData({...editHeaderData, otherAgreements: e.target.value})}
                          placeholder="Ej. Planos adicionales, etc."
                          className="w-full text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-[#E3000F]/20 outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-[10px] font-black text-[#E3000F] bg-red-50 px-2.5 py-1 rounded-lg border border-red-100 uppercase tracking-widest">
                          {procedure.code || 'SIN CÓDIGO'}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          <Calendar className="w-3 h-3" /> {formatDate(procedure.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl md:text-3xl font-black text-gray-900 leading-tight tracking-tight">{procedure.title}</h2>
                        {currentUser?.role === 'admin' && (
                          <button onClick={() => setIsEditingHeader(true)} className="p-2 text-gray-400 hover:text-[#E3000F] hover:bg-red-50 rounded-xl transition-all">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">{procedure.procedureType}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {isEditingHeader ? (
                    <div className="flex gap-2 ml-auto">
                      <button onClick={() => setIsEditingHeader(false)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                      <button onClick={handleUpdateHeader} disabled={saving} className="px-6 py-2 bg-[#E3000F] text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-100 transition-all flex items-center gap-2">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3 ml-auto">
                      <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Estado</span>
                          {currentUser?.role === 'admin' || currentUser?.role === 'tech' ? (
                            <select 
                              value={procedure.status}
                              onChange={(e) => handleStatusChange(e.target.value)}
                              disabled={saving}
                              className="border-none bg-transparent focus:ring-0 text-xs font-black text-gray-900 p-0 cursor-pointer hover:text-[#E3000F] transition-colors"
                            >
                              <option value="En proceso">En proceso</option>
                              <option value="Finalizado">Finalizado</option>
                            </select>
                          ) : (
                            <span className={clsx("text-xs font-black", 
                              procedure.status === 'Finalizado' ? 'text-emerald-600' : 'text-amber-600'
                            )}>
                              {procedure.status}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Técnico</span>
                          {currentUser?.role === 'admin' ? (
                            <div className="relative flex items-center">
                              <select
                                value={procedure.technicianUsername || ''}
                                onChange={(e) => handleAssignTechnician(e.target.value)}
                                disabled={saving}
                                className="border-none bg-transparent focus:ring-0 text-xs font-black text-gray-900 p-0 pr-6 cursor-pointer hover:text-[#E3000F] transition-colors"
                              >
                                <option value="">Sin asignar</option>
                                {techs.map(t => (
                                  <option key={t.id} value={t.username}>{t.name}</option>
                                ))}
                              </select>
                              {saving && <Loader2 className="w-3 h-3 animate-spin text-[#E3000F] absolute right-0 pointer-events-none" />}
                            </div>
                          ) : (
                            <span className="text-xs font-black text-gray-900">
                              {techs.length > 0 
                                ? (techs.find(t => t.username === procedure.technicianUsername)?.name || procedure.technicianUsername || 'Sin asignar')
                                : (procedure.technicianUsername || 'Sin asignar')
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progreso del Trámite</label>
                  <span className="text-sm font-black text-[#E3000F]">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden border border-gray-50 shadow-inner">
                  <div 
                    className={clsx(
                      "h-full transition-all duration-1000 ease-out shadow-sm",
                      progressPercentage === 100 ? "bg-emerald-500" : "bg-[#E3000F]"
                    )}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col justify-center">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Valor Acordado</span>
                <div className="text-xl font-black text-gray-900">
                  ${Number(procedure.expectedValue || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
            {steps.length > 0 && (
              <>
                <div className="p-4 md:p-6">
                  <div className="pt-2">
                    <div className="flex justify-between items-end mb-2 md:mb-4">
                      <div>
                        <h3 className="text-[10px] md:text-sm font-bold text-gray-900 uppercase tracking-wider">Avance del Trámite</h3>
                        <p className="text-[10px] md:text-xs text-gray-500">Pasos: {completedStepsCount} / {steps.length}</p>
                      </div>
                      <div className="text-right">
                        <span className={clsx(
                          "text-xl md:text-2xl font-black",
                          progressPercentage <= 33 ? "text-[#E3000F]" : 
                          progressPercentage <= 66 ? "text-gray-500" : "text-gray-900"
                        )}>
                          {progressPercentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 h-2 md:h-3 rounded-full overflow-hidden border border-gray-200">
                      <div 
                        className={clsx(
                          "h-full transition-all duration-1000 ease-out",
                          progressPercentage <= 33 ? "bg-[#E3000F]" : 
                          progressPercentage <= 66 ? "bg-gray-400" : "bg-stone-900"
                        )}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Workflow Steps Checklist */}
                <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">Pasos de Seguimiento</h3>
                    {(currentUser?.role === 'admin' || currentUser?.role === 'tech') && (
                      <div className="flex gap-2">
                        {isBulkEditingSteps ? (
                          <>
                            <button 
                              onClick={() => setIsBulkEditingSteps(false)}
                              className="px-2 py-1 text-[10px] font-bold text-gray-500 hover:bg-gray-200 rounded transition-colors"
                            >
                              Cancelar
                            </button>
                            <button 
                              onClick={handleSaveBulkSteps}
                              disabled={saving}
                              className="px-2 py-1 text-[10px] font-bold bg-[#E3000F] text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                            >
                              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                              Guardar
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => {
                              setIsBulkEditingSteps(true);
                              setTempSteps(procedure.completedSteps ? procedure.completedSteps.split(',').filter(Boolean) : []);
                            }}
                            className="px-2 py-1 text-[10px] font-bold bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            Editar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    {steps.map((step: string, index: number) => {
                      const stepStr = index.toString();
                      const isCompleted = isBulkEditingSteps 
                        ? tempSteps.includes(stepStr)
                        : (procedure.completedSteps || '').split(',').includes(stepStr);
                      const canToggle = currentUser?.role === 'admin' || (currentUser?.role === 'tech' && procedure.technicianUsername === currentUser.username);
                      
                      return (
                        <div 
                          key={index} 
                          className={clsx(
                            "flex items-center gap-2 p-1.5 rounded-lg transition-colors",
                            isCompleted ? "bg-green-50/50" : "hover:bg-white",
                            isBulkEditingSteps && "cursor-pointer"
                          )}
                          onClick={() => isBulkEditingSteps && handleToggleStep(index)}
                        >
                          <button
                            disabled={!canToggle && !isBulkEditingSteps}
                            onClick={(e) => {
                              if (!isBulkEditingSteps) {
                                e.stopPropagation();
                                handleToggleStep(index);
                              }
                            }}
                            className={clsx(
                              "shrink-0 transition-all",
                              isCompleted ? "text-green-600" : "text-gray-300 hover:text-gray-400",
                              (!canToggle && !isBulkEditingSteps) && "cursor-not-allowed opacity-50"
                            )}
                          >
                            {isCompleted ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> : <Circle className="w-4 h-4 md:w-5 md:h-5" />}
                          </button>
                          <span className={clsx(
                            "text-[10px] md:text-xs font-medium leading-tight",
                            isCompleted ? "text-green-800" : "text-gray-600"
                          )}>
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>



          {/* Logs Section */}
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-[#E3000F] rounded-full" />
                Bitácora de Seguimiento
              </h3>
              <div className="bg-white px-3 py-1 rounded-full border border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {logs.length} Entradas
              </div>
            </div>
            
            <div className="p-6 md:p-8">
              {(currentUser?.role === 'admin' || currentUser?.role === 'tech') && (
                <form onSubmit={handleAddLog} className="mb-8 bg-gray-50 p-6 rounded-[24px] border border-gray-100 shadow-inner">
                  <div className="space-y-4">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Escribe un nuevo comentario o actualización..."
                      className="w-full border-none bg-white rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-[#E3000F]/20 outline-none transition-all min-h-[100px] shadow-sm"
                      required
                    />
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={clsx(
                          "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                          isExternal ? "bg-[#E3000F] border-[#E3000F]" : "bg-white border-gray-200 group-hover:border-gray-300"
                        )}>
                          {isExternal && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <input
                          type="checkbox"
                          checked={isExternal}
                          onChange={(e) => setIsExternal(e.target.checked)}
                          className="hidden"
                        />
                        <span className="text-xs font-bold text-gray-600">Visible para el cliente</span>
                      </label>
                      <button
                        type="submit"
                        disabled={addingNote}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-gray-200 text-white bg-[#1A1A1A] hover:bg-[#E3000F] transition-all disabled:opacity-50 active:scale-95"
                      >
                        {addingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                        Agregar Entrada
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="relative space-y-8">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-50"></div>
                {logs.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50/50 rounded-[32px] border-2 border-dashed border-gray-100">
                    <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">No hay registros en la bitácora</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="relative pl-12 group">
                      <div className="absolute left-2.5 top-2 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#E3000F] z-10 shadow-sm group-hover:scale-125 transition-transform group-hover:bg-[#E3000F]"></div>
                      <div className="bg-white rounded-[24px] p-6 border border-gray-100 hover:border-[#E3000F]/20 transition-all shadow-sm hover:shadow-md">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-[10px] font-black text-[#E3000F] border border-gray-100">
                              {log.technicianUsername[0].toUpperCase()}
                            </div>
                            <div>
                              <span className="text-xs font-black text-gray-900 block leading-none">{log.technicianUsername}</span>
                              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                {formatDate(log.date, "d 'de' MMMM, yyyy • HH:mm")}
                              </div>
                            </div>
                          </div>
                          {log.isExternal && (
                            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full border border-blue-100">
                              <Eye className="w-3 h-3" />
                              <span className="text-[8px] font-black uppercase tracking-widest">Público</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 font-medium leading-relaxed bg-gray-50/50 p-4 rounded-2xl border border-gray-50">{log.note}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
