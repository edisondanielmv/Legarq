import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Plus, Loader2, Trash2, Briefcase } from 'lucide-react';
import { ProcedureType } from '../../types';

export default function ProcedureTypes() {
  const [types, setTypes] = useState<ProcedureType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const data = await api.getProcedureTypes();
      setTypes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await api.createProcedureType(newName);
      setNewName('');
      await fetchTypes();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#E3000F]" /></div>;

  return (
    <div className="space-y-4 md:space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Tipos de Trámite</h2>
          <p className="text-xs md:text-sm text-gray-500">Gestione los servicios ofrecidos.</p>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-100 text-xs">{error}</div>}

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-3 md:p-6 border-b border-gray-200 bg-gray-50">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input 
              required
              type="text" 
              value={newName} 
              onChange={e => setNewName(e.target.value)}
              placeholder="Nuevo tipo (ej. Propiedad Horizontal)"
              className="flex-1 border border-gray-300 rounded-lg p-2 text-xs md:text-sm focus:ring-2 focus:ring-[#E3000F] focus:border-transparent outline-none transition-all"
            />
            <button 
              type="submit" 
              disabled={saving}
              className="bg-[#E3000F] text-white px-4 md:px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-red-100 text-xs md:text-sm"
            >
              {saving ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <Plus className="w-3 h-3 md:w-4 md:h-4" />}
              <span className="hidden xs:inline">Añadir</span>
            </button>
          </form>
        </div>

        <div className="divide-y divide-gray-100">
          {types.length === 0 ? (
            <div className="p-8 md:p-12 text-center text-gray-400 italic text-xs">
              No hay tipos de trámite registrados.
            </div>
          ) : (
            types.map((type) => (
              <div key={type.id} className="p-3 md:p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-gray-100 rounded-lg group-hover:bg-white transition-colors">
                    <Briefcase className="w-3 h-3 md:w-4 md:h-4 text-gray-500" />
                  </div>
                  <span className="font-bold text-gray-900 text-xs md:text-sm">{type.name}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
