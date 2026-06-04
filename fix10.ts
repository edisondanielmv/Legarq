import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/ProcedureDetails.tsx', 'utf8');

// Remove the button
content = content.replace(
  /<TabButton label="Presupuesto" icon=\{DollarSign\} active=\{activeTab === 'finanzas'\} onClick=\{\(\) => setActiveTab\('finanzas'\)\} count=\{draft\.financials\.length\} \/>/g,
  ""
);

// Remove the view
const startStr = "{activeTab === 'finanzas' && (";
const endStr = "              </motion.div>\n            )}";
const startIndex = content.indexOf(startStr);
if (startIndex !== -1) {
  const endIndex = content.indexOf(endStr, startIndex) + endStr.length;
  content = content.substring(0, startIndex) + content.substring(endIndex);
}

fs.writeFileSync('src/pages/dashboard/ProcedureDetails.tsx', content);
