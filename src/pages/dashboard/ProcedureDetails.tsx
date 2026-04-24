import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { 
  ArrowLeft, Save, Edit2, CheckCircle2, XCircle, Plus, Trash2, 
  User as UserIcon, Calendar, DollarSign, FileText, Hourglass, 
  Phone, MapPin, Mail, Folder, MessageSquare, Clock, ArrowUpRight, 
  ArrowDownRight, Circle, Check, AlertCircle, RefreshCw, Eye,
  ClipboardList, Users, ShieldAlert, Briefcase
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import { Procedure, ProcedureLog, FinancialItem, User, ProcedureFile, ProcedureType, Account } from '../../types';
import LoadingOverlay from '../../components/LoadingOverlay';
import { motion, AnimatePresence } from 'motion/react';

interface DraftState {
  procedure: Partial<Procedure>;
  client: Partial<User>;
  logs: (Partial<ProcedureLog> & { isNew?: boolean, isDeleted?: boolean })[];
  financials: (Partial<FinancialItem> & { isNew?: boolean, isDeleted?: boolean })[];
}

export default function ProcedureDetails() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Original Data (Master)
  const [original, setOriginal] = useState<{
    procedure: Procedure | null;
    client: User | null;
    logs: ProcedureLog[];
    financials: FinancialItem[];
  }>({ procedure: null, client: null, logs: [], financials: [] });

  // Working Copy (Expediente En Edición)
  const [draft, setDraft] = useState<DraftState | null>(null);
  
  // Supporting Data
  const [procedureTypes, setProcedureTypes] = useState<ProcedureType[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [files, setFiles] = useState<ProcedureFile[]>([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'bitacora' | 'finanzas' | 'archivos'>('info');

  const hasChanges = useMemo(() => {
    if (!draft || !original.procedure) return false;
    
    // Check procedure changes
    const procChanged = JSON.stringify({
      title: draft.procedure.title,
      status: draft.procedure.status,
      technicianUsername: draft.procedure.technicianUsername,
      expectedValue: draft.procedure.expectedValue,
      completedSteps: draft.procedure.completedSteps,
      procedureType: draft.procedure.procedureType,
      propertyNumber: draft.procedure.propertyNumber
    }) !== JSON.stringify({
      title: original.procedure.title,
      status: original.procedure.status,
      technicianUsername: original.procedure.technicianUsername,
      expectedValue: original.procedure.expectedValue,
      completedSteps: original.procedure.completedSteps,
      procedureType: original.procedure.procedureType,
      propertyNumber: original.procedure.propertyNumber
    });

    // Check client changes
    const clientChanged = JSON.stringify({
      name: draft.client.name,
      phone: draft.client.phone,
      address: draft.client.address,
      idNumber: draft.client.idNumber,
      email: draft.client.email
    }) !== JSON.stringify({
      name: original.client?.name,
      phone: original.client?.phone,
      address: original.client?.address,
      idNumber: original.client?.idNumber,
      email: original.client?.email
    });

    // Check logs/financials for new or deleted or modified items
    const logsChanged = draft.logs.some(l => l.isNew || l.isDeleted || (l.id && JSON.stringify(l) !== JSON.stringify(original.logs.find(ol => ol.id === l.id))));
    const financialsChanged = draft.financials.some(f => f.isNew || f.isDeleted || (f.id && JSON.stringify(f) !== JSON.stringify(original.financials.find(of => of.id === f.id))));

    return procChanged || clientChanged || logsChanged || financialsChanged;
  }, [draft, original]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id || !currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const procs = await api.getProcedures({ username: currentUser.username, role: currentUser.role });
      const proc = procs.find((p: Procedure) => String(p.id) === String(id));
      if (!proc) throw new Error('Expediente no encontrado');

      const [logs, financials, users, types, accounts, files] = await Promise.all([
        api.getLogs(id),
        currentUser.role === 'admin' ? api.getFinancials(id) : Promise.resolve([]),
        api.getUsers(currentUser.role),
        api.getProcedureTypes(),
        api.getAccounts(),
        api.getFiles(id)
      ]);

      const clientUser = users.find((u: User) => u.username === proc.clientUsername) || null;
      
      setOriginal({ procedure: proc, client: clientUser, logs, financials });
      setFiles(files);
      setProcedureTypes(types);
      setAccounts(accounts);
      setStaff(users.filter((u: User) => u.role === 'tech' || u.role === 'admin'));

      setDraft({
        procedure: { ...proc },
        client: clientUser ? { ...clientUser } : {},
        logs: logs.map(l => ({ ...l })),
        financials: financials.map(f => ({ ...f }))
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalSave = async () => {
    if (!draft || !id) return;
    setSaving(true);
    setError(null);
    try {
      // 1. Update Procedure & Sync Client Info in Procedure table
      const procedureChanges = {
        id,
        title: draft.procedure.title,
        status: draft.procedure.status,
        technicianUsername: draft.procedure.technicianUsername,
        expectedValue: draft.procedure.expectedValue,
        completedSteps: draft.procedure.completedSteps,
        procedureType: draft.procedure.procedureType,
        propertyNumber: draft.procedure.propertyNumber,
        clientName: draft.client.name, // Sync
        clientPhone: draft.client.phone, // Sync
        clientEmail: draft.client.email // Sync
      };
      await api.updateProcedure(procedureChanges);

      // 2. Update Client User account (if admin/tech)
      if (currentUser?.role !== 'client' && original.client) {
        await api.updateUser({
          username: original.client.username,
          name: draft.client.name,
          phone: draft.client.phone,
          address: draft.client.address,
          idNumber: draft.client.idNumber,
          email: draft.client.email
        });
      }

      // 3. Handle Bitacora (Logs)
      const logsToDelete = draft.logs.filter(l => l.isDeleted && l.id).map(l => l.id!);
      const logsToCreate = draft.logs.filter(l => l.isNew && !l.isDeleted);
      const logsToUpdate = draft.logs.filter(l => !l.isNew && !l.isDeleted && l.id && JSON.stringify(l) !== JSON.stringify(original.logs.find(ol => ol.id === l.id)));

      for (const logId of logsToDelete) await api.deleteLog(logId);
      for (const log of logsToCreate) await api.addLog({ procedureId: id, note: log.note!, isExternal: !!log.isExternal, technicianUsername: currentUser?.username });
      if (logsToUpdate.length > 0) {
        await api.batchUpdateTable('Bitacora', logsToUpdate.map(l => ({ id: l.id!, changes: { note: l.note, isExternal: l.isExternal } })));
      }

      // 4. Handle Finanzas
      const finsToDelete = draft.financials.filter(f => f.isDeleted && f.id).map(f => f.id!);
      const finsToCreate = draft.financials.filter(f => f.isNew && !f.isDeleted);
      const finsToUpdate = draft.financials.filter(f => !f.isNew && !f.isDeleted && f.id && JSON.stringify(f) !== JSON.stringify(original.financials.find(of => of.id === f.id)));

      for (const finId of finsToDelete) await api.deleteFinancialItem(finId);
      for (const fin of finsToCreate) await api.addFinancialItem({ ...fin as any, procedureId: id });
      if (finsToUpdate.length > 0) {
        await api.batchUpdateTable('Finanzas', finsToUpdate.map(f => ({ id: f.id!, changes: { description: f.description, amount: f.amount, type: f.type, category: f.category, isReimbursable: f.isReimbursable, reimburseTo: f.reimburseTo } })));
      }

      setSuccess('Expediente actualizado correctamente');
      setTimeout(() => setSuccess(null), 3000);
      await fetchData();
    } catch (err: any) {
      setError("Error al guardar cambios: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addLogLocal = () => {
    if (!draft) return;
    const newLog = {
      id: `temp-${Date.now()}`,
      note: '',
      date: new Date().toISOString(),
      technicianUsername: currentUser?.username,
      isExternal: false,
      isNew: true
    };
    setDraft({ ...draft, logs: [newLog, ...draft.logs] });
    setActiveTab('bitacora');
  };

  const addFinancialLocal = (type: 'Ingreso' | 'Egreso' | 'Cuenta por Cobrar') => {
    if (!draft) return;
    const newFin = {
      id: `temp-${Date.now()}`,
      type,
      category: type === 'Ingreso' ? 'Abono Cliente' : (type === 'Cuenta por Cobrar' ? 'Monto Acordado' : 'Operativo'),
      description: '',
      amount: 0,
      date: new Date().toISOString(),
      isNew: true
    };
    setDraft({ ...draft, financials: [newFin, ...draft.financials] });
    setActiveTab('finanzas');
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <RefreshCw className="w-10 h-10 text-[#E3000F] animate-spin" />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cargando expediente...</p>
    </div>
  );

  if (!draft || !original.procedure) return (
    <div className="text-center py-20 px-6">
      <AlertCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
      <h2 className="text-xl font-black text-gray-900">Expediente no disponible</h2>
      <button onClick={() => navigate('/dashboard')} className="mt-4 text-[#E3000F] text-[10px] font-black uppercase tracking-widest">Volver al Dashboard</button>
    </div>
  );

  const calculateProgress = () => {
    const currentType = procedureTypes.find(t => t.name === draft.procedure.procedureType);
    if (!currentType) return 0;
    try {
      const steps = JSON.parse(currentType.steps);
      if (!Array.isArray(steps) || steps.length === 0) return 0;
      const completedCount = (draft.procedure.completedSteps || '').split(',').filter(Boolean).length;
      return Math.round((completedCount / steps.length) * 100);
    } catch(e) { return 0; }
  };

  const progress = calculateProgress();

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-32">
      {saving && <LoadingOverlay message="Guardando expediente..." />}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2.5 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-xl border border-gray-100 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-red-50 text-[#E3000F] px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest border border-red-100 uppercase">
                {original.procedure.code}
              </span>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                Creado: {format(new Date(original.procedure.createdAt), "dd MMM yyyy", { locale: es })}
              </span>
            </div>
            <input 
              value={draft.procedure.title || ''}
              onChange={e => setDraft({...draft, procedure: {...draft.procedure, title: e.target.value}})}
              className="text-xl font-black text-gray-900 bg-transparent border-none outline-none focus:ring-0 w-full p-0 leading-none placeholder:text-gray-200"
              placeholder="Nombre del expediente..."
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden lg:flex flex-col items-end mr-4">
             <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Progreso Global</span>
             <div className="flex items-center gap-2 mt-1">
                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                   <div className="h-full bg-[#E3000F]" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-[10px] font-black text-gray-900">{progress}%</span>
             </div>
          </div>
          
          <div className="h-10 w-px bg-gray-100 mx-2" />
          
          {currentUser?.role === 'admin' && (
            <select 
              value={draft.procedure.status}
              onChange={e => setDraft({...draft, procedure: {...draft.procedure, status: e.target.value as any}})}
              className={clsx(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-none ring-1 transition-all outline-none",
                draft.procedure.status === 'Finalizado' 
                  ? "bg-emerald-50 text-emerald-600 ring-emerald-100" 
                  : "bg-amber-50 text-amber-600 ring-amber-100"
              )}
            >
              <option value="En proceso">En proceso</option>
              <option value="Finalizado">Finalizado</option>
            </select>
          )}

          <a 
            href={`/consulta?idNumber=${draft.client.idNumber || draft.client.username}`} 
            target="_blank" 
            className="p-2.5 bg-white text-gray-400 hover:text-[#E3000F] rounded-xl border border-gray-100 shadow-sm"
            title="Ver vista pública"
          >
            <Eye className="w-5 h-5" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Sidebar Tabs & Client Quick Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-2 rounded-[28px] border border-gray-100 shadow-sm flex flex-col gap-1">
             <TabButton label="Información General" icon={Briefcase} active={activeTab === 'info'} onClick={() => setActiveTab('info')} />
             <TabButton label="Bitácora" icon={ClipboardList} active={activeTab === 'bitacora'} onClick={() => setActiveTab('bitacora')} count={draft.logs.length} />
             <TabButton label="Finanzas" icon={DollarSign} active={activeTab === 'finanzas'} onClick={() => setActiveTab('finanzas')} count={draft.financials.length} />
             <TabButton label="Archivos Drive" icon={Folder} active={activeTab === 'archivos'} onClick={() => setActiveTab('archivos')} />
          </div>

          {/* Quick Info Cards */}
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-[#E3000F]" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Cliente</p>
                <p className="text-sm font-black mt-1 truncate">{draft.client.name || 'Cargando...'}</p>
              </div>
            </div>
            
            <div className="h-px bg-gray-50 w-full" />
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-400">
                  <span>Monto Acordado</span>
                  <span className="text-gray-900">${draft.procedure.expectedValue || 0}</span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-400">
                  <span>Abonado</span>
                  <span className="text-emerald-600">${draft.financials.filter(f => f.type === 'Ingreso' && !f.isDeleted).reduce((sum, f) => sum + Number(f.amount), 0)}</span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-400">
                  <span>Gastos</span>
                  <span className="text-red-500">${draft.financials.filter(f => f.type === 'Egreso' && !f.isDeleted).reduce((sum, f) => sum + Number(f.amount), 0)}</span>
                </div>
                <div className="h-px bg-gray-200 w-full" />
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-gray-400">Saldo Pendiente</span>
                  <span className={clsx(
                    (draft.procedure.expectedValue || 0) - draft.financials.filter(f => f.type === 'Ingreso' && !f.isDeleted).reduce((sum, f) => sum + Number(f.amount), 0) > 0 ? "text-[#E3000F]" : "text-emerald-600"
                  )}>
                    ${(draft.procedure.expectedValue || 0) - draft.financials.filter(f => f.type === 'Ingreso' && !f.isDeleted).reduce((sum, f) => sum + Number(f.amount), 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Center Content */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'info' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <Section title="Información del Trámite">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Field label="Tipo de Trámite">
                        <select 
                          value={draft.procedure.procedureType}
                          onChange={e => setDraft({...draft, procedure: {...draft.procedure, procedureType: e.target.value}})}
                          className="w-full bg-gray-50 border-gray-100 rounded-xl p-3 text-xs font-black outline-none focus:ring-2 focus:ring-red-500/20"
                        >
                          <option value="">Seleccione tipo...</option>
                          {procedureTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                        </select>
                      </Field>
                      <Field label="Responsable (Técnico)">
                         <select 
                          value={draft.procedure.technicianUsername || ''}
                          onChange={e => setDraft({...draft, procedure: {...draft.procedure, technicianUsername: e.target.value}})}
                          className="w-full bg-gray-50 border-gray-100 rounded-xl p-3 text-xs font-black outline-none focus:ring-2 focus:ring-red-500/20"
                          disabled={currentUser?.role !== 'admin'}
                        >
                          <option value="">Sin asignar</option>
                          {staff.filter(u => u.role === 'tech').map(t => <option key={t.id} value={t.username}>{t.name}</option>)}
                        </select>
                      </Field>
                   </div>
                </Section>

                <Section title="Pasos y Avance del Trámite">
                  <div className="space-y-4">
                    {(() => {
                      const procType = (draft.procedure.procedureType || '').trim().toLowerCase();
                      const currentType = procedureTypes.find(t => t.name.trim().toLowerCase() === procType);
                      if (!currentType) return <p className="text-[10px] text-gray-400 font-bold uppercase py-2">Seleccione un tipo de trámite para ver los pasos.</p>;
                      
                      try {
                        const stepsList = JSON.parse(currentType.steps);
                        if (!Array.isArray(stepsList) || stepsList.length === 0) return <p className="text-[10px] text-gray-400 font-bold uppercase py-2">No hay pasos definidos para este trámite.</p>;
                        
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {stepsList.map((step: string, index: number) => {
                              const isCompleted = (draft.procedure.completedSteps || '').split(',').filter(Boolean).includes(step);
                              return (
                                <div 
                                  key={index}
                                  onClick={() => {
                                    const current = (draft.procedure.completedSteps || '').split(',').filter(Boolean);
                                    const updated = isCompleted 
                                      ? current.filter(s => s !== step)
                                      : [...current, step];
                                    setDraft({
                                      ...draft,
                                      procedure: { ...draft.procedure, completedSteps: updated.join(',') }
                                    });
                                  }}
                                  className={clsx(
                                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                                    isCompleted 
                                      ? "bg-emerald-50 border-emerald-100 text-emerald-700 shadow-sm" 
                                      : "bg-gray-50 border-gray-100 text-gray-400 hover:border-red-100"
                                  )}
                                >
                                  <div className={clsx(
                                    "w-5 h-5 rounded-md flex items-center justify-center border transition-all",
                                    isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-gray-200"
                                  )}>
                                    {isCompleted && <Check className="w-3.5 h-3.5" />}
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-tight">{step}</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      } catch (e) {
                        return <p className="text-[10px] text-red-400 font-bold uppercase py-2">Error al procesar los pasos del trámite.</p>;
                      }
                    })()}
                  </div>
                </Section>

                <Section title="Información del Cliente">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Nombre del Cliente">
                      <input 
                        value={draft.client.name || ''}
                        onChange={e => setDraft({...draft, client: {...draft.client, name: e.target.value}})}
                        className="w-full bg-gray-50 border-gray-100 rounded-xl p-3 text-xs font-black outline-none focus:ring-2 focus:ring-red-500/20"
                      />
                    </Field>
                    <Field label="Cédula / RUC">
                      <input 
                        value={draft.client.idNumber || ''}
                        onChange={e => setDraft({...draft, client: {...draft.client, idNumber: e.target.value}})}
                        className="w-full bg-gray-50 border-gray-100 rounded-xl p-3 text-xs font-black outline-none focus:ring-2 focus:ring-red-500/20"
                      />
                    </Field>
                    <Field label="Número de Predio / Clave">
                      <input 
                        value={draft.procedure.propertyNumber || ''}
                        onChange={e => setDraft({...draft, procedure: {...draft.procedure, propertyNumber: e.target.value}})}
                        className="w-full bg-gray-50 border-gray-100 rounded-xl p-3 text-xs font-black outline-none focus:ring-2 focus:ring-red-500/20"
                        placeholder="00-00-00-00"
                      />
                    </Field>
                    <Field label="Teléfono / WhatsApp">
                      <input 
                        value={draft.client.phone || ''}
                        onChange={e => setDraft({...draft, client: {...draft.client, phone: e.target.value}})}
                        className="w-full bg-gray-50 border-gray-100 rounded-xl p-3 text-xs font-black outline-none focus:ring-2 focus:ring-red-500/20"
                      />
                    </Field>
                    <Field label="Email">
                      <input 
                        type="email"
                        value={draft.client.email || ''}
                        onChange={e => setDraft({...draft, client: {...draft.client, email: e.target.value}})}
                        className="w-full bg-gray-50 border-gray-100 rounded-xl p-3 text-xs font-black outline-none focus:ring-2 focus:ring-red-500/20"
                      />
                    </Field>
                    <Field label="Dirección Domiciliaria">
                      <input 
                        value={draft.client.address || ''}
                        onChange={e => setDraft({...draft, client: {...draft.client, address: e.target.value}})}
                        className="w-full bg-gray-50 border-gray-100 rounded-xl p-3 text-xs font-black outline-none focus:ring-2 focus:ring-red-500/20"
                      />
                    </Field>
                  </div>
                </Section>
              </motion.div>
            )}

            {activeTab === 'bitacora' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6">
                <div className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                   <div>
                      <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">Registro de Bitácora</h3>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Gestión de anotaciones y seguimiento técnico</p>
                   </div>
                   <button onClick={addLogLocal} className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-[#E3000F] transition-all">
                      <Plus className="w-4 h-4" /> Nueva Nota
                   </button>
                </div>

                <div className="space-y-4">
                  {draft.logs.filter(l => !l.isDeleted).map((log, idx) => (
                    <div key={log.id} className={clsx(
                      "bg-white p-5 rounded-[24px] border transition-all flex gap-4",
                      log.isNew ? "border-amber-200 bg-amber-50/20" : "border-gray-100 hover:border-red-100"
                    )}>
                       <div className="hidden sm:flex flex-col items-center gap-1">
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 uppercase text-[10px] font-black text-gray-400">
                             {format(new Date(log.date || Date.now()), "dd")}
                          </div>
                          <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{format(new Date(log.date || Date.now()), "MMM")}</span>
                       </div>

                       <div className="flex-1 space-y-3">
                          <div className="flex justify-between items-center">
                             <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">{log.technicianUsername || 'Sistema'}</span>
                                <label className="flex items-center gap-2 cursor-pointer">
                                   <input 
                                     type="checkbox" 
                                     checked={log.isExternal} 
                                     onChange={e => {
                                        const newLogs = [...draft.logs];
                                        newLogs[idx].isExternal = e.target.checked;
                                        setDraft({...draft, logs: newLogs});
                                     }}
                                     className="w-3.5 h-3.5 text-[#E3000F] rounded border-gray-300 pointer-events-none sm:pointer-events-auto"
                                   />
                                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Visible Cliente</span>
                                </label>
                             </div>
                             <button 
                              onClick={() => {
                                const newLogs = [...draft.logs];
                                if (log.isNew) {
                                   newLogs.splice(idx, 1);
                                } else {
                                   newLogs[idx].isDeleted = true;
                                }
                                setDraft({...draft, logs: newLogs});
                              }}
                              className="text-gray-300 hover:text-red-500 transition-colors"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                          <textarea 
                            value={log.note}
                            onChange={e => {
                              const newLogs = [...draft.logs];
                              newLogs[idx].note = e.target.value;
                              setDraft({...draft, logs: newLogs});
                            }}
                            className="w-full bg-transparent border-none outline-none focus:ring-0 text-xs font-medium text-gray-600 min-h-[60px] p-0 resize-none"
                            placeholder="Ingrese los detalles de este avance..."
                          />
                       </div>
                    </div>
                  ))}

                  {draft.logs.length === 0 && (
                    <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[32px]">
                       <ClipboardList className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                       <p className="text-gray-300 font-black text-[10px] uppercase tracking-widest">No hay notas registradas en este expediente</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'finanzas' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                {/* Finance Header (Unified) */}
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex-1">
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                           <DollarSign className="w-5 h-5 text-emerald-500" />
                           Gestión Financiera del Expediente
                        </h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Control de pagos, gastos y saldos pendientes</p>
                      </div>
                      <div className="w-full md:w-auto">
                        <Field label="Monto Acordado del Trámite ($)">
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                              type="number"
                              value={draft.procedure.expectedValue || 0}
                              onChange={e => setDraft({...draft, procedure: {...draft.procedure, expectedValue: Number(e.target.value)}})}
                              className="w-full md:w-48 bg-gray-900 text-white border-none rounded-2xl pl-10 pr-4 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-xl shadow-emerald-500/10"
                            />
                          </div>
                        </Field>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <StatCard 
                     label="V. Acordado" 
                     value={draft.procedure.expectedValue || 0} 
                     color="gray" 
                     icon={FileText} 
                   />
                   <StatCard 
                     label="Abonado" 
                     value={draft.financials.filter(f => f.type === 'Ingreso' && !f.isDeleted).reduce((sum, f) => sum + Number(f.amount), 0)} 
                     color="emerald" 
                     icon={ArrowUpRight} 
                   />
                   <StatCard 
                     label="Gastos" 
                     value={draft.financials.filter(f => f.type === 'Egreso' && !f.isDeleted).reduce((sum, f) => sum + Number(f.amount), 0)} 
                     color="red" 
                     icon={ArrowDownRight} 
                   />
                   <StatCard 
                     label="S. Pendiente" 
                     value={(draft.procedure.expectedValue || 0) - draft.financials.filter(f => f.type === 'Ingreso' && !f.isDeleted).reduce((sum, f) => sum + Number(f.amount), 0)} 
                     color={(draft.procedure.expectedValue || 0) - draft.financials.filter(f => f.type === 'Ingreso' && !f.isDeleted).reduce((sum, f) => sum + Number(f.amount), 0) > 0 ? "orange" : "emerald"} 
                     icon={DollarSign} 
                     highlight
                   />
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">Rubros Económicos</h3>
                      <div className="flex gap-2">
                         <button onClick={() => addFinancialLocal('Ingreso')} className="px-4 py-2.5 bg-emerald-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Abono
                         </button>
                         <button onClick={() => addFinancialLocal('Egreso')} className="px-4 py-2.5 bg-red-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Gasto
                         </button>
                      </div>
                   </div>

                   <div className="space-y-3">
                      {draft.financials.filter(f => !f.isDeleted).map((fin, idx) => (
                        <div key={fin.id} className={clsx(
                          "flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border transition-all",
                          fin.isNew ? "border-amber-200 bg-amber-50/20" : "border-gray-50 hover:bg-gray-50/50"
                        )}>
                           <div className={clsx(
                             "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                             fin.type === 'Ingreso' ? "bg-emerald-50 text-emerald-600" : (fin.type === 'Egreso' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600")
                           )}>
                             {fin.type === 'Ingreso' ? <ArrowUpRight className="w-5 h-5" /> : (fin.type === 'Egreso' ? <ArrowDownRight className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />)}
                           </div>

                           <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                              <div className="sm:col-span-2">
                                <input 
                                  value={fin.description}
                                  onChange={e => {
                                    const newFins = [...draft.financials];
                                    newFins[idx].description = e.target.value;
                                    setDraft({...draft, financials: newFins});
                                  }}
                                  className="w-full bg-transparent border-none outline-none focus:ring-0 text-[11px] font-black text-gray-900 p-0 placeholder:text-gray-200"
                                  placeholder="Descripción del rubro..."
                                />
                                <div className="flex mt-1 text-[8px] font-black text-gray-400 uppercase tracking-widest gap-2">
                                   <span>{fin.category}</span>
                                   <span>•</span>
                                   <span>{format(new Date(fin.date || Date.now()), "dd MMM yyyy")}</span>
                                </div>
                              </div>
                              
                              <div>
                                <div className="relative">
                                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                  <input 
                                    type="number"
                                    value={fin.amount || ''}
                                    onChange={e => {
                                      const newFins = [...draft.financials];
                                      newFins[idx].amount = Number(e.target.value);
                                      setDraft({...draft, financials: newFins});
                                    }}
                                    className="w-full bg-transparent border-none border-b border-gray-100 pl-4 outline-none focus:ring-0 text-sm font-black text-gray-900 p-0"
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end gap-2">
                                 <button 
                                  onClick={() => {
                                    const newFins = [...draft.financials];
                                    if (fin.isNew) {
                                       newFins.splice(idx, 1);
                                    } else {
                                       newFins[idx].isDeleted = true;
                                    }
                                    setDraft({...draft, financials: newFins});
                                  }}
                                  className="p-2 text-gray-300 hover:text-red-500 rounded-xl"
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                              </div>
                           </div>
                        </div>
                      ))}

                      {draft.financials.length === 0 && (
                        <div className="py-12 text-center">
                           <DollarSign className="w-10 h-10 text-gray-100 mx-auto mb-2" />
                           <p className="text-gray-300 font-black text-[9px] uppercase tracking-widest">No hay movimientos financieros registrados</p>
                        </div>
                      )}
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'archivos' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                 <div className="bg-white p-10 rounded-[32px] border-2 border-dashed border-gray-100 text-center space-y-6">
                    <div className="w-20 h-20 bg-blue-50 rounded-[28px] flex items-center justify-center mx-auto shadow-sm">
                       <Folder className="w-10 h-10 text-blue-500" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-gray-900">Gestión de Archivos en la Nube</h3>
                       <p className="text-xs font-medium text-gray-400 mt-2 max-w-sm mx-auto leading-relaxed">
                          La documentación técnica, planos y comprobantes se sincronizan automáticamente con la carpeta virtual de Google Drive asignada a este trámite.
                       </p>
                    </div>

                    {draft.procedure.driveUrl ? (
                      <a 
                        href={draft.procedure.driveUrl} 
                        target="_blank" 
                        className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:scale-105 hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
                      >
                         <Folder className="w-5 h-5" /> Ir a Carpeta Drive
                      </a>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Carpeta no vinculada aún</p>
                        <button className="px-6 py-3 bg-gray-100 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all">Crear Carpeta Automáticamente</button>
                      </div>
                    )}
                 </div>

                 {files.length > 0 && (
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {files.map(file => (
                        <a key={file.id} href={file.url} target="_blank" className="p-4 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 group transition-all flex items-center gap-3 shadow-sm">
                           <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                              <FileText className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                           </div>
                           <div className="overflow-hidden">
                              <p className="text-[10px] font-black text-gray-900 truncate uppercase tracking-tight">{file.name}</p>
                              <p className="text-[8px] font-medium text-gray-400 uppercase tracking-widest">{format(new Date(file.date), "dd MMM, yyyy")}</p>
                           </div>
                        </a>
                      ))}
                   </div>
                 )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Global Save Button (Fixed Footer) */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-2xl"
          >
            <div className="bg-[#1A1A1A] p-5 rounded-[28px] border border-white/10 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-6">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/30">
                     <Save className="w-6 h-6 text-white" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Expediente Modificado</p>
                     <p className="text-[9px] font-medium text-gray-400 mt-1">Hay cambios pendientes por guardar en el sistema</p>
                  </div>
               </div>

               <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      if (window.confirm('¿Descartar cambios localizados?')) fetchData();
                    }}
                    className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Descartar
                  </button>
                  <button 
                    onClick={handleGlobalSave}
                    disabled={saving}
                    className="px-8 py-3 bg-red-600 text-white rounded-[18px] font-black text-[11px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 active:scale-95 flex items-center gap-2"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar Expediente
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {success && (
         <div className="fixed top-8 right-8 bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl z-[100] animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-widest">{success}</span>
         </div>
      )}

      {error && (
         <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-[100] animate-bounce flex items-center gap-3">
            <AlertCircle className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
            <button onClick={() => setError(null)} className="ml-4"><Trash2 className="w-4 h-4" /></button>
         </div>
      )}
    </div>
  );
}

function Section({ title, children, extra }: { title: string, children: React.ReactNode, extra?: React.ReactNode }) {
  return (
    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-black text-gray-900 flex items-center gap-3">
          <div className="w-1.5 h-6 bg-[#E3000F] rounded-full" />
          {title}
        </h3>
        {extra}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      {children}
    </div>
  );
}

function TabButton({ label, icon: Icon, active, onClick, count }: { label: string, icon: any, active: boolean, onClick: () => void, count?: number }) {
  return (
    <button 
      onClick={onClick}
      className={clsx(
        "flex items-center justify-between px-5 py-4 rounded-[20px] transition-all group",
        active ? "bg-gray-900 text-white shadow-lg" : "bg-white text-gray-500 hover:bg-gray-50"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className={clsx("w-5 h-5", active ? "text-red-500" : "text-gray-300 group-hover:text-gray-400")} />
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      {count !== undefined && count > 0 && (
        <span className={clsx("px-2 py-0.5 rounded-full text-[8px] font-black", active ? "bg-red-600 text-white" : "bg-gray-100 text-gray-400")}>
          {count}
        </span>
      )}
    </button>
  );
}

function StatCard({ label, value, color, icon: Icon, highlight }: { label: string, value: number, color: 'emerald' | 'red' | 'blue' | 'gray' | 'orange', icon: any, highlight?: boolean }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    red: 'bg-red-50 text-red-600 ring-red-100',
    blue: 'bg-blue-50 text-blue-600 ring-blue-100',
    gray: 'bg-gray-50 text-gray-600 ring-gray-100',
    orange: 'bg-orange-50 text-orange-600 ring-orange-100'
  };
  
  return (
    <div className={clsx(
      "p-6 rounded-[32px] ring-1 ring-inset shadow-sm transition-all",
      colors[color],
      highlight && "ring-2 ring-offset-2 ring-current ring-opacity-20 translate-y-[-2px]"
    )}>
       <div className="flex items-center justify-between mb-4">
          <Icon className="w-6 h-6 opacity-40" />
          <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
       </div>
       <p className="text-2xl font-black">${value.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</p>
    </div>
  );
}
