import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/FinancialReports.tsx', 'utf8');

const target = `                                <span className="text-[10px] text-gray-500 truncate max-w-[200px]">{item.clientName || item.clientUsername || 'Sin cliente'}</span>
                              </div>
                            </td>`;

const replacement = `                                <span className="text-[10px] text-gray-500 truncate max-w-[200px]">{item.clientName || item.clientUsername || 'Sin cliente'}</span>
                              </div>
                            </div>
                            </td>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/pages/dashboard/FinancialReports.tsx', content);
  console.log("Fixed div closing tag");
} else {
  console.log("Target not found!");
}
