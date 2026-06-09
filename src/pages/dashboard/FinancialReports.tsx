import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { DollarSign, Hourglass, TrendingUp, TrendingDown, Wallet, Search, Filter, ArrowUpRight, ArrowDownRight, Briefcase, User as UserIcon, Mail, Plus, Edit2, Trash2, X, Check, AlertCircle, Upload, FileCheck, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { FileDown } from 'lucide-react';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import { Procedure, FinancialItem, Account, User } from '../../types';
import LoadingOverlay from '../../components/LoadingOverlay';

export default function FinancialReports() {
  const navigate = useNavigate();
  const [data, setData] = useState<{ procedures: Procedure[], transactions: FinancialItem[] }>({ procedures: [], transactions: [] });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProcs, setExpandedProcs] = useState<{ [key: string]: boolean }>({});

  const toggleExpand = (id: string) => {
    setExpandedProcs(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const [filterType, setFilterType] = useState('all');
  const [reportView, setReportView] = useState<'procedures' | 'categories' | 'cashflow' | 'transactions' | 'summary' | 'receivables'>('procedures');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');
  const [accountTypeFilter, setAccountTypeFilter] = useState('all');
  const [transactionSort, setTransactionSort] = useState('date-desc');
  const [transactionMonth, setTransactionMonth] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Modal states
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FinancialItem | null>(null);
  const [newAccountName, setNewAccountName] = useState('');
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isScriptOutdated, setIsScriptOutdated] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [summary, allProcedures, accs, usersData] = await Promise.all([
        api.getFinancialSummary(),
        api.getProcedures({ username: '', role: 'admin' }).catch(() => []),
        api.getAccounts().catch(() => []),
        api.getUsers('admin').catch(() => [])
      ]);
      
      if (summary && (summary as any).isScriptOutdated) {
        setIsScriptOutdated(true);
      }
      
      // Merge data
      const legarqProc = {
        id: 'LEGARQ_INTERNAL',
        title: 'Administración y Operación Interna',
        clientName: 'Empresa LEGARQ',
        clientUsername: 'legarq_interno',
        code: 'LEGARQ-01',
        expectedValue: 0
      } as any;
      
      const combinedProcedures = allProcedures.length > 0 ? allProcedures : (summary?.procedures || []);

      setData({
        transactions: summary?.transactions || [],
        procedures: [legarqProc, ...combinedProcedures]
      });
      
      setAccounts(accs || []);
      setStaff(Array.isArray(usersData) ? usersData.filter((u: any) => u.role === 'admin' || u.role === 'tech') : []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos financieros');
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions by date
  const filteredTransactions = (data.transactions || []).filter(t => {
    if (t.isDeleted) return false;
    if (!t.date) return true;
    
    // Clean and parse date
    const tDate = new Date(t.date);
    if (isNaN(tDate.getTime())) return true; // Include if date is invalid but exists
    
    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime()) && tDate < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate + 'T23:59:59');
      if (!isNaN(end.getTime()) && tDate > end) return false;
    }
    return true;
  });

  // Helper to parse currency safely
  const parseAmount = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    let str = String(val).trim();
    if (str.includes(',') && str.includes('.')) {
      if (str.indexOf(',') > str.indexOf('.')) {
        str = str.replace(/\./g, '').replace(',', '.');
      } else {
        str = str.replace(/,/g, '');
      }
    } else if (str.includes(',')) {
      str = str.replace(',', '.');
    }
    const cleaned = str.replace(/[^-0.9.]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Process data for Procedure Summary
  const procedureSummary = (data.procedures || []).map(proc => {
    // Flexible ID matching (string/number)
    const procTransactions = filteredTransactions.filter(t => String(t.procedureId).trim() === String(proc.id).trim());
    
    const income = procTransactions.filter(t => {
      const type = String(t.type || '').trim().toLowerCase();
      const cat = (t.category || '').trim().toLowerCase();
      return type === 'ingreso' || type === 'abono' || cat === 'abono cliente';
    }).reduce((sum, t) => sum + parseAmount(t.amount), 0);
    
    const expense = procTransactions.filter(t => {
      const type = String(t.type || '').trim().toLowerCase();
      return type === 'egreso' || type === 'gasto';
    }).reduce((sum, t) => sum + parseAmount(t.amount), 0);
    
    const receivable = procTransactions.filter(t => {
      const type = String(t.type || '').trim().toLowerCase();
      const cat = (t.category || '').trim().toLowerCase();
      return type === 'cuenta por cobrar' || type === 'por cobrar' || type === 'valor acordado' || cat === 'monto acordado';
    }).reduce((sum, t) => sum + parseAmount(t.amount), 0);
    
    // Prioritize total receivable transactions if any exist, otherwise fallback to the procedure's expected value
    const rawVal = proc.expectedValue;
    const procExpectedValue = parseAmount(rawVal);
    const expected = receivable > 0 ? receivable : (procExpectedValue || 0);
    
    return {
      ...proc,
      totalIncome: income,
      totalExpense: expense,
      totalValue: expected,
      pending: Math.max(0, expected - income),
      projectedProfit: expected - expense,
      balance: income - expense,
      transactions: procTransactions
    };
  });

  const filteredProcedures = procedureSummary.filter(item => {
    const matchesSearch = 
      String(item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.clientUsername || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.procedureType || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'pending') return matchesSearch && item.pending > 0;
    if (filterType === 'paid') return matchesSearch && item.pending <= 0 && item.totalValue > 0;
    return matchesSearch;
  });

  // Process data for Category Summary
  const categorySummary = filteredTransactions.reduce((acc: any, t) => {
    const type = String(t.type || '').trim().toLowerCase();
    const isIncome = type === 'ingreso' || type === 'abono';
    const isExpense = type === 'egreso' || type === 'gasto';
    if (!isIncome && !isExpense) return acc;

    if (accountTypeFilter === 'Ingreso' && !isIncome) return acc;
    if (accountTypeFilter === 'Egreso' && !isExpense) return acc;

    const cat = t.category || 'Sin Categoría';
    if (!acc[cat]) acc[cat] = { category: cat, income: 0, expense: 0, count: 0 };
    const amt = parseAmount(t.amount);
    if (isIncome) acc[cat].income += amt;
    if (isExpense) acc[cat].expense += amt;
    acc[cat].count++;
    return acc;
  }, {});

  const categoryList = Object.values(categorySummary).sort((a: any, b: any) => (b.income + b.expense) - (a.income + a.expense));

  // Process data for Cash Flow
  const cashFlowSummary = filteredTransactions.reduce((acc: any, t) => {
    if (!t.date) return acc;
    const type = String(t.type || '').trim().toLowerCase();
    const isIncome = type === 'ingreso' || type === 'abono';
    const isExpense = type === 'egreso' || type === 'gasto';
    if (!isIncome && !isExpense) return acc;

    if (!t.date || t.date.length < 7) return acc;
    const monthKey = t.date.substring(0, 7);
    if (!acc[monthKey]) acc[monthKey] = { month: monthKey, income: 0, expense: 0 };
    const amt = parseAmount(t.amount);
    if (isIncome) acc[monthKey].income += amt;
    if (isExpense) acc[monthKey].expense += amt;
    return acc;
  }, {});

  const cashFlowList = Object.values(cashFlowSummary).sort((a: any, b: any) => b.month.localeCompare(a.month));

  const totalIncome = filteredTransactions.filter(t => {
    const type = String(t.type || '').trim().toLowerCase();
    return type === 'ingreso' || type === 'abono';
  }).reduce((sum, t) => sum + parseAmount(t.amount), 0);
  
  const totalExpense = filteredTransactions.filter(t => {
    const type = String(t.type || '').trim().toLowerCase();
    return type === 'egreso' || type === 'gasto';
  }).reduce((sum, t) => sum + parseAmount(t.amount), 0);
  const totalBalance = totalIncome - totalExpense;
  const totalExpected = procedureSummary.reduce((sum, p) => sum + p.totalValue, 0);
  const cuentasPorCobrar = procedureSummary.reduce((sum, p) => sum + p.pending, 0);

  const handleAddTransaction = () => {
    setEditingItem(null);
    setIsTransactionModalOpen(true);
  };

  const handleEditTransaction = (item: FinancialItem) => {
    setEditingItem(item);
    setIsTransactionModalOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (deletingTransactionId !== id) {
      setDeletingTransactionId(id);
      setTimeout(() => setDeletingTransactionId(null), 3000);
      return;
    }

    setSaving(true);
    setDeletingTransactionId(null);
    try {
      await api.deleteFinancialItem(id);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!newAccountName.trim()) return;
    setSaving(true);
    setError('');
    try {
      setIsSubmitting(true);
      await api.createAccount(newAccountName);
      setNewAccountName('');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta');
    } finally {
      setIsSubmitting(false);
      setSaving(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (deletingAccountId !== id) {
      setDeletingAccountId(id);
      setTimeout(() => setDeletingAccountId(null), 3000);
      return;
    }
    
    setSaving(true);
    setDeletingAccountId(null);
    setError('');
    try {
      await api.deleteAccount(id);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la cuenta');
    } finally {
      setSaving(false);
    }
  };

  const generateProcedurePDF = (item: any) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16);
    doc.setFont('', 'bold');
    doc.text('ESTADO DE CUENTA DE TRÁMITE', 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('', 'normal');
    doc.text(`Fecha de Emisión: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 28);
    
    // Client and Procedure details
    doc.setFontSize(11);
    doc.setFont('', 'bold');
    doc.text('DETALLE DEL TRÁMITE', 14, 40);
    
    doc.setFontSize(10);
    doc.setFont('', 'normal');
    doc.text(`Código: ${item.code || 'N/A'}`, 14, 48);
    doc.text(`Cliente: ${item.clientName || item.clientUsername || 'N/A'}`, 14, 54);
    
    const linesTitle = doc.splitTextToSize(`Descripción: ${item.title || 'N/A'}`, 90);
    doc.text(linesTitle, 14, 60);

    let y = 80;

    // Default procedure info:
    doc.setFontSize(11);
    doc.setFont('', 'bold');
    doc.text('RESUMEN FINANCIERO', 14, y);
    
    const summaryData = [
       ['Monto Acordado', `$${(item.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
       ['Total Ingresos (Abonos)', `$${(item.totalIncome || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
       ['Total Egresos (Gastos)', `$${(item.totalExpense || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
       ['Saldo por Cobrar', `$${(item.pending || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`]
    ];

    autoTable(doc, {
       startY: y + 5,
       head: [['Concepto', 'Total']],
       body: summaryData,
       theme: 'grid',
       headStyles: { fillColor: [40, 40, 40] },
       margin: { left: 14 },
       tableWidth: 100
    });
    
    y = (doc as any).lastAutoTable.finalY + 15;
    
    // Chart / Timeline (if transactions exist)
    const tx = item.transactions || [];
    if (tx.length > 0) {
       doc.setFontSize(10);
       doc.setFont('', 'bold');
       doc.text('TENDENCIA DE PAGOS O EGRESOS', 14, y);
       y += 10;
       
       const sortedTx = [...tx].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
       let balance = item.totalValue || 0;
       const balanceData = [{ date: 'Inicio', balance, desc: 'Acordado' }];
       
       sortedTx.forEach(t => {
          const amt = t.amount ? Number(t.amount.toString().replace(/[^0-9.-]+/g,"")) : 0;
          if (t.type === 'Ingreso' || t.type === 'Abono') {
             balance -= amt;
          }
          balanceData.push({ date: t.date?.split('T')[0] || '', balance, desc: t.type === 'Egreso' ? 'Egreso' : 'Pago' });
       });
       
       const chartHeight = 30;
       const chartWidth = 180;
       const startX = 14;
       const chartY = y + chartHeight;
       
       const maxB = Math.max(...balanceData.map(d => d.balance), 100);
       const minB = Math.min(...balanceData.map(d => d.balance), 0);
       const rangeB = maxB - minB || 1;
       
       doc.setDrawColor(200);
       doc.setLineWidth(0.5);
       doc.line(startX, chartY, startX + chartWidth, chartY); // x
       doc.line(startX, chartY - chartHeight, startX, chartY); // y
       
       doc.setFontSize(7);
       doc.setTextColor(150);
       doc.text(`${maxB.toFixed(0)}`, startX - 2, chartY - chartHeight + 2, { align: 'right' });
       doc.text(`${minB.toFixed(0)}`, startX - 2, chartY, { align: 'right' });
       
       const stepX = chartWidth / Math.max(1, balanceData.length - 1);
       doc.setDrawColor(59, 130, 246);
       doc.setLineWidth(1.0);
       let px = startX;
       let py = chartY - ((balanceData[0].balance - minB) / rangeB) * chartHeight;
       for(let i=1; i<balanceData.length; i++) {
          let cx = startX + i * stepX;
          let cy = chartY - ((balanceData[i].balance - minB) / rangeB) * chartHeight;
          doc.line(px, py, cx, cy);
          doc.setFillColor(59, 130, 246);
          doc.circle(cx, cy, 0.8, 'F');
          px = cx; py = cy;
       }
       doc.setTextColor(0);
       
       y = chartY + 15;
    }
    
    // Check for new pages needed
    const checkPageBreak = (currentY: number, requiredSpace: number) => {
      if (currentY + requiredSpace > doc.internal.pageSize.getHeight()) {
        doc.addPage();
        return 20; // New Y position
      }
      return currentY;
    };

    // Montos Acordados Table
    const acordados = tx.filter((t: any) => t.type === 'Cuenta por Cobrar' || t.category === 'Monto Acordado');
    if (acordados.length > 0) {
      y = checkPageBreak(y, 30);
      doc.setFontSize(10);
      doc.setFont('', 'bold');
      doc.text('DETALLE DE MONTOS ACORDADOS', 14, y);
      
      const acordadoData = acordados.map((t: any) => [
         t.date ? t.date.split('T')[0] : '',
         t.description || '',
         t.category || '',
         `$${(t.amount ? Number(t.amount.toString().replace(/[^0-9.-]+/g,"")) : 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      ]);
      
      autoTable(doc, {
         startY: y + 5,
         head: [['Fecha', 'Descripción', 'Categoría', 'Monto']],
         body: acordadoData,
         theme: 'grid',
         headStyles: { fillColor: [59, 130, 246] }, // blue-500
         margin: { left: 14 }
      });
      y = (doc as any).lastAutoTable.finalY + 15;
    }

    // Incomes Table
    const incomes = tx.filter((t: any) => t.type === 'Ingreso' || t.type === 'Abono');
    if (incomes.length > 0) {
      y = checkPageBreak(y, 30);
      doc.setFontSize(10);
      doc.setFont('', 'bold');
      doc.text('DETALLE DE INGRESOS', 14, y);
      
      const incomeData = incomes.map((t: any) => [
         t.date ? t.date.split('T')[0] : '',
         t.description || '',
         t.category || '',
         `$${(t.amount ? Number(t.amount.toString().replace(/[^0-9.-]+/g,"")) : 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      ]);
      
      autoTable(doc, {
         startY: y + 5,
         head: [['Fecha', 'Descripción', 'Categoría', 'Monto']],
         body: incomeData,
         theme: 'grid',
         headStyles: { fillColor: [34, 197, 94] },
         margin: { left: 14 }
      });
      y = (doc as any).lastAutoTable.finalY + 15;
    }

    // Expenses Table
    const expenses = tx.filter((t: any) => t.type === 'Egreso' || t.type === 'Gasto');
    if (expenses.length > 0) {
      y = checkPageBreak(y, 30);
      doc.setFontSize(10);
      doc.setFont('', 'bold');
      doc.text('DETALLE DE EGRESOS', 14, y);
      
      const expenseData = expenses.map((t: any) => [
         t.date ? t.date.split('T')[0] : '',
         t.description || '',
         t.category || '',
         `-$${(t.amount ? Number(t.amount.toString().replace(/[^0-9.-]+/g,"")) : 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      ]);
      
      autoTable(doc, {
         startY: y + 5,
         head: [['Fecha', 'Descripción', 'Categoría', 'Monto']],
         body: expenseData,
         theme: 'grid',
         headStyles: { fillColor: [239, 68, 68] },
         margin: { left: 14 }
      });
      y = (doc as any).lastAutoTable.finalY + 15;
    }

    // Others Table
    const otros = tx.filter((t: any) => !acordados.includes(t) && !incomes.includes(t) && !expenses.includes(t));
    if (otros.length > 0) {
      y = checkPageBreak(y, 30);
      doc.setFontSize(10);
      doc.setFont('', 'bold');
      doc.text('DETALLE DE OTROS MOVIMIENTOS', 14, y);
      
      const otrosData = otros.map((t: any) => [
         t.date ? t.date.split('T')[0] : '',
         t.description || '',
         t.category || '',
         `$${(t.amount ? Number(t.amount.toString().replace(/[^0-9.-]+/g,"")) : 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      ]);
      
      autoTable(doc, {
         startY: y + 5,
         head: [['Fecha', 'Descripción', 'Categoría', 'Monto']],
         body: otrosData,
         theme: 'grid',
         headStyles: { fillColor: [245, 158, 11] }, // amber-500
         margin: { left: 14 }
      });
      y = (doc as any).lastAutoTable.finalY + 15;
    }
    
    doc.save(`estado-cuenta-${item.code || item.id}.pdf`);
  };

  const generateMonthlyPDF = (monthStr: string) => {
    const doc = new jsPDF();
    const monthName = format(new Date(monthStr + '-01T12:00:00Z'), 'MMMM yyyy', { locale: es }).toUpperCase();
    
    // Add title
    doc.setFontSize(16);
    doc.text(`REPORTE FINANCIERO MENSUAL - ${monthName}`, 14, 20);
    
    // Filter transactions for this month
    const monthTransactions = filteredTransactions.filter(t => t.date && t.date.substring(0, 7) === monthStr);
    const incomes = monthTransactions.filter(t => {
       const type = String(t.type || '').trim().toLowerCase();
       return type === 'ingreso' || type === 'abono';
    });
    const expenses = monthTransactions.filter(t => {
       const type = String(t.type || '').trim().toLowerCase();
       return type === 'egreso' || type === 'gasto';
    });
    
    const incomeTotal = incomes.reduce((sum, t) => sum + (t.amount ? Number(t.amount.toString().replace(/[^0-9.-]+/g,"")) : 0), 0);
    const expenseTotal = expenses.reduce((sum, t) => sum + (t.amount ? Number(t.amount.toString().replace(/[^0-9.-]+/g,"")) : 0), 0);
    const netTotal = incomeTotal - expenseTotal;

    let y = 30;

    doc.setFontSize(10);
    const d = new Date(monthStr + '-01T12:00:00Z');
    const monthNameEs = format(d, 'MMMM', { locale: es });
    const yearNameEs = format(d, 'yyyy');
    
    const p1 = `Durante el mes de ${monthNameEs} de ${yearNameEs}, el desempeño financiero de las operaciones muestra que se generaron ingresos por un total de ${incomeTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}. Estos ingresos corresponden a los pagos y abonos registrados por los usuarios durante el periodo.`;
    const p2 = `En paralelo, la estructura de egresos ascendió a ${expenseTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}, destinados a cubrir los gastos propios del área y devoluciones si corresponde.`;
    const p3 = `El balance neto para el ciclo se establece en ${netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}, indicando un ${netTotal >= 0 ? 'balance positivo' : 'saldo negativo'} al cierre del mes de ${monthNameEs}.`;

    const docWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const maxLineWidth = docWidth - margin * 2;

    const lines1 = doc.splitTextToSize(p1, maxLineWidth);
    doc.text(lines1, margin, y);
    y += (lines1.length * 5) + 5;

    const lines2 = doc.splitTextToSize(p2, maxLineWidth);
    doc.text(lines2, margin, y);
    y += (lines2.length * 5) + 5;

    const lines3 = doc.splitTextToSize(p3, maxLineWidth);
    doc.text(lines3, margin, y);
    y += (lines3.length * 5) + 15;

    doc.setFontSize(10);
    doc.setFont('', 'bold');
    doc.text(`INGRESOS TOTALES: ${incomeTotal.toFixed(2)}`, 14, y);
    y += 7;
    doc.text(`EGRESOS TOTALES: ${expenseTotal.toFixed(2)}`, 14, y);
    y += 7;
    doc.text(`FLUJO NETO: ${netTotal.toFixed(2)}`, 14, y);
    doc.setFont('', 'normal');
    y += 15;

    // --- GRÁFICO DE LÍNEAS DIARIO ---
    doc.setFontSize(10);
    doc.setFont('', 'bold');
    doc.text('TENDENCIA DIARIA DE FLUJO DE EFECTIVO', margin, y);
    y += 8;
    
    // Preparar datos diarios
    const diasDelMes = new Date(parseInt(monthStr.substring(0,4)), parseInt(monthStr.substring(5,7)), 0).getDate();
    const dailyData = Array.from({length: diasDelMes}, (_, i) => {
       const dStr = `${monthStr}-${(i+1).toString().padStart(2, '0')}`;
       const inc = incomes.filter(t => t.date && t.date.startsWith(dStr)).reduce((s,t) => s + (t.amount ? Number(t.amount.toString().replace(/[^0-9.-]+/g,"")) : 0), 0);
       const exp = expenses.filter(t => t.date && t.date.startsWith(dStr)).reduce((s,t) => s + (t.amount ? Number(t.amount.toString().replace(/[^0-9.-]+/g,"")) : 0), 0);
       return { day: i+1, inc, exp, net: inc - exp };
    });

    const maxVal = Math.max(...dailyData.map(d => Math.max(d.inc, d.exp, Math.abs(d.net))), 100);
    const minVal = Math.min(...dailyData.map(d => Math.min(d.net, 0))); // for negative net flow
    const totalRange = maxVal - minVal;
    
    const chartHeight = 35;
    const chartWidth = maxLineWidth - 10;
    const chartY = y + chartHeight; // Bottom of chart
    const startX = margin + 10;
    
    // Draw axes
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(startX, chartY, startX + chartWidth, chartY); // x axis
    doc.line(startX, chartY - chartHeight, startX, chartY); // y axis
    
    // Zero line if minVal < 0
    const zeroY = chartY - ((0 - minVal) / totalRange) * chartHeight;
    if (minVal < 0) {
       doc.setDrawColor(220, 220, 220);
       doc.line(startX, zeroY, startX + chartWidth, zeroY);
    }
    
    const stepX = chartWidth / (diasDelMes - 1);
    
    // Labels Y
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`${maxVal.toFixed(0)}`, margin, chartY - chartHeight + 3);
    doc.text(`${minVal.toFixed(0)}`, margin, chartY);

    // Draw lines Function
    const drawLine = (key: 'inc' | 'exp' | 'net', r:number, g:number, b:number) => {
       doc.setDrawColor(r,g,b);
       doc.setLineWidth(1.0);
       let px = startX;
       let py = chartY - ((dailyData[0][key] - minVal) / totalRange) * chartHeight;
       for(let i=1; i<diasDelMes; i++) {
          let cx = startX + i * stepX;
          let cy = chartY - ((dailyData[i][key] - minVal) / totalRange) * chartHeight;
          doc.line(px, py, cx, cy);
          px = cx; py = cy;
       }
    };
    
    drawLine('inc', 34, 197, 94); // green
    drawLine('exp', 239, 68, 68); // red
    // drawLine('net', 59, 130, 246); // blue

    // Legend
    doc.setFillColor(34, 197, 94); doc.rect(startX, chartY + 5, 3, 3, 'F'); doc.setTextColor(100); doc.text('Ingresos', startX + 5, chartY + 8);
    doc.setFillColor(239, 68, 68); doc.rect(startX + 25, chartY + 5, 3, 3, 'F'); doc.text('Egresos', startX + 30, chartY + 8);
    // doc.setFillColor(59, 130, 246); doc.rect(startX + 50, chartY + 5, 3, 3, 'F'); doc.text('Flujo Neto', startX + 55, chartY + 8);

    doc.setTextColor(0);
    doc.setFont('', 'normal');
    
    y = chartY + 20;

    // Top Expense Categories
    const expenseCategories = expenses.reduce((acc: any, t) => {
       const cat = t.category || 'OTROS';
       const amount = t.amount ? Number(t.amount.toString().replace(/[^0-9.-]+/g,"")) : 0;
       acc[cat] = (acc[cat] || 0) + amount;
       return acc;
    }, {});
    const topExpenseCategories = Object.entries(expenseCategories).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);

    if (topExpenseCategories.length > 0) {
        doc.setFontSize(10);
        doc.setFont('', 'bold');
        doc.text('PRINCIPALES CATEGORÍAS DE EGRESOS', 14, y);
        
        autoTable(doc, {
           startY: y + 5,
           head: [['Categoría', 'Monto']],
           body: topExpenseCategories.map(([cat, amt]) => [cat, `${Number(amt).toFixed(2)}`]),
           theme: 'grid',
           headStyles: { fillColor: [150, 150, 150] },
           margin: { left: 14 },
           tableWidth: 100
        });
        y = (doc as any).lastAutoTable.finalY + 15;
    } else {
        y += 15;
    }

    doc.setFontSize(10);
    doc.setFont('', 'bold');
    doc.text('DETALLE DE INGRESOS', 14, y);
    
    const incomeData = incomes.map(t => [
       t.date ? t.date.split('T')[0] : '',
       t.description || '',
       t.category || '',
       `$${(t.amount ? Number(t.amount.toString().replace(/[^0-9.-]+/g,"")) : 0).toFixed(2)}`
    ]);
    
    autoTable(doc, {
       startY: y + 5,
       head: [['Fecha', 'Descripción', 'Categoría', 'Monto']],
       body: incomeData,
       theme: 'grid',
       headStyles: { fillColor: [34, 197, 94] }
    });
    
    y = (doc as any).lastAutoTable.finalY + 15;
    doc.text('DETALLE DE EGRESOS', 14, y);
    
    const expenseData = expenses.map(t => [
       t.date ? t.date.split('T')[0] : '',
       t.description || '',
       t.category || '',
       `$${(t.amount ? Number(t.amount.toString().replace(/[^0-9.-]+/g,"")) : 0).toFixed(2)}`
    ]);
    
    autoTable(doc, {
       startY: y + 5,
       head: [['Fecha', 'Descripción', 'Categoría', 'Monto']],
       body: expenseData,
       theme: 'grid',
       headStyles: { fillColor: [239, 68, 68] }
    });
    
    doc.save(`reporte-financiero-${monthStr}.pdf`);
  };

  const chartData = [...cashFlowList].reverse().map((c: any) => ({
    name: format(new Date(c.month + '-01T12:00:00Z'), 'MMM yy', { locale: es }).toUpperCase(),
    Ingresos: c.income,
    Egresos: c.expense,
    'Flujo Neto': c.income - c.expense
  }));

  if (loading) return <div className="flex justify-center items-center h-64"><Hourglass className="w-8 h-8 animate-pulse text-[#E3000F]" /></div>;

  return (
    <div className="space-y-3 md:space-y-4 max-w-7xl mx-auto pb-12 relative">
      {saving && <LoadingOverlay />}
      
      {isScriptOutdated && (
        <div className="bg-amber-50 border border-amber-200 text-amber-950 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start md:items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 md:mt-0" />
            <div>
              <p className="text-xs font-black uppercase tracking-wider mb-0.5">Código de Servidor Desactualizado</p>
              <p className="text-stone-600 text-[10px] font-bold uppercase tracking-wide">
                Su módulo de Reportes Financieros requiere actualizar la Web App de Google Apps Script. Vaya a Configuración, copie el código y vuelva a publicarlo.
              </p>
            </div>
          </div>
          <button 
            onClick={() => window.location.hash = '#/dashboard/settings'} 
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest self-end md:self-auto shrink-0 transition-colors shadow-md shadow-amber-100"
          >
            Actualizar Ahora
          </button>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Reportes Financieros</h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Gestión de Flujo de Efectivo</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {error && (
            <div className="mr-4 px-3 py-1 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-[9px] font-bold uppercase">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </div>
          )}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            <input 
              type="date" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="text-[10px] font-black text-gray-700 bg-transparent outline-none px-2 py-1 uppercase tracking-widest"
              title="Fecha Inicio"
            />
            <span className="text-gray-300">-</span>
            <input 
              type="date" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="text-[10px] font-black text-gray-700 bg-transparent outline-none px-2 py-1 uppercase tracking-widest"
              title="Fecha Fin"
            />
          </div>
          <button 
            onClick={() => setIsAccountModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-black text-[9px] uppercase tracking-widest shadow-sm"
          >
            <Wallet className="w-3.5 h-3.5" /> Cuentas
          </button>
          <button 
            onClick={handleAddTransaction}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#E3000F] text-white rounded-lg hover:bg-red-700 transition-all font-black text-[9px] uppercase tracking-widest shadow-lg shadow-red-100"
          >
            <Plus className="w-3.5 h-3.5" /> Nuevo
          </button>
          <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto scrollbar-hide">
            <button 
              onClick={() => setReportView('procedures')}
              className={clsx(
                "px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all whitespace-nowrap",
                reportView === 'procedures' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Trámites
            </button>
            <button 
              onClick={() => setReportView('receivables')}
              className={clsx(
                "px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all whitespace-nowrap",
                reportView === 'receivables' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Cuentas por Cobrar
            </button>
            <button 
              onClick={() => setReportView('categories')}
              className={clsx(
                "px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all whitespace-nowrap",
                reportView === 'categories' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Cuentas
            </button>
            <button 
              onClick={() => setReportView('cashflow')}
              className={clsx(
                "px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all whitespace-nowrap",
                reportView === 'cashflow' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Flujo
            </button>
            <button 
              onClick={() => setReportView('summary')}
              className={clsx(
                "px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all whitespace-nowrap",
                reportView === 'summary' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Resumen
            </button>
            <button 
              onClick={() => setReportView('transactions')}
              className={clsx(
                "px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all whitespace-nowrap",
                reportView === 'transactions' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Movimientos
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-white p-2.5 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <div className="p-1 bg-green-50 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
            </div>
            <span className="text-[6.5px] sm:text-[7px] font-black text-green-600 bg-green-50 px-1 sm:px-1.5 py-0.5 rounded-full uppercase tracking-widest">Ingresos</span>
          </div>
          <p className="text-sm sm:text-lg md:text-xl font-black text-gray-900">${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-white p-2.5 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <div className="p-1 bg-red-50 rounded-lg">
              <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E3000F]" />
            </div>
            <span className="text-[6.5px] sm:text-[7px] font-black text-[#E3000F] bg-red-50 px-1 sm:px-1.5 py-0.5 rounded-full uppercase tracking-widest">Egresos</span>
          </div>
          <p className="text-sm sm:text-lg md:text-xl font-black text-gray-900">${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-white p-2.5 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <div className="p-1 bg-blue-50 rounded-lg">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
            </div>
            <span className="text-[6.5px] sm:text-[7px] font-black text-blue-600 bg-blue-50 px-1 sm:px-1.5 py-0.5 rounded-full uppercase tracking-widest">Saldo</span>
          </div>
          <p className="text-sm sm:text-lg md:text-xl font-black text-gray-900">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-white p-2.5 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <div className="p-1 bg-gray-50 rounded-lg">
              <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
            </div>
            <span className="text-[6.5px] sm:text-[7px] font-black text-gray-600 bg-gray-50 px-1 sm:px-1.5 py-0.5 rounded-full uppercase tracking-widest">Cuentas por cobrar</span>
          </div>
          <p className="text-sm sm:text-lg md:text-xl font-black text-gray-900">${cuentasPorCobrar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      {reportView === 'receivables' && (
        <div className="space-y-6">
          {['En proceso', 'Suspendido', 'Finalizado', 'Otro'].map(statusGroup => {
            const groupProcedures = procedureSummary.filter(p => p.pending > 0.01 && (
              statusGroup === 'Otro' ? !['En proceso', 'Suspendido', 'Finalizado'].includes(p.status || '') : (p.status || (p.projectedProfit !== undefined ? 'En proceso' : 'Otro')) === statusGroup || (!p.status && statusGroup === 'En proceso')
            )).sort((a, b) => b.pending - a.pending);

            if (groupProcedures.length === 0) return null;

            const getStatusColor = (status: string) => {
              switch (status) {
                case 'En proceso': return 'bg-amber-50 text-amber-600 border-amber-100';
                case 'Suspendido': return 'bg-rose-50 text-rose-600 border-rose-100';
                case 'Finalizado': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
                default: return 'bg-gray-50 text-gray-600 border-gray-100';
              }
            };

            return (
              <div key={statusGroup} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">{statusGroup}</h3>
                  <span className={clsx(
                    "px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md border",
                    getStatusColor(statusGroup)
                  )}>
                    {groupProcedures.length} Trámites
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left">Trámite / Cliente</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Monto Acordado</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Total Ingresos</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Total Egresos</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Por Cobrar</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Estado de Pago</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {groupProcedures.map(item => (
                        <React.Fragment key={item.id}>
                        <tr onClick={() => toggleExpand(item.id)} className="hover:bg-gray-50 transition-colors group cursor-pointer">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-4 flex justify-center">
                                {expandedProcs[item.id] ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#E3000F]" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#E3000F]" />}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-900 group-hover:text-[#E3000F] transition-colors">{item.title}</span>
                                <span className="text-[10px] text-gray-500 truncate max-w-[200px]">{item.clientName || item.clientUsername || 'Sin cliente'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-xs font-bold text-gray-900">${item.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-xs font-bold text-green-600">${item.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-xs font-bold text-red-600">${item.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-xs font-bold text-orange-600">${item.pending.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={clsx(
                              "px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md whitespace-nowrap",
                              item.pending <= 0 && item.totalValue > 0 ? "bg-green-100 text-green-700 border border-green-200" : 
                              item.totalIncome > 0 ? "bg-orange-100 text-orange-700 border border-orange-200" : "bg-gray-100 text-gray-600 border border-gray-200"
                            )}>
                              {item.pending <= 0 && item.totalValue > 0 ? 'Liquidado' : 
                               item.totalIncome > 0 ? 'Abonado' : 'Pendiente'}
                            </span>
                          </td>
                        </tr>
                        {expandedProcs[item.id] && item.transactions && item.transactions.length > 0 && (
                          <tr>
                            <td colSpan={6} className="p-0 bg-gray-50/50 border-b border-gray-100">
                              <div className="px-8 py-3 w-full max-w-full overflow-hidden">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Registro de Transacciones</h4>
                                  <button onClick={(e) => { e.stopPropagation(); generateProcedurePDF(item); }} className="inline-flex items-center gap-1.5 text-[9px] font-bold text-gray-600 hover:text-black uppercase tracking-widest bg-white border border-gray-200 px-2.5 py-1 rounded-md shadow-sm transition-colors cursor-pointer">
                                    <FileDown className="w-3 h-3" />
                                    Descargar PDF
                                  </button>
                                </div>
                                
                                {(() => {
                                  const groupTransactions = (typeList: string[], categoryList: string[] = []) => item.transactions.filter((t: any) => typeList.includes(t.type) || categoryList.includes(t.category));
                                  const renderGroup = (title: string, txs: any[], colorClass: string, dotClass: string) => txs.length > 0 && (
                                    <div className="mb-3 last:mb-0">
                                      <h5 className={clsx("text-[9px] font-bold uppercase tracking-widest mb-1.5 pl-1", colorClass)}>{title}</h5>
                                      <div className="space-y-1.5">
                                        {txs.map((t: any) => (
                                          <div key={t.id} onClick={() => t.procedureId && navigate('/dashboard/quick-finance', { state: { procedureId: t.procedureId, editFinancialItemId: t.id } })} className={clsx("flex items-center justify-between text-[10px] bg-white border border-gray-100 rounded-md p-1.5", t.procedureId && "cursor-pointer hover:bg-gray-50 transition-colors")}>
                                            <div className="flex items-center gap-3">
                                              <span className={clsx("w-2 h-2 rounded-full shrink-0", dotClass)}></span>
                                              <span className="font-bold text-gray-700 w-16 shrink-0">{t.date ? t.date.split('T')[0] : '---'}</span>
                                              <span className="text-gray-900 font-medium truncate max-w-[300px]">{t.description}</span>
                                              <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest shrink-0">{t.category}</span>
                                            </div>
                                            <div className="flex items-center gap-4 shrink-0">
                                              {t.registeredBy && <span className="text-gray-400 text-[8px] uppercase tracking-wider">Por: {t.registeredBy}</span>}
                                              <span className={clsx("font-bold text-right w-20", colorClass)}>
                                                {t.type === 'Egreso' || t.type === 'Gasto' ? '-' : ''}${Number(t.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );

                                  const tAcordados = groupTransactions(['Cuenta por Cobrar'], ['Monto Acordado']);
                                  const tIngresos = groupTransactions(['Ingreso', 'Abono']);
                                  const tEgresos = groupTransactions(['Egreso', 'Gasto']);
                                  const tOtros = item.transactions.filter((t: any) => !tAcordados.includes(t) && !tIngresos.includes(t) && !tEgresos.includes(t));

                                  return (
                                    <div className="space-y-2">
                                      {renderGroup('Montos Acordados', tAcordados, 'text-blue-600', 'bg-blue-500')}
                                      {renderGroup('Ingresos', tIngresos, 'text-green-600', 'bg-green-500')}
                                      {renderGroup('Egresos', tEgresos, 'text-red-600', 'bg-red-500')}
                                      {renderGroup('Otros Movimientos', tOtros, 'text-amber-600', 'bg-amber-500')}
                                    </div>
                                  );
                                })()}
                              </div>
                            </td>
                          </tr>
                        )}
                        </React.Fragment>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-100">
                      <tr>
                        <td className="px-4 py-3 text-right font-black text-gray-900 text-[10px] uppercase tracking-widest">Totales</td>
                        <td className="px-4 py-3 text-right font-black text-gray-900 text-xs">
                          ${groupProcedures.reduce((sum, p) => sum + p.totalValue, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-green-600 text-xs">
                          ${groupProcedures.reduce((sum, p) => sum + p.totalIncome, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-red-600 text-xs">
                          ${groupProcedures.reduce((sum, p) => sum + p.totalExpense, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-orange-600 text-xs">
                          ${groupProcedures.reduce((sum, p) => sum + p.pending, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}
          {procedureSummary.filter(p => p.pending > 0.01).length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <span className="text-gray-400 text-xs italic">No hay cuentas por cobrar</span>
            </div>
          )}
        </div>
      )}

      {reportView === 'procedures' && (
        <>
          {/* Filters */}
          <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar trámite o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-[#E3000F] focus:border-[#E3000F] outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="flex-1 md:flex-none border border-gray-200 rounded-lg text-[10px] md:text-sm py-2 px-2 md:px-3 focus:ring-[#E3000F] focus:border-[#E3000F] outline-none bg-white"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendientes</option>
                <option value="paid">Liquidados</option>
              </select>
            </div>
          </div>

          {/* Table / Cards */}
          <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-2 py-1.5 w-6"></th>
                    <th className="px-2 py-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Trámite / Cliente</th>
                    <th className="px-2 py-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right">Monto Acordado</th>
                    <th className="px-2 py-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right">Ingresos</th>
                    <th className="px-2 py-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right">Egresos</th>
                    <th className="px-2 py-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right">Saldo por Cobrar</th>
                    <th className="px-2 py-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right">Utilidad</th>
                    <th className="px-2 py-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProcedures.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-400 italic">No se encontraron registros financieros.</td>
                    </tr>
                  ) : (
                    filteredProcedures.map((item) => (
                      <React.Fragment key={item.id}>
                        <tr onClick={() => toggleExpand(item.id)} className="hover:bg-gray-50 transition-colors group cursor-pointer">
                          <td className="px-2 py-1.5 w-6 text-center">
                            {expandedProcs[item.id] ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 inline-block" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400 inline-block" />}
                          </td>
                          <td className="px-2 py-1.5 max-w-[200px]">
                            <div className="flex flex-col truncate">
                              <span className="text-xs font-bold text-gray-900 group-hover:text-[#E3000F] transition-colors truncate">{item.title}</span>
                              <span className="text-[9px] text-gray-500 truncate">{item.clientName || item.clientUsername}</span>
                            </div>
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            <span className="text-xs font-bold text-gray-900">${item.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            <span className="text-xs font-bold text-green-600">${item.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            <span className="text-xs font-bold text-red-600">${item.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            <span className="text-xs font-bold text-amber-600">${item.pending.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            <span className={clsx(
                              "text-xs font-black",
                              item.projectedProfit >= 0 ? "text-blue-600" : "text-red-600"
                            )}>
                              ${item.projectedProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <span className={clsx(
                              "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                              item.pending <= 0 && item.totalValue > 0 ? "bg-green-100 text-green-700" : 
                              item.totalIncome > 0 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"
                            )}>
                              {item.pending <= 0 && item.totalValue > 0 ? 'Liquidado' : 
                               item.totalIncome > 0 ? 'Abonado' : 'Pendiente'}
                            </span>
                          </td>
                        </tr>
                        {expandedProcs[item.id] && item.transactions && item.transactions.length > 0 && (
                          <tr>
                            <td colSpan={8} className="p-0 bg-gray-50/50 border-b border-gray-100">
                              <div className="px-8 py-3 w-full max-w-full overflow-hidden">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Registro de Transacciones</h4>
                                  <button onClick={(e) => { e.stopPropagation(); generateProcedurePDF(item); }} className="inline-flex items-center gap-1.5 text-[9px] font-bold text-gray-600 hover:text-black uppercase tracking-widest bg-white border border-gray-200 px-2.5 py-1 rounded-md shadow-sm transition-colors cursor-pointer">
                                    <FileDown className="w-3 h-3" />
                                    Descargar PDF
                                  </button>
                                </div>
                                
                                {(() => {
                                  const groupTransactions = (typeList: string[], categoryList: string[] = []) => item.transactions.filter((t: any) => typeList.includes(t.type) || categoryList.includes(t.category));
                                  const renderGroup = (title: string, txs: any[], colorClass: string, dotClass: string) => txs.length > 0 && (
                                    <div className="mb-3 last:mb-0">
                                      <h5 className={clsx("text-[9px] font-bold uppercase tracking-widest mb-1.5 pl-1", colorClass)}>{title}</h5>
                                      <div className="space-y-1.5">
                                        {txs.map((t: any) => (
                                          <div key={t.id} onClick={() => t.procedureId && navigate('/dashboard/quick-finance', { state: { procedureId: t.procedureId, editFinancialItemId: t.id } })} className={clsx("flex items-center justify-between text-[10px] bg-white border border-gray-100 rounded-md p-1.5", t.procedureId && "cursor-pointer hover:bg-gray-50 transition-colors")}>
                                            <div className="flex items-center gap-3">
                                              <span className={clsx("w-2 h-2 rounded-full shrink-0", dotClass)}></span>
                                              <span className="font-bold text-gray-700 w-16 shrink-0">{t.date ? t.date.split('T')[0] : '---'}</span>
                                              <span className="text-gray-900 font-medium truncate max-w-[300px]">{t.description}</span>
                                              <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest shrink-0">{t.category}</span>
                                            </div>
                                            <div className="flex items-center gap-4 shrink-0">
                                              {t.registeredBy && <span className="text-gray-400 text-[8px] uppercase tracking-wider">Por: {t.registeredBy}</span>}
                                              <span className={clsx("font-bold text-right w-20", colorClass)}>
                                                {t.type === 'Egreso' || t.type === 'Gasto' ? '-' : ''}${Number(t.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );

                                  const tAcordados = groupTransactions(['Cuenta por Cobrar'], ['Monto Acordado']);
                                  const tIngresos = groupTransactions(['Ingreso', 'Abono']);
                                  const tEgresos = groupTransactions(['Egreso', 'Gasto']);
                                  const tOtros = item.transactions.filter((t: any) => !tAcordados.includes(t) && !tIngresos.includes(t) && !tEgresos.includes(t));

                                  return (
                                    <div className="space-y-2">
                                      {renderGroup('Montos Acordados', tAcordados, 'text-blue-600', 'bg-blue-500')}
                                      {renderGroup('Ingresos', tIngresos, 'text-green-600', 'bg-green-500')}
                                      {renderGroup('Egresos', tEgresos, 'text-red-600', 'bg-red-500')}
                                      {renderGroup('Otros Movimientos', tOtros, 'text-amber-600', 'bg-amber-500')}
                                    </div>
                                  );
                                })()}
                              </div>
                            </td>
                          </tr>
                        )}
                        {expandedProcs[item.id] && (!item.transactions || item.transactions.length === 0) && (
                          <tr>
                            <td colSpan={8} className="p-3 text-center text-[10px] text-gray-400 bg-gray-50/50 border-b border-gray-100">
                              <div className="flex items-center justify-center gap-4">
                                <span>No hay movimientos registrados.</span>
                                <button onClick={(e) => { e.stopPropagation(); generateProcedurePDF(item); }} className="inline-flex items-center gap-1 text-[9px] font-bold text-gray-600 hover:text-black uppercase tracking-widest bg-white border border-gray-200 px-2 py-1 rounded-md shadow-sm transition-colors cursor-pointer">
                                  <FileDown className="w-2.5 h-2.5" />
                                  Descargar Reporte PDF
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredProcedures.length === 0 ? (
                <div className="p-8 text-center text-gray-400 italic text-xs">No se encontraron registros.</div>
              ) : (
                filteredProcedures.map((item) => (
                  <div key={item.id} className="flex flex-col">
                    <div 
                      onClick={() => toggleExpand(item.id)}
                      className="p-3 space-y-3 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-start gap-2 overflow-hidden flex-1">
                          <button className="mt-0.5 text-gray-400 shrink-0">
                            {expandedProcs[item.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          <div className="overflow-hidden">
                            <h3 className="font-bold text-gray-900 text-[11px] leading-tight truncate">{item.title}</h3>
                            <p className="text-[9px] text-gray-400 truncate mt-0.5">{item.clientName || item.clientUsername}</p>
                          </div>
                        </div>
                        <span className={clsx(
                          "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase shrink-0",
                          item.pending <= 0 && item.totalValue > 0 ? "bg-green-100 text-green-700" : 
                          item.totalIncome > 0 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"
                        )}>
                          {item.pending <= 0 && item.totalValue > 0 ? 'Liquidado' : 
                          item.totalIncome > 0 ? 'Abonado' : 'Pendiente'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 pl-5">
                        <div className="flex flex-col">
                          <span className="text-[8px] text-gray-400 uppercase font-bold tracking-wider">Monto Acordado</span>
                          <span className="text-[11px] font-black text-gray-900">${item.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[8px] text-gray-400 uppercase font-bold tracking-wider">Utilidad</span>
                          <span className={clsx(
                            "text-[11px] font-black",
                            item.projectedProfit >= 0 ? "text-blue-600" : "text-red-600"
                          )}>${item.projectedProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] text-gray-400 uppercase font-bold tracking-wider">Ingresos</span>
                          <span className="text-[11px] font-bold text-green-600">${item.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[8px] text-gray-400 uppercase font-bold tracking-wider">Egresos</span>
                          <span className="text-[11px] font-bold text-red-600">${item.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] text-gray-400 uppercase font-bold tracking-wider">Por Cobrar</span>
                          <span className="text-[11px] font-bold text-amber-600">${item.pending.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                    
                    {expandedProcs[item.id] && (
                      <div className="bg-gray-50/50 p-3 pt-0 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-2 mt-2">
                          <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Registro de Transacciones</h4>
                          <button onClick={(e) => { e.stopPropagation(); generateProcedurePDF(item); }} className="inline-flex items-center gap-1.5 text-[9px] font-bold text-gray-600 hover:text-black uppercase tracking-widest bg-white border border-gray-200 px-2.5 py-1 rounded-md shadow-sm transition-colors cursor-pointer">
                            <FileDown className="w-3 h-3" />
                            PDF
                          </button>
                        </div>
                        {item.transactions && item.transactions.length > 0 ? (
                          
                          <div className="pl-5">
                                {(() => {
                                  const groupTransactions = (typeList: string[], categoryList: string[] = []) => item.transactions.filter((t: any) => typeList.includes(t.type) || categoryList.includes(t.category));
                                  const renderGroup = (title: string, txs: any[], colorClass: string, dotClass: string) => txs.length > 0 && (
                                    <div className="mb-3 last:mb-0">
                                      <h5 className={clsx("text-[8px] font-bold uppercase tracking-widest mb-1.5", colorClass)}>{title}</h5>
                                      <div className="space-y-1.5">
                                        {txs.map((t: any) => (
                                          <div key={t.id} onClick={() => t.procedureId && navigate('/dashboard/quick-finance', { state: { procedureId: t.procedureId, editFinancialItemId: t.id } })} className={clsx("flex flex-col bg-white border border-gray-100 rounded-md p-2 space-y-1", t.procedureId && "cursor-pointer hover:bg-gray-50 transition-colors")}>
                                            <div className="flex justify-between items-start gap-2">
                                              <div className="flex items-center gap-1.5 flex-1 overflow-hidden">
                                                <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", dotClass)}></span>
                                                <span className="text-[10px] text-gray-900 font-bold truncate">{t.description}</span>
                                              </div>
                                              <span className={clsx("font-black text-[10px] shrink-0", colorClass)}>
                                                {t.type === 'Egreso' || t.type === 'Gasto' ? '-' : ''}${Number(t.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                              </span>
                                            </div>
                                            <div className="flex justify-between items-center text-[8px] font-bold text-gray-400 uppercase tracking-wider pl-3">
                                              <span>{t.date ? t.date.split('T')[0] : '---'} • {t.category}</span>
                                              {t.registeredBy && <span className="truncate max-w-[80px]">Por: {t.registeredBy}</span>}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );

                                  const tAcordados = groupTransactions(['Cuenta por Cobrar'], ['Monto Acordado']);
                                  const tIngresos = groupTransactions(['Ingreso', 'Abono']);
                                  const tEgresos = groupTransactions(['Egreso', 'Gasto']);
                                  const tOtros = item.transactions.filter((t: any) => !tAcordados.includes(t) && !tIngresos.includes(t) && !tEgresos.includes(t));

                                  return (
                                    <div className="space-y-2">
                                      {renderGroup('Montos Acordados', tAcordados, 'text-blue-600', 'bg-blue-500')}
                                      {renderGroup('Ingresos', tIngresos, 'text-green-600', 'bg-green-500')}
                                      {renderGroup('Egresos', tEgresos, 'text-red-600', 'bg-red-500')}
                                      {renderGroup('Otros', tOtros, 'text-amber-600', 'bg-amber-500')}
                                    </div>
                                  );
                                })()}
                          </div>
                        ) : (
                          <div className="text-center text-[10px] text-gray-400 p-2 italic">
                            No hay transacciones registradas.
                            <div className="mt-2 text-center">
                              <button onClick={(e) => { e.stopPropagation(); generateProcedurePDF(item); }} className="inline-flex items-center gap-1.5 text-[9px] font-bold text-gray-600 hover:text-black uppercase tracking-widest bg-white border border-gray-200 px-2.5 py-1 rounded-md shadow-sm transition-colors cursor-pointer">
                                <FileDown className="w-3 h-3" />
                                Descargar Reporte PDF
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {reportView === 'categories' && (
        <div className="space-y-6">
          <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filtrar transacciones por descripción, trámite o cuenta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-[#E3000F] focus:border-[#E3000F] outline-none"
              />
            </div>
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={accountTypeFilter}
                onChange={(e) => setAccountTypeFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-[#E3000F] appearance-none cursor-pointer"
              >
                <option value="all">Todas las Cuentas</option>
                <option value="Ingreso">Cuentas de Ingreso</option>
                <option value="Egreso">Cuentas de Egreso</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 uppercase">Resumen por Cuentas</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {categoryList.map((cat: any) => (
                    <div key={cat.category} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSearchTerm(cat.category)}>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{cat.category}</p>
                        <p className="text-[10px] text-gray-400">{cat.count} transacciones</p>
                      </div>
                      <div className="text-right">
                        <p className={clsx(
                          "text-sm font-black",
                          (cat.income - cat.expense) >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          ${(cat.income - cat.expense).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-gray-900 uppercase">Listado de Transacciones</h3>
                </div>
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Fecha</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Descripción / Cuenta</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Monto</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredTransactions
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
                        .map(t => (
                        <tr key={t.id} onClick={() => t.procedureId && navigate('/dashboard/quick-finance', { state: { procedureId: t.procedureId, editFinancialItemId: t.id } })} className={clsx("hover:bg-gray-50 transition-colors", t.procedureId && "cursor-pointer")}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs text-gray-500">{format(new Date(t.date), 'dd/MM/yy')}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-900">{t.description}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-gray-400 uppercase font-bold">{t.category}</span>
                                {t.isReimbursable && (
                                  <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1 rounded font-bold">Reembolsar a: {t.reimburseTo}</span>
                                )}
                                {t.fileUrl && (
                                  <a 
                                    href={t.fileUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded font-bold flex items-center gap-0.5 hover:bg-blue-200"
                                  >
                                    <FileCheck className="w-2 h-2" /> RESPALDO
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={clsx(
                              "text-xs font-black",
                              t.type === 'Ingreso' ? "text-green-600" : 
                              t.type === 'Cuenta por Cobrar' ? "text-blue-600" : "text-red-600"
                            )}>
                              {t.type === 'Ingreso' ? '+' : 
                               t.type === 'Cuenta por Cobrar' ? '+' : '-'}${parseAmount(t.amount).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-1">
                              <button 
                                type="button"
                                onClick={() => handleEditTransaction(t)}
                                disabled={saving}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleDeleteTransaction(t.id)}
                                disabled={saving}
                                className={clsx(
                                  "p-1 rounded transition-all disabled:opacity-50",
                                  deletingTransactionId === t.id 
                                    ? "bg-red-600 text-white animate-pulse px-2 text-[8px] font-black" 
                                    : "text-gray-400 hover:text-red-600"
                                )}
                              >
                                {deletingTransactionId === t.id ? '¿BORRAR?' : <Trash2 className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Card List */}
                <div className="md:hidden divide-y divide-gray-100">
                  {(filteredTransactions
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
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).length === 0) ? (
                      <div className="p-8 text-center text-gray-400 italic text-xs">No se encontraron transacciones.</div>
                    ) : (
                      filteredTransactions
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
                        .map(t => {
                          const isIncome = t.type === 'Ingreso' || t.type === 'Abono' || String(t.type || '').trim().toLowerCase() === 'ingreso' || String(t.type || '').trim().toLowerCase() === 'abono';
                          const isReceivable = t.type === 'Cuenta por Cobrar' || t.type === 'Por Cobrar' || String(t.type || '').trim().toLowerCase() === 'cuenta por cobrar';
                          return (
                            <div key={t.id} onClick={() => t.procedureId && navigate('/dashboard/quick-finance', { state: { procedureId: t.procedureId, editFinancialItemId: t.id } })} className={clsx("p-3 space-y-2 hover:bg-gray-50 transition-colors", t.procedureId && "cursor-pointer")}>
                              <div className="flex justify-between items-start">
                                <div className="space-y-0.5 max-w-[70%]">
                                  <span className="text-[10px] text-gray-400 font-bold">{format(new Date(t.date), 'dd/MM/yyyy')}</span>
                                  <h4 className="text-xs font-bold text-gray-900 leading-tight block break-words">{t.description}</h4>
                                  <span className="inline-block text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">{t.category}</span>
                                </div>
                                <span className={clsx(
                                  "text-sm font-black whitespace-nowrap shrink-0 ml-2",
                                  isIncome ? "text-green-600" : 
                                  isReceivable ? "text-blue-600" : "text-red-600"
                                )}>
                                  {isIncome ? '+' : isReceivable ? '+' : '-'}${parseAmount(t.amount).toLocaleString()}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-1.5 items-center">
                                {t.isReimbursable && (
                                  <span className="text-[8px] bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-100 font-bold">Reembolsar a: {t.reimburseTo}</span>
                                )}
                                {t.fileUrl && (
                                  <a 
                                    href={t.fileUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-[8px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 font-bold flex items-center gap-0.5 hover:bg-blue-100"
                                  >
                                    <FileCheck className="w-2.5 h-2.5" /> RESPALDO
                                  </a>
                                )}
                              </div>

                              <div className="flex justify-end gap-2 pt-1.5 border-t border-gray-100">
                                <button 
                                  type="button"
                                  onClick={() => handleEditTransaction(t)}
                                  disabled={saving}
                                  className="px-2.5 py-1 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors hover:bg-gray-100 disabled:opacity-50"
                                >
                                  <Edit2 className="w-2.5 h-2.5 text-blue-600" /> Editar
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => handleDeleteTransaction(t.id)}
                                  disabled={saving}
                                  className={clsx(
                                    "px-2.5 py-1 border rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all disabled:opacity-50",
                                    deletingTransactionId === t.id 
                                      ? "bg-red-600 text-white border-red-600 animate-pulse font-black text-[8px]" 
                                      : "bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                                  )}
                                >
                                  {deletingTransactionId === t.id ? '¿BORRAR?' : (
                                    <>
                                      <Trash2 className="w-2.5 h-2.5" /> Borrar
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportView === 'transactions' && (
        <div className="space-y-6">
          <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por detalle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all"
              />
            </div>
            
            <div className="flex gap-2 flex-col sm:flex-row">
              <div className="relative min-w-[140px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <select
                  value={transactionMonth}
                  onChange={(e) => setTransactionMonth(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-black focus:bg-white cursor-pointer"
                >
                  <option value="all">Todos los meses</option>
                  {cashFlowList.map((c: any) => (
                    <option key={c.month} value={c.month}>
                      {format(new Date(c.month + '-01T12:00:00Z'), 'MMMM yyyy', { locale: es })} ({new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(c.income - c.expense)})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
              
              <div className="relative min-w-[130px]">
                <select
                  value={transactionTypeFilter}
                  onChange={(e) => setTransactionTypeFilter(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-black focus:bg-white cursor-pointer"
                >
                  <option value="all">Todos (Ing/Egr)</option>
                  <option value="Ingreso">Solo Ingresos</option>
                  <option value="Egreso">Solo Egresos</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative min-w-[140px]">
                <select
                  value={transactionSort}
                  onChange={(e) => setTransactionSort(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-black focus:bg-white cursor-pointer"
                >
                  <option value="date-desc">Más recientes</option>
                  <option value="date-asc">Más antiguos</option>
                  <option value="amount-desc">Monto (Mayor)</option>
                  <option value="amount-asc">Monto (Menor)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-2.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Fecha / Registro</th>
                    <th className="px-4 py-2.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Detalle / Categoría</th>
                    <th className="px-4 py-2.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Trámite</th>
                    <th className="px-4 py-2.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center">Tipo</th>
                    <th className="px-4 py-2.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(()=>{
                    let list = [...filteredTransactions].filter(t => t.type === 'Ingreso' || t.type === 'Egreso' || t.type === 'Gasto');
                    
                    if (searchTerm) {
                      const q = searchTerm.toLowerCase();
                      list = list.filter(t => 
                        String(t.description || '').toLowerCase().includes(q) || 
                        String(t.category || '').toLowerCase().includes(q)
                      );
                    }
                    
                    if (transactionTypeFilter !== 'all') {
                      list = list.filter(t => {
                        const type = (t.type || '').trim();
                        if (transactionTypeFilter === 'Ingreso') return type === 'Ingreso' || type === 'Abono';
                        if (transactionTypeFilter === 'Egreso') return type === 'Egreso' || type === 'Gasto';
                        return true;
                      });
                    }
                    
                    if (transactionMonth !== 'all') {
                      list = list.filter(t => {
                        if (!t.date) return false;
                        const tMonth = t.date.substring(0, 7);
                        return tMonth === transactionMonth;
                      });
                    }

                    list.sort((a,b) => {
                       switch(transactionSort) {
                         case 'amount-desc': return Number(b.amount || 0) - Number(a.amount || 0);
                         case 'amount-asc': return Number(a.amount || 0) - Number(b.amount || 0);
                         case 'date-asc': return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
                         case 'date-desc':
                         default:
                             return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
                       }
                    });

                    if (list.length === 0) {
                      return (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            No se encontraron movimientos financieros.
                          </td>
                        </tr>
                      );
                    }

                    return list.map(t => {
                      const proc = t.procedureId ? data.procedures.find(p => p.id === t.procedureId) : null;
                      return (
                      <tr key={t.id} onClick={() => t.procedureId && navigate('/dashboard/quick-finance', { state: { procedureId: t.procedureId, editFinancialItemId: t.id } })} className={clsx("hover:bg-gray-50 transition-colors", t.procedureId && "cursor-pointer")}>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-900">{t.date ? t.date.split('T')[0] : '---'}</span>
                            {t.registeredBy && <span className="text-[9px] text-gray-400 uppercase tracking-widest">Por: {t.registeredBy}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 max-w-[300px]">
                          <div className="flex flex-col truncate">
                            <span className="text-xs font-medium text-gray-900 truncate">{t.description}</span>
                            <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest truncate">{t.category}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          {proc ? (
                            <div className="flex flex-col truncate max-w-[150px]">
                              <span className="text-[10px] font-bold text-gray-900 truncate">{proc.code}</span>
                              <span className="text-[9px] text-gray-500 truncate">{proc.clientName}</span>
                            </div>
                          ) : (
                            <span className="text-[9px] text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={clsx(
                            "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest",
                            t.type === 'Ingreso' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          )}>
                             {t.type}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={clsx(
                            "text-xs font-black",
                            t.type === 'Ingreso' ? "text-green-600" : "text-red-600"
                          )}>
                             {t.type === 'Egreso' ? '-' : ''}${"" + Number(t.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-gray-100">
               {(()=>{
                    let list = [...filteredTransactions].filter(t => t.type === 'Ingreso' || t.type === 'Egreso' || t.type === 'Gasto');
                    
                    if (searchTerm) {
                      const q = searchTerm.toLowerCase();
                      list = list.filter(t => 
                        String(t.description || '').toLowerCase().includes(q) || 
                        String(t.category || '').toLowerCase().includes(q)
                      );
                    }
                    
                    if (transactionTypeFilter !== 'all') {
                      list = list.filter(t => {
                        const type = (t.type || '').trim();
                        if (transactionTypeFilter === 'Ingreso') return type === 'Ingreso' || type === 'Abono';
                        if (transactionTypeFilter === 'Egreso') return type === 'Egreso' || type === 'Gasto';
                        return true;
                      });
                    }
                    
                    if (transactionMonth !== 'all') {
                      list = list.filter(t => {
                        if (!t.date) return false;
                        const tMonth = t.date.substring(0, 7);
                        return tMonth === transactionMonth;
                      });
                    }

                    list.sort((a,b) => {
                       switch(transactionSort) {
                         case 'amount-desc': return Number(b.amount || 0) - Number(a.amount || 0);
                         case 'amount-asc': return Number(a.amount || 0) - Number(b.amount || 0);
                         case 'date-asc': return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
                         case 'date-desc':
                         default:
                             return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
                       }
                    });

                    if (list.length === 0) {
                      return (
                        <div className="p-8 text-center text-gray-400 italic text-xs">No se encontraron movimientos.</div>
                      );
                    }

                                        return list.map(t => {
                      const proc = t.procedureId ? data.procedures.find(p => p.id === t.procedureId) : null;
                      return (
                      <div key={t.id} onClick={() => t.procedureId && navigate('/dashboard/quick-finance', { state: { procedureId: t.procedureId, editFinancialItemId: t.id } })} className={clsx("p-3 flex flex-col space-y-1.5 hover:bg-gray-50/50", t.procedureId && "cursor-pointer")}>
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[11px] font-bold text-gray-900 leading-tight">{t.description}</span>
                          <span className={clsx(
                            "text-[11px] font-black shrink-0",
                            t.type === 'Ingreso' ? "text-green-600" : "text-red-600"
                          )}>
                            {t.type === 'Egreso' ? '-' : ''}${"" + Number(t.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {proc && (
                          <div className="flex flex-col gap-0.5 bg-gray-50 p-1.5 rounded-md border border-gray-100 mt-1.5 mb-1.5">
                            <span className="text-[10px] font-bold text-gray-900">{proc.code}</span>
                            <span className="text-[9px] text-gray-500 truncate">{proc.clientName}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                          <span>{t.date ? t.date.split('T')[0] : '---'} • {t.category}</span>
                          <span className={clsx(
                             "px-1.5 py-0.5 rounded-sm text-[8px] tracking-widest",
                             t.type === 'Ingreso' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                          )}>{t.type}</span>
                        </div>
                        {t.registeredBy && (
                          <div className="text-[8px] text-gray-400 uppercase tracking-wider">Por: {t.registeredBy}</div>
                        )}
                      </div>
                      );
                    });
                  })()}
            </div>
          </div>
        </div>
      )}

      {reportView === 'cashflow' && (
        <div className="space-y-6">
        <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden mb-6">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 uppercase">Tendencia del Flujo de Caja</h3>
          </div>
          <div className="p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(value) => `${value}`} />
                <RechartsTooltip 
                  cursor={{ fill: 'transparent' }} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value.toFixed(2)}`]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="Ingresos" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Egresos" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-900 uppercase">Flujo de Caja Mensual</h3>
          </div>

          {/* Desktop View Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mes</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Ingresos</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Egresos</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Flujo Neto</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Tendencia</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cashFlowList.map((item: any) => (
                  <tr key={item.month} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-900 uppercase">
                        {format(new Date(item.month + '-01T12:00:00Z'), 'MMMM yyyy', { locale: es })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-green-600">${item.income.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-red-600">${item.expense.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={clsx(
                        "text-sm font-black",
                        (item.income - item.expense) >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        ${(item.income - item.expense).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {(item.income - item.expense) >= 0 ? (
                        <ArrowUpRight className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-red-500 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
            {cashFlowList.length === 0 ? (
              <div className="p-8 text-center text-gray-400 italic text-xs">No hay registros de flujo de caja.</div>
            ) : (
              cashFlowList.map((item: any) => {
                const netFlow = item.income - item.expense;
                const isPositive = netFlow >= 0;
                return (
                  <div key={item.month} className="p-3.5 space-y-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-gray-900 uppercase tracking-tight">
                        {format(new Date(item.month + '-01T12:00:00Z'), 'MMMM yyyy', { locale: es })}
                      </span>
                      <span className={clsx(
                        "flex items-center gap-1 text-[8px] font-black uppercase px-2 py-0.5 rounded-full",
                        isPositive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      )}>
                        {isPositive ? (
                          <>Positivo <ArrowUpRight className="w-3 h-3 text-green-600" /></>
                        ) : (
                          <>Negativo <ArrowDownRight className="w-3 h-3 text-red-600" /></>
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-center">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-gray-400 uppercase font-black tracking-wider">Ingresos</span>
                        <span className="text-[11px] font-bold text-green-600">${item.income.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col border-l border-r border-gray-100">
                        <span className="text-[8px] text-gray-400 uppercase font-black tracking-wider">Egresos</span>
                        <span className="text-[11px] font-bold text-red-600">${item.expense.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] text-gray-400 uppercase font-black tracking-wider">Flujo Neto</span>
                        <span className={clsx(
                          "text-[11px] font-black",
                          isPositive ? "text-green-600" : "text-red-600"
                        )}>${netFlow.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        </div>
      )}

      
      {reportView === 'summary' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="w-full sm:w-64">
                <select
                  value={transactionMonth}
                  onChange={(e) => setTransactionMonth(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-black focus:bg-white cursor-pointer"
                >
                  <option value="all">Todos los meses</option>
                  {cashFlowList.map((c: any) => (
                    <option key={c.month} value={c.month}>
                      {format(new Date(c.month + '-01T12:00:00Z'), 'MMMM yyyy', { locale: es })}
                    </option>
                  ))}
                </select>
              </div>
              <button 
                onClick={() => {
                  if (transactionMonth === 'all') {
                    alert('Por favor, selecciona un mes específico para generar el informe PDF.');
                    return;
                  }
                  if (transactionMonth) {
                    generateMonthlyPDF(transactionMonth);
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-sm"
              >
                <FileDown className="w-4 h-4" />
                Descargar Informe PDF
              </button>
            </div>

            <div className="flex flex-col gap-6 w-full">
              {(() => {
                let inc = 0;
                let exp = 0;
                let title = '';
                let chartDt = [];

                if (transactionMonth === 'all') {
                  title = 'RESUMEN EJECUTIVO GLOBAL';
                  inc = totalIncome;
                  exp = totalExpense;
                  chartDt = cashFlowList.map((c: any) => ({
                    name: format(new Date(c.month + '-01T12:00:00Z'), 'MMM yyyy', { locale: es }),
                    Ingresos: c.income,
                    Egresos: c.expense,
                    FlujoNeto: c.income - c.expense
                  })).reverse();
                } else {
                  const d = new Date(transactionMonth + '-01T12:00:00Z');
                  title = `RESUMEN - ${format(d, 'MMMM yyyy', { locale: es }).toUpperCase()}`;
                  const mData = cashFlowSummary[transactionMonth];
                  if (mData) {
                    inc = mData.income;
                    exp = mData.expense;
                  }
                  
                  const diasDelMes = new Date(parseInt(transactionMonth.substring(0,4)), parseInt(transactionMonth.substring(5,7)), 0).getDate();
                  chartDt = Array.from({length: diasDelMes}, (_, i) => {
                     const dStr = `${transactionMonth}-${(i+1).toString().padStart(2, '0')}`;
                     const mInc = filteredTransactions.filter(t => (t.type === 'Ingreso' || t.type === 'Abono') && t.date && t.date.startsWith(dStr)).reduce((s, t) => s + (t.amount ? Number(t.amount.toString().replace(/[^0-9.-]+/g,"")) : 0), 0);
                     const mExp = filteredTransactions.filter(t => (t.type === 'Egreso' || t.type === 'Gasto') && t.date && t.date.startsWith(dStr)).reduce((s, t) => s + (t.amount ? Number(t.amount.toString().replace(/[^0-9.-]+/g,"")) : 0), 0);
                     return { name: (i+1).toString(), Ingresos: mInc, Egresos: mExp, FlujoNeto: mInc - mExp };
                  });
                }

                const net = inc - exp;

                return (
                  <div className="flex flex-col xl:flex-row gap-6">
                    <div className="xl:w-1/3 flex flex-col gap-4">
                      <div className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <div className="p-4 bg-gray-100 border-b border-gray-200">
                          <h4 className="text-xs font-black text-gray-900 tracking-widest text-center truncate">{title}</h4>
                        </div>
                        <div className="p-5 flex flex-col gap-4">
                           <div className="flex justify-between items-center bg-green-50/50 p-2.5 rounded-lg border border-green-100">
                              <span className="text-xs font-bold text-gray-600">Total Ingresos</span>
                              <span className="text-sm font-black text-green-700">${inc.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                           </div>
                           <div className="flex justify-between items-center bg-red-50/50 p-2.5 rounded-lg border border-red-100">
                              <span className="text-xs font-bold text-gray-600">Total Egresos</span>
                              <span className="text-sm font-black text-red-700">${exp.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                           </div>
                           <div className="flex justify-between items-center bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                              <span className="text-xs font-bold text-gray-600">Flujo Neto</span>
                              <span className={clsx(
                                "text-sm font-black",
                                net >= 0 ? "text-blue-700" : "text-red-700"
                              )}>${net.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                           </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="xl:w-2/3 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col">
                      <div className="p-4 bg-gray-100 border-b border-gray-200">
                         <h4 className="text-xs font-black text-gray-900 tracking-widest">TENDENCIA ${transactionMonth === 'all' ? 'HISTÓRICA' : 'DEL MES'}</h4>
                      </div>
                      <div className="p-4 flex-1 min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          {transactionMonth === 'all' ? (
                            <BarChart data={chartDt} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280' }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280' }} tickFormatter={(value) => `${value}`} />
                              <RechartsTooltip 
                                cursor={{ fill: 'transparent' }} 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                                formatter={(val: number) => [`${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`]}
                              />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                              <Bar dataKey="Ingresos" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={30} />
                              <Bar dataKey="Egresos" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={30} />
                            </BarChart>
                          ) : (
                            <AreaChart data={chartDt} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.5}/>
                                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.5}/>
                                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.5}/>
                                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280' }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280' }} tickFormatter={(value) => `${value}`} />
                              <RechartsTooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                                formatter={(val: number) => [`${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`]}
                              />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                              <Area type="monotone" dataKey="Ingresos" stroke="#22C55E" fillOpacity={1} fill="url(#colorInc)" />
                              <Area type="monotone" dataKey="Egresos" stroke="#EF4444" fillOpacity={1} fill="url(#colorExp)" />
                              <Area type="monotone" dataKey="FlujoNeto" stroke="#3B82F6" fillOpacity={1} fill="url(#colorNet)" />
                            </AreaChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {isTransactionModalOpen && (
        <TransactionModal 
          isOpen={isTransactionModalOpen}
          onClose={() => setIsTransactionModalOpen(false)}
          onSuccess={() => {
            setIsTransactionModalOpen(false);
            fetchData();
          }}
          editingItem={editingItem}
          procedures={data.procedures}
          accounts={accounts}
          staff={staff}
        />
      )}

      {/* Accounts Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-black text-gray-900 uppercase">Gestionar Cuentas</h3>
              <button onClick={() => setIsAccountModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {error && (
                <div className="p-2 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-[10px] font-bold uppercase">
                  <AlertCircle className="w-3 h-3" /> {error}
                </div>
              )}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Nombre de la nueva cuenta..."
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#E3000F]"
                />
                <button 
                  onClick={handleCreateAccount}
                  disabled={isSubmitting || !newAccountName.trim()}
                  className="px-3 py-1.5 bg-[#E3000F] text-white rounded-lg font-bold text-[10px] disabled:opacity-50"
                >
                  {isSubmitting ? <Hourglass className="w-3 h-3 animate-pulse" /> : 'Añadir'}
                </button>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {accounts.map(acc => (
                  <div key={acc.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-xs font-bold text-gray-700">{acc.name}</span>
                    <button 
                      type="button"
                      onClick={() => handleDeleteAccount(acc.id)}
                      disabled={saving}
                      className={clsx(
                        "p-1 rounded transition-all disabled:opacity-50",
                        deletingAccountId === acc.id 
                          ? "bg-red-600 text-white px-2 text-[8px] font-black" 
                          : "text-gray-400 hover:text-red-600"
                      )}
                    >
                      {deletingAccountId === acc.id ? '¿BORRAR?' : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingItem: FinancialItem | null;
  procedures: Procedure[];
  accounts: Account[];
  staff: User[];
}

function TransactionModal({ isOpen, onClose, onSuccess, editingItem, procedures, accounts, staff }: TransactionModalProps) {
  const [formData, setFormData] = useState<Partial<FinancialItem>>({
    type: 'Egreso',
    category: 'Operativo',
    description: '',
    amount: 0,
    procedureId: '',
    isReimbursable: false,
    reimburseTo: '',
    fileUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setFormData(editingItem);
    }
  }, [editingItem]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!formData.procedureId) {
      alert("Debe seleccionar un trámite para poder subir un respaldo (se requiere una carpeta de Drive).");
      e.target.value = '';
      return;
    }

    setUploadingReceipt(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await api.uploadFile({ 
        procedureId: formData.procedureId, 
        name: `Respaldo_${file.name}`, 
        base64,
        mimeType: file.type
      });
      setFormData({ ...formData, fileUrl: result.url });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadingReceipt(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (editingItem) {
        await api.updateFinancialItem({ ...formData, id: editingItem.id });
      } else {
        await api.addFinancialItem(formData);
      }
      onSuccess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-sm font-black text-gray-900 uppercase">
            {editingItem ? 'Editar Registro' : 'Nuevo Registro Financiero'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 md:p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Tipo</label>
              <select 
                value={formData.type}
                onChange={(e) => {
                  const type = e.target.value as any;
                  setFormData({
                    ...formData, 
                    type,
                    category: type === 'Cuenta por Cobrar' ? 'Monto Acordado' : (type === 'Ingreso' ? 'Abono Cliente' : (accounts[0]?.name || 'Operativo'))
                  });
                }}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#E3000F] bg-white"
                required
              >
                <option value="Cuenta por Cobrar">Cuenta por Cobrar (+ Valor)</option>
                <option value="Ingreso">Ingreso (Abono)</option>
                <option value="Egreso">Egreso (Gasto)</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Cuenta / Categoría</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#E3000F] bg-white"
                required
                disabled={formData.type === 'Cuenta por Cobrar'}
              >
                {formData.type === 'Cuenta por Cobrar' ? (
                  <option value="Monto Acordado">Monto Acordado</option>
                ) : formData.type === 'Ingreso' ? (
                  <option value="Abono Cliente">Abono Cliente</option>
                ) : (
                  accounts.map(acc => (
                    <option key={acc.id} value={acc.name}>{acc.name}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Trámite Relacionado (Opcional)</label>
            <select 
              value={formData.procedureId}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({
                  ...formData, 
                  procedureId: val,
                  category: val ? 'Operativo' : formData.category // Default to Operativo if linked to procedure
                });
              }}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#E3000F] bg-white"
            >
              <option value="">Gasto/Ingreso General</option>
              {procedures.map(proc => (
                <option key={proc.id} value={proc.id}>{proc.title} ({proc.clientUsername})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Descripción</label>
            <input 
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#E3000F]"
              placeholder="Ej: Pago de honorarios, Compra de materiales..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Monto ($)</label>
              <input 
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#E3000F]"
                placeholder="0.00"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Respaldo</label>
              <label className={clsx(
                "w-full px-3 py-1.5 border rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-all",
                formData.fileUrl ? "bg-green-50 border-green-200 text-green-700" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
              )}>
                {uploadingReceipt ? <Hourglass className="w-3 h-3 animate-pulse" /> : (formData.fileUrl ? <FileCheck className="w-3 h-3" /> : <Upload className="w-3 h-3" />)}
                <span className="font-bold text-[10px]">{formData.fileUrl ? 'Cargado' : 'Subir'}</span>
                <input type="file" className="hidden" onChange={handleReceiptUpload} disabled={uploadingReceipt} />
              </label>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-xl space-y-2 border border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox"
                checked={formData.isReimbursable}
                onChange={(e) => setFormData({...formData, isReimbursable: e.target.checked})}
                className="w-3.5 h-3.5 text-[#E3000F] border-gray-300 rounded focus:ring-[#E3000F]"
              />
              <span className="text-[10px] font-bold text-gray-700">¿Es un gasto reembolsable?</span>
            </label>

            {formData.isReimbursable && (
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Reembolsar a:</label>
                <select 
                  value={formData.reimburseTo}
                  onChange={(e) => setFormData({...formData, reimburseTo: e.target.value})}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#E3000F] bg-white"
                  required={formData.isReimbursable}
                >
                  <option value="">Seleccionar Persona...</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.role === 'admin' ? 'Admin' : 'Técnico'})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-1.5 border border-gray-200 text-gray-700 rounded-lg font-bold text-xs hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-1.5 bg-[#E3000F] text-white rounded-lg font-bold text-xs hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Hourglass className="w-3 h-3 animate-pulse" /> : <Check className="w-3 h-3" />}
              {editingItem ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
