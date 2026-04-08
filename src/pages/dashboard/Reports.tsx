import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, FileText, User as UserIcon, Calendar, ClipboardList, Search, Download, Filter } from 'lucide-react';
import { ProcedureLog, Procedure } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';

interface ReportData {
  logs: ProcedureLog[];
  procedures: Procedure[];
  technicians: { id: string, name: string, username: string }[];
}

export default function Reports() {
  const { user } = useAuth();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTech, setSelectedTech] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchReport();
    }
  }, [user]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const result = await api.getTechnicianActivityReport('admin');
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#E3000F]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
        {error}
      </div>
    );
  }

  const filteredLogs = data?.logs.filter(log => {
    const matchesTech = selectedTech === 'all' || log.technicianUsername === selectedTech;
    
    // Date filtering
    let matchesDate = true;
    if (startDate || endDate) {
      if (!log.date) {
        matchesDate = false;
      } else {
        const logDate = new Date(log.date);
        if (isNaN(logDate.getTime())) {
          matchesDate = false;
        } else {
          // Normalize logDate to local midnight for comparison with input dates
          const logDateMidnight = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
          
          if (startDate) {
            const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
            const start = new Date(sYear, sMonth - 1, sDay);
            if (logDateMidnight < start) matchesDate = false;
          }
          
          if (endDate) {
            const [eYear, eMonth, eDay] = endDate.split('-').map(Number);
            const end = new Date(eYear, eMonth - 1, eDay);
            if (logDateMidnight > end) matchesDate = false;
          }
        }
      }
    }

    const procedure = data.procedures.find(p => p.id === log.procedureId);
    const matchesSearch = 
      log.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (procedure?.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (procedure?.clientName?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesTech && matchesDate && matchesSearch;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];

  const getProcedureTitle = (id: string) => {
    return data?.procedures.find(p => p.id === id)?.title || 'Trámite Desconocido';
  };

  const getTechName = (username: string) => {
    return data?.technicians.find(t => t.username === username)?.name || username;
  };

  const groupedByProcedure = data?.procedures.map(proc => {
    const procLogs = filteredLogs.filter(l => l.procedureId === proc.id);
    if (procLogs.length === 0 && searchTerm) return null; // Filter out if searching and no logs match
    return {
      ...proc,
      logs: procLogs
    };
  }).filter(Boolean) as (Procedure & { logs: ProcedureLog[] })[];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-900 uppercase tracking-tight">Reporte de Actividades</h2>
          <p className="text-stone-500 text-sm">Seguimiento detallado de las acciones realizadas por el equipo técnico.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex bg-stone-100 p-1 rounded-lg border border-stone-200">
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                viewMode === 'list' ? "bg-white text-[#E3000F] shadow-sm" : "text-stone-500 hover:text-stone-700"
              )}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={clsx(
                "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                viewMode === 'grouped' ? "bg-white text-[#E3000F] shadow-sm" : "text-stone-500 hover:text-stone-700"
              )}
            >
              Por Trámite
            </button>
          </div>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-all font-bold text-sm shadow-lg"
          >
            <Download className="w-4 h-4" /> Exportar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-lg">
            <ClipboardList className="w-6 h-6 text-[#E3000F]" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase">Total Actividades</p>
            <p className="text-2xl font-black text-stone-900">{filteredLogs.length}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <UserIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase">Técnicos Activos</p>
            <p className="text-2xl font-black text-stone-900">{data?.technicians.length || 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-lg">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase">Trámites con Avance</p>
            <p className="text-2xl font-black text-stone-900">
              {new Set(filteredLogs.map(l => l.procedureId)).size}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nota, trámite o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-[#E3000F] focus:border-transparent outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-stone-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs border border-stone-200 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-[#E3000F] bg-white font-medium"
              />
              <span className="text-stone-400">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs border border-stone-200 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-[#E3000F] bg-white font-medium"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-stone-400" />
              <select
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value)}
                className="text-xs border border-stone-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#E3000F] bg-white font-medium"
              >
                <option value="all">Todos los Técnicos</option>
                {data?.technicians.map(tech => (
                  <option key={tech.id} value={tech.username}>{tech.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100">
                  <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-wider">Técnico</th>
                  <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-wider">Trámite</th>
                  <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-wider">Actividad / Nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-stone-600">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span className="text-xs font-medium">
                          {format(new Date(log.date), 'dd MMM, yyyy', { locale: es })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-stone-100 rounded-full flex items-center justify-center text-[10px] font-bold text-stone-600 uppercase">
                          {getTechName(log.technicianUsername).substring(0, 2)}
                        </div>
                        <span className="text-xs font-bold text-stone-900">{getTechName(log.technicianUsername)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-[#E3000F] line-clamp-1">
                        {getProcedureTitle(log.procedureId)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-stone-600 leading-relaxed max-w-md">
                        {log.note}
                      </p>
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-stone-400 italic text-sm">
                      No se encontraron actividades registradas con los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 space-y-8">
            {groupedByProcedure.map(proc => (
              <div key={proc.id} className="border border-stone-200 rounded-xl overflow-hidden">
                <div className="bg-stone-50 px-4 py-3 border-b border-stone-200 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-black text-stone-900 uppercase tracking-tight">{proc.title}</h3>
                    <p className="text-[10px] text-stone-500 font-bold uppercase">Cliente: {proc.clientName || 'N/A'}</p>
                  </div>
                  <div className="text-[10px] font-black px-2 py-1 bg-white border border-stone-200 rounded-full text-stone-400 uppercase">
                    {proc.logs.length} Actividades
                  </div>
                </div>
                <div className="divide-y divide-stone-100">
                  {proc.logs.map(log => (
                    <div key={log.id} className="p-4 flex gap-4 hover:bg-stone-50/30 transition-colors">
                      <div className="shrink-0 text-center w-16">
                        <div className="text-[10px] font-black text-stone-400 uppercase">
                          {format(new Date(log.date), 'MMM', { locale: es })}
                        </div>
                        <div className="text-lg font-black text-stone-900 leading-none">
                          {format(new Date(log.date), 'dd')}
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-[#E3000F] uppercase tracking-wider">
                            {getTechName(log.technicianUsername)}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          {log.note}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {groupedByProcedure.length === 0 && (
              <div className="py-12 text-center text-stone-400 italic text-sm">
                No se encontraron trámites con actividades registradas.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
