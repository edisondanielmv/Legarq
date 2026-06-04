import fs from 'fs';

function replaceInFile(file: string, replacements: [RegExp, string][]) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    for (const [regex, replacement] of replacements) {
      content = content.replace(regex, replacement);
    }
    fs.writeFileSync(file, content);
  } catch(e) {}
}

const fixes: [RegExp, string][] = [
  [/StringString\(/g, "String("],
  [/StringStringString\(/g, "String("],
];

replaceInFile('src/pages/dashboard/FinancialReports.tsx', fixes);
replaceInFile('src/pages/dashboard/Reports.tsx', fixes);
replaceInFile('src/pages/dashboard/Users.tsx', fixes);
replaceInFile('src/pages/dashboard/QuickFinance.tsx', fixes);

console.log("Fixed StringString");
