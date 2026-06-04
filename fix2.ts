import fs from 'fs';

function replaceInFile(file: string, replacements: [RegExp, string][]) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    for (const [regex, replacement] of replacements) {
      content = content.replace(regex, replacement);
    }
    fs.writeFileSync(file, content);
  } catch (e) {}
}

const safeLower = (prop: string) => `String(${prop}).toLowerCase()`;

const replacements: [RegExp, string][] = [
  [/\(item\.title \|\| ''\)\.toLowerCase\(\)/g, "String(item.title || '').toLowerCase()"],
  [/\(item\.clientUsername \|\| ''\)\.toLowerCase\(\)/g, "String(item.clientUsername || '').toLowerCase()"],
  [/\(item\.clientName \|\| ''\)\.toLowerCase\(\)/g, "String(item.clientName || '').toLowerCase()"],
  [/\(item\.procedureType \|\| ''\)\.toLowerCase\(\)/g, "String(item.procedureType || '').toLowerCase()"],
  [/\(t\.description \|\| ''\)\.toLowerCase\(\)/g, "String(t.description || '').toLowerCase()"],
  [/\(t\.category \|\| ''\)\.toLowerCase\(\)/g, "String(t.category || '').toLowerCase()"],
  
  [/\(\(procedure\?\.title \|\| ''\)\)\.toLowerCase\(\)/g, "String(procedure?.title || '').toLowerCase()"],
  [/\(\(procedure\?\.clientName \|\| procedure\?\.clientUsername \|\| ''\)\)\.toLowerCase\(\)/g, "String(procedure?.clientName || procedure?.clientUsername || '').toLowerCase()"],
  [/\(procedure\?\.title \|\| ''\)\.toLowerCase\(\)/g, "String(procedure?.title || '').toLowerCase()"],
  [/\(procedure\?\.clientName \|\| procedure\?\.clientUsername \|\| ''\)\.toLowerCase\(\)/g, "String(procedure?.clientName || procedure?.clientUsername || '').toLowerCase()"],
  
  [/\(proc\.clientName \|\| proc\.clientUsername \|\| ''\)\.toLowerCase\(\)/g, "String(proc.clientName || proc.clientUsername || '').toLowerCase()"],
  [/\(proc\.code \|\| ''\)\.toLowerCase\(\)/g, "String(proc.code || '').toLowerCase()"],
  [/proc\.title\.toLowerCase\(\)/g, "String(proc.title || '').toLowerCase()"],
  
  [/\(p\.clientName \|\| p\.clientUsername \|\| ''\)\.toLowerCase\(\)/g, "String(p.clientName || p.clientUsername || '').toLowerCase()"],
  [/\(p\.code \|\| ''\)\.toLowerCase\(\)/g, "String(p.code || '').toLowerCase()"],
  [/p\.title\.toLowerCase\(\)/g, "String(p.title || '').toLowerCase()"],
  
  [/log\.note\.toLowerCase\(\)/g, "String(log.note || '').toLowerCase()"],
  
  [/\(u\.name \|\| ''\)\.toLowerCase\(\)/g, "String(u.name || '').toLowerCase()"],
  [/\(u\.username \|\| ''\)\.toLowerCase\(\)/g, "String(u.username || '').toLowerCase()"]
];

replaceInFile('src/pages/dashboard/FinancialReports.tsx', replacements);
replaceInFile('src/pages/dashboard/Reports.tsx', replacements);
replaceInFile('src/pages/dashboard/Users.tsx', replacements);
replaceInFile('src/pages/dashboard/QuickFinance.tsx', replacements);

console.log("Done fixed");
