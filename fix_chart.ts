import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/FinancialReports.tsx', 'utf8');

const oldHtml = `                    <div className="xl:w-2/3 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col">
                      <div className="p-4 bg-gray-100 border-b border-gray-200">
                         <h4 className="text-xs font-black text-gray-900 tracking-widest">TENDENCIA \${transactionMonth === 'all' ? 'HISTÓRICA' : 'DEL MES'}</h4>
                      </div>
                      <div className="p-4 flex-1 min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          {transactionMonth === 'all' ? (
                            <BarChart data={chartDt} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280' }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280' }} tickFormatter={(value) => \`$\${value}\`} />
                              <RechartsTooltip 
                                cursor={{ fill: 'transparent' }} 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                                formatter={(val: number) => [\`$\${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}\`]}
                              />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                              <Bar dataKey="Ingresos" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={30} />
                              <Bar dataKey="Egresos" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={30} />
                            </BarChart>
                          ) : (
                            <LineChart data={chartDt} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280' }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280' }} tickFormatter={(value) => \`$\${value}\`} />
                              <RechartsTooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                                formatter={(val: number) => [\`$\${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}\`]}
                              />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                              <Line type="monotone" dataKey="Ingresos" stroke="#22C55E" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                              <Line type="monotone" dataKey="Egresos" stroke="#EF4444" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                            </LineChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </div>`;

const newHtml = `                    <div className="xl:w-2/3 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col">
                      <div className="p-4 bg-gray-100 border-b border-gray-200">
                         <h4 className="text-xs font-black text-gray-900 tracking-widest">TENDENCIA \${transactionMonth === 'all' ? 'HISTÓRICA' : 'DEL MES'}</h4>
                      </div>
                      <div className="p-4 flex-1 min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          {transactionMonth === 'all' ? (
                            <BarChart data={chartDt} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280' }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280' }} tickFormatter={(value) => \`$\${value}\`} />
                              <RechartsTooltip 
                                cursor={{ fill: 'transparent' }} 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                                formatter={(val: number) => [\`$\${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}\`]}
                              />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                              <Bar dataKey="Ingresos" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={30} />
                              <Bar dataKey="Egresos" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={30} />
                            </BarChart>
                          ) : (
                            <AreaChart data={chartDt} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280' }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280' }} tickFormatter={(value) => \`$\${value}\`} />
                              <RechartsTooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                                formatter={(val: number) => [\`$\${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}\`]}
                              />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                              <Area type="monotone" dataKey="Ingresos" stroke="#22C55E" fillOpacity={1} fill="url(#colorInc)" />
                              <Area type="monotone" dataKey="Egresos" stroke="#EF4444" fillOpacity={1} fill="url(#colorExp)" />
                              <Area type="monotone" dataKey="FlujoNeto" stroke="#3B82F6" fillOpacity={1} fill="url(#colorNet)" />
                            </AreaChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </div>`;

const oldData = `return { name: (i+1).toString(), Ingresos: mInc, Egresos: mExp };`;
const newData = `return { name: (i+1).toString(), Ingresos: mInc, Egresos: mExp, FlujoNeto: mInc - mExp };`;

content = content.replace(oldHtml, newHtml);
content = content.replace(oldData, newData);

fs.writeFileSync('src/pages/dashboard/FinancialReports.tsx', content);
