import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/FinancialReports.tsx', 'utf8');

content = content.replace(
  /onClick=\{\(\) => t\.procedureId && navigate\(\`\/dashboard\/procedures\/\$\{t\.procedureId\}\`\)\}/g,
  "onClick={() => t.procedureId && navigate('/dashboard/quick-finance', { state: { procedureId: t.procedureId, editFinancialItemId: t.id } })}"
);

fs.writeFileSync('src/pages/dashboard/FinancialReports.tsx', content);
