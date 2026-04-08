import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { ArrowLeft, Plus, FileText, Calendar, DollarSign, User as UserIcon, Loader2, Phone, MapPin, Mail, Save, Edit2, CheckCircle2, XCircle, Upload, ExternalLink, Download, Trash2, Circle, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import { Procedure, ProcedureLog, FinancialItem, User, ProcedureFile, ProcedureType, Account } from '../../types';

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
  const [addingNote, setAddingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Client Edit State
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editClientData, setEditClientData] = useState<Partial<Procedure>>({});
  const [savingClient, setSavingClient] = useState(false);

  // Technician Assignment
  const [techs, setTechs] = useState<User[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [assigningTech, setAssigningTech] = useState(false);

  // Financial Item State
  const [showFinancialForm, setShowFinancialForm] = useState(false);
  const [newFinancial, setNewFinancial] = useState<Partial<FinancialItem>>({ 
    type: 'Ingreso', 
    category: 'Abono Cliente', 
    description: '', 
    amount: 0 
  });
  const [savingFinancial, setSavingFinancial] = useState(false);
  const [editingFinancial, setEditingFinancial] = useState<FinancialItem | null>(null);
  const [deletingFinancialId, setDeletingFinancialId] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editHeaderData, setEditHeaderData] = useState({ title: '', procedureType: '', expectedValue: 0, otherAgreements: '' });
  const [savingHeader, setSavingHeader] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isBulkEditingSteps, setIsBulkEditingSteps] = useState(false);
  const [tempSteps, setTempSteps] = useState<string[]>([]);
  const [savingSteps, setSavingSteps] = useState(false);

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
        idNumber: updatedProcedure.idNumber
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

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      await api.addLog({ procedureId: id, technicianUsername: currentUser?.username, note: newNote });
      setNewNote('');
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddingNote(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      await api.updateProcedureStatus({ id: id!, status: newStatus as any });
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignTechnician = async (techUsername: string) => {
    setAssigningTech(true);
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
      setAssigningTech(false);
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
    setSavingSteps(true);
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
      setSavingSteps(false);
    }
  };

  const handleUpdateHeader = async () => {
    setSavingHeader(true);
    try {
      await api.updateProcedure({ id: id!, ...editHeaderData });
      setIsEditingHeader(false);
      showSuccess('Información actualizada');
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingHeader(false);
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
    setSavingClient(true);
    try {
      // Update user info
      await api.updateUser({
        username: procedure!.clientUsername,
        name: editClientData.clientName,
        phone: editClientData.clientPhone,
        address: editClientData.clientAddress,
        idNumber: editClientData.idNumber
      });
      showSuccess('Información del cliente actualizada');
      setIsEditingClient(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingClient(false);
    }
  };

  const unusedOldHandleUpdateClient = async () => {
    setSavingClient(true);
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
      setSavingClient(false);
    }
  };

  const handleAddFinancial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFinancial(true);
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
      setSavingFinancial(false);
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
    setDeletingFinancialId(financialId);
    try {
      await api.deleteFinancialItem(financialId);
      showSuccess('Rubro eliminado');
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingFinancialId(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-64 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-[#E3000F]" />
      {slowLoading && (
        <p className="text-gray-500 text-sm animate-pulse">
          La conexión con Google Sheets está tardando más de lo habitual...
        </p>
      )}
    </div>
  );
  if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">{error}</div>;
  if (!procedure) return <div className="p-4 text-gray-500 italic">Trámite no encontrado.</div>;

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
    <div className="space-y-4 md:space-y-6 max-w-6xl mx-auto pb-12 relative">
      {/* Success Message Toast */}
      {successMessage && (
        <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl z-[100] flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold">{successMessage}</span>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="flex items-center text-gray-600 hover:text-[#E3000F] transition-colors text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Trámites
        </button>
        {currentUser?.role === 'admin' && (
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-xs font-bold"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Eliminar Trámite
          </button>
        )}
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
                <p className="text-xs text-red-700 font-medium leading-relaxed">
                  Se eliminará permanentemente toda la información relacionada:
                  <ul className="list-disc ml-4 mt-1">
                    <li>Bitácora de seguimiento</li>
                    <li>Registros financieros</li>
                    <li>Archivos adjuntos</li>
                  </ul>
                </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-200 bg-gray-50 flex flex-col gap-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1 w-full">
                  {isEditingHeader ? (
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        value={editHeaderData.title} 
                        onChange={e => setEditHeaderData({...editHeaderData, title: e.target.value})}
                        className="w-full text-xl md:text-2xl font-bold text-gray-900 border-b border-gray-300 focus:border-[#E3000F] outline-none bg-transparent"
                      />
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <select 
                          value={editHeaderData.procedureType} 
                          onChange={e => setEditHeaderData({...editHeaderData, procedureType: e.target.value})}
                          className="text-xs md:text-sm border-none bg-transparent focus:ring-0 p-0 text-gray-500 font-medium"
                        >
                          <option value="">Seleccionar Tipo</option>
                          {procedureTypes.map(t => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Valor Acordado ($)</label>
                          <input 
                            type="number" 
                            value={editHeaderData.expectedValue} 
                            onChange={e => setEditHeaderData({...editHeaderData, expectedValue: Number(e.target.value)})}
                            className="w-full text-xs border-gray-300 rounded-md p-2 border"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Otros Acuerdos</label>
                          <input 
                            type="text" 
                            value={editHeaderData.otherAgreements} 
                            onChange={e => setEditHeaderData({...editHeaderData, otherAgreements: e.target.value})}
                            placeholder="Ej. Planos adicionales, etc."
                            className="w-full text-xs border-gray-300 rounded-md p-2 border"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-3 mb-1 md:mb-2">
                        <span className="text-[10px] md:text-xs font-black text-[#E3000F] bg-red-50 px-2 py-0.5 rounded border border-red-100 uppercase tracking-wider">
                          {procedure.code || 'SIN CÓDIGO'}
                        </span>
                        <p className="text-[10px] md:text-sm text-gray-500 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 md:w-4 md:h-4" /> {formatDate(procedure.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg md:text-2xl font-bold text-gray-900 leading-tight">{procedure.title}</h2>
                        {currentUser?.role === 'admin' && (
                          <button onClick={() => setIsEditingHeader(true)} className="text-gray-400 hover:text-[#E3000F] transition-colors">
                            <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full md:w-auto">
                  {isEditingHeader ? (
                    <div className="flex gap-2 ml-auto">
                      <button onClick={() => setIsEditingHeader(false)} className="p-2 text-gray-400 hover:text-gray-600"><XCircle className="w-5 h-5" /></button>
                      <button onClick={handleUpdateHeader} disabled={savingHeader} className="p-2 text-green-600 hover:text-green-700">
                        {savingHeader ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">Estado</span>
                        {currentUser?.role === 'admin' || currentUser?.role === 'tech' ? (
                          <select 
                            value={procedure.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            disabled={updatingStatus}
                            className="border-none bg-transparent focus:ring-0 text-xs md:text-sm font-bold text-gray-900 p-0"
                          >
                            <option value="Nuevo">Nuevo</option>
                            <option value="En Curso">En Curso</option>
                            <option value="Finalizado">Finalizado</option>
                          </select>
                        ) : (
                          <span className="text-xs md:text-sm font-bold text-blue-600">
                            {procedure.status}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">Técnico</span>
                        {currentUser?.role === 'admin' ? (
                          <div className="relative flex items-center">
                            <select
                              value={procedure.technicianUsername || ''}
                              onChange={(e) => handleAssignTechnician(e.target.value)}
                              disabled={assigningTech}
                              className="border-none bg-transparent focus:ring-0 text-xs md:text-sm font-bold text-gray-900 p-0 pr-6"
                            >
                              <option value="">Sin asignar</option>
                              {techs.map(t => (
                                <option key={t.id} value={t.username}>{t.name}</option>
                              ))}
                            </select>
                            {assigningTech && <Loader2 className="w-3 h-3 animate-spin text-[#E3000F] absolute right-0 pointer-events-none" />}
                          </div>
                        ) : (
                          <span className="text-xs md:text-sm font-bold text-gray-900">
                            {techs.length > 0 
                              ? (techs.find(t => t.username === procedure.technicianUsername)?.name || procedure.technicianUsername || 'Sin asignar')
                              : (procedure.technicianUsername || 'Sin asignar')
                            }
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
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
                              disabled={savingSteps}
                              className="px-2 py-1 text-[10px] font-bold bg-[#E3000F] text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                            >
                              {savingSteps ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
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

          {/* Documents Section - Simplified */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm md:text-base">Documentación del Trámite</h3>
                  <p className="text-[10px] md:text-xs text-gray-500">Gestione todos los archivos directamente en la carpeta compartida.</p>
                </div>
              </div>
              
              {procedure.driveUrl ? (
                <a 
                  href={procedure.driveUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full md:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir Carpeta en Google Drive
                </a>
              ) : (
                currentUser?.role === 'admin' && (
                  <button
                    onClick={handleCreateDriveFolder}
                    disabled={creatingDriveFolder}
                    className="w-full md:w-auto inline-flex items-center justify-center px-6 py-2.5 bg-[#E3000F] text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-all shadow-xl shadow-red-100 disabled:opacity-50"
                  >
                    {creatingDriveFolder ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Vincular Carpeta de Drive
                  </button>
                )
              )}
            </div>
          </div>

          {/* Consolidated Bitácora */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-[#E3000F]" /> Bitácora Consolidada
              </h3>
            </div>
            <div className="p-4 md:p-6">
              {(currentUser?.role === 'admin' || currentUser?.role === 'tech') && (
                <form onSubmit={handleAddLog} className="mb-4 md:mb-6 bg-gray-50 p-2 md:p-4 rounded-lg border border-gray-200">
                  <textarea
                    required
                    rows={2}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[#E3000F] focus:border-[#E3000F] text-[10px] md:text-sm p-2 md:p-3 border"
                    placeholder="Registrar nuevo avance..."
                  />
                  <div className="mt-1 md:mt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={addingNote}
                      className="inline-flex items-center px-2 py-1 md:px-4 md:py-2 text-[10px] md:text-sm font-bold rounded-md shadow-sm text-white bg-[#1A1A1A] hover:bg-[#E3000F] transition-colors disabled:opacity-50"
                    >
                      {addingNote ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin mr-1 md:mr-2" /> : <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />}
                      Añadir
                    </button>
                  </div>
                </form>
              )}

              <div className="relative">
                <div className="absolute left-3 md:left-4 top-0 bottom-0 w-0.5 bg-gray-100"></div>
                <div className="space-y-4 md:space-y-6">
                  {logs.length === 0 ? (
                    <p className="text-gray-500 italic text-center py-4 text-xs md:text-sm">Sin registros aún.</p>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="relative pl-8 md:pl-10">
                        <div className="absolute left-1.5 md:left-2.5 top-1.5 w-3 md:w-3.5 h-3 md:h-3.5 rounded-full bg-white border-2 border-[#E3000F] z-10"></div>
                        <div className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-100 hover:border-gray-200 transition-colors">
                          <div className="flex justify-between items-center mb-1 md:mb-2">
                            <span className="text-[10px] md:text-xs font-bold text-[#E3000F] uppercase">{log.technicianUsername}</span>
                            <span className="text-[10px] md:text-xs text-gray-400">{formatDate(log.date, "d MMM, HH:mm")}</span>
                          </div>
                          <p className="text-xs md:text-sm text-gray-700 leading-relaxed">{log.note}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Info Card */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                <UserIcon className="w-4 h-4 text-[#E3000F]" /> Cliente
              </h3>
              {(currentUser?.role === 'admin' || (currentUser?.role === 'tech' && procedure.technicianUsername === currentUser.username)) && (
                <button 
                  onClick={() => setIsEditingClient(!isEditingClient)}
                  className="text-gray-400 hover:text-[#E3000F] transition-colors"
                >
                  {isEditingClient ? <XCircle className="w-4 h-4" /> : <Edit2 className="w-3 h-3 md:w-4 h-4" />}
                </button>
              )}
            </div>
            <div className="p-4 md:p-6 space-y-4">
              {isEditingClient ? (
                <form onSubmit={handleUpdateClient} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nombre Completo</label>
                    <input 
                      type="text" 
                      value={editClientData.clientName || ''} 
                      onChange={e => setEditClientData({...editClientData, clientName: e.target.value})}
                      placeholder="Nombre"
                      className="w-full text-xs md:text-sm border-gray-300 rounded-md p-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Teléfono</label>
                    <input 
                      type="text" 
                      value={editClientData.clientPhone || ''} 
                      onChange={e => setEditClientData({...editClientData, clientPhone: e.target.value})}
                      placeholder="Teléfono"
                      className="w-full text-xs md:text-sm border-gray-300 rounded-md p-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Dirección</label>
                    <input 
                      type="text" 
                      value={editClientData.clientAddress || ''} 
                      onChange={e => setEditClientData({...editClientData, clientAddress: e.target.value})}
                      placeholder="Dirección"
                      className="w-full text-xs md:text-sm border-gray-300 rounded-md p-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Cédula</label>
                    <input 
                      type="text" 
                      value={editClientData.idNumber || ''} 
                      onChange={e => setEditClientData({...editClientData, idNumber: e.target.value})}
                      placeholder="Número de Cédula"
                      className="w-full text-xs md:text-sm border-gray-300 rounded-md p-2 border"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={savingClient}
                    className="w-full flex justify-center items-center gap-2 bg-[#1A1A1A] text-white py-2 rounded-md text-xs md:text-sm hover:bg-[#E3000F] transition-colors"
                  >
                    {savingClient ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <Save className="w-3 h-3 md:w-4 md:h-4" />}
                    Guardar Cambios
                  </button>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-700">
                    <UserIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                    <span className="text-xs md:text-sm font-bold truncate">{procedure.clientName || procedure.clientUsername}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                    <span className="text-[10px] md:text-xs break-all">{procedure.clientUsername}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                    <span className="text-[10px] md:text-xs">{procedure.clientPhone || 'No registrado'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                    <span className="text-[10px] md:text-xs leading-tight">{procedure.clientAddress || 'No registrada'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Briefcase className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                    <span className="text-[10px] md:text-xs">Predio: {procedure.propertyNumber || 'No registrado'}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Cédula</p>
                    <span className="text-[10px] md:text-xs font-bold text-gray-700">{procedure.idNumber || 'No registrada'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary (Admin Only) */}
          {currentUser?.role === 'admin' && (
            <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-900 flex justify-between items-center">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-[#E3000F]" /> Finanzas
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
                  className="text-white hover:text-[#E3000F] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                {showFinancialForm && (
                  <form onSubmit={handleAddFinancial} className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase">{editingFinancial ? 'Editar Registro' : 'Nuevo Registro'}</h4>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <select 
                        value={newFinancial.type} 
                        onChange={e => setNewFinancial({...newFinancial, type: e.target.value as any})}
                        className="w-full text-xs border-gray-300 rounded-md p-2 border"
                      >
                        <option value="Ingreso">Ingreso (+)</option>
                        <option value="Egreso">Egreso (-)</option>
                      </select>
                      <select 
                        value={newFinancial.category} 
                        onChange={e => setNewFinancial({...newFinancial, category: e.target.value})}
                        className="w-full text-xs border-gray-300 rounded-md p-2 border"
                      >
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.name}>{acc.name}</option>
                        ))}
                        {accounts.length === 0 && (
                          <>
                            <option value="Abono Cliente">Abono Cliente</option>
                            <option value="Gasto Administrativo">Gasto Administrativo</option>
                            <option value="Gasto Operativo">Gasto Operativo</option>
                            <option value="Honorarios">Honorarios</option>
                            <option value="Otros">Otros</option>
                          </>
                        )}
                      </select>
                    </div>

                    <input 
                      required
                      type="text" 
                      placeholder="Descripción" 
                      value={newFinancial.description}
                      onChange={e => setNewFinancial({...newFinancial, description: e.target.value})}
                      className="w-full text-xs border-gray-300 rounded-md p-2 border"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        required
                        type="number" 
                        placeholder="Monto ($)" 
                        value={newFinancial.amount || ''}
                        onChange={e => setNewFinancial({...newFinancial, amount: Number(e.target.value)})}
                        className="w-full text-xs border-gray-300 rounded-md p-2 border"
                      />
                      <label className="cursor-pointer bg-white border border-gray-300 rounded-md p-2 text-[10px] flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors">
                        {uploadingReceipt ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        {newFinancial.fileUrl ? 'OK' : 'Respaldo'}
                        <input type="file" className="hidden" onChange={handleReceiptUpload} disabled={uploadingReceipt} />
                      </label>
                    </div>

                    <div className="bg-white p-2 rounded border border-gray-200 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={newFinancial.isReimbursable}
                          onChange={(e) => setNewFinancial({...newFinancial, isReimbursable: e.target.checked})}
                          className="w-3 h-3 text-[#E3000F] border-gray-300 rounded focus:ring-[#E3000F]"
                        />
                        <span className="text-[10px] font-bold text-gray-700">¿Reembolsable?</span>
                      </label>

                      {newFinancial.isReimbursable && (
                        <select 
                          value={newFinancial.reimburseTo || ''}
                          onChange={(e) => setNewFinancial({...newFinancial, reimburseTo: e.target.value})}
                          className="w-full text-[10px] border-gray-300 rounded p-1 border bg-white"
                          required={newFinancial.isReimbursable}
                        >
                          <option value="">Seleccionar Persona...</option>
                          {staff.map(s => (
                            <option key={s.id} value={s.name}>{s.name} ({s.role === 'admin' ? 'Admin' : 'Técnico'})</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => {
                          setShowFinancialForm(false);
                          setEditingFinancial(null);
                        }}
                        className="flex-1 bg-gray-200 text-gray-700 py-1.5 rounded-md text-[10px] font-bold hover:bg-gray-300 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        disabled={savingFinancial}
                        className="flex-2 bg-[#E3000F] text-white py-1.5 px-4 rounded-md text-[10px] font-bold hover:bg-red-700 transition-colors"
                      >
                        {savingFinancial ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : editingFinancial ? 'Actualizar' : 'Guardar'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {financials.length === 0 ? (
                    <p className="text-center text-gray-400 text-[10px] italic py-4">Sin movimientos.</p>
                  ) : (
                    financials.map(f => (
                      <div key={f.id} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0 group">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={clsx(
                                "text-[8px] px-1 py-0.5 rounded font-bold uppercase",
                                f.type === 'Ingreso' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              )}>
                                {f.type}
                              </span>
                              <span className="text-[8px] text-gray-400 font-medium truncate">{f.category}</span>
                            </div>
                            <span className="text-[10px] font-bold text-gray-900 mt-0.5 truncate">{f.description}</span>
                            {f.isReimbursable && (
                              <span className="text-[8px] bg-yellow-100 text-yellow-700 px-1 rounded font-bold mt-0.5">
                                Reembolsar a: {f.reimburseTo}
                              </span>
                            )}
                            <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => {
                                  setEditingFinancial(f);
                                  setNewFinancial({ ...f });
                                  setShowFinancialForm(true);
                                }}
                                className="text-[8px] text-blue-600 hover:underline"
                              >
                                Editar
                              </button>
                              <button 
                                onClick={() => handleDeleteFinancial(f.id)}
                                disabled={deletingFinancialId === f.id}
                                className="text-[8px] text-red-600 hover:underline"
                              >
                                {deletingFinancialId === f.id ? '...' : 'Eliminar'}
                              </button>
                              {f.fileUrl && (
                                <a href={f.fileUrl} target="_blank" rel="noreferrer" className="text-[8px] text-emerald-600 hover:underline flex items-center gap-0.5">
                                  <Download className="w-2 h-2" /> Doc
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={clsx(
                              "text-xs font-bold",
                              f.type === 'Ingreso' ? "text-green-600" : "text-red-600"
                            )}>
                              {f.type === 'Ingreso' ? '+' : '-'}${Number(f.amount).toLocaleString()}
                            </span>
                            <p className="text-[8px] text-gray-400">{formatDate(f.date, "d MMM")}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-3 border-t border-gray-200 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-medium text-gray-500">Ingresos:</span>
                    <span className="text-xs font-bold text-green-600">${totalIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-medium text-gray-500">Egresos:</span>
                    <span className="text-xs font-bold text-red-600">-${totalExpense.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5">
                    <span className="text-[10px] font-bold text-gray-900">Saldo:</span>
                    <span className={clsx(
                      "text-sm font-black",
                      balance >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      ${balance.toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-100 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-medium text-gray-500 italic">Acordado:</span>
                      <span className="text-xs font-bold text-gray-700">${(Number(procedure.expectedValue) || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-medium text-gray-500 italic">Pendiente:</span>
                      <span className={clsx(
                        "text-xs font-bold",
                        (Number(procedure.expectedValue || 0) - totalIncome) > 0 ? "text-orange-600" : "text-gray-400"
                      )}>
                        ${Math.max(0, Number(procedure.expectedValue || 0) - totalIncome).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
