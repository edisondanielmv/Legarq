import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/FinancialReports.tsx', 'utf8');

const oldBtnCode = `              <button 
                onClick={() => {
                  let monthOpt = transactionMonth;
                  if (monthOpt === 'all' && cashFlowList.length > 0) {
                     monthOpt = cashFlowList[0].month;
                  }
                  if (monthOpt && monthOpt !== 'all') {
                    generateMonthlyPDF(monthOpt);
                  } else {
                    alert('No hay datos para generar el PDF');
                  }
                }}`;

const newBtnCode = `              <button 
                onClick={() => {
                  if (transactionMonth === 'all') {
                    alert('Por favor, selecciona un mes específico para generar el informe PDF.');
                    return;
                  }
                  if (transactionMonth) {
                    generateMonthlyPDF(transactionMonth);
                  }
                }}`;

content = content.replace(oldBtnCode, newBtnCode);
fs.writeFileSync('src/pages/dashboard/FinancialReports.tsx', content);
