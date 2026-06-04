import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/FinancialReports.tsx', 'utf8');

// replace format(new Date(item.month + '-01'), ... with format(new Date(item.month + '-01T12:00:00Z')
content = content.replace(/new Date\((c\.month|item\.month) \+ '-01'\)/g, "new Date($1 + '-01T12:00:00Z')");

// also adjust the cashflow summary to not use new Date(t.date) for the month
const oldCashflow = `    const date = new Date(t.date);
    if (isNaN(date.getTime())) return acc;
    const monthKey = format(date, 'yyyy-MM');`;
const newCashflow = `    if (!t.date || t.date.length < 7) return acc;
    const monthKey = t.date.substring(0, 7);`;

content = content.replace(oldCashflow, newCashflow);

fs.writeFileSync('src/pages/dashboard/FinancialReports.tsx', content);
