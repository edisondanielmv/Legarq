import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/FinancialReports.tsx', 'utf8');

const tOld = `    let y = 30;
    
    const incomeTotal = incomes.reduce((sum, t) => sum + (t.amount ? Number(t.amount.toString().replace(/[^0-9.-]+/g,"")) : 0), 0);
    const expenseTotal = expenses.reduce((sum, t) => sum + (t.amount ? Number(t.amount.toString().replace(/[^0-9.-]+/g,"")) : 0), 0);
    const netTotal = incomeTotal - expenseTotal;
    
    doc.setFontSize(10);
    doc.text(\`INGRESOS TOTALES: $\${incomeTotal.toFixed(2)}\`, 14, y);
    y += 7;
    doc.text(\`EGRESOS TOTALES: $\${expenseTotal.toFixed(2)}\`, 14, y);
    y += 7;
    doc.text(\`FLUJO NETO: $\${netTotal.toFixed(2)}\`, 14, y);
    
    y += 15;`;

const tNew = `    const incomeTotal = incomes.reduce((sum, t) => sum + (t.amount ? Number(t.amount.toString().replace(/[^0-9.-]+/g,"")) : 0), 0);
    const expenseTotal = expenses.reduce((sum, t) => sum + (t.amount ? Number(t.amount.toString().replace(/[^0-9.-]+/g,"")) : 0), 0);
    const netTotal = incomeTotal - expenseTotal;

    let y = 30;

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

content = content.replace(tOld, tNew);
fs.writeFileSync('src/pages/dashboard/FinancialReports.tsx', content);
