import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/FinancialReports.tsx', 'utf8');

content = content.replace(/\$\{totalIncome\.toLocaleString\(\)\}/g, '${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}');
content = content.replace(/\$\{totalExpense\.toLocaleString\(\)\}/g, '${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}');
content = content.replace(/\$\{totalBalance\.toLocaleString\(\)\}/g, '${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}');

fs.writeFileSync('src/pages/dashboard/FinancialReports.tsx', content);
