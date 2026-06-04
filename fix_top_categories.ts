import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/FinancialReports.tsx', 'utf8');

const tOld = `    doc.setTextColor(0);
    doc.setFont('', 'normal');
    
    y = chartY + 20;

    y += 15;
    doc.text('DETALLE DE INGRESOS', 14, y);`;

const tNew = `    doc.setTextColor(0);
    doc.setFont('', 'normal');
    
    y = chartY + 20;

    // Top Expense Categories
    const expenseCategories = expenses.reduce((acc: any, t) => {
       const cat = t.category || 'OTROS';
       const amount = t.amount ? Number(t.amount.toString().replace(/[^0-9.-]+/g,"")) : 0;
       acc[cat] = (acc[cat] || 0) + amount;
       return acc;
    }, {});
    const topExpenseCategories = Object.entries(expenseCategories).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);

    if (topExpenseCategories.length > 0) {
        doc.setFontSize(11);
        doc.setFont('', 'bold');
        doc.text('PRINCIPALES CATEGORÍAS DE EGRESOS', 14, y);
        
        autoTable(doc, {
           startY: y + 5,
           head: [['Categoría', 'Monto']],
           body: topExpenseCategories.map(([cat, amt]) => [cat, \`$\${Number(amt).toFixed(2)}\`]),
           theme: 'grid',
           headStyles: { fillColor: [150, 150, 150] },
           margin: { left: 14 },
           tableWidth: 100
        });
        y = (doc as any).lastAutoTable.finalY + 15;
    } else {
        y += 15;
    }

    doc.setFontSize(11);
    doc.setFont('', 'bold');
    doc.text('DETALLE DE INGRESOS', 14, y);`;

content = content.replace(tOld, tNew);

// Also substitute 
const oldStartTable = `    y += 15;
    doc.text('DETALLE DE INGRESOS', 14, y);`;

if (content.includes(oldStartTable)) {
  content = content.replace(oldStartTable, `    doc.setFontSize(11);\n    doc.setFont('', 'bold');\n    doc.text('DETALLE DE INGRESOS', 14, y);`);
}

fs.writeFileSync('src/pages/dashboard/FinancialReports.tsx', content);
