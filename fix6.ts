import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/FinancialReports.tsx', 'utf8');

const tDesktopOld = `                      {(data.transactions || [])
                        .filter(t => 
                          String(t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(t.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(data.procedures?.find(p => String(p.id) === String(t.procedureId))?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map(t => (`;
                        
const tDesktopNew = `                      {filteredTransactions
                        .filter(t => 
                          String(t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(t.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(data.procedures?.find(p => String(p.id) === String(t.procedureId))?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .filter(t => {
                          if (accountTypeFilter === 'all') return true;
                          const tType = String(t.type || '').trim().toLowerCase();
                          const isIncome = tType === 'ingreso' || tType === 'abono';
                          const isExpense = tType === 'egreso' || tType === 'gasto';
                          if (accountTypeFilter === 'Ingreso' && isIncome) return true;
                          if (accountTypeFilter === 'Egreso' && isExpense) return true;
                          return false;
                        })
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map(t => (`;

content = content.replace(tDesktopOld, tDesktopNew);

const tMobileOld1 = `                  {((data.transactions || [])
                    .filter(t => 
                      String(t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      String(t.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      String(data.procedures?.find(p => String(p.id) === String(t.procedureId))?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).length === 0) ? (`

const tMobileNew1 = `                  {(filteredTransactions
                    .filter(t => 
                      String(t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      String(t.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      String(data.procedures?.find(p => String(p.id) === String(t.procedureId))?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .filter(t => {
                      if (accountTypeFilter === 'all') return true;
                      const tType = String(t.type || '').trim().toLowerCase();
                      const isIncome = tType === 'ingreso' || tType === 'abono';
                      const isExpense = tType === 'egreso' || tType === 'gasto';
                      if (accountTypeFilter === 'Ingreso' && isIncome) return true;
                      if (accountTypeFilter === 'Egreso' && isExpense) return true;
                      return false;
                    })
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).length === 0) ? (`

content = content.replace(tMobileOld1, tMobileNew1);

const tMobileOld2 = `                      (data.transactions || [])
                        .filter(t => 
                          String(t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(t.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(data.procedures?.find(p => String(p.id) === String(t.procedureId))?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map(t => {`

const tMobileNew2 = `                      filteredTransactions
                        .filter(t => 
                          String(t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(t.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(data.procedures?.find(p => String(p.id) === String(t.procedureId))?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .filter(t => {
                          if (accountTypeFilter === 'all') return true;
                          const tType = String(t.type || '').trim().toLowerCase();
                          const isIncome = tType === 'ingreso' || tType === 'abono';
                          const isExpense = tType === 'egreso' || tType === 'gasto';
                          if (accountTypeFilter === 'Ingreso' && isIncome) return true;
                          if (accountTypeFilter === 'Egreso' && isExpense) return true;
                          return false;
                        })
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map(t => {`

content = content.replace(tMobileOld2, tMobileNew2);

fs.writeFileSync('src/pages/dashboard/FinancialReports.tsx', content);
