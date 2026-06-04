import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/FinancialReports.tsx', 'utf8');

const tOld = `    let y = 30;

    doc.setFontSize(10);
    const d = new Date(monthStr + '-01T12:00:00Z');
    const monthNameEs = format(d, 'MMMM', { locale: es });
    const yearNameEs = format(d, 'yyyy');
    
    const p1 = \`Durante el mes de \${monthNameEs} de \${yearNameEs}, el desempeño financiero de las operaciones muestra que se generaron ingresos por un total de $\${incomeTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}. Estos ingresos corresponden a los pagos y abonos registrados por los usuarios durante el periodo.\`;
    const p2 = \`En paralelo, la estructura de egresos ascendió a $\${expenseTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}, destinados a cubrir los gastos propios del área y devoluciones si corresponde.\`;
    const p3 = \`El balance neto para el ciclo se establece en $\${netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}, indicando un \${netTotal >= 0 ? 'balance positivo' : 'saldo negativo'} al cierre del mes de \${monthNameEs}.\`;

    const docWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const maxLineWidth = docWidth - margin * 2;

    const lines1 = doc.splitTextToSize(p1, maxLineWidth);
    doc.text(lines1, margin, y);
    y += (lines1.length * 5) + 5;

    const lines2 = doc.splitTextToSize(p2, maxLineWidth);
    doc.text(lines2, margin, y);
    y += (lines2.length * 5) + 5;

    const lines3 = doc.splitTextToSize(p3, maxLineWidth);
    doc.text(lines3, margin, y);
    y += (lines3.length * 5) + 15;

    doc.setFontSize(10);
    doc.setFont('', 'bold');
    doc.text(\`INGRESOS TOTALES: $\${incomeTotal.toFixed(2)}\`, 14, y);
    y += 7;
    doc.text(\`EGRESOS TOTALES: $\${expenseTotal.toFixed(2)}\`, 14, y);
    y += 7;
    doc.text(\`FLUJO NETO: $\${netTotal.toFixed(2)}\`, 14, y);
    doc.setFont('', 'normal');
    
    y += 15;`;

const tNew = `    let y = 30;

    doc.setFontSize(10);
    const d = new Date(monthStr + '-01T12:00:00Z');
    const monthNameEs = format(d, 'MMMM', { locale: es });
    const yearNameEs = format(d, 'yyyy');
    
    const p1 = \`Durante el mes de \${monthNameEs} de \${yearNameEs}, el desempeño financiero de las operaciones muestra que se generaron ingresos por un total de $\${incomeTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}. Estos ingresos corresponden a los pagos y abonos registrados por los usuarios durante el periodo.\`;
    const p2 = \`En paralelo, la estructura de egresos ascendió a $\${expenseTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}, destinados a cubrir los gastos propios del área y devoluciones si corresponde.\`;
    const p3 = \`El balance neto para el ciclo se establece en $\${netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}, indicando un \${netTotal >= 0 ? 'balance positivo' : 'saldo negativo'} al cierre del mes de \${monthNameEs}.\`;

    const docWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const maxLineWidth = docWidth - margin * 2;

    const lines1 = doc.splitTextToSize(p1, maxLineWidth);
    doc.text(lines1, margin, y);
    y += (lines1.length * 5) + 5;

    const lines2 = doc.splitTextToSize(p2, maxLineWidth);
    doc.text(lines2, margin, y);
    y += (lines2.length * 5) + 5;

    const lines3 = doc.splitTextToSize(p3, maxLineWidth);
    doc.text(lines3, margin, y);
    y += (lines3.length * 5) + 15;

    doc.setFontSize(11);
    doc.setFont('', 'bold');
    doc.text(\`INGRESOS TOTALES: $\${incomeTotal.toFixed(2)}\`, 14, y);
    y += 7;
    doc.text(\`EGRESOS TOTALES: $\${expenseTotal.toFixed(2)}\`, 14, y);
    y += 7;
    doc.text(\`FLUJO NETO: $\${netTotal.toFixed(2)}\`, 14, y);
    doc.setFont('', 'normal');
    y += 15;

    // --- GRÁFICO DE LÍNEAS DIARIO ---
    doc.setFontSize(11);
    doc.setFont('', 'bold');
    doc.text('TENDENCIA DIARIA DE FLUJO DE EFECTIVO', margin, y);
    y += 10;
    
    // Preparar datos diarios
    const diasDelMes = new Date(parseInt(monthStr.substring(0,4)), parseInt(monthStr.substring(5,7)), 0).getDate();
    const dailyData = Array.from({length: diasDelMes}, (_, i) => {
       const dStr = \`\${monthStr}-\${(i+1).toString().padStart(2, '0')}\`;
       const inc = incomes.filter(t => t.date && t.date.startsWith(dStr)).reduce((s,t) => s + (t.amount ? Number(t.amount.toString().replace(/[^0-9.-]+/g,"")) : 0), 0);
       const exp = expenses.filter(t => t.date && t.date.startsWith(dStr)).reduce((s,t) => s + (t.amount ? Number(t.amount.toString().replace(/[^0-9.-]+/g,"")) : 0), 0);
       return { day: i+1, inc, exp, net: inc - exp };
    });

    const maxVal = Math.max(...dailyData.map(d => Math.max(d.inc, d.exp, Math.abs(d.net))), 100);
    const minVal = Math.min(...dailyData.map(d => Math.min(d.net, 0))); // for negative net flow
    const totalRange = maxVal - minVal;
    
    const chartHeight = 40;
    const chartWidth = maxLineWidth - 10;
    const chartY = y + chartHeight; // Bottom of chart
    const startX = margin + 10;
    
    // Draw axes
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(startX, chartY, startX + chartWidth, chartY); // x axis
    doc.line(startX, chartY - chartHeight, startX, chartY); // y axis
    
    // Zero line if minVal < 0
    const zeroY = chartY - ((0 - minVal) / totalRange) * chartHeight;
    if (minVal < 0) {
       doc.setDrawColor(220, 220, 220);
       doc.line(startX, zeroY, startX + chartWidth, zeroY);
    }
    
    const stepX = chartWidth / (diasDelMes - 1);
    
    // Labels Y
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(\`$\${maxVal.toFixed(0)}\`, margin, chartY - chartHeight + 3);
    doc.text(\`$\${minVal.toFixed(0)}\`, margin, chartY);

    // Draw lines Function
    const drawLine = (key: 'inc' | 'exp' | 'net', r:number, g:number, b:number) => {
       doc.setDrawColor(r,g,b);
       doc.setLineWidth(1.0);
       let px = startX;
       let py = chartY - ((dailyData[0][key] - minVal) / totalRange) * chartHeight;
       for(let i=1; i<diasDelMes; i++) {
          let cx = startX + i * stepX;
          let cy = chartY - ((dailyData[i][key] - minVal) / totalRange) * chartHeight;
          doc.line(px, py, cx, cy);
          // Opcional: dibujar un círculo en cada punto
          // doc.setFillColor(r,g,b);
          // doc.circle(cx, cy, 0.5, 'F');
          px = cx; py = cy;
       }
    };
    
    drawLine('inc', 34, 197, 94); // green
    drawLine('exp', 239, 68, 68); // red
    // drawLine('net', 59, 130, 246); // blue

    // Legend
    doc.setFillColor(34, 197, 94); doc.rect(startX, chartY + 5, 3, 3, 'F'); doc.setTextColor(100); doc.text('Ingresos', startX + 5, chartY + 8);
    doc.setFillColor(239, 68, 68); doc.rect(startX + 25, chartY + 5, 3, 3, 'F'); doc.text('Egresos', startX + 30, chartY + 8);
    // doc.setFillColor(59, 130, 246); doc.rect(startX + 50, chartY + 5, 3, 3, 'F'); doc.text('Flujo Neto', startX + 55, chartY + 8);

    doc.setTextColor(0);
    doc.setFont('', 'normal');
    
    y = chartY + 20;`;

content = content.replace(tOld, tNew);

fs.writeFileSync('src/pages/dashboard/FinancialReports.tsx', content);
