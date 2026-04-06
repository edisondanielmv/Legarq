import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { DollarSign, Loader2, TrendingUp, TrendingDown, Wallet, Search, Filter, ArrowUpRight, ArrowDownRight, Briefcase, User as UserIcon, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import { Procedure, FinancialItem } from '../../types';

export default function FinancialReports() {
  const [data, setData] = useState<{ procedures: Procedure[], transactions: FinancialItem[] }>({ procedures: [], transactions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [reportView, setReportView] = useState<'procedures' | 'categories' | 'cashflow'>('procedures');

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const result = await api.getFinancialSummary();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Process data for Procedure Summary
  const procedureSummary = data.procedures.map(proc => {
    const procTransactions = data.transactions.filter(t => t.procedureId === proc.id);
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
      item.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.procedureType || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'pending') return matchesSearch && item.pending > 0;
    if (filterType === 'paid') return matchesSearch && item.pending <= 0 && item.totalValue > 0;
    return matchesSearch;
  });

  // Process data for Category Summary
  const categorySummary = data.transactions.reduce((acc: any, t) => {
    const cat = t.category || 'Sin Categoría';
    if (!acc[cat]) acc[cat] = { category: cat, income: 0, expense: 0, count: 0 };
    if (t.type === 'Ingreso') acc[cat].income += Number(t.amount);
    else acc[cat].expense += Number(t.amount);
    acc[cat].count++;
    return acc;
  }, {});

  const categoryList = Object.values(categorySummary).sort((a: any, b: any) => (b.income + b.expense) - (a.income + a.expense));

  // Process data for Cash Flow
  const cashFlowSummary = data.transactions.reduce((acc: any, t) => {
    const date = new Date(t.date);
    const monthKey = format(date, 'yyyy-MM');
    if (!acc[monthKey]) acc[monthKey] = { month: monthKey, income: 0, expense: 0 };
    if (t.type === 'Ingreso') acc[monthKey].income += Number(t.amount);
    else acc[monthKey].expense += Number(t.amount);
    return acc;
  }, {});

  const cashFlowList = Object.values(cashFlowSummary).sort((a: any, b: any) => b.month.localeCompare(a.month));

  const totalIncome = data.transactions.filter(t => t.type === 'Ingreso').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = data.transactions.filter(t => t.type === 'Egreso').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpected = data.procedures.reduce((sum, p) => sum + (Number(p.expectedValue) || 0), 0);
  const totalBalance = totalIncome - totalExpense;

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#E3000F]" /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Reportes Financieros</h1>
          <p className="text-gray-500 text-sm">Legarq Constructora - Gestión de Flujo de Efectivo</p>
        </div>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase">Ingresos</span>
          </div>
          <p className="text-3xl font-black text-gray-900">${totalIncome.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Total recaudado</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <TrendingDown className="w-6 h-6 text-[#E3000F]" />
            </div>
            <span className="text-[10px] font-bold text-[#E3000F] bg-red-50 px-2 py-1 rounded-full uppercase">Egresos</span>
          </div>
          <p className="text-3xl font-black text-gray-900">${totalExpense.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Total gastos registrados</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase">Saldo Neto</span>
          </div>
          <p className="text-3xl font-black text-gray-900">${totalBalance.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Efectivo en caja</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-gray-50 rounded-lg">
              <Briefcase className="w-6 h-6 text-gray-600" />
            </div>
            <span className="text-[10px] font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded-full uppercase">Proyectado</span>
          </div>
          <p className="text-3xl font-black text-gray-900">${totalExpected.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Valor total acordado</p>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProcedures.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No se encontraron registros financieros.</td>
                    </tr>
                  ) : (
                    filteredProcedures.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 group-hover:text-[#E3000F] transition-colors">{item.title}</span>
                            <span className="text-[10px] text-gray-500">{item.clientEmail}</span>
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
                        <p className="text-[9px] text-gray-400 truncate mt-0.5">{item.clientEmail}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 uppercase">Resumen por Cuentas / Categorías</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {categoryList.map((cat: any) => (
                <div key={cat.category} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{cat.category}</p>
                    <p className="text-[10px] text-gray-400">{cat.count} transacciones</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-green-600 font-bold">+${cat.income.toLocaleString()}</span>
                      <span className="text-xs text-red-600 font-bold">-${cat.expense.toLocaleString()}</span>
                    </div>
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
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-center items-center text-center">
            <div className="p-4 bg-blue-50 rounded-full mb-4">
              <Wallet className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Análisis de Cuentas</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Este reporte permite visualizar el rendimiento de cada categoría de ingreso y gasto en la constructora.
            </p>
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
    </div>
  );
}
