import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { DollarSign, Loader2, TrendingUp, TrendingDown, Wallet, Search, Filter, ArrowUpRight, ArrowDownRight, Briefcase, User as UserIcon, Mail, Plus, Edit2, Trash2, X, Check, AlertCircle, Upload, FileCheck, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import { Procedure, FinancialItem, Account, User } from '../../types';
import LoadingOverlay from '../../components/LoadingOverlay';

export default function FinancialReports() {
  const [data, setData] = useState<{ procedures: Procedure[], transactions: FinancialItem[] }>({ procedures: [], transactions: [] });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [reportView, setReportView] = useState<'procedures' | 'categories' | 'cashflow'>('procedures');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Modal states
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FinancialItem | null>(null);
  const [newAccountName, setNewAccountName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summary, accs, usersData] = await Promise.all([
        api.getFinancialSummary(),
        api.getAccounts(),
        api.getUsers('admin')
      ]);
      setData(summary);
      setAccounts(accs);
      setStaff(Array.isArray(usersData) ? usersData.filter((u: any) => u.role === 'admin' || u.role === 'tech') : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions by date
  const filteredTransactions = (data.transactions || []).filter(t => {
    if (!t.date) return true;
    const tDate = new Date(t.date);
    if (startDate && tDate < new Date(startDate)) return false;
    if (endDate && tDate > new Date(endDate + 'T23:59:59')) return false;
    return true;
  });

  // Process data for Procedure Summary
  const procedureSummary = (data.procedures || []).map(proc => {
    const procTransactions = filteredTransactions.filter(t => t.procedureId === proc.id);
    const income = procTransactions.filter(t => t.type === 'Ingreso').reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = procTransactions.filter(t => t.type === 'Egreso').reduce((sum, t) => sum + Number(t.amount), 0);
    const expected = Number(proc.expectedValue) || 0;
    return {
      ...proc,
      totalIncome: income,
      totalExpense: expense,
      totalValue: expected,
      pending: Math.max(0, expected - income),
      balance: income - expense
    };
  });

  const filteredProcedures = procedureSummary.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.clientUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.procedureType || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'pending') return matchesSearch && item.pending > 0;
    if (filterType === 'paid') return matchesSearch && item.pending <= 0 && item.totalValue > 0;
    return matchesSearch;
  });

  // Process data for Category Summary
  const categorySummary = filteredTransactions.reduce((acc: any, t) => {
    const cat = t.category || 'Sin Categoría';
    if (!acc[cat]) acc[cat] = { category: cat, income: 0, expense: 0, count: 0 };
    if (t.type === 'Ingreso') acc[cat].income += Number(t.amount);
    else acc[cat].expense += Number(t.amount);
    acc[cat].count++;
    return acc;
  }, {});

  const categoryList = Object.values(categorySummary).sort((a: any, b: any) => (b.income + b.expense) - (a.income + a.expense));

  // Process data for Cash Flow
  const cashFlowSummary = filteredTransactions.reduce((acc: any, t) => {
    if (!t.date) return acc;
    const date = new Date(t.date);
    if (isNaN(date.getTime())) return acc;
    const monthKey = format(date, 'yyyy-MM');
    if (!acc[monthKey]) acc[monthKey] = { month: monthKey, income: 0, expense: 0 };
    if (t.type === 'Ingreso') acc[monthKey].income += Number(t.amount);
    else acc[monthKey].expense += Number(t.amount);
    return acc;
  }, {});

  const cashFlowList = Object.values(cashFlowSummary).sort((a: any, b: any) => b.month.localeCompare(a.month));

  const totalIncome = filteredTransactions.filter(t => t.type === 'Ingreso').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'Egreso').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpected = (data.procedures || []).reduce((sum, p) => sum + (Number(p.expectedValue) || 0), 0);
  const totalBalance = totalIncome - totalExpense;

  const handleAddTransaction = () => {
    setEditingItem(null);
    setIsTransactionModalOpen(true);
  };

  const handleEditTransaction = (item: FinancialItem) => {
    setEditingItem(item);
    setIsTransactionModalOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;
    setSaving(true);
    try {
      await api.deleteFinancialItem(id);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!newAccountName.trim()) return;
    setSaving(true);
    try {
      setIsSubmitting(true);
      await api.createAccount(newAccountName);
      setNewAccountName('');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
      setSaving(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta cuenta?')) return;
    setSaving(true);
    try {
      await api.deleteAccount(id);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#E3000F]" /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 relative">
      {saving && <LoadingOverlay />}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Reportes Financieros</h1>
          <p className="text-gray-500 text-sm">Legarq Constructora - Gestión de Flujo de Efectivo</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            <input 
              type="date" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="text-xs font-bold text-gray-700 bg-transparent outline-none px-2 py-1"
              title="Fecha Inicio"
            />
            <span className="text-gray-300">-</span>
            <input 
              type="date" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="text-xs font-bold text-gray-700 bg-transparent outline-none px-2 py-1"
              title="Fecha Fin"
            />
          </div>
          <button 
            onClick={() => setIsAccountModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-bold text-xs shadow-sm"
          >
            <Wallet className="w-4 h-4" /> Gestionar Cuentas
          </button>
          <button 
            onClick={handleAddTransaction}
            className="flex items-center gap-2 px-4 py-2 bg-[#E3000F] text-white rounded-lg hover:bg-red-700 transition-all font-bold text-xs shadow-lg"
          >
            <Plus className="w-4 h-4" /> Nuevo Registro
          </button>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setReportView('procedures')}
              className={clsx(
                "px-4 py-2 text-xs font-bold rounded-md transition-all",
                reportView === 'procedures' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Por Trámite
            </button>
            <button 
              onClick={() => setReportView('categories')}
              className={clsx(
                "px-4 py-2 text-xs font-bold rounded-md transition-all",
                reportView === 'categories' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Por Cuentas
            </button>
            <button 
              onClick={() => setReportView('cashflow')}
              className={clsx(
                "px-4 py-2 text-xs font-bold rounded-md transition-all",
                reportView === 'cashflow' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Flujo Mensual
            </button>
          </div>
        </div>
      </div>

    {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase">Ingresos</span>
          </div>
          <p className="text-2xl font-black text-gray-900">${totalIncome.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-1">Total recaudado</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 bg-red-50 rounded-lg">
              <TrendingDown className="w-5 h-5 text-[#E3000F]" />
            </div>
            <span className="text-[9px] font-bold text-[#E3000F] bg-red-50 px-2 py-1 rounded-full uppercase">Egresos</span>
          </div>
          <p className="text-2xl font-black text-gray-900">${totalExpense.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-1">Total gastos registrados</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase">Saldo Neto</span>
          </div>
          <p className="text-2xl font-black text-gray-900">${totalBalance.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-1">Efectivo en caja</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 bg-gray-50 rounded-lg">
              <Briefcase className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-[9px] font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded-full uppercase">Proyectado</span>
          </div>
          <p className="text-2xl font-black text-gray-900">${totalExpected.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-1">Valor total acordado</p>
        </div>
      </div>

      {reportView === 'procedures' && (
        <>
          {/* Filters */}
          <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar trámite o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-[#E3000F] focus:border-[#E3000F] outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="flex-1 md:flex-none border border-gray-200 rounded-lg text-[10px] md:text-sm py-2 px-2 md:px-3 focus:ring-[#E3000F] focus:border-[#E3000F] outline-none bg-white"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendientes</option>
                <option value="paid">Liquidados</option>
              </select>
            </div>
          </div>

          {/* Table / Cards */}
          <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trámite / Cliente</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Valor Acordado</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Ingresos</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Egresos</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Saldo</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Estado</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProcedures.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">No se encontraron registros financieros.</td>
                    </tr>
                  ) : (
                    filteredProcedures.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 group-hover:text-[#E3000F] transition-colors">{item.title}</span>
                            <span className="text-[10px] text-gray-500">{item.clientUsername}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-bold text-gray-900">${item.totalValue.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-bold text-green-600">${item.totalIncome.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-bold text-red-600">${item.totalExpense.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={clsx(
                            "text-sm font-bold",
                            item.balance >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            ${item.balance.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={clsx(
                            "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                            item.pending <= 0 && item.totalValue > 0 ? "bg-green-100 text-green-700" : 
                            item.totalIncome > 0 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"
                          )}>
                            {item.pending <= 0 && item.totalValue > 0 ? 'Liquidado' : 
                             item.totalIncome > 0 ? 'Abonado' : 'Pendiente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => {
                                // Find the first transaction for this procedure to edit or just open modal
                                // Actually, it's better to show the transactions of this procedure
                                setReportView('categories'); // Or just filter by this procedure
                                setSearchTerm(item.title);
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Ver detalles"
                            >
                              <Search className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredProcedures.length === 0 ? (
                <div className="p-8 text-center text-gray-400 italic text-xs">No se encontraron registros.</div>
              ) : (
                filteredProcedures.map((item) => (
                  <div key={item.id} className="p-3 space-y-3 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="overflow-hidden">
                        <h3 className="font-bold text-gray-900 text-[11px] leading-tight truncate">{item.title}</h3>
                        <p className="text-[9px] text-gray-400 truncate mt-0.5">{item.clientUsername}</p>
                      </div>
                      <span className={clsx(
                        "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase shrink-0",
                        item.pending <= 0 && item.totalValue > 0 ? "bg-green-100 text-green-700" : 
                        item.totalIncome > 0 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"
                      )}>
                        {item.pending <= 0 && item.totalValue > 0 ? 'Liquidado' : 
                         item.totalIncome > 0 ? 'Abonado' : 'Pendiente'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-gray-400 uppercase font-bold tracking-wider">Valor Acordado</span>
                        <span className="text-[11px] font-black text-gray-900">${item.totalValue.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[8px] text-gray-400 uppercase font-bold tracking-wider">Saldo Neto</span>
                        <span className={clsx(
                          "text-[11px] font-black",
                          item.balance >= 0 ? "text-green-600" : "text-red-600"
                        )}>${item.balance.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] text-gray-400 uppercase font-bold tracking-wider">Ingresos</span>
                        <span className="text-[11px] font-bold text-green-600">${item.totalIncome.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[8px] text-gray-400 uppercase font-bold tracking-wider">Egresos</span>
                        <span className="text-[11px] font-bold text-red-600">${item.totalExpense.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {reportView === 'categories' && (
        <div className="space-y-6">
          <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filtrar transacciones por descripción, trámite o cuenta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-[#E3000F] focus:border-[#E3000F] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 uppercase">Resumen por Cuentas</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {categoryList.map((cat: any) => (
                    <div key={cat.category} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSearchTerm(cat.category)}>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{cat.category}</p>
                        <p className="text-[10px] text-gray-400">{cat.count} transacciones</p>
                      </div>
                      <div className="text-right">
                        <p className={clsx(
                          "text-sm font-black",
                          (cat.income - cat.expense) >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          ${(cat.income - cat.expense).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-gray-900 uppercase">Listado de Transacciones</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Fecha</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Descripción / Cuenta</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Monto</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(data.transactions || [])
                        .filter(t => 
                          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (data.procedures.find(p => p.id === t.procedureId)?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map(t => (
                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs text-gray-500">{format(new Date(t.date), 'dd/MM/yy')}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-900">{t.description}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-gray-400 uppercase font-bold">{t.category}</span>
                                {t.isReimbursable && (
                                  <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1 rounded font-bold">Reembolsar a: {t.reimburseTo}</span>
                                )}
                                {t.fileUrl && (
                                  <a 
                                    href={t.fileUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded font-bold flex items-center gap-0.5 hover:bg-blue-200"
                                  >
                                    <FileCheck className="w-2 h-2" /> RESPALDO
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={clsx(
                              "text-xs font-black",
                              t.type === 'Ingreso' ? "text-green-600" : "text-red-600"
                            )}>
                              {t.type === 'Ingreso' ? '+' : '-'}${Number(t.amount).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-1">
                              <button 
                                onClick={() => handleEditTransaction(t)}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteTransaction(t.id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportView === 'cashflow' && (
        <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 uppercase">Flujo de Caja Mensual</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mes</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Ingresos</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Egresos</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Flujo Neto</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Tendencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cashFlowList.map((item: any) => (
                  <tr key={item.month} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-900 uppercase">
                        {format(new Date(item.month + '-01'), 'MMMM yyyy', { locale: es })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-green-600">${item.income.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-red-600">${item.expense.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={clsx(
                        "text-sm font-black",
                        (item.income - item.expense) >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        ${(item.income - item.expense).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {(item.income - item.expense) >= 0 ? (
                        <ArrowUpRight className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-red-500 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {isTransactionModalOpen && (
        <TransactionModal 
          isOpen={isTransactionModalOpen}
          onClose={() => setIsTransactionModalOpen(false)}
          onSuccess={() => {
            setIsTransactionModalOpen(false);
            fetchData();
          }}
          editingItem={editingItem}
          procedures={data.procedures}
          accounts={accounts}
          staff={staff}
        />
      )}

      {/* Accounts Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-black text-gray-900 uppercase">Gestionar Cuentas</h3>
              <button onClick={() => setIsAccountModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Nombre de la nueva cuenta..."
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#E3000F]"
                />
                <button 
                  onClick={handleCreateAccount}
                  disabled={isSubmitting || !newAccountName.trim()}
                  className="px-4 py-2 bg-[#E3000F] text-white rounded-lg font-bold text-xs disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Añadir'}
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {accounts.map(acc => (
                  <div key={acc.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-sm font-bold text-gray-700">{acc.name}</span>
                    <button 
                      onClick={() => handleDeleteAccount(acc.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingItem: FinancialItem | null;
  procedures: Procedure[];
  accounts: Account[];
  staff: User[];
}

function TransactionModal({ isOpen, onClose, onSuccess, editingItem, procedures, accounts, staff }: TransactionModalProps) {
  const [formData, setFormData] = useState<Partial<FinancialItem>>({
    type: 'Egreso',
    category: 'Operativo',
    description: '',
    amount: 0,
    procedureId: '',
    isReimbursable: false,
    reimburseTo: '',
    fileUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setFormData(editingItem);
    }
  }, [editingItem]);

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

    if (!formData.procedureId) {
      alert("Debe seleccionar un trámite para poder subir un respaldo (se requiere una carpeta de Drive).");
      e.target.value = '';
      return;
    }

    setUploadingReceipt(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await api.uploadFile({ 
        procedureId: formData.procedureId, 
        name: `Respaldo_${file.name}`, 
        base64 
      });
      setFormData({ ...formData, fileUrl: result.url });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadingReceipt(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (editingItem) {
        await api.updateFinancialItem({ ...formData, id: editingItem.id });
      } else {
        await api.addFinancialItem(formData);
      }
      onSuccess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-sm font-black text-gray-900 uppercase">
            {editingItem ? 'Editar Registro' : 'Nuevo Registro Financiero'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Tipo</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#E3000F] bg-white"
                required
              >
                <option value="Ingreso">Ingreso (+)</option>
                <option value="Egreso">Egreso (-)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Cuenta / Categoría</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#E3000F] bg-white"
                required
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.name}>{acc.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Trámite Relacionado (Opcional)</label>
            <select 
              value={formData.procedureId}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({
                  ...formData, 
                  procedureId: val,
                  category: val ? 'Operativo' : formData.category // Default to Operativo if linked to procedure
                });
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#E3000F] bg-white"
            >
              <option value="">Gasto/Ingreso General</option>
              {procedures.map(proc => (
                <option key={proc.id} value={proc.id}>{proc.title} ({proc.clientUsername})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Descripción</label>
            <input 
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#E3000F]"
              placeholder="Ej: Pago de honorarios, Compra de materiales..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Monto ($)</label>
              <input 
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#E3000F]"
                placeholder="0.00"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Respaldo</label>
              <label className={clsx(
                "w-full px-3 py-2 border rounded-lg text-sm flex items-center justify-center gap-2 cursor-pointer transition-all",
                formData.fileUrl ? "bg-green-50 border-green-200 text-green-700" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
              )}>
                {uploadingReceipt ? <Loader2 className="w-4 h-4 animate-spin" /> : (formData.fileUrl ? <FileCheck className="w-4 h-4" /> : <Upload className="w-4 h-4" />)}
                <span className="font-bold text-xs">{formData.fileUrl ? 'Cargado' : 'Subir'}</span>
                <input type="file" className="hidden" onChange={handleReceiptUpload} disabled={uploadingReceipt} />
              </label>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox"
                checked={formData.isReimbursable}
                onChange={(e) => setFormData({...formData, isReimbursable: e.target.checked})}
                className="w-4 h-4 text-[#E3000F] border-gray-300 rounded focus:ring-[#E3000F]"
              />
              <span className="text-xs font-bold text-gray-700">¿Es un gasto reembolsable?</span>
            </label>

            {formData.isReimbursable && (
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Reembolsar a:</label>
                <select 
                  value={formData.reimburseTo}
                  onChange={(e) => setFormData({...formData, reimburseTo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#E3000F] bg-white"
                  required={formData.isReimbursable}
                >
                  <option value="">Seleccionar Persona...</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.role === 'admin' ? 'Admin' : 'Técnico'})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-[#E3000F] text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {editingItem ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
