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

  if (loading && types.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#E3000F]" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Cargando servicios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto relative font-sans selection:bg-[#E3000F] selection:text-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Tipos de Trámite</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Gestión de servicios y hojas de ruta</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-[#1A1A1A] text-white px-6 py-3 rounded-2xl flex items-center gap-3 hover:bg-[#E3000F] transition-all shadow-xl shadow-gray-200 active:scale-95 text-[10px] font-black uppercase tracking-widest"
        >
          <Plus className="w-4 h-4" /> Nuevo Tipo
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 flex items-center gap-3">
          <ListChecks className="w-5 h-5 shrink-0" />
          <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {types.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-gray-100">
            <div className="bg-gray-50 w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-6">
              <Briefcase className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Sin registros</h3>
            <p className="text-gray-400 max-w-xs mx-auto text-[10px] font-black uppercase tracking-widest leading-relaxed">No hay tipos de trámite registrados aún.</p>
          </div>
        ) : (
          types.map((type) => (
            <div key={type.id} className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all group">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 group-hover:scale-110 transition-transform">
                    <Briefcase className="w-6 h-6 text-gray-400 group-hover:text-[#E3000F] transition-colors" />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 tracking-tight leading-tight">{type.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenModal(type)} className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-90" title="Editar"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(type.id)} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                  <ListChecks className="w-3.5 h-3.5 text-[#E3000F]" /> Pasos del Proceso
                </div>
                <div className="flex flex-wrap gap-2">
                  {getStepsList(type.steps).length === 0 ? (
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Sin pasos definidos</span>
                  ) : (
                    getStepsList(type.steps).slice(0, 4).map((step, i) => (
                      <span key={i} className="px-3 py-1.5 bg-gray-50 text-gray-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-gray-100 truncate max-w-[140px]">
                        {step}
                      </span>
                    ))
                  )}
                  {getStepsList(type.steps).length > 4 && (
                    <span className="px-3 py-1.5 bg-[#1A1A1A] text-white text-[9px] font-black uppercase tracking-widest rounded-lg">
                      +{getStepsList(type.steps).length - 4} más
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-[#1A1A1A] text-white relative shrink-0">
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <h3 className="text-lg font-black tracking-tight">{editingType ? 'Editar Tipo' : 'Nuevo Tipo'}</h3>
                </div>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </div>
            </div>
            
            <form onSubmit={handleSave} className="p-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nombre del Servicio</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full bg-gray-50 border-transparent rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:bg-white border text-sm font-bold transition-all"
                  placeholder="Ej. Propiedad Horizontal"
                />
              </div>

              <div className="flex flex-col flex-1 min-h-0">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pasos del Proceso ({getStepsList(formData.steps).length})</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    type="text" 
                    value={newStep} 
                    onChange={e => setNewStep(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addStep())}
                    className="flex-1 bg-gray-50 border-transparent rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:bg-white border text-sm font-bold transition-all"
                    placeholder="Añadir nuevo paso..."
                  />
                  <button 
                    type="button" 
                    onClick={addStep}
                    className="w-10 h-10 bg-[#1A1A1A] text-white rounded-xl flex items-center justify-center hover:bg-[#E3000F] transition-all shadow-md active:scale-95 shrink-0"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto space-y-2 pr-1 custom-scrollbar flex-1 min-h-[150px] max-h-[300px] border border-gray-100 rounded-xl p-2">
                  {getStepsList(formData.steps).length === 0 ? (
                    <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 h-full flex items-center justify-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No hay pasos definidos</p>
                    </div>
                  ) : (
                    getStepsList(formData.steps).map((step, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100 group/step hover:bg-white hover:shadow-sm transition-all">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="w-5 h-5 flex items-center justify-center bg-white text-gray-900 text-[9px] font-black rounded border border-gray-100 shrink-0 shadow-sm">
                            {index + 1}
                          </span>
                          <span className="text-xs font-bold text-gray-700 uppercase tracking-tight truncate">{step}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeStep(index)}
                          className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all active:scale-90"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 shrink-0">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="px-6 py-2 bg-[#1A1A1A] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#E3000F] shadow-md shadow-gray-200 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
