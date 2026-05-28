import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Procedure, FinancialItem, Account, User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { 
  DollarSign, 
  HelpCircle, 
  Search, 
  Plus, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Upload, 
  Check, 
  FileText, 
  Coins, 
  Clock, 
  AlertCircle,
  UserCheck,
  RefreshCw,
  Trash2,
  Edit2
} from 'lucide-react';
import clsx from 'clsx';

export default function QuickFinance() {
  const { user } = useAuth();
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [teamUsers, setTeamUsers] = useState<User[]>([]);
  const [selectedProcId, setSelectedProcId] = useState<string>('');
  
  // Financial status state for the selected procedure
  const [procFinancials, setProcFinancials] = useState<FinancialItem[]>([]);
  const [isProcSummaryLoading, setIsProcSummaryLoading] = useState(false);
  
  // Load initial procedures and accounts list
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form details
  const [type, setType] = useState<'Ingreso' | 'Egreso' | 'Cuenta por Cobrar'>('Ingreso');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Abono Cliente');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Reimbursable fields
  const [isReimbursable, setIsReimbursable] = useState(false);
  const [reimburseTo, setReimburseTo] = useState('');

  // Editing state
  const [editingItem, setEditingItem] = useState<FinancialItem | null>(null);

  // State for confirm inline delete
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Auto-fill form values when entering edit mode
  useEffect(() => {
    if (editingItem) {
      setType(editingItem.type);
      setAmount(Number(editingItem.amount) || 0);
      setDescription(editingItem.description || '');
      setCategory(editingItem.category || '');
      if (editingItem.date) {
        setDate(editingItem.date.split('T')[0]);
      }
      setFileUrl(editingItem.fileUrl || '');
      setIsReimbursable(!!editingItem.isReimbursable);
      setReimburseTo(editingItem.reimburseTo || '');
    } else {
      setAmount(0);
      setDescription('');
      setFileUrl('');
      setIsReimbursable(false);
      setReimburseTo('');
      
      // Set default categories by type when exiting edit mode
      if (type === 'Cuenta por Cobrar') {
        setCategory('Monto Acordado');
      } else if (type === 'Ingreso') {
        setCategory('Abono Cliente');
      } else {
        setCategory(accounts[0]?.name || 'Operativo');
      }
    }
  }, [editingItem]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      const [procsList, accsList, usersList] = await Promise.all([
        api.getProcedures({ role: user?.role || 'admin', username: user?.username || '' }),
        api.getAccounts(),
        api.getUsers(user?.role || 'admin').catch(() => [])
      ]);
      setProcedures(procsList || []);
      setAccounts(accsList || []);
      
      // Filter out client users so we display system staff ("el equipo")
      const staffList = (usersList || []).filter((u: any) => u.role !== 'client');
      setTeamUsers(staffList);
    } catch (err: any) {
      setError('Error al cargar datos del servidor: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch financials for selected procedure to display instant feedback
  useEffect(() => {
    if (!selectedProcId) {
      setProcFinancials([]);
      return;
    }
    
    const fetchProcSummary = async () => {
      setIsProcSummaryLoading(true);
      try {
        const list = await api.getFinancials(selectedProcId);
        setProcFinancials(list || []);
      } catch (e) {
        console.error("Error fetching financials for summary", e);
      } finally {
        setIsProcSummaryLoading(false);
      }
    };
    
    fetchProcSummary();
  }, [selectedProcId]);

  // Handle dropdown type select category updating
  const handleTypeChange = (newType: 'Ingreso' | 'Egreso' | 'Cuenta por Cobrar') => {
    setType(newType);
    setDescription('');
    
    if (newType !== 'Egreso') {
      setIsReimbursable(false);
      setReimburseTo('');
    }

    const p = procedures.find(proc => proc.id === selectedProcId);
    
    if (newType === 'Cuenta por Cobrar') {
      setCategory('Monto Acordado');
      setAmount(p?.expectedValue || 0);
    } else {
      setAmount(0);
      if (newType === 'Ingreso') {
        setCategory('Abono Cliente');
      } else {
        setCategory(accounts[0]?.name || 'Operativo');
      }
    }
  };

  // File to base64 helper
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Upload receipt directly to GDrive folder associated to procedure
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedProcId) {
      alert("Debe seleccionar un trámite primero para poder asociar y guardar el comprobante.");
      e.target.value = '';
      return;
    }

    setUploadingFile(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await api.uploadFile({
        procedureId: selectedProcId,
        name: `Caja_Respaldo_${file.name}`,
        base64,
        mimeType: file.type
      });
      setFileUrl(result.url);
      setSuccessMessage("Archivo subido y vinculado al trámite correctamente.");
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      alert("No se pudo subir el archivo: " + err.message);
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  // Handle transaction submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProcId) {
      setError('Por favor, busque o seleccione un trámite para asociar su registro.');
      return;
    }
    if (amount <= 0 && type !== 'Cuenta por Cobrar') {
      setError('El monto del registro debe ser un valor numérico positivo.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      if (editingItem) {
        if (editingItem.id === 'virtual-monto-acordado') {
          // Since it's virtual, we just update the Procedure's expectedValue directly
          await api.updateProcedure({
            id: selectedProcId,
            expectedValue: Number(amount)
          });
          setSuccessMessage(`¡Monto acordado actualizado con éxito!`);
          setEditingItem(null); // Exit edit mode
        } else {
          // Update existing financial item
          await api.updateFinancialItem({
            id: editingItem.id,
            procedureId: selectedProcId,
            type,
            category,
            description: description.trim() || `${type} rápido`,
            amount: Number(amount),
            date: new Date(date).toISOString(),
            fileUrl,
            isReimbursable: type === 'Egreso' ? isReimbursable : false,
            reimburseTo: type === 'Egreso' && isReimbursable ? reimburseTo : ''
          });

          // Note: We no longer override expectedValue directly. 
          // The application will sum 'Cuenta por Cobrar' records dynamically.

          setSuccessMessage(`¡Registro de ${type} actualizado con éxito!`);
          setEditingItem(null); // Exit edit mode
        }
      } else {
        // Create new financial item
        await api.addFinancialItem({
          procedureId: selectedProcId,
          type,
          category,
          description: description.trim() || `${type} rápido`,
          amount: Number(amount),
          date: new Date(date).toISOString(),
          fileUrl,
          isReimbursable: type === 'Egreso' ? isReimbursable : false,
          reimburseTo: type === 'Egreso' && isReimbursable ? reimburseTo : ''
        });

        // Note: We no longer override expectedValue directly. 
        // The application will sum 'Cuenta por Cobrar' records dynamically.

        setSuccessMessage(`¡Registro de ${type} guardado con éxito!`);
      }
      
      // Clean up form variables
      setAmount(0);
      setDescription('');
      setFileUrl('');
      setIsReimbursable(false);
      setReimburseTo('');
      
      // Refresh database info on current page
      const updatedProcs = await api.getProcedures({ role: user?.role || 'admin', username: user?.username || '' });
      setProcedures(updatedProcs || []);
      
      // Force refresh current summary listing
      const updatedFins = await api.getFinancials(selectedProcId);
      setProcFinancials(updatedFins || []);
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
    } catch (err: any) {
      setError('Error al procesar el registro: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle transaction deletion
  const handleDeleteFinancial = async (itemId: string) => {
    if (confirmDeleteId !== itemId) {
      setConfirmDeleteId(itemId);
      // Automatically reset state after 3.5 seconds
      setTimeout(() => {
        setConfirmDeleteId(prev => prev === itemId ? null : prev);
      }, 3500);
      return;
    }

    setConfirmDeleteId(null);
    setIsSubmitting(true);
    setError('');
    
    try {
      if (itemId === 'virtual-monto-acordado') {
        await api.updateProcedure({
          id: selectedProcId,
          expectedValue: 0
        });
        setSuccessMessage("¡Monto acordado removido con éxito!");
      } else {
        await api.deleteFinancialItem(itemId);
        setSuccessMessage("¡Registro financiero eliminado con éxito!");
      }
      
      // Refresh procedures & financials lists
      const updatedProcs = await api.getProcedures({ role: user?.role || 'admin', username: user?.username || '' });
      setProcedures(updatedProcs || []);
      
      const updatedFins = await api.getFinancials(selectedProcId);
      setProcFinancials(updatedFins || []);
      
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setError("Error al eliminar el registro: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to get financials list plus the virtual "Monto Acordado" transaction (if it exists)
  const getProcessedFinancials = () => {
    const list = [...procFinancials];
    const proc = procedures.find(p => p.id === selectedProcId);
    if (proc) {
      const expValue = Number(proc.expectedValue || 0);
      if (expValue > 0) {
        // Check if there is already a transaction of type 'Cuenta por Cobrar' or with category 'Monto Acordado'
        const hasAgreedValueRecord = list.some(f => f.type === 'Cuenta por Cobrar' || f.category === 'Monto Acordado');
        if (!hasAgreedValueRecord) {
          list.unshift({
            id: 'virtual-monto-acordado',
            procedureId: selectedProcId,
            type: 'Cuenta por Cobrar',
            category: 'Monto Acordado',
            description: 'Monto Acordado (Sincronizado del Trámite)',
            amount: expValue,
            date: proc.createdAt || new Date().toISOString(),
            isVirtual: true
          } as any);
        }
      }
    }
    return list;
  };

  // Calculations for selected procedure
  const getSelectedProcSummary = () => {
    const proc = procedures.find(p => p.id === selectedProcId);
    if (!proc) return null;

    const agreedValue = proc.expectedValue || 0;
    const paidSum = procFinancials
      .filter(f => f.type === 'Ingreso' || f.category === 'Abono Cliente')
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    
    const expensesSum = procFinancials
      .filter(f => f.type === 'Egreso')
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    const balanceDue = agreedValue - paidSum;

    return {
      proc,
      agreedValue,
      paidSum,
      expensesSum,
      balanceDue
    };
  };

  // Filter procedures by searchable text (e.g., Code, Client Name, Title)
  const filteredProcedures = procedures.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      String(p.code || '').toLowerCase().includes(q) ||
      String(p.clientName || '').toLowerCase().includes(q) ||
      String(p.title || '').toLowerCase().includes(q) ||
      String(p.idNumber || '').toLowerCase().includes(q) ||
      String(p.clientUsername || '').toLowerCase().includes(q)
    );
  });

  const summary = getSelectedProcSummary();

  return (
    <div className="space-y-4">
      {/* Container Box: Compacted padding from p-6 sm:p-8 to p-4 sm:p-6 */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm">
        
        {/* Compact Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-50 pb-4 mb-4">
          <div className="space-y-0.5">
            <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-1.5">
              <Coins className="w-4.5 h-4.5 text-[#E3000F]" />
              Caja Rápida de Administrador
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              Registra cobros, gastos y valores acordados al instante (Versión Móvil Compacta)
            </p>
          </div>
          <div className="text-[9px] font-black uppercase tracking-widest text-[#C5B39A] bg-[#C5B39A]/10 px-2.5 py-0.5 rounded-full self-start">
            Fácil Acceso
          </div>
        </div>

        {/* Action Status Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 rounded-xl flex items-center gap-2 border border-red-100 animate-in fade-in duration-200">
            <AlertCircle className="w-4.5 h-4.5 text-red-600 shrink-0" />
            <span className="text-[11px] font-black text-red-700 leading-tight">{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 rounded-xl flex items-center gap-2 border border-emerald-100 animate-in fade-in duration-200">
            <Check className="w-4.5 h-4.5 text-emerald-600 shrink-0 animate-bounce" />
            <span className="text-[11px] font-black text-emerald-800 leading-tight">{successMessage}</span>
          </div>
        )}

        {/* Main Grid: Highly responsive columns */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          
          {/* Column 1: Procedure selection (Full height on large, highly collapsed on mobile) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="space-y-1">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">
                1. Seleccionar Trámite
              </label>
              
              {/* Dense Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar trámite, cédula..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 pl-8.5 pr-3 outline-none focus:ring-2 focus:ring-[#E3000F]/15 focus:bg-white text-[11px] font-bold text-gray-800"
                />
              </div>
            </div>

            {/* List box of key procedures (Limit high to 150px on mobile to prevent endless scroll) */}
            <div className="border border-gray-100 rounded-xl overflow-y-auto max-h-[150px] sm:max-h-[300px] bg-gray-50 p-1.5 space-y-1">
              {loading ? (
                <div className="p-4 text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider animate-pulse">
                  Cargando trámites...
                </div>
              ) : filteredProcedures.length === 0 ? (
                <div className="p-4 text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  No se encontraron trámites
                </div>
              ) : (
                filteredProcedures.map(p => {
                  const isSelected = selectedProcId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedProcId(p.id);
                        setError('');
                      }}
                      className={clsx(
                        "w-full text-left p-2 rounded-lg transition-all flex items-center justify-between border",
                        isSelected 
                          ? "bg-stone-900 border-[#E3000F] text-white shadow" 
                          : "bg-white border-transparent hover:border-gray-100 text-gray-900"
                      )}
                    >
                      <div className="space-y-0.5 truncate pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className={clsx(
                            "text-[8px] font-black tracking-wider px-1 py-0.2 rounded leading-none",
                            isSelected ? "bg-red-800 text-white" : "bg-gray-100 text-gray-800"
                          )}>
                            {p.code || 'S/C'}
                          </span>
                          <span className="text-[11px] font-black truncate">
                            {p.title}
                          </span>
                        </div>
                        <div className={clsx(
                          "text-[9px] truncate leading-tight",
                          isSelected ? "text-stone-300" : "text-gray-400"
                        )}>
                          {p.clientName} {p.idNumber ? `(${p.idNumber})` : `@${p.clientUsername}`}
                        </div>
                      </div>
                      <ChevronRight className={clsx("w-3.5 h-3.5 shrink-0", isSelected ? "text-[#E3000F]" : "text-gray-300")} />
                    </button>
                  );
                })
              )}
            </div>

            {/* Selected Procedure Instant Quick Stats */}
            {selectedProcId && summary && (
              <div className="bg-stone-900 text-white rounded-2xl p-3.5 space-y-2.5 shadow-md border border-stone-800 animate-in slide-in-from-bottom duration-200">
                <div className="flex justify-between items-center border-b border-stone-800 pb-1.5">
                  <span className="text-[9px] font-black text-[#C5B39A] uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Balance del Trámite
                  </span>
                  <span className="text-[8px] font-mono bg-stone-800 text-stone-300 px-1.5 py-0.2 rounded">
                    {summary.proc.code}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-stone-800/60 p-2 rounded-lg border border-stone-800/80">
                    <div className="text-[7px] text-gray-400 font-bold uppercase tracking-wider">Acuñado</div>
                    <div className="text-xs font-black text-[#C5B39A]">${summary.agreedValue.toLocaleString()}</div>
                  </div>
                  <div className="bg-stone-800/60 p-2 rounded-lg border border-stone-800/80">
                    <div className="text-[7px] text-gray-400 font-bold uppercase tracking-wider">Cobrado</div>
                    <div className="text-xs font-black text-emerald-400">${summary.paidSum.toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center px-2 py-1.5 rounded-lg bg-[#E3000F]/15 border border-[#E3000F]/20">
                  <span className="text-[7px] font-black tracking-widest uppercase text-stone-300">Pendiente</span>
                  <span className={clsx(
                    "text-xs font-black",
                    summary.balanceDue > 0 ? "text-red-400" : "text-emerald-400"
                  )}>
                    ${summary.balanceDue.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Fast input form (Slightly reduced margins and dense spacings) */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-4 bg-stone-50/50 p-3 sm:p-4 rounded-2xl border border-stone-100">
            <div className="space-y-3.5">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">
                2. Detalles de Operación
              </label>

              {/* Transaction Type Segmented Toggle Box - Small & Dense */}
              <div className="space-y-1">
                <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider">
                  Tipo de Registro
                </label>
                <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('Ingreso')}
                    className={clsx(
                      "py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-0.5",
                      type === 'Ingreso' 
                        ? "bg-white text-emerald-600 shadow-sm" 
                        : "text-gray-500 hover:text-gray-950"
                    )}
                  >
                    <ArrowUpRight className="w-3 h-3" />
                    Ingreso / Abono
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('Egreso')}
                    className={clsx(
                      "py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-0.5",
                      type === 'Egreso' 
                        ? "bg-white text-red-600 shadow-sm" 
                        : "text-gray-500 hover:text-gray-950"
                    )}
                  >
                    <ArrowDownRight className="w-3 h-3" />
                    Egreso / Gasto
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('Cuenta por Cobrar')}
                    className={clsx(
                      "py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-0.5",
                      type === 'Cuenta por Cobrar' 
                        ? "bg-white text-blue-600 shadow-sm" 
                        : "text-gray-500 hover:text-gray-950"
                    )}
                  >
                    <FileText className="w-3 h-3" />
                    Acordado
                  </button>
                </div>
              </div>

              {/* Amount and Category Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">
                    {type === 'Cuenta por Cobrar' ? 'Valor Acordado ($)' : 'Valor ($)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px] font-black text-gray-400">$</span>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount || ''}
                      onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full bg-white border border-gray-150 rounded-xl py-2 pl-7.5 pr-3 outline-none focus:ring-2 focus:ring-[#E3000F]/15 text-[11px] font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">
                    Categoría / Cuenta
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    disabled={type === 'Cuenta por Cobrar' || type === 'Ingreso'}
                    className="w-full bg-white border border-gray-150 rounded-xl p-2 outline-none focus:ring-2 focus:ring-[#E3000F]/15 text-[11px] font-bold cursor-pointer disabled:opacity-60"
                  >
                    {type === 'Cuenta por Cobrar' ? (
                      <option value="Monto Acordado">Monto Acordado</option>
                    ) : type === 'Ingreso' ? (
                      <option value="Abono Cliente">Abono Cliente</option>
                    ) : (
                      accounts.map(acc => (
                        <option key={acc.id} value={acc.name}>{acc.name}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Date Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">
                    Fecha
                  </label>
                  <input
                    required
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-white border border-gray-150 rounded-xl p-2 outline-none focus:ring-2 focus:ring-[#E3000F]/15 text-[11px] font-semibold text-gray-800"
                  />
                </div>
                
                <div className="flex flex-col justify-end">
                  {editingItem && (
                    <div className="p-1 px-2.5 bg-blue-50 border border-blue-150 text-blue-900 rounded-lg flex items-center justify-between text-[10px] font-bold">
                      <span className="truncate">Modo Edición Activo</span>
                      <button
                        type="button"
                        onClick={() => setEditingItem(null)}
                        className="text-[#E3000F] uppercase font-black text-[9px] hover:underline"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Reimbursable Fields (ONLY for expenses - Egreso) & Team selection */}
              {type === 'Egreso' && (
                <div className="bg-amber-50/50 border border-amber-100/70 rounded-xl p-3.5 space-y-2.5 animate-in slide-in-from-top duration-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isReimbursable"
                      checked={isReimbursable}
                      onChange={e => {
                        setIsReimbursable(e.target.checked);
                        if (!e.target.checked) setReimburseTo('');
                      }}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-amber-600 focus:ring-amber-500 accent-[#E3000F] cursor-pointer"
                    />
                    <label htmlFor="isReimbursable" className="text-[10px] font-black text-amber-900 uppercase tracking-wide cursor-pointer select-none">
                      ¿Este gasto es reembolsable?
                    </label>
                  </div>

                  {isReimbursable && (
                    <div className="animate-in slide-in-from-top-1 duration-150 space-y-1">
                      <label className="block text-[8px] font-black text-amber-800 uppercase tracking-widest">
                        Reembolsar a (Miembro del Equipo)
                      </label>
                      <select
                        required={isReimbursable}
                        value={reimburseTo}
                        onChange={e => setReimburseTo(e.target.value)}
                        className="w-full bg-white border border-amber-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-[#E3000F]/15 text-[11px] font-bold text-gray-800"
                      >
                        <option value="">Selecciona responsable...</option>
                        {teamUsers.map(u => (
                          <option key={u.id} value={u.name || u.username}>
                            {u.name} ({u.role === 'admin' ? 'Administrador' : u.role === 'tech' ? 'Técnico' : 'Finanzas'})
                          </option>
                        ))}
                        {teamUsers.length === 0 && (
                          <option value="Administrador">Administrador General</option>
                        )}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Description Input */}
              <div className="space-y-1">
                <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider">
                  Detalle / Descripción
                </label>
                <input
                  required
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ej: Pago de copias, abono de lote, etc."
                  className="w-full bg-white border border-gray-150 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-[#E3000F]/15 text-[11px]"
                />
              </div>

              {/* File Upload receipt Area (Compact) */}
              <div className="space-y-1">
                <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider">
                  Subir Comprobante (Opcional)
                </label>
                <div className="flex items-center gap-2">
                  <label className={clsx(
                    "flex-1 border border-dashed rounded-xl p-2.5 text-center cursor-pointer transition-all flex items-center justify-center gap-2",
                    fileUrl 
                      ? "border-emerald-300 bg-emerald-50/60 text-emerald-800"
                      : "border-gray-200 bg-white hover:bg-gray-50 text-gray-400"
                  )}>
                    <Upload className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-[9px] font-black uppercase tracking-wider">
                      {uploadingFile 
                        ? 'Subiendo...' 
                        : fileUrl 
                          ? '¡Comprobante Vinculado!' 
                          : 'Seleccionar PDF/Imagen'
                      }
                    </span>
                    <input
                      type="file"
                      disabled={uploadingFile || !selectedProcId}
                      onChange={handleReceiptUpload}
                      className="hidden"
                    />
                  </label>

                  {fileUrl && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white bg-[#1A1A1A] p-2.5 rounded-xl hover:bg-[#E3000F] transition-colors"
                      title="Ver Comprobante"
                    >
                      <FileText className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-2 flex items-center gap-2">
              {editingItem && (
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black uppercase tracking-wider text-[9px] rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !selectedProcId}
                className="flex-1 bg-[#1A1A1A] hover:bg-[#E3000F] disabled:bg-gray-100 disabled:text-gray-400 text-white font-black uppercase tracking-wider text-[9px] py-2.5 rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                {editingItem ? 'Guardar Cambios' : `Registrar ${type}`}
              </button>
            </div>
          </form>

          {/* Registered Transactions List for Selected Procedure */}
          {/* CRITICAL BUG FIX: Added lg:col-span-5 so that this full-width box never gets crushed into a single vertical column on desktop! */}
          {selectedProcId && (
            <div className="lg:col-span-5 bg-white border border-gray-100 rounded-2xl p-3.5 sm:p-5 space-y-3 mt-2 shadow-sm">
              
              <div className="flex justify-between items-center border-b border-gray-50 pb-2.5">
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-emerald-600 animate-pulse" /> Historial de Transacciones Registradas
                  </h3>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                    Visualice, edite o elimine movimientos financieros de este trámite
                  </p>
                </div>
                <span className="text-[9px] font-black font-mono bg-stone-100 text-stone-800 px-2.5 py-0.5 rounded">
                  {getProcessedFinancials().length} registros
                </span>
              </div>

              {isProcSummaryLoading ? (
                <div className="py-6 text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider animate-pulse">
                  Cargando historial...
                </div>
              ) : getProcessedFinancials().length === 0 ? (
                <div className="py-6 text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  No hay transacciones registradas aún para este trámite.
                </div>
              ) : (
                <>
                  {/* MOBILE-ONLY CARD STACK: Compact, simple listings that never overflow or cause side-scroll */}
                  <div className="block sm:hidden space-y-2.5">
                    {getProcessedFinancials().map(f => {
                      const isEditingThis = editingItem?.id === f.id;
                      return (
                        <div 
                          key={f.id} 
                          className={clsx(
                            "p-3 rounded-xl border transition-all space-y-2", 
                            isEditingThis ? "bg-blue-50/50 border-blue-200" : "bg-gray-50/50 border-gray-100"
                          )}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-[9px] text-gray-400 font-mono font-bold">
                              {f.date ? f.date.split('T')[0] : '---'}
                            </span>
                            
                            {/* Type indicator badge */}
                            <div className="flex flex-wrap gap-1 justify-end">
                              {f.isVirtual && (
                                <span className="inline-block px-1 py-0.2 text-[8px] font-black bg-purple-50 text-purple-700 rounded border border-purple-100 uppercase">
                                  Sincronizado
                                </span>
                              )}
                              <span className={clsx(
                                "px-1 py-0.2 text-[8px] font-black uppercase rounded",
                                f.type === 'Ingreso' && "bg-emerald-50 text-emerald-700",
                                f.type === 'Egreso' && "bg-rose-50 text-rose-700",
                                f.type === 'Cuenta por Cobrar' && "bg-blue-50 text-blue-700"
                              )}>
                                {f.type === 'Cuenta por Cobrar' ? 'Valor Acordado' : f.type}
                              </span>
                              {f.isReimbursable && (
                                <span className="inline-block px-1 py-0.2 text-[8px] font-black bg-amber-50 text-amber-700 rounded border border-amber-100">
                                  Reembolsable
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-xs font-black text-gray-900 leading-tight block">
                              {f.description}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wide">
                                {f.category}
                              </span>
                              {f.fileUrl && (
                                <a 
                                  href={f.fileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-[8px] font-black uppercase text-[#E3000F] hover:underline"
                                >
                                  Ver Recibo
                                </a>
                              )}
                            </div>
                            
                            {f.isReimbursable && f.reimburseTo && (
                              <p className="text-[9px] font-black text-amber-600 uppercase tracking-wide">
                                Reembolsar a: <span className="text-amber-800 font-black">{f.reimburseTo}</span>
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-1.5 border-t border-gray-100/50">
                            <span className="text-xs font-black font-mono text-gray-900">
                              ${Number(f.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingItem(f)}
                                className="p-1 px-2.5 text-[9px] font-black uppercase tracking-wider text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteFinancial(f.id)}
                                className={`p-1 px-2.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all border ${
                                  confirmDeleteId === f.id
                                    ? "bg-rose-600 text-white border-rose-700 animate-pulse"
                                    : "text-rose-700 bg-white border-rose-200 hover:bg-rose-50"
                                }`}
                              >
                                {confirmDeleteId === f.id ? "¡SÍ, BORRAR!" : "Eliminar"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* DESKTOP TABLE VIEW: Elegantly presented for bigger displays */}
                  <div className="hidden sm:block overflow-x-auto border border-gray-150 rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-150">
                          <th className="p-2.5 text-[9px] font-black text-gray-400 uppercase tracking-wider">Fecha</th>
                          <th className="p-2.5 text-[9px] font-black text-gray-400 uppercase tracking-wider">Detalle</th>
                          <th className="p-2.5 text-[9px] font-black text-gray-400 uppercase tracking-wider">Tipo/Categoría</th>
                          <th className="p-2.5 text-[9px] font-black text-gray-400 uppercase tracking-wider text-right">Monto</th>
                          <th className="p-2.5 text-[9px] font-black text-gray-400 uppercase tracking-wider text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {getProcessedFinancials().map(f => {
                          const isEditingThis = editingItem?.id === f.id;
                          return (
                            <tr key={f.id} className={clsx("hover:bg-gray-50/40 transition-colors", isEditingThis && "bg-blue-50/30")}>
                              <td className="p-2.5 text-[10px] text-gray-500 font-mono whitespace-nowrap">
                                {f.date ? f.date.split('T')[0] : '---'}
                              </td>
                              <td className="p-2.5">
                                <span className="text-[11px] font-black text-gray-800 block leading-tight">{f.description}</span>
                                {f.fileUrl && (
                                  <a 
                                    href={f.fileUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-[8px] font-black uppercase text-[#E3000F] hover:underline mt-0.5 inline-block"
                                  >
                                    Ver Comprobante
                                  </a>
                                )}
                              </td>
                              <td className="p-2.5 space-y-1">
                                <div className="flex flex-wrap gap-1 items-center">
                                  {f.isVirtual && (
                                    <span className="inline-flex px-1.5 py-0.2 text-[8px] font-black bg-purple-50 text-purple-700 rounded border border-purple-100 uppercase leading-none">
                                      Sincronizado
                                    </span>
                                  )}
                                  <span className={clsx(
                                    "inline-flex px-1.5 py-0.2 text-[8px] font-black uppercase tracking-widest rounded leading-none",
                                    f.type === 'Ingreso' && "bg-emerald-50 text-emerald-705 border border-emerald-100",
                                    f.type === 'Egreso' && "bg-rose-50 text-rose-705 border border-rose-100",
                                    f.type === 'Cuenta por Cobrar' && "bg-blue-50 text-blue-705 border border-blue-100"
                                  )}>
                                    {f.type === 'Cuenta por Cobrar' ? 'Valor Acordado' : f.type}
                                  </span>
                                  {f.isReimbursable && (
                                    <span className="inline-flex px-1.5 py-0.2 text-[8px] font-black bg-amber-50 text-amber-705 rounded border border-amber-100 leading-none">
                                      Reembolsable
                                    </span>
                                  )}
                                </div>
                                <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-wide leading-none">{f.category}</span>
                                {f.isReimbursable && f.reimburseTo && (
                                  <span className="block text-[9px] font-black text-amber-600 uppercase tracking-wider mt-0.5">
                                    A: <span className="text-amber-800 font-black">{f.reimburseTo}</span>
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 text-right text-[11px] font-black font-mono text-gray-900 whitespace-nowrap">
                                ${Number(f.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="p-2.5">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditingItem(f)}
                                    className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 rounded-lg transition-colors"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteFinancial(f.id)}
                                    className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-colors border ${
                                      confirmDeleteId === f.id
                                        ? "bg-rose-600 text-white border-rose-700 animate-pulse"
                                        : "text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200"
                                    }`}
                                  >
                                    {confirmDeleteId === f.id ? "¿SEGURO? ¡SÍ!" : "Eliminar"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
