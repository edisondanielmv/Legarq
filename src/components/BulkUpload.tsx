import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertCircle, X, Hourglass, HelpCircle } from 'lucide-react';
import { api } from '../lib/api';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { ProcedureType, User } from '../types';

interface BulkUploadProps {
  onSuccess: () => void;
  procedureTypes: ProcedureType[];
  technicians: User[];
}

export function BulkUpload({ onSuccess, procedureTypes, technicians }: BulkUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{ success: any[], errors: any[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const templateColumns = [
    'Título del Trámite',
    'Descripción',
    'Tipo de Trámite',
    'Nombre del Cliente',
    'Cédula/RUC Cliente',
    'Email Cliente',
    'Teléfono Cliente',
    'Valor Esperado',
    'Username Técnico (opcional)'
  ];

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([templateColumns]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla Tramites");
    XLSX.writeFile(wb, "Plantilla_Carga_Masiva_Tramites.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        // Remove header row and filter empty rows
        const rows = rawData.slice(1).filter(row => row.length > 0 && row[0]);
        
        const validatedData = rows.map(row => ({
          title: row[0],
          description: row[1] || '',
          procedureType: row[2] || '',
          clientName: row[3] || '',
          idNumber: row[4]?.toString() || '',
          clientEmail: row[5] || '',
          clientPhone: row[6]?.toString() || '',
          expectedValue: parseFloat(row[7]) || 0,
          technicianUsername: row[8] || ''
        }));

        setData(validatedData);
      } catch (err) {
        alert("Error al leer el archivo. Asegúrese de que sea un archivo Excel válido.");
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleSubmit = async () => {
    if (data.length === 0) return;
    setIsLoading(true);
    try {
      const res = await api.bulkCreate(data);
      setResults(res);
      if (res.success.length > 0) {
        onSuccess();
      }
    } catch (err: any) {
      alert("Error en la carga masiva: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setData([]);
    setResults(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        id="btn-bulk-upload"
      >
        <Upload size={18} />
        <span>Carga Masiva</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Upload className="text-emerald-600" />
                    Carga Masiva de Trámites
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Suba varios trámites a la vez mediante una plantilla de Excel</p>
                </div>
                <button 
                  onClick={() => { setIsOpen(false); reset(); }}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {!results ? (
                  <div className="space-y-8">
                    {/* Step 1: Download Template */}
                    <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                      <div className="flex items-start gap-4">
                        <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600">
                          <Download size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-emerald-900">Paso 1: Descargue la Plantilla</h3>
                          <p className="text-emerald-700 text-sm mt-1">
                            Utilice nuestro formato oficial para asegurar que los datos se procesen correctamente. 
                            Complete los campos obligatorios como título, nombre de cliente y cédula.
                          </p>
                          <button
                            onClick={downloadTemplate}
                            className="mt-4 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            <Download size={18} />
                            Bajar Plantilla Excel
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Upload File */}
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                      <div className="flex items-start gap-4">
                        <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                          <FileText size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-blue-900">Paso 2: Suba su Archivo</h3>
                          <p className="text-blue-700 text-sm mt-1">
                            Seleccione el archivo Excel con la información de los trámites.
                          </p>
                          
                          <div className="mt-4">
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept=".xlsx, .xls"
                              className="hidden"
                              id="bulk-file-input"
                            />
                            <label
                              htmlFor="bulk-file-input"
                              className="flex items-center justify-center gap-3 border-2 border-dashed border-blue-300 rounded-xl p-8 cursor-pointer hover:bg-blue-100/50 transition-colors"
                            >
                              {file ? (
                                <div className="text-center">
                                  <FileText size={32} className="mx-auto text-blue-600 mb-2" />
                                  <span className="font-medium text-blue-800">{file.name}</span>
                                  <p className="text-xs text-blue-600 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <Upload size={32} className="mx-auto text-blue-400 mb-2" />
                                  <span className="text-blue-700">Seleccionar o arrastrar archivo</span>
                                </div>
                              )}
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Preview Table */}
                    {data.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                          Vista Previa ({data.length} registros encontrados)
                        </h3>
                        <div className="overflow-x-auto border rounded-xl">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                              <tr>
                                <th className="px-4 py-3">Título</th>
                                <th className="px-4 py-3">Cliente</th>
                                <th className="px-4 py-3">Cédula</th>
                                <th className="px-4 py-3">Tipo</th>
                                <th className="px-4 py-3 text-right">Valor</th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.map((item, idx) => (
                                <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                                  <td className="px-4 py-3 truncate max-w-[200px]">{item.title}</td>
                                  <td className="px-4 py-3">{item.clientName}</td>
                                  <td className="px-4 py-3">{item.idNumber}</td>
                                  <td className="px-4 py-3">{item.procedureType}</td>
                                  <td className="px-4 py-3 text-right">${item.expectedValue?.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center p-8 bg-gray-50 rounded-2xl border flex flex-col items-center">
                      {results.errors.length === 0 ? (
                        <>
                          <div className="bg-emerald-100 p-4 rounded-full text-emerald-600 mb-4">
                            <CheckCircle size={48} />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-800">¡Carga Exitosa!</h3>
                          <p className="text-gray-600 mt-2">
                            Se han creado satisfactoriamente <strong>{results.success.length}</strong> trámites.
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="bg-orange-100 p-4 rounded-full text-orange-600 mb-4">
                            <AlertCircle size={48} />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-800">Proceso Finalizado con Alertas</h3>
                          <p className="text-gray-600 mt-2">
                            Procesados: <strong>{results.success.length}</strong> exitosos, <strong>{results.errors.length}</strong> con error.
                          </p>
                        </>
                      )}
                    </div>

                    {results.errors.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-bold text-red-600 flex items-center gap-2">
                          Detalle de Errores
                        </h4>
                        <div className="bg-red-50 border border-red-100 rounded-xl overflow-hidden">
                          {results.errors.map((err, idx) => (
                            <div key={idx} className="p-3 border-b last:border-0 border-red-100 flex items-start gap-3">
                              <AlertCircle size={16} className="text-red-500 mt-1 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-red-900 text-sm">Fila {err.index + 2}: {err.title}</p>
                                <p className="text-red-700 text-xs">{err.error}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 border-t flex justify-end gap-3 bg-gray-50">
                {!results ? (
                  <>
                    <button
                      onClick={() => { setIsOpen(false); reset(); }}
                      className="px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={data.length === 0 || isLoading}
                      className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      {isLoading ? (
                        <Hourglass className="animate-spin" size={18} />
                      ) : (
                        <CheckCircle size={18} />
                      )}
                      {isLoading ? "Procesando..." : "Subir Trámites"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setIsOpen(false); reset(); }}
                    className="bg-gray-800 text-white px-8 py-2 rounded-lg font-bold hover:bg-gray-900 transition-colors shadow-lg"
                  >
                    Cerrar
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Help for Technicians and Types */}
      <HelpTooltip technicians={technicians} procedureTypes={procedureTypes} />
    </>
  );
}

function HelpTooltip({ technicians, procedureTypes }: { technicians: User[], procedureTypes: ProcedureType[] }) {
  const [show, setShow] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="bg-gray-800 text-white p-3 rounded-full shadow-xl hover:bg-black transition-colors"
      >
        <HelpCircle size={24} />
      </button>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-16 right-0 w-80 bg-white border shadow-2xl rounded-2xl overflow-hidden p-6"
          >
            <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Guía de Referencia</h4>
            
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Usernames Técnicos</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {technicians.map(t => (
                    <span key={t.id} className="text-[10px] bg-gray-100 px-2 py-1 rounded font-mono border">
                      {t.username}
                    </span>
                  ))}
                  {technicians.length === 0 && <span className="text-xs text-gray-400 italic">No hay técnicos</span>}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Tipos de Trámite</span>
                <div className="mt-1 space-y-1">
                  {procedureTypes.map(t => (
                    <div key={t.id} className="text-[10px] bg-blue-50 px-2 py-1 rounded border border-blue-100 text-blue-700">
                      {t.name}
                    </div>
                  ))}
                  {procedureTypes.length === 0 && <span className="text-xs text-gray-400 italic">No hay tipos definidos</span>}
                </div>
              </div>
              
              <div className="text-[10px] text-gray-500 bg-amber-50 p-2 rounded border border-amber-100">
                <strong>Nota:</strong> Los nombres en el Excel deben coincidir exactamente con estos valores para evitar errores.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
