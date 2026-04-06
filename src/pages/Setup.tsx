import { Link } from 'react-router-dom';
import { Database, Copy, CheckCircle, Settings, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { apiCall } from '../lib/api';
import clsx from 'clsx';

export default function Setup() {
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await apiCall('ping') as any;
      if (res && res.status === 'ok') {
        setTestResult({ success: true, message: '¡Conexión exitosa! La base de datos está lista.' });
      } else {
        throw new Error();
      }
    } catch (err: any) {
      setTestResult({ success: false, message: 'Error: No se pudo conectar. Verifique la URL y que el script esté publicado como "Cualquier persona".' });
    } finally {
      setTesting(false);
    }
  };

  const scriptCode = `// IMPORTANTE: Ejecute la función 'autorizar' una vez manualmente en el editor 
// para conceder los permisos de Google Drive necesarios.

function autorizar() {
  DriveApp.getRootFolder();
  try {
    DriveApp.getFolderById('1HwVT_hs0frirkp4Lznjby8M9oL0-tvm5');
  } catch (e) {}
  SpreadsheetApp.getActiveSpreadsheet();
}

function initSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('El script no está vinculado a una hoja de cálculo. Por favor, cree el script desde Extensiones > Apps Script dentro de una hoja de cálculo.');
  
  // Usuarios
  var usersSheet = ss.getSheetByName('Usuarios');
  if (!usersSheet) {
    usersSheet = ss.insertSheet('Usuarios');
    usersSheet.appendRow(['id', 'name', 'email', 'password', 'role', 'phone', 'address', 'idNumber']);
    usersSheet.appendRow(['1', 'Administrador', 'admin@legarconstructora.com', 'admin123', 'admin', '0999999999', 'Quito', '1700000001']);
  } else {
    ensureColumns(usersSheet, ['id', 'name', 'email', 'password', 'role', 'phone', 'address', 'idNumber']);
  }
  
  // Tramites
  var proceduresSheet = ss.getSheetByName('Tramites');
  var procedureHeaders = ['id', 'title', 'clientEmail', 'status', 'description', 'totalCost', 'paidAmount', 'createdAt', 'technicianEmail', 'completedSteps', 'procedureType', 'propertyNumber', 'driveUrl'];
  if (!proceduresSheet) {
    proceduresSheet = ss.insertSheet('Tramites');
    proceduresSheet.appendRow(procedureHeaders);
  } else {
    ensureColumns(proceduresSheet, procedureHeaders);
  }
  
  // Tipos de Tramite
  var typesSheet = ss.getSheetByName('TiposTramite');
  if (!typesSheet) {
    typesSheet = ss.insertSheet('TiposTramite');
    typesSheet.appendRow(['id', 'name']);
    var initialTypes = [
      'Regularización', 'Aprobación de planos Nuevos', 'Aprobación de planos modificatorios ampliatorios', 
      'Propiedad horizontal', 'Certificación de áreas y linderos', 'Fraccionamientos', 
      'Unificaciones', 'Lotizaciones', 'Mantenimiento de infraestructura', 
      'Devolución de fondo de garantías', 'Permisos de trabajos varios', 
      'Avalúos de bienes inmuebles', 'Construcción'
    ];
    initialTypes.forEach(function(t) {
      typesSheet.appendRow([Utilities.getUuid(), t]);
    });
  }
  
  // Bitacora
  var logsSheet = ss.getSheetByName('Bitacora');
  if (!logsSheet) {
    logsSheet = ss.insertSheet('Bitacora');
    logsSheet.appendRow(['id', 'procedureId', 'date', 'technicianEmail', 'note']);
  }

  // Finanzas
  var financialSheet = ss.getSheetByName('Finanzas');
  if (!financialSheet) {
    financialSheet = ss.insertSheet('Finanzas');
    financialSheet.appendRow(['id', 'procedureId', 'item', 'totalValue', 'paidAmount', 'date']);
  }

  // Archivos
  var filesSheet = ss.getSheetByName('Archivos');
  if (!filesSheet) {
    filesSheet = ss.insertSheet('Archivos');
    filesSheet.appendRow(['id', 'procedureId', 'name', 'url', 'mimeType', 'date']);
  }
}

function ensureColumns(sheet, expectedHeaders) {
  var data = sheet.getDataRange().getValues();
  if (data.length === 0) {
    sheet.appendRow(expectedHeaders);
    return;
  }
  var actualHeaders = data[0];
  for (var i = 0; i < expectedHeaders.length; i++) {
    if (actualHeaders.indexOf(expectedHeaders[i]) === -1) {
      sheet.getRange(1, actualHeaders.length + 1).setValue(expectedHeaders[i]);
      actualHeaders.push(expectedHeaders[i]);
    }
  }
}

function doPost(e) {
  try {
    initSheets();
    var params = JSON.parse(e.postData.contents);
    var action = params.action;
    var data = params.data;
    
    var result;
    switch(action) {
      case 'ping': return response({success: true, status: 'ok'});
      case 'login': result = login(data); break;
      case 'getProcedures': result = getProcedures(data); break;
      case 'createProcedure': result = createProcedure(data); break;
      case 'deleteProcedure': result = deleteProcedure(data); break;
      case 'updateProcedureStatus': result = updateProcedureStatus(data); break;
      case 'assignTechnician': result = assignTechnician(data); break;
      case 'updateProcedureSteps': result = updateProcedureSteps(data); break;
      case 'getProcedureByClientId': result = getProcedureByClientId(data); break;
      case 'getLogs': result = getLogs(data); break;
      case 'addLog': result = addLog(data); break;
      case 'getUsers': result = getUsers(data); break;
      case 'createUser': result = createUser(data); break;
      case 'updateUser': result = updateUser(data); break;
      case 'getFinancials': result = getFinancials(data); break;
      case 'addFinancialItem': result = addFinancialItem(data); break;
      case 'updateFinancialItem': result = updateFinancialItem(data); break;
      case 'deleteFinancialItem': result = deleteFinancialItem(data); break;
      case 'getFinancialSummary': result = getFinancialSummary(); break;
      case 'getProcedureTypes': result = getProcedureTypes(); break;
      case 'createProcedureType': result = createProcedureType(data); break;
      case 'updateProcedure': result = updateProcedure(data); break;
      case 'getFiles': result = getFiles(data); break;
      case 'uploadFile': result = uploadFile(data); break;
      default: throw new Error('Acción no válida: ' + action);
    }
    
    return response({success: true, data: result});
  } catch (err) {
    return response({success: false, error: err.toString()});
  }
}

function response(res) {
  return ContentService.createTextOutput(JSON.stringify(res))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheetData(sheetName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    result.push(obj);
  }
  return result;
}

function login(data) {
  var users = getSheetData('Usuarios');
  for (var i = 0; i < users.length; i++) {
    if (users[i].email === data.email && users[i].password === data.password) {
      return users[i];
    }
  }
  throw new Error('Credenciales incorrectas');
}

function getProcedures(data) {
  var procedures = getSheetData('Tramites');
  var users = getSheetData('Usuarios');
  var usersMap = {};
  users.forEach(function(u) { 
    if (u.email) usersMap[u.email.toString().toLowerCase()] = u; 
  });
  
  var filtered = procedures;
  if (data.role === 'client') {
    filtered = procedures.filter(function(p) { return p.clientEmail === data.email; });
  } else if (data.role === 'tech') {
    filtered = procedures.filter(function(p) { return p.technicianEmail === data.email; });
  }

  // Unify data: if client fields are empty in Tramites, try to get them from Usuarios
  return filtered.map(function(p) {
    var email = p.clientEmail ? p.clientEmail.toString().toLowerCase() : '';
    var user = usersMap[email];
    if (user) {
      p.clientName = p.clientName || user.name;
      p.clientPhone = p.clientPhone || user.phone;
      p.clientAddress = p.clientAddress || user.address;
      p.idNumber = p.idNumber || user.idNumber;
    }
    return p;
  });
}

function createProcedure(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Tramites');
  var id = Utilities.getUuid();
  var date = new Date().toISOString();
  
  // Ensure we have a client email for linking
  var clientEmail = data.clientEmail;
  if (!clientEmail && data.idNumber) {
    clientEmail = data.idNumber.toString().trim() + '@legarconstructora.com';
  } else if (!clientEmail) {
    clientEmail = 'temp_' + id.substring(0, 8) + '@legarconstructora.com';
  }

  // Find or create user
  var usersSheet = ss.getSheetByName('Usuarios');
  var users = getSheetData('Usuarios');
  var userIndex = -1;
  for (var i = 0; i < users.length; i++) {
    if (users[i].email === clientEmail || (data.idNumber && users[i].idNumber && users[i].idNumber.toString() === data.idNumber.toString())) {
      userIndex = i;
      clientEmail = users[i].email; // Use existing email if found by idNumber
      break;
    }
  }

  if (userIndex === -1) {
    // Create new user
    usersSheet.appendRow([
      Utilities.getUuid(), 
      data.clientName || 'Cliente Nuevo', 
      clientEmail, 
      'cliente123', 
      'client', 
      data.clientPhone || '', 
      data.clientAddress || '', 
      data.idNumber || ''
    ]);
  }

  // Create Google Drive folder for the procedure
  var driveUrl = '';
  try {
    var parentFolderId = '1HwVT_hs0frirkp4Lznjby8M9oL0-tvm5';
    var parentFolder = DriveApp.getFolderById(parentFolderId);
    
    // Create subfolder for the procedure
    var folderName = (data.procedureType || 'Trámite') + ' - ' + (data.clientName || 'Sin Nombre');
    var newFolder = parentFolder.createFolder(folderName);
    newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    driveUrl = newFolder.getUrl();
  } catch (e) {
    // If DriveApp fails, we still want to create the procedure record but log the error
    console.error('Error creating Google Drive folder: ' + e.toString());
  }

  // Get headers to ensure correct column mapping
  var headers = sheet.getDataRange().getValues()[0].map(function(h) { return h.toString().trim(); });
  var newRow = new Array(headers.length).fill('');
  
  var rowData = {
    'id': id,
    'title': data.title || (data.procedureType + ' - ' + data.clientName),
    'clientEmail': clientEmail,
    'status': 'Nuevo',
    'description': data.description || '',
    'totalCost': 0,
    'paidAmount': 0,
    'createdAt': date,
    'technicianEmail': data.technicianEmail || '',
    'completedSteps': '',
    'procedureType': data.procedureType || '',
    'propertyNumber': data.propertyNumber || '',
    'driveUrl': driveUrl
  };

  for (var key in rowData) {
    var colIdx = headers.indexOf(key);
    if (colIdx !== -1) {
      newRow[colIdx] = rowData[key];
    }
  }

  sheet.appendRow(newRow);
  return { id: id, driveUrl: driveUrl };
}

function deleteProcedure(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var id = data.id;
  
  // Find driveUrl before deleting from Tramites
  var tramitesSheet = ss.getSheetByName('Tramites');
  var tramitesRows = tramitesSheet.getDataRange().getValues();
  var driveUrl = '';
  for (var i = 1; i < tramitesRows.length; i++) {
    if (tramitesRows[i][0] === id) {
      driveUrl = tramitesRows[i][12]; // Column M (driveUrl)
      break;
    }
  }

  // Delete Drive folder if it exists
  if (driveUrl) {
    try {
      var folderId = driveUrl.split('/folders/')[1];
      if (folderId) {
        var folder = DriveApp.getFolderById(folderId);
        folder.setTrashed(true);
      }
    } catch (e) {
      console.error('Error deleting folder: ' + e.toString());
    }
  }
  
  // Delete from Tramites
  var sheet = ss.getSheetByName('Tramites');
  var rows = sheet.getDataRange().getValues();
  for (var i = rows.length - 1; i >= 1; i--) {
    if (rows[i][0] === id) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  
  // Delete from Bitacora
  var logsSheet = ss.getSheetByName('Bitacora');
  if (logsSheet) {
    var logs = logsSheet.getDataRange().getValues();
    for (var i = logs.length - 1; i >= 1; i--) {
      if (logs[i][1] === id) logsSheet.deleteRow(i + 1);
    }
  }
  
  // Delete from Finanzas
  var finSheet = ss.getSheetByName('Finanzas');
  if (finSheet) {
    var fins = finSheet.getDataRange().getValues();
    for (var i = fins.length - 1; i >= 1; i--) {
      if (fins[i][1] === id) finSheet.deleteRow(i + 1);
    }
  }
  
  // Delete from Archivos
  var filesSheet = ss.getSheetByName('Archivos');
  if (filesSheet) {
    var files = filesSheet.getDataRange().getValues();
    for (var i = files.length - 1; i >= 1; i--) {
      if (files[i][1] === id) filesSheet.deleteRow(i + 1);
    }
  }
  
  return { success: true };
}

function updateProcedure(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Tramites');
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0].map(function(h) { return h.toString().trim(); });
  
  var procedureFound = false;
  var clientEmail = '';

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      procedureFound = true;
      clientEmail = rows[i][2]; // clientEmail column
      for (var key in data) {
        var colIndex = headers.indexOf(key);
        if (colIndex !== -1) {
          sheet.getRange(i + 1, colIndex + 1).setValue(data[key]);
        }
      }
      break;
    }
  }

  if (!procedureFound) throw new Error('Trámite no encontrado');

  // Unified update: if client fields are updated, also update the user record
  if (clientEmail && (data.clientName || data.clientPhone || data.clientAddress || data.idNumber)) {
    var usersSheet = ss.getSheetByName('Usuarios');
    var usersRows = usersSheet.getDataRange().getValues();
    for (var j = 1; j < usersRows.length; j++) {
      if (usersRows[j][2] === clientEmail) {
        if (data.clientName) usersSheet.getRange(j + 1, 2).setValue(data.clientName);
        if (data.clientPhone) usersSheet.getRange(j + 1, 6).setValue(data.clientPhone);
        if (data.clientAddress) usersSheet.getRange(j + 1, 7).setValue(data.clientAddress);
        if (data.idNumber) usersSheet.getRange(j + 1, 8).setValue(data.idNumber);
        break;
      }
    }
  }

  return { success: true };
}

function getProcedureTypes() {
  return getSheetData('TiposTramite');
}

function createProcedureType(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TiposTramite');
  var id = Utilities.getUuid();
  sheet.appendRow([id, data.name]);
  return { id: id };
}

function updateProcedureStatus(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tramites');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      sheet.getRange(i + 1, 4).setValue(data.status);
      return { success: true };
    }
  }
  throw new Error('Trámite no encontrado');
}

function assignTechnician(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Tramites');
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0].map(function(h) { return h.toString().trim(); });
  var colIdx = headers.indexOf('technicianEmail');
  
  if (colIdx === -1) throw new Error('Columna technicianEmail no encontrada');

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.procedureId) {
      sheet.getRange(i + 1, colIdx + 1).setValue(data.technicianEmail);
      return { success: true };
    }
  }
  throw new Error('Trámite no encontrado');
}

function updateProcedureSteps(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Tramites');
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0].map(function(h) { return h.toString().trim(); });
  var colIdx = headers.indexOf('completedSteps');
  
  if (colIdx === -1) throw new Error('Columna completedSteps no encontrada');

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.procedureId) {
      sheet.getRange(i + 1, colIdx + 1).setValue(data.completedSteps);
      return { success: true };
    }
  }
  throw new Error('Trámite no encontrado');
}

function getProcedureByClientId(data) {
  var idNumber = data.idNumber.toString();
  var users = getSheetData('Usuarios');
  var client = users.find(function(u) { 
    return u.idNumber && u.idNumber.toString() === idNumber; 
  });
  
  if (!client) return [];
  
  // Now get all procedures for this client email
  return getProcedures({ role: 'client', email: client.email });
}

function getLogs(data) {
  var logs = getSheetData('Bitacora');
  return logs.filter(function(l) { return l.procedureId === data.procedureId; });
}

function addLog(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Bitacora');
  var id = Utilities.getUuid();
  var date = new Date().toISOString();
  sheet.appendRow([id, data.procedureId, date, data.technicianEmail, data.note]);
  return { id: id };
}

function getUsers(data) {
  return getSheetData('Usuarios');
}

function createUser(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Usuarios');
  var id = Utilities.getUuid();
  sheet.appendRow([id, data.name, data.email, data.password, data.role, data.phone || '', data.address || '', data.idNumber || '']);
  return { id: id };
}

function updateUser(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Usuarios');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][2] === data.email) {
      sheet.getRange(i + 1, 2).setValue(data.name);
      sheet.getRange(i + 1, 6).setValue(data.phone);
      sheet.getRange(i + 1, 7).setValue(data.address);
      return { success: true };
    }
  }
  throw new Error('Usuario no encontrado');
}

function getFinancials(data) {
  var financials = getSheetData('Finanzas');
  return financials.filter(function(f) { return f.procedureId === data.procedureId; });
}

function addFinancialItem(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Finanzas');
  var id = Utilities.getUuid();
  sheet.appendRow([id, data.procedureId, data.item, data.totalValue, data.paidAmount, new Date().toISOString()]);
  return { id: id };
}

function updateFinancialItem(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Finanzas');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      sheet.getRange(i + 1, 3).setValue(data.item);
      sheet.getRange(i + 1, 4).setValue(data.totalValue);
      sheet.getRange(i + 1, 5).setValue(data.paidAmount);
      return { success: true };
    }
  }
  throw new Error('Rubro no encontrado');
}

function deleteFinancialItem(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Finanzas');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  throw new Error('Rubro no encontrado');
}

function getFinancialSummary() {
  var procedures = getSheetData('Tramites');
  var financials = getSheetData('Finanzas');
  
  var summary = procedures.map(function(p) {
    var procFins = financials.filter(function(f) { return f.procedureId === p.id; });
    var totalIncome = procFins.reduce(function(sum, f) { return sum + (Number(f.paidAmount) || 0); }, 0);
    var totalValue = procFins.reduce(function(sum, f) { return sum + (Number(f.totalValue) || 0); }, 0);
    
    return {
      id: p.id,
      title: p.title,
      clientEmail: p.clientEmail,
      procedureType: p.procedureType,
      totalValue: totalValue,
      totalIncome: totalIncome,
      pending: totalValue - totalIncome
    };
  });
  
  return summary;
}

function getFiles(data) {
  var files = getSheetData('Archivos');
  return files.filter(function(f) { return f.procedureId === data.procedureId; });
}

function uploadFile(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tramitesSheet = ss.getSheetByName('Tramites');
  var tramitesRows = tramitesSheet.getDataRange().getValues();
  var headers = tramitesRows[0].map(function(h) { return h.toString().trim(); });
  var urlIdx = headers.indexOf('driveUrl');
  
  var folderId = '';
  if (urlIdx !== -1) {
    for (var i = 1; i < tramitesRows.length; i++) {
      if (tramitesRows[i][0] === data.procedureId) {
        var driveUrl = tramitesRows[i][urlIdx];
        if (driveUrl) {
          folderId = driveUrl.split('/folders/')[1];
          if (folderId && folderId.includes('?')) folderId = folderId.split('?')[0];
        }
        break;
      }
    }
  }

  var folder;
  if (folderId) {
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (e) {
      console.error('No se pudo encontrar la carpeta del trámite: ' + e.toString());
    }
  }

  if (!folder) {
    var folderName = 'Legarq_Archivos_Generales';
    var folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }
  }
  
  var contentType = data.base64.substring(5, data.base64.indexOf(';'));
  var bytes = Utilities.base64Decode(data.base64.split(',')[1]);
  var blob = Utilities.newBlob(bytes, contentType, data.name);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Archivos');
  var id = Utilities.getUuid();
  sheet.appendRow([id, data.procedureId, data.name, file.getUrl(), contentType, new Date().toISOString()]);
  
  return { id: id, url: file.getUrl() };
}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <Database className="mx-auto h-12 w-12 text-[#E3000F]" />
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
            Configuración de Base de Datos
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            Siga estos pasos para conectar la aplicación con Google Sheets.
          </p>
        </div>

        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-8 space-y-8">
            
            {/* Step 1 */}
            <div>
              <h3 className="text-xl font-bold flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1A1A1A] text-white text-sm">1</span>
                Crear Hoja de Cálculo
              </h3>
              <p className="text-gray-600 ml-11">
                Vaya a <a href="https://sheets.google.com/create" target="_blank" rel="noreferrer" className="text-[#E3000F] hover:underline">Google Sheets</a> y cree un documento en blanco. No es necesario crear las pestañas, el sistema lo hará automáticamente.
              </p>
            </div>

            {/* Step 2 */}
            <div>
              <h3 className="text-xl font-bold flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1A1A1A] text-white text-sm">2</span>
                Añadir el Código
              </h3>
              <div className="ml-11 space-y-4">
                <p className="text-gray-600">
                  En el menú superior de la hoja de cálculo, haga clic en <strong>Extensiones</strong> {'>'} <strong>Apps Script</strong>.
                  Borre todo el código que aparece y pegue el siguiente:
                </p>
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto max-h-64">
                    <code>{scriptCode}</code>
                  </pre>
                  <button
                    onClick={handleCopy}
                    className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-md text-white transition-colors"
                  >
                    {copied ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div>
              <h3 className="text-xl font-bold flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1A1A1A] text-white text-sm">3</span>
                Autorizar y Publicar
              </h3>
              <div className="ml-11 text-gray-600 space-y-4">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                  <p className="text-amber-800 font-bold mb-2">⚠️ MUY IMPORTANTE - PASO CRÍTICO:</p>
                  <p className="text-amber-700 text-sm">
                    Antes de publicar, debe autorizar el script para que pueda crear carpetas en su Google Drive:
                  </p>
                  <ol className="list-decimal ml-5 mt-2 text-amber-700 text-sm space-y-1">
                    <li>En la barra superior del editor de Apps Script, busque el menú desplegable que dice <strong>'initSheets'</strong>.</li>
                    <li>Cámbielo por <strong>'autorizar'</strong>.</li>
                    <li>Haga clic en el botón <strong>'Ejecutar'</strong> (ícono de triángulo).</li>
                    <li>Siga los pasos de Google para conceder los permisos (haga clic en "Configuración avanzada" e "Ir a Legarq (no seguro)" si aparece una advertencia).</li>
                  </ol>
                </div>
                
                <p>1. Una vez autorizado, haga clic en el botón azul <strong>Implementar</strong> (arriba a la derecha) y seleccione <strong>Nueva implementación</strong>.</p>
                <p>2. Haga clic en el ícono de engranaje junto a "Seleccionar tipo" y elija <strong>Aplicación web</strong>.</p>
                <p>3. En "Ejecutar como", seleccione <strong>Yo</strong>.</p>
                <p>4. En "Quién tiene acceso", seleccione <strong>Cualquier persona</strong>.</p>
                <p>5. Haga clic en <strong>Implementar</strong>.</p>
                <p>6. Copie la <strong>URL de la aplicación web</strong> que se genera.</p>
              </div>
            </div>

            {/* Step 4 */}
            <div>
              <h3 className="text-xl font-bold flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1A1A1A] text-white text-sm">4</span>
                Configurar la Variable de Entorno
              </h3>
              <div className="ml-11 text-gray-600 space-y-4">
                <p>
                  Vuelva a AI Studio, haga clic en el ícono de engranaje (<Settings className="inline w-4 h-4" />) en la esquina superior derecha para abrir <strong>Settings</strong>.
                </p>
                <p>
                  Vaya a <strong>Secrets</strong>, escriba <code>VITE_APPS_SCRIPT_URL</code> y presione Enter. Pegue la URL que copió en el paso anterior y presione Enter nuevamente.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-4">
                  <p className="text-blue-800 font-medium">Una vez configurado, pruebe la conexión:</p>
                  <div className="mt-4 flex flex-col gap-3">
                    <button
                      onClick={handleTest}
                      disabled={testing}
                      className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
                      Probar Conexión
                    </button>
                    {testResult && (
                      <div className={clsx("p-3 rounded-md text-sm", testResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                        {testResult.message}
                      </div>
                    )}
                  </div>
                  <p className="mt-4 text-blue-800 font-medium">Credenciales iniciales:</p>
                  <ul className="mt-2 text-sm text-blue-700 space-y-1">
                    <li>Admin: <strong>admin@legarconstructora.com</strong> / admin123</li>
                    <li>Técnico: <strong>tecnico@legarconstructora.com</strong> / tech123</li>
                    <li>Cliente: <strong>cliente@legarconstructora.com</strong> / cliente123</li>
                  </ul>
                </div>
                <div className="mt-6">
                  <Link to="/login" className="inline-flex justify-center py-2.5 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1A1A1A] hover:bg-[#E3000F] transition-colors">
                    Ir al Login
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
