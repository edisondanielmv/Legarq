import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, 
  Search, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  Table as TableIcon,
  User as UserIcon,
  FileText,
  DollarSign,
  ClipboardList,
  Box,
  CreditCard,
  X,
  Plus
} from 'lucide-react';
import { api } from '../../lib/api';
import LoadingOverlay from '../../components/LoadingOverlay';
import { motion, AnimatePresence } from 'motion/react';
import { Procedure } from '../../types';

type TableName = 'Tramites' | 'Usuarios' | 'Finanzas' | 'Bitacora' | 'Archivos' | 'TiposTramite' | 'Cuentas';

const TABLE_CONFIG: Record<TableName, { icon: any, label: string, primaryKey: string }> = {
  Tramites: { icon: Box, label: 'Trámites', primaryKey: 'id' },
  Usuarios: { icon: UserIcon, label: 'Usuarios', primaryKey: 'username' },
  Finanzas: { icon: DollarSign, label: 'Finanzas', primaryKey: 'id' },
  Bitacora: { icon: ClipboardList, label: 'Bitácora', primaryKey: 'id' },
  Archivos: { icon: FileText, label: 'Archivos', primaryKey: 'id' },
  TiposTramite: { icon: TableIcon, label: 'Tipos de Trámite', primaryKey: 'id' },
  Cuentas: { icon: CreditCard, label: 'Cuentas', primaryKey: 'id' },
};

export default function DatabaseEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTable, setActiveTable] = useState<TableName>('Tramites');
  const [data, setData] = useState<Record<string, any[]>>({});
  const [editStates, setEditStates] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getAllTableData();
      setData(result || {});
      // Reset edit states
      setEditStates({});
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const currentTableData = useMemo(() => {
    const raw = data[activeTable]?.rows || [];
    if (!searchTerm) return raw;
    
    return raw.filter((row: any) => 
      Object.values(row).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, activeTable, searchTerm]);

  const handleCellChange = (id: string, field: string, value: any) => {
    setEditStates(prev => ({
      ...prev,
      [`${activeTable}-${id}`]: {
        ...(prev[`${activeTable}-${id}`] || {}),
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    const updates = Object.entries(editStates)
      .filter(([key]) => key.startsWith(activeTable))
      .map(([key, changes]) => {
        const id = key.replace(`${activeTable}-`, '');
        const primaryKeyName = TABLE_CONFIG[activeTable].primaryKey;
        return {
          [primaryKeyName]: id,
          changes
        };
      });

    if (updates.length === 0) return;

    setSaving(true);
    setError(null);
    try {
      await api.batchUpdateTable(activeTable, updates);
      setSuccess('Cambios guardados correctamente');
      setTimeout(() => setSuccess(null), 3000);
      await fetchAllData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getProcedureContext = (row: any) => {
    const procedureId = row.procedureId || row.id;
    const tramites = data['Tramites']?.rows || [];
    const proc = tramites.find((t: any) => t.id === procedureId) as Procedure | undefined;
    
    if (!proc && activeTable !== 'Tramites') return null;
    if (activeTable === 'Tramites') return { code: row.code, client: row.clientName };
    return proc ? { code: proc.code, client: proc.clientName } : null;
  };

  const getColumns = () => {
    return data[activeTable]?.headers || [];
  };

  const columns = getColumns();

  if (loading && Object.keys(data).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] gap-4">
        <RefreshCw className="w-10 h-10 text-[#E3000F] animate-spin" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cargando base de datos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto space-y-6 pb-20">
      {saving && <LoadingOverlay />}
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-900 rounded-[18px] flex items-center justify-center shadow-lg shadow-black/10">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-gray-900">Editor de Base de Datos</h1>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Gestión administrativa global de registros</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={fetchAllData}
            className="p-2.5 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-xl transition-all border border-gray-100"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar registro..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-gray-50 border-transparent rounded-[14px] pl-10 pr-4 py-2.5 text-xs font-black outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:bg-white w-full md:w-64 border transition-all"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={Object.keys(editStates).filter(k => k.startsWith(activeTable)).length === 0}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-[14px] font-black text-xs uppercase tracking-widest transition-all ${
              Object.keys(editStates).filter(k => k.startsWith(activeTable)).length > 0
                ? 'bg-[#E3000F] text-white shadow-lg shadow-[#E3000F]/20 hover:scale-[1.02]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            Guardar Cambios
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {(Object.keys(TABLE_CONFIG) as TableName[]).map((tableName) => {
          const config = TABLE_CONFIG[tableName];
          const isActive = activeTable === tableName;
          const editCount = Object.keys(editStates).filter(k => k.startsWith(tableName)).length;
          
          return (
            <button
              key={tableName}
              onClick={() => setActiveTable(tableName)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-black transition-all whitespace-nowrap relative border ${
                isActive 
                  ? 'bg-gray-900 text-white border-gray-900 shadow-xl shadow-black/10 scale-105 z-10' 
                  : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <config.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
              {config.label}
              {editCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#E3000F] text-white text-[8px] flex items-center justify-center rounded-full border-2 border-white">
                  {editCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded-lg"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 text-sm font-medium"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table Section */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-900">
                <th className="p-4 text-left border-b border-white/10 text-[9px] font-black text-white/40 uppercase tracking-widest whitespace-nowrap">Trámite</th>
                <th className="p-4 text-left border-b border-white/10 text-[9px] font-black text-white/40 uppercase tracking-widest whitespace-nowrap">Cliente</th>
                {columns.map(col => (
                  <th key={col} className="p-4 text-left border-b border-white/10 text-[9px] font-black text-white/40 uppercase tracking-widest whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentTableData.map((row) => {
                const primaryKey = TABLE_CONFIG[activeTable].primaryKey;
                const idValue = row[primaryKey];
                const context = getProcedureContext(row);
                const isModified = !!editStates[`${activeTable}-${idValue}`];

                return (
                  <tr key={idValue} className={`group border-b border-gray-50 transition-colors ${isModified ? 'bg-amber-50/30' : 'hover:bg-gray-50/50'}`}>
                    <td className="p-4 border-r border-gray-50">
                      {context ? (
                        <span className="text-[10px] font-black text-gray-900">{context.code}</span>
                      ) : (
                        <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">N/A</span>
                      )}
                    </td>
                    <td className="p-4 border-r border-gray-50">
                      {context ? (
                        <span className="text-[10px] font-black text-gray-700 truncate block max-w-[150px]">{context.client}</span>
                      ) : (
                        <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">N/A</span>
                      )}
                    </td>
                    {columns.map(col => {
                      const isPK = col === primaryKey;
                      const isImmutable = isPK || ['createdAt', 'driveFolderId', 'driveUrl', 'id'].includes(col);
                      const currentEdit = editStates[`${activeTable}-${idValue}`]?.[col];
                      const displayValue = currentEdit !== undefined ? currentEdit : row[col];

                      return (
                        <td key={col} className="p-2 min-w-[150px]">
                          {isImmutable ? (
                             <div className="px-2 py-1.5 text-[10px] font-medium text-gray-400 bg-gray-50/50 rounded-lg truncate select-all">
                               {String(displayValue || '')}
                             </div>
                          ) : (
                            <input 
                              type={typeof displayValue === 'number' ? 'number' : 'text'}
                              value={displayValue === null ? '' : displayValue}
                              onChange={e => handleCellChange(idValue, col, typeof displayValue === 'number' ? Number(e.target.value) : e.target.value)}
                              className={`w-full bg-transparent border-transparent px-2 py-1.5 rounded-lg text-[10px] font-black tracking-tight outline-none focus:ring-2 focus:ring-[#E3000F]/10 focus:bg-white border transition-all ${
                                currentEdit !== undefined ? 'text-[#E3000F]' : 'text-gray-900'
                              }`}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {currentTableData.length === 0 && (
          <div className="p-20 text-center">
            <Box className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium italic">No se encontraron registros en esta tabla</p>
          </div>
        )}
      </div>

      {/* Floating Save Hint */}
      {Object.keys(editStates).length > 0 && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]"
        >
          <div className="bg-[#1A1A1A] text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-6 border border-white/10 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#E3000F] rounded-xl flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">Cambios pendientes</p>
                <p className="text-[9px] font-medium text-gray-400 mt-1">{Object.keys(editStates).length} registro(s) modificados</p>
              </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-[14px] font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
            >
              <Save className="w-4 h-4" />
              Guardar Todo
            </button>
            <button 
              onClick={() => {
                const confirmed = window.confirm('¿Seguro que deseas descartar todos los cambios?');
                if (confirmed) setEditStates({});
              }}
              className="p-2.5 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
