import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Hourglass, FileText, User as UserIcon, Calendar, ClipboardList, Search, Download, Filter, MessageSquare, X, RefreshCw } from 'lucide-react';
import { ProcedureLog, Procedure } from '../../types';
import { format, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import LoadingOverlay from '../../components/LoadingOverlay';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportData {
  logs: ProcedureLog[];
  procedures: Procedure[];
  technicians: { id: string, name: string, username: string }[];
}

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [selectedTech, setSelectedTech] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
    const [quickNoteModal, setQuickNoteModal] = useState<{ isOpen: boolean; procedureId: string; title: string }>({ isOpen: false, procedureId: '', title: '' });
  const [quickNoteText, setQuickNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const viewMode = (searchParams.get('view') as 'list' | 'grouped' | 'tracking') || 'list';

  const setViewMode = (mode: string) => {
    setSearchParams({ view: mode });
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchReport();
    }
  }, [user]);

  const fetchReport = async () => {
    try {
      setFetching(true);
      const result = await api.getTechnicianActivityReport('admin');
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Hourglass className="w-8 h-8 animate-pulse text-[#E3000F]" />
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
          const logTime = logDate.getTime();
          
          if (startDate) {
            const start = startOfDay(new Date(startDate + 'T00:00:00')).getTime();
            if (logTime < start) matchesDate = false;
          }
          
          if (endDate) {
            const end = endOfDay(new Date(endDate + 'T23:59:59')).getTime();
            if (logTime > end) matchesDate = false;
          }
        }
      }
    }

    const procedure = data.procedures.find(p => p.id === log.procedureId);
    
    // Status filtering
    const matchesStatus = selectedStatus === 'all' || procedure?.status === selectedStatus;
    if (!matchesStatus) return false;

    const matchesSearch = 
      String(log.note || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (String(procedure?.title || '').toLowerCase().includes(searchTerm.toLowerCase())) ||
      (String(procedure?.clientName || procedure?.clientUsername || '').toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesTech && matchesDate && matchesSearch;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];

  const getProcedureTitle = (id: string) => {
    return data?.procedures?.find(p => p.id === id)?.title || 'Trámite Desconocido';
  };

  const getTechName = (username: string) => {
    return data?.technicians?.find(t => t?.username === username)?.name || username;
  };

  const groupedByProcedure = (data?.procedures || []).map(proc => {
    const procLogs = filteredLogs.filter(l => l.procedureId === proc.id);
    if (procLogs.length === 0 && searchTerm) return null; // Filter out if searching and no logs match
    return {
      ...proc,
      logs: procLogs
    };
  }).filter(Boolean) as (Procedure & { logs: ProcedureLog[] })[];

  
  const handleSaveQuickNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNoteText.trim() || !quickNoteModal.procedureId) return;
    setSaving(true);
    try {
      await api.addLog({
        procedureId: quickNoteModal.procedureId,
        date: new Date().toISOString(),
        technicianUsername: user?.username,
        note: quickNoteText,
        isExternal: false
      });
      setQuickNoteModal({ isOpen: false, procedureId: '', title: '' });
      setQuickNoteText('');
      fetchReport(); // Reload data to show the new note
    } catch (err: any) {
      alert(`Error al guardar la nota: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(viewMode === 'tracking' ? 'Seguimiento de Trámites' : 'Reporte de Actividades', 14, 22);
    
    // Add filters info
    doc.setFontSize(10);
    doc.setTextColor(100);
    let filterText = `Filtros: Técnico: ${selectedTech === 'all' ? 'Todos' : getTechName(selectedTech)}`;
    if (selectedStatus !== 'all') filterText += ` | Estado: ${selectedStatus}`;
    if (startDate) filterText += ` | Desde: ${startDate}`;
    if (endDate) filterText += ` | Hasta: ${endDate}`;
    if (searchTerm) filterText += ` | Búsqueda: "${searchTerm}"`;
    doc.text(filterText, 14, 30);
    
    if (viewMode === 'tracking') {
      // Filter procedures that have logs matching the filters
      const proceduresWithFilteredLogs = (data?.procedures || []).filter(proc => {
        const procLogs = filteredLogs.filter(l => l.procedureId === proc.id);
        const matchesSearch = 
          String(proc.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(proc.clientName || proc.clientUsername || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(proc.code || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        // Filter by state
        const matchesStatus = selectedStatus === 'all' || proc.status === selectedStatus;
        if (!matchesStatus) return false;

        // If there are technician or date filters, only show procedures with matching logs
        const hasActiveFilters = selectedTech !== 'all' || startDate || endDate;
        if (hasActiveFilters) {
          return procLogs.length > 0 && matchesSearch;
        }
        return matchesSearch;
      });

      const tableData = proceduresWithFilteredLogs.map(proc => {
        const procLogs = filteredLogs.filter(l => l.procedureId === proc.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return [
          proc.code || proc.id.substring(0, 8),
          proc.clientName || proc.clientUsername,
          proc.procedureType || 'N/A',
          proc.technicianName || proc.technicianUsername || 'Sin asignar',
          proc.status || 'En proceso',
          procLogs.map(l => `${format(new Date(l.date), 'dd/MM/yy')}: ${l.note}`).join('\n')
        ];
      });

      autoTable(doc, {
        startY: 35,
        head: [['Nº Trámite', 'Cliente', 'Tipo', 'Técnico', 'Estado', 'Actividades']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [227, 0, 15] },
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20 },
          5: { cellWidth: 'auto' }
        }
      });
    } else {
      // Create table data for activity report
      const tableData = filteredLogs.map(log => {
        const proc = data?.procedures.find(p => p.id === log.procedureId);
        return [
          format(new Date(log.date), 'dd/MM/yyyy HH:mm'),
          getTechName(log.technicianUsername),
          `${proc?.code || ''} - ${proc?.title || ''}`,
          proc?.clientName || proc?.clientUsername || '',
          log.note
        ];
      });
      
      autoTable(doc, {
        startY: 35,
        head: [['Fecha', 'Técnico', 'Trámite', 'Cliente', 'Actividad / Nota']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [227, 0, 15] }, // #E3000F
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25 },
          2: { cellWidth: 35 },
          3: { cellWidth: 30 },
          4: { cellWidth: 'auto' }
        }
      });
    }
    
    doc.save(`${viewMode === 'tracking' ? 'seguimiento' : 'reporte'}_actividades_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <>

      {/* Quick Note Modal */}
      {quickNoteModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 min-h-[100dvh]">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#E3000F]/10 rounded-xl flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-[#E3000F]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 tracking-tight">Agregar Nota</h3>
                  <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 mt-0.5 line-clamp-1">{quickNoteModal.title}</p>
                </div>
              </div>
              <button 
                onClick={() => setQuickNoteModal({ isOpen: false, procedureId: '', title: '' })}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSaveQuickNote} className="p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                  Contenido de la nota (Interna)
                </label>
                <textarea
                  value={quickNoteText}
                  onChange={(e) => setQuickNoteText(e.target.value)}
                  placeholder="Escriba aquí el seguimiento, anotación técnica..."
                  className="w-full h-32 px-4 py-3 bg-gray-50 border-transparent rounded-[14px] focus:bg-white focus:ring-2 focus:ring-[#E3000F]/10 focus:border-[#E3000F]/20 outline-none transition-all resize-none text-[13px] font-medium text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-2 mt-auto">
                <button
                  type="button"
                  onClick={() => setQuickNoteModal({ isOpen: false, procedureId: '', title: '' })}
                  className="px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-colors"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !quickNoteText.trim()}
                  className="px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-[#E3000F] text-white hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                  Guardar Nota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    <div className="space-y-6 max-w-6xl mx-auto relative font-sans selection:bg-[#E3000F] selection:text-white">
      {fetching && <LoadingOverlay message="Actualizando reporte..." />}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight">Reporte de Actividades</h2>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Seguimiento detallado de las acciones realizadas</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                "px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all",
                viewMode === 'list' ? "bg-white text-[#E3000F] shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={clsx(
                "px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all",
                viewMode === 'grouped' ? "bg-white text-[#E3000F] shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Por Trámite
            </button>
            <button
              onClick={() => setViewMode('tracking')}
              className={clsx(
                "px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all",
                viewMode === 'tracking' ? "bg-white text-[#E3000F] shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Seguimiento
            </button>
          </div>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-3 py-1.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-all font-black text-[9px] uppercase tracking-widest shadow-lg"
          >
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-lg">
            <ClipboardList className="w-5 h-5 text-[#E3000F]" />
          </div>
          <div>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Actividades</p>
            <p className="text-xl font-black text-gray-900">{filteredLogs.length}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <UserIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Técnicos</p>
            <p className="text-xl font-black text-gray-900">{data?.technicians.length || 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <FileText className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Trámites</p>
            <p className="text-xl font-black text-gray-900">
              {new Set(filteredLogs.map(l => l.procedureId)).size}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-3 md:p-4 border-b border-gray-50 bg-gray-50/30 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Buscar por nota, trámite o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#E3000F]/20 focus:border-transparent outline-none bg-white"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-[9px] font-black uppercase tracking-widest border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-[#E3000F]/20 bg-white"
              />
              <span className="text-gray-300">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-[9px] font-black uppercase tracking-widest border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-[#E3000F]/20 bg-white"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value)}
                className="text-[9px] font-black uppercase tracking-widest border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-[#E3000F]/20 bg-white"
              >
                <option value="all">Todos los Técnicos</option>
                {data?.technicians.map(tech => (
                  <option key={tech.id} value={tech?.username || ''}>{tech?.name || 'Nombre Desconocido'}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-[9px] font-black uppercase tracking-widest border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-[#E3000F]/20 bg-white"
              >
                <option value="all">Todos los Estados</option>
                <option value="En proceso">En proceso</option>
                <option value="Suspendido">Suspendido</option>
                <option value="Finalizado">Finalizado</option>
              </select>
            </div>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                  <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Técnico</th>
                  <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Trámite</th>
                  <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Tipo</th>
                  <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                  <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Actividad / Nota</th>
                  <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Ver</th>
                  <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLogs.map((log) => {
                  const proc = data?.procedures.find(p => p.id === log.procedureId);
                  const techName = getTechName(log.technicianUsername || '');
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/30 transition-colors group">
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-[9px] font-black uppercase tracking-widest">
                            {format(new Date(log.date), 'dd MMM, yyyy', { locale: es })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center text-[8px] font-black text-gray-600 uppercase border border-gray-200">
                            {techName.substring(0, 2)}
                          </div>
                          <span className="text-[9px] font-black text-gray-900 uppercase tracking-widest">{techName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="text-[9px] font-black text-[#E3000F] uppercase tracking-widest line-clamp-1">
                          {proc?.code || 'N/A'} - {proc?.title || 'Trámite Desconocido'}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                          {proc?.procedureType || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">
                          {proc?.clientName || proc?.clientUsername || 'Sin Cliente'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <p className="text-[10px] text-gray-600 leading-relaxed max-w-md">
                          {log.note}
                        </p>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <a 
                          href={`/dashboard/procedures/${log.procedureId}`}
                          className="p-1.5 text-gray-400 hover:text-[#E3000F] hover:bg-red-50 rounded-lg transition-all inline-block"
                          title="Ver detalle del trámite"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400 italic text-[10px] font-black uppercase tracking-widest">
                      No se encontraron actividades registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : viewMode === 'grouped' ? (
          <div className="p-4 space-y-4">
            {groupedByProcedure.map(proc => (
              <div key={proc.id} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-50/50 px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-1">{proc.title}</h3>
                    <span className="bg-sky-50 text-sky-700 border border-sky-100 px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase tracking-widest break-words inline-block">
                        CL: {proc.clientName || 'N/A'}
                    </span>
                  </div>
                  <div className="text-[8px] font-black px-2 py-0.5 bg-white border border-gray-100 rounded-full text-gray-400 uppercase tracking-widest">
                    {proc.logs.length} Actividades
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {proc.logs.map(log => (
                    <div key={log.id} className="p-3 flex gap-4 hover:bg-gray-50/30 transition-colors">
                      <div className="shrink-0 text-center w-12">
                        <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                          {format(new Date(log.date), 'MMM', { locale: es })}
                        </div>
                        <div className="text-base font-black text-gray-900 leading-none">
                          {format(new Date(log.date), 'dd')}
                        </div>
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black text-[#E3000F] uppercase tracking-widest">
                            {getTechName(log.technicianUsername)}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-600 leading-relaxed">
                          {log.note}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {groupedByProcedure.length === 0 && (
              <div className="py-12 text-center text-gray-400 italic text-[10px] font-black uppercase tracking-widest">
                No se encontraron trámites con actividades registradas.
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Nº Trámite</th>
                  <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                  <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Tipo de Trámite</th>
                  <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Técnico</th>
                  <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Estado</th>
                  <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Actividades (Bitácora)</th>
                  <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Ver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(data?.procedures || []).filter(p => {
                  const procLogs = filteredLogs.filter(l => l.procedureId === p.id);
                  const matchesSearch = 
                    String(p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    String(p.clientName || p.clientUsername || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    String(p.code || '').toLowerCase().includes(searchTerm.toLowerCase());
                  
                  // Filter by status match
                  const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;
                  if (!matchesStatus) return false;

                  // If there are technician or date filters, only show procedures with matching logs
                  // For tracking view, if tech is filtered, match procedure technician instead of only logs
                  if (selectedTech !== 'all' && p.technicianUsername !== selectedTech && p.technicianName !== selectedTech) {
                    return false;
                  }
                  return matchesSearch;
                  return matchesSearch;
                }).map((proc) => {
                  const procLogs = filteredLogs.filter(l => l.procedureId === proc.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  return (
                    <tr key={proc.id} className="hover:bg-gray-50/30 transition-colors group">
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{proc.code || proc.id.substring(0, 8)}</span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{proc.clientName || proc.clientUsername}</span>
                          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{proc.idNumber || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-[9px] font-black text-[#E3000F] uppercase tracking-widest">{proc.procedureType || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{proc.technicianName || proc.technicianUsername || 'Sin asignar'}</span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-center">
                        <span className={clsx(
                          "px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border font-sans select-none inline-block",
                          proc.status === 'Finalizado' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          proc.status === 'Suspendido' ? "bg-rose-50 text-rose-600 border-rose-100" :
                          proc.status === 'En proceso' ? "bg-amber-50 text-amber-600 border-amber-100" :
                          "bg-gray-50 text-gray-600 border-gray-100"
                        )}>
                          {proc.status || 'En proceso'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="space-y-1 max-h-32 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                          {procLogs.length > 0 ? procLogs.map(log => (
                            <div key={log.id} className="text-[8px] leading-tight border-l-2 border-red-100 pl-2 py-0.5">
                              <span className="font-black text-gray-400 mr-1">{format(new Date(log.date), 'dd/MM/yy')}:</span>
                              <span className="text-gray-600">{log.note}</span>
                            </div>
                          )) : (
                            <span className="text-[8px] text-gray-400 italic">Sin actividades registradas</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <a 
                          href={`/dashboard/procedures/${proc.id}`}
                          className="p-1.5 text-gray-400 hover:text-[#E3000F] hover:bg-red-50 rounded-lg transition-all inline-block"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </a>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            navigate(`/dashboard/report-note?procedureId=${proc.id}`);
                          }}
                          className="p-1.5 text-gray-400 hover:text-[#E3000F] hover:bg-red-50 rounded-lg transition-all inline-block"
                          title="Reportar nota"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
