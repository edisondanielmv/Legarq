import React, { useState } from 'react';
import { Copy, Check, Code, AlertTriangle, ExternalLink } from 'lucide-react';

  const APPS_SCRIPT_CODE = `/**
 * @fileoverview Backend para Gestión de Trámites Legar
 * @author Edison Daniel
 * @version 1.1
 * 
 * IMPORTANTE: Este script requiere permisos de Google Drive y Google Sheets.
 * Si obtienes "Acceso denegado: DriveApp", ejecuta la función 'authorizeDrive' manualmente.
 */

function authorizeDrive() {
  // Esta función solo sirve para forzar la solicitud de permisos de Drive
  var root = DriveApp.getRootFolder();
  var parentId = '1HwVT_hs0frirkp4Lznjby8M9oL0-tvm5';
  var folder = DriveApp.getFolderById(parentId);
  Logger.log("Autorización exitosa. Carpeta principal encontrada: " + folder.getName());
  return "Autorización exitosa";
}

function initSheets() {
  // Forzar detección de permisos de Drive
  try { DriveApp.getRootFolder(); } catch (e) { Logger.log(e); }
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (ss.getSheetByName('Usuarios')) {
    // Check for missing columns in Tramites
    var proceduresSheet = ss.getSheetByName('Tramites');
    if (proceduresSheet) {
      var procHeaders = ['id', 'title', 'clientEmail', 'status', 'description', 'createdAt', 'driveFolderId', 'driveUrl', 'technicianEmail', 'completedSteps', 'expectedValue', 'otherAgreements', 'clientName', 'idNumber'];
      var existingHeaders = proceduresSheet.getRange(1, 1, 1, proceduresSheet.getLastColumn()).getValues()[0];
      for (var i = 0; i < procHeaders.length; i++) {
        if (existingHeaders.indexOf(procHeaders[i]) === -1) {
          proceduresSheet.getRange(1, existingHeaders.length + 1).setValue(procHeaders[i]);
          existingHeaders.push(procHeaders[i]);
        }
      }
    }
    return;
  }
  
  var usersSheet = ss.insertSheet('Usuarios');
  usersSheet.appendRow(['id', 'name', 'email', 'password', 'role', 'phone', 'address', 'idNumber']);
  usersSheet.appendRow(['1', 'Administrador', 'admin@legarconstructora.com', 'admin123', 'admin', '0999999999', 'Oficina Central', '1700000001']);
  usersSheet.appendRow(['2', 'Técnico', 'tecnico@legarconstructora.com', 'tech123', 'tech', '0988888888', 'Sector Norte', '1700000002']);
  usersSheet.appendRow(['3', 'Cliente', 'cliente@legarconstructora.com', 'cliente123', 'client', '0977777777', 'Av. Principal 123', '1700000003']);
  
  var proceduresSheet = ss.insertSheet('Tramites');
  proceduresSheet.appendRow(['id', 'title', 'clientEmail', 'status', 'description', 'createdAt', 'driveFolderId', 'driveUrl', 'technicianEmail', 'completedSteps', 'expectedValue', 'otherAgreements', 'clientName', 'idNumber']);
  
  var financialSheet = ss.insertSheet('Finanzas');
  financialSheet.appendRow(['id', 'procedureId', 'type', 'category', 'description', 'amount', 'date', 'fileUrl']);
  
  var logsSheet = ss.insertSheet('Bitacora');
  logsSheet.appendRow(['id', 'procedureId', 'date', 'technicianEmail', 'note']);

  var filesSheet = ss.getSheetByName('Archivos');
  if (!filesSheet) {
    filesSheet = ss.insertSheet('Archivos');
    filesSheet.appendRow(['id', 'procedureId', 'name', 'driveId', 'mimeType', 'url', 'date']);
  }

  var typesSheet = ss.getSheetByName('TiposTramite');
  if (!typesSheet) {
    typesSheet = ss.insertSheet('TiposTramite');
    typesSheet.appendRow(['id', 'name']);
    typesSheet.appendRow(['1', 'Legalización de Planos']);
    typesSheet.appendRow(['2', 'Propiedad Horizontal']);
    typesSheet.appendRow(['3', 'Licencia de Construcción']);
  }
}

function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    var action = params.action;
    var data = params.data;
    
    // Solo inicializamos si no es un ping, para ahorrar tiempo
    if (action !== 'ping') {
      initSheets();
    }
    
    var result;
    if (action === 'ping') result = { status: 'ok', timestamp: new Date().toISOString() };
    else if (action === 'login') result = login(data);
    else if (action === 'getProcedures') result = getProcedures(data);
    else if (action === 'createProcedure') result = createProcedure(data);
    else if (action === 'updateProcedureStatus') result = updateProcedureStatus(data);
    else if (action === 'assignTechnician') result = assignTechnician(data);
    else if (action === 'updateProcedureSteps') result = updateProcedureSteps(data);
    else if (action === 'getProcedureByClientId') result = getProcedureByClientId(data);
    else if (action === 'getLogs') result = getLogs(data);
    else if (action === 'addLog') result = addLog(data);
    else if (action === 'getUsers') result = getUsers(data);
    else if (action === 'createUser') result = createUser(data);
    else if (action === 'updateUser') result = updateUser(data);
    else if (action === 'getFinancials') result = getFinancials(data);
    else if (action === 'addFinancialItem') result = addFinancialItem(data);
    else if (action === 'updateFinancialItem') result = updateFinancialItem(data);
    else if (action === 'deleteFinancialItem') result = deleteFinancialItem(data);
    else if (action === 'getFinancialSummary') result = getFinancialSummary(data);
    else if (action === 'uploadFile') result = uploadFile(data);
    else if (action === 'getFiles') result = getFiles(data);
    else if (action === 'getProcedureTypes') result = getProcedureTypes(data);
    else if (action === 'createProcedureType') result = createProcedureType(data);
    else if (action === 'updateProcedure') result = updateProcedure(data);
    else if (action === 'deleteProcedure') result = deleteProcedure(data);
    else if (action === 'createDriveFolder') result = createDriveFolderAction(data);
    else throw new Error('Acción no válida: ' + action);
    
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

function updateUser(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Usuarios');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][2] === data.email) {
      sheet.getRange(i + 1, 2).setValue(data.name);
      sheet.getRange(i + 1, 6).setValue(data.phone);
      sheet.getRange(i + 1, 7).setValue(data.address);
      sheet.getRange(i + 1, 8).setValue(data.idNumber);
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
  sheet.appendRow([id, data.procedureId || '', data.type, data.category, data.description, data.amount, new Date().toISOString(), data.fileUrl || '']);
  return { id: id };
}

function updateFinancialItem(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Finanzas');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      sheet.getRange(i + 1, 3).setValue(data.type);
      sheet.getRange(i + 1, 4).setValue(data.category);
      sheet.getRange(i + 1, 5).setValue(data.description);
      sheet.getRange(i + 1, 6).setValue(data.amount);
      if (data.fileUrl) sheet.getRange(i + 1, 8).setValue(data.fileUrl);
      return { success: true };
    }
  }
  throw new Error('Rubro no encontrado');
}

function getProcedures(data) {
  var procedures = getSheetData('Tramites');
  if (data.role === 'client') {
    return procedures.filter(function(p) { return p.clientEmail === data.email; });
  }
  if (data.role === 'tech') {
    return procedures.filter(function(p) { return p.technicianEmail === data.email; });
  }
  return procedures;
}

function createProcedure(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Tramites');
  var id = Utilities.getUuid();
  var date = new Date().toISOString();
  
  // Crear carpeta en Drive para el trámite
  var procFolder;
  try {
    var parentFolderId = '1HwVT_hs0frirkp4Lznjby8M9oL0-tvm5'; 
    var parentFolder = DriveApp.getFolderById(parentFolderId);
    procFolder = parentFolder.createFolder('Trámite: ' + data.title + ' (' + id.substring(0,8) + ')');
    procFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    Logger.log("Error creating folder: " + e.toString());
    throw new Error("Error al crear carpeta en Drive: " + e.toString());
  }
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowData = new Array(headers.length).fill('');
  
  var dataMap = {
    'id': id,
    'title': data.title,
    'clientEmail': data.clientEmail || '',
    'status': 'Nuevo',
    'description': data.description,
    'createdAt': date,
    'driveFolderId': procFolder ? procFolder.getId() : '',
    'driveUrl': procFolder ? procFolder.getUrl() : '',
    'technicianEmail': data.technicianEmail || '',
    'completedSteps': '',
    'expectedValue': data.expectedValue || 0,
    'otherAgreements': data.otherAgreements || '',
    'clientName': data.clientName || '',
    'idNumber': data.idNumber || ''
  };
  
  for (var i = 0; i < headers.length; i++) {
    if (dataMap[headers[i]] !== undefined) {
      rowData[i] = dataMap[headers[i]];
    }
  }
  
  sheet.appendRow(rowData);
  return { id: id, driveUrl: procFolder ? procFolder.getUrl() : null };
}

function assignTechnician(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tramites');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.procedureId) {
      sheet.getRange(i + 1, 9).setValue(data.technicianEmail);
      return { success: true };
    }
  }
  throw new Error('Trámite no encontrado');
}

function updateProcedureSteps(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tramites');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.procedureId) {
      sheet.getRange(i + 1, 10).setValue(data.completedSteps);
      return { success: true };
    }
  }
  throw new Error('Trámite no encontrado');
}

function getProcedureByClientId(data) {
  var users = getSheetData('Usuarios');
  var client = users.find(function(u) { return u.idNumber === data.idNumber; });
  if (!client) throw new Error('Cliente no encontrado con esa cédula');
  
  var procs = getSheetData('Tramites');
  return procs.filter(function(p) { return p.clientEmail === client.email; });
}

function uploadFile(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var procSheet = ss.getSheetByName('Tramites');
  var procRows = procSheet.getDataRange().getValues();
  var folderId = '';
  
  for (var i = 1; i < procRows.length; i++) {
    if (procRows[i][0] === data.procedureId) {
      folderId = procRows[i][6];
      break;
    }
  }
  
  if (!folderId) throw new Error('Carpeta de trámite no encontrada');
  
  var folder;
  try {
    folder = DriveApp.getFolderById(folderId);
  } catch (e) {
    throw new Error('La carpeta de Drive no existe o no es accesible. Por favor, créala de nuevo.');
  }
  
  var contentType = data.base64.substring(5, data.base64.indexOf(';'));
  var bytes = Utilities.base64Decode(data.base64.split(',')[1]);
  var blob = Utilities.newBlob(bytes, contentType, data.name);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  var filesSheet = ss.getSheetByName('Archivos');
  var fileId = Utilities.getUuid();
  var date = new Date().toISOString();
  filesSheet.appendRow([fileId, data.procedureId, data.name, file.getId(), contentType, file.getUrl(), date]);
  
  return { id: fileId, url: file.getUrl() };
}

function getFiles(data) {
  var files = getSheetData('Archivos');
  return files.filter(function(f) { return f.procedureId === data.procedureId; });
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

function createDriveFolderAction(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Tramites');
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var driveFolderIdCol = headers.indexOf('driveFolderId');
  var driveUrlCol = headers.indexOf('driveUrl');
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.procedureId) {
      // Si ya tiene carpeta, no creamos otra
      if (rows[i][driveUrlCol]) return { driveUrl: rows[i][driveUrlCol] };
      
      var parentFolderId = '1HwVT_hs0frirkp4Lznjby8M9oL0-tvm5'; 
      var parentFolder = DriveApp.getFolderById(parentFolderId);
      var procFolder = parentFolder.createFolder('Trámite: ' + data.title + ' (' + data.procedureId.substring(0,8) + ')');
      procFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      sheet.getRange(i + 1, driveFolderIdCol + 1).setValue(procFolder.getId());
      sheet.getRange(i + 1, driveUrlCol + 1).setValue(procFolder.getUrl());
      
      return { driveUrl: procFolder.getUrl() };
    }
  }
  throw new Error('Trámite no encontrado');
}

function updateProcedure(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tramites');
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      for (var key in data) {
        if (key === 'id') continue;
        var colIndex = headers.indexOf(key);
        if (colIndex !== -1) {
          sheet.getRange(i + 1, colIndex + 1).setValue(data[key]);
        }
      }
      return { success: true };
    }
  }
  throw new Error('Trámite no encontrado');
}

function deleteProcedure(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Tramites');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  throw new Error('Trámite no encontrado');
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

function getFinancialSummary(data) {
  return {
    procedures: getSheetData('Tramites'),
    transactions: getSheetData('Finanzas')
  };
}

function getUsers(data) {
  if (data.role !== 'admin' && data.role !== 'tech') throw new Error('No autorizado');
  var users = getSheetData('Usuarios');
  // Remove passwords from response
  return users.map(function(u) {
    var copy = JSON.parse(JSON.stringify(u));
    delete copy.password;
    return copy;
  });
}

function getProcedureTypes(data) {
  return getSheetData('TiposTramite');
}

function createProcedureType(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TiposTramite');
  var id = Utilities.getUuid();
  sheet.appendRow([id, data.name]);
  return { id: id };
}

function createUser(data) {
  if (data.requesterRole !== 'admin') throw new Error('No autorizado');
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Usuarios');
  var id = Utilities.getUuid();
  sheet.appendRow([id, data.name, data.email, data.password, data.role]);
  return { id: id };
}
`;

export default function Settings() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
      <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-stone-200">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="p-2 md:p-3 bg-red-50 rounded-xl">
            <Code className="w-5 h-5 md:w-6 md:h-6 text-[#E3000F]" />
          </div>
          <div>
            <h2 className="text-lg md:text-2xl font-black text-stone-900 uppercase tracking-tight">Configuración de Backend</h2>
            <p className="text-stone-500 text-[10px] md:text-sm">Código de Google Apps Script para sincronización.</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 md:p-4 mb-4 md:mb-6 flex gap-3 md:gap-4">
          <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-amber-600 shrink-0" />
          <div className="text-[10px] md:text-sm text-amber-800">
            <p className="font-bold mb-1">¡Atención Administrador!</p>
            <p>Este código es esencial para el funcionamiento del sistema. Si realizas cambios en la estructura de la aplicación, debes actualizar el script en Google Apps Script:</p>
            <ol className="list-decimal ml-4 mt-2 space-y-1">
              <li>Copia el código completo.</li>
              <li>Ve a tu proyecto de Google Apps Script.</li>
              <li>Borra todo el código anterior y pega el nuevo.</li>
              <li>Guarda e implementa como Aplicación Web.</li>
            </ol>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute top-2 right-2 md:top-4 md:right-4 flex gap-2 z-10">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-all shadow-lg"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                  <span className="text-[10px] md:text-xs font-bold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-[10px] md:text-xs font-bold">Copiar</span>
                </>
              )}
            </button>
            <a 
              href="https://script.google.com/" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white border border-stone-200 text-stone-900 rounded-lg hover:bg-stone-50 transition-all shadow-sm"
            >
              <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
              <span className="text-[10px] md:text-xs font-bold">Abrir</span>
            </a>
          </div>
          
          <div className="bg-stone-950 rounded-xl p-4 md:p-6 overflow-hidden border border-stone-800">
            <pre className="text-stone-300 text-[10px] md:text-[13px] font-mono overflow-x-auto max-h-[400px] md:max-h-[500px] scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-transparent pt-10 md:pt-12">
              {APPS_SCRIPT_CODE}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
