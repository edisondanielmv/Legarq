import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/FinancialReports.tsx', 'utf8');

const procPdfFunc = `  const generateProcedurePDF = (item: any) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16);
    doc.setFont('', 'bold');
    doc.text('ESTADO DE CUENTA DE TRÁMITE', 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('', 'normal');
    doc.text(\`Fecha de Emisión: \${format(new Date(), 'dd/MM/yyyy HH:mm')}\`, 14, 28);
    
    // Client and Procedure details
    doc.setFontSize(11);
    doc.setFont('', 'bold');
    doc.text('DETALLE DEL TRÁMITE', 14, 40);
    
    doc.setFontSize(10);
    doc.setFont('', 'normal');
    doc.text(\`Código: \${item.code || 'N/A'}\`, 14, 48);
    doc.text(\`Cliente: \${item.clientName || item.clientUsername || 'N/A'}\`, 14, 54);
    
    const linesTitle = doc.splitTextToSize(\`Descripción: \${item.title || 'N/A'}\`, 90);
    doc.text(linesTitle, 14, 60);

    // Financial Summary
    doc.setFontSize(11);
    doc.setFont('', 'bold');
    doc.text('RESUMEN FINANCIERO', 110, 40);
    
    doc.setFontSize(10);
    doc.setFont('', 'normal');
    doc.text(\`Monto Acordado: $\${(item.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}\`, 110, 48);
    doc.text(\`Total Ingresos: $\${(item.totalIncome || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}\`, 110, 54);
    doc.text(\`Total Egresos: $\${(item.totalExpense || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}\`, 110, 60);
    doc.setFont('', 'bold');
    doc.text(\`Saldo por Cobrar: $\${(item.pending || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}\`, 110, 68);
    doc.setFont('', 'normal');
    
    let y = 80;
    
    // Chart / Timeline (if transactions exist)
    const tx = item.transactions || [];
    if (tx.length > 0) {
       doc.setFontSize(10);
       doc.setFont('', 'bold');
       doc.text('TENDENCIA DE PAGOS O EGRESOS', 14, y);
       y += 10;
       
       const sortedTx = [...tx].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
       let balance = item.totalValue || 0;
       const balanceData = [{ date: 'Inicio', balance, desc: 'Acordado' }];
       
       sortedTx.forEach(t => {
          const amt = t.amount ? Number(t.amount.toString().replace(/[^0-9.-]+/g,"")) : 0;
          if (t.type === 'Ingreso' || t.type === 'Abono') {
             balance -= amt;
          }
          balanceData.push({ date: t.date?.split('T')[0] || '', balance, desc: t.type === 'Egreso' ? 'Egreso' : 'Pago' });
       });
       
       const chartHeight = 30;
       const chartWidth = 180;
       const startX = 14;
       const chartY = y + chartHeight;
       
       const maxB = Math.max(...balanceData.map(d => d.balance), 100);
       const minB = Math.min(...balanceData.map(d => d.balance), 0);
       const rangeB = maxB - minB || 1;
       
       doc.setDrawColor(200);
       doc.setLineWidth(0.5);
       doc.line(startX, chartY, startX + chartWidth, chartY); // x
       doc.line(startX, chartY - chartHeight, startX, chartY); // y
       
       doc.setFontSize(7);
       doc.setTextColor(150);
       doc.text(\`$\${maxB.toFixed(0)}\`, startX - 2, chartY - chartHeight + 2, { align: 'right' });
       doc.text(\`$\${minB.toFixed(0)}\`, startX - 2, chartY, { align: 'right' });
       
       const stepX = chartWidth / Math.max(1, balanceData.length - 1);
       doc.setDrawColor(59, 130, 246);
       doc.setLineWidth(1.0);
       let px = startX;
       let py = chartY - ((balanceData[0].balance - minB) / rangeB) * chartHeight;
       for(let i=1; i<balanceData.length; i++) {
          let cx = startX + i * stepX;
          let cy = chartY - ((balanceData[i].balance - minB) / rangeB) * chartHeight;
          doc.line(px, py, cx, cy);
          doc.setFillColor(59, 130, 246);
          doc.circle(cx, cy, 0.8, 'F');
          px = cx; py = cy;
       }
       doc.setTextColor(0);
       
       y = chartY + 15;
    }
    
    // Transactions Table
    doc.setFontSize(10);
    doc.setFont('', 'bold');
    doc.text('MOVIMIENTOS DEL TRÁMITE', 14, y);
    
    const tableData = tx.map((t: any) => [
       t.date ? t.date.split('T')[0] : '',
       t.description || '',
       t.type || '',
       t.category || '',
       (t.type === 'Egreso' ? '-' : '') + \`$\${(t.amount ? Number(t.amount.toString().replace(/[^0-9.-]+/g,"")) : 0).toFixed(2)}\`
    ]);
    
    autoTable(doc, {
       startY: y + 5,
       head: [['Fecha', 'Descripción', 'Tipo', 'Categoría', 'Monto']],
       body: tableData,
       theme: 'grid',
       headStyles: { fillColor: [60, 60, 60] },
       margin: { left: 14 }
    });
    
    doc.save(\`estado-cuenta-\${item.code || item.id}.pdf\`);
  };

  const generateMonthlyPDF = (monthStr: string) => {`;

content = content.replace("  const generateMonthlyPDF = (monthStr: string) => {", procPdfFunc);

const oldDesktopTitle = `<h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Registro de Transacciones</h4>`;
const newDesktopTitle = `<div className="flex justify-between items-center mb-2">
                                  <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Registro de Transacciones</h4>
                                  <button onClick={(e) => { e.stopPropagation(); generateProcedurePDF(item); }} className="inline-flex items-center gap-1.5 text-[9px] font-bold text-gray-600 hover:text-black uppercase tracking-widest bg-white border border-gray-200 px-2.5 py-1 rounded-md shadow-sm transition-colors cursor-pointer">
                                    <FileDown className="w-3 h-3" />
                                    Descargar PDF
                                  </button>
                                </div>`;

content = content.replace(oldDesktopTitle, newDesktopTitle);

const oldDesktopNoTx = `No hay movimientos registrados.
                            </td>`;
const newDesktopNoTx = `<div className="flex items-center justify-center gap-4">
                                <span>No hay movimientos registrados.</span>
                                <button onClick={(e) => { e.stopPropagation(); generateProcedurePDF(item); }} className="inline-flex items-center gap-1 text-[9px] font-bold text-gray-600 hover:text-black uppercase tracking-widest bg-white border border-gray-200 px-2 py-1 rounded-md shadow-sm transition-colors cursor-pointer">
                                  <FileDown className="w-2.5 h-2.5" />
                                  Descargar Reporte PDF
                                </button>
                              </div>
                            </td>`;

content = content.replace(oldDesktopNoTx, newDesktopNoTx);

const oldMobileTitle = `<h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 mt-2">Registro de Transacciones</h4>`;
const newMobileTitle = `<div className="flex justify-between items-center mb-2 mt-2">
                          <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Registro de Transacciones</h4>
                          <button onClick={(e) => { e.stopPropagation(); generateProcedurePDF(item); }} className="inline-flex items-center gap-1.5 text-[9px] font-bold text-gray-600 hover:text-black uppercase tracking-widest bg-white border border-gray-200 px-2.5 py-1 rounded-md shadow-sm transition-colors cursor-pointer">
                            <FileDown className="w-3 h-3" />
                            PDF
                          </button>
                        </div>`;

content = content.replace(oldMobileTitle, newMobileTitle);


const oldMobileNoTx = `No hay transacciones registradas.
                          </div>`;
const newMobileNoTx = `No hay transacciones registradas.
                            <div className="mt-2 text-center">
                              <button onClick={(e) => { e.stopPropagation(); generateProcedurePDF(item); }} className="inline-flex items-center gap-1.5 text-[9px] font-bold text-gray-600 hover:text-black uppercase tracking-widest bg-white border border-gray-200 px-2.5 py-1 rounded-md shadow-sm transition-colors cursor-pointer">
                                <FileDown className="w-3 h-3" />
                                Descargar Reporte PDF
                              </button>
                            </div>
                          </div>`;
content = content.replace(oldMobileNoTx, newMobileNoTx);


fs.writeFileSync('src/pages/dashboard/FinancialReports.tsx', content);
