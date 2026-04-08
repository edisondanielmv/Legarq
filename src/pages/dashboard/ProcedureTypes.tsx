import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Plus, Loader2, Trash2, Briefcase, Edit2, Save, X, ListChecks } from 'lucide-react';
import { ProcedureType } from '../../types';

export default function ProcedureTypes() {
  const [types, setTypes] = useState<ProcedureType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [editingType, setEditingType] = useState<ProcedureType | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', steps: '' });
  const [newStep, setNewStep] = useState('');

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

  const handleOpenModal = (type?: ProcedureType) => {
    if (type) {
      setEditingType(type);
      setFormData({ name: type.name, steps: type.steps || '[]' });
    } else {
      setEditingType(null);
      setFormData({ name: '', steps: '[]' });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      if (editingType) {
        await api.updateProcedureType({ id: editingType.id, ...formData });
      } else {
        await api.createProcedureType(formData);
      }
      setShowModal(false);
      await fetchTypes();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este tipo de trámite?')) return;
    setLoading(true);
    try {
      await api.deleteProcedureType(id);
      await fetchTypes();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getStepsList = (stepsJson?: string): string[] => {
    try {
      return JSON.parse(stepsJson || '[]');
    } catch (e) {
      return [];
    }
  };

  const addStep = () => {
    if (!newStep.trim()) return;
    const currentSteps = getStepsList(formData.steps);
    const updatedSteps = [...currentSteps, newStep.trim()];
    setFormData({ ...formData, steps: JSON.stringify(updatedSteps) });
    setNewStep('');
  };

  const removeStep = (index: number) => {
    const currentSteps = getStepsList(formData.steps);
    const updatedSteps = currentSteps.filter((_, i) => i !== index);
    setFormData({ ...formData, steps: JSON.stringify(updatedSteps) });
  };

  if (loading && types.length === 0) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#E3000F]" /></div>;

  return (
    <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Tipos de Trámite</h2>
          <p className="text-xs md:text-sm text-gray-500">Gestione los servicios y sus pasos de avance.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-[#E3000F] text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition-all flex items-center gap-2 shadow-lg shadow-red-100 text-sm"
        >
          <Plus className="w-4 h-4" /> Nuevo Tipo
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-100 text-xs">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {types.length === 0 ? (
          <div className="col-span-full p-12 text-center text-gray-400 italic text-sm bg-white rounded-xl border border-dashed border-gray-300">
            No hay tipos de trámite registrados.
          </div>
        ) : (
          types.map((type) => (
            <div key={type.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-[#E3000F]/10 transition-colors">
                    <Briefcase className="w-4 h-4 text-gray-500 group-hover:text-[#E3000F]" />
                  </div>
                  <h3 className="font-bold text-gray-900">{type.name}</h3>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(type)} className="p-1.5 text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(type.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  <ListChecks className="w-3 h-3" /> Pasos configurados
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {getStepsList(type.steps).length === 0 ? (
                    <span className="text-[10px] text-gray-400 italic">Sin pasos definidos</span>
                  ) : (
                    getStepsList(type.steps).slice(0, 3).map((step, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-50 text-gray-600 text-[10px] rounded-md border border-gray-100 truncate max-w-[120px]">
                        {step}
                      </span>
                    ))
                  )}
                  {getStepsList(type.steps).length > 3 && (
                    <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-[10px] rounded-md border border-gray-100">
                      +{getStepsList(type.steps).length - 3} más
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Editor */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 bg-gray-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{editingType ? 'Editar Tipo' : 'Nuevo Tipo'}</h3>
                <p className="text-gray-400 text-sm">Configure el nombre y los pasos del trámite.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nombre del Servicio</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-[#E3000F] outline-none"
                  placeholder="Ej. Propiedad Horizontal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pasos del Proceso ({getStepsList(formData.steps).length})</label>
                <div className="flex gap-2 mb-3">
                  <input 
                    type="text" 
                    value={newStep} 
                    onChange={e => setNewStep(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addStep())}
                    className="flex-1 border border-gray-300 rounded-xl p-2.5 text-sm outline-none focus:border-[#E3000F]"
                    placeholder="Añadir nuevo paso..."
                  />
                  <button 
                    type="button" 
                    onClick={addStep}
                    className="p-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {getStepsList(formData.steps).length === 0 ? (
                    <p className="text-center py-4 text-gray-400 text-sm italic">No hay pasos definidos. Añada el primero arriba.</p>
                  ) : (
                    getStepsList(formData.steps).map((step, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="w-5 h-5 flex items-center justify-center bg-gray-200 text-gray-500 text-[10px] font-bold rounded-full shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-sm text-gray-700 truncate">{step}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeStep(index)}
                          className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="px-8 py-2.5 bg-[#E3000F] text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-100 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
