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

  const scriptCode = `/**
 * @fileoverview Backend para Gestión de Trámites Legar
 * @author Edison Daniel
 */

// ==============================================================================
// 1. EJECUTA ESTA FUNCIÓN PRIMERO PARA FORZAR LOS PERMISOS
// ==============================================================================
function FORZAR_PERMISOS_NUCLEARES() {
  try {
    // Crear un archivo de Google Docs y borrarlo fuerza los permisos máximos
    var doc = DocumentApp.create('TEST_PERMISOS_LEGARQ');
    var file = DriveApp.getFileById(doc.getId());
    file.setTrashed(true);
    
    // Crear una hoja de cálculo y borrarla
    var ss = SpreadsheetApp.create('TEST_PERMISOS_SHEETS');
    var ssFile = DriveApp.getFileById(ss.getId());
    ssFile.setTrashed(true);
    
    Logger.log("✅ EXCELENTE: Los permisos de Drive y Sheets han sido concedidos correctamente.");
    Logger.log("👉 Ahora ejecuta la función 'setup'");
  } catch (e) {
    Logger.log("❌ Error al forzar permisos: " + e.toString());
  }
}

// ==============================================================================
// 2. LUEGO EJECUTA ESTA FUNCIÓN PARA CONFIGURAR TODO
// ==============================================================================
function setup() {
  var parentId = '1HwVT_hs0frirkp4Lznjby8M9oL0-tvm5';
  var folder;
  
  try {
    // Intentamos acceder a la carpeta original
    folder = DriveApp.getFolderById(parentId);
    Logger.log("✅ Carpeta original encontrada: " + folder.getName());
  } catch (e) {
    // SI FALLA (Acceso denegado), CREAMOS UNA NUEVA CARPETA AUTOMÁTICAMENTE
    Logger.log("⚠️ ATENCIÓN: No tienes acceso a la carpeta con ID " + parentId);
    Logger.log("⚠️ Creando una nueva carpeta principal en tu Drive...");
    
    folder = DriveApp.createFolder("LEGARQ_TRAMITES_PRINCIPAL");
    Logger.log("✅ NUEVA CARPETA CREADA CON ÉXITO.");
    Logger.log("🔥 IMPORTANTE: El nuevo ID de tu carpeta es: " + folder.getId());
    Logger.log("👉 Por favor, copia ese ID y reemplázalo en la variable 'parentId' de este código si deseas usarlo en el futuro.");
  }
  
  initSheets();
  
  Logger.log("=========================================================");
  Logger.log("✅ SISTEMA INICIALIZADO CORRECTAMENTE");
  Logger.log("Ya puedes ir a Implementar -> Nueva implementación.");
  Logger.log("=========================================================");
}

function initSheets() {
  // Forzar detección de permisos de Drive
  try { DriveApp.getRootFolder(); } catch (e) { Logger.log(e); }
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Usuarios
  var usersSheet = ss.getSheetByName('Usuarios');
  if (!usersSheet) {
    usersSheet = ss.insertSheet('Usuarios');
    usersSheet.appendRow(['id', 'name', 'username', 'password', 'role', 'phone', 'address', 'idNumber']);
    usersSheet.appendRow(['1', 'Administrador', 'admin', 'admin123', 'admin', '0999999999', 'Oficina Central', '1700000001']);
    usersSheet.appendRow(['2', 'Técnico', 'tecnico', 'tech123', 'tech', '0988888888', 'Sector Norte', '1700000002']);
    usersSheet.appendRow(['3', 'Cliente', 'cliente', 'cliente123', 'client', '0977777777', 'Av. Principal 123', '1700000003']);
  }

  // 2. Tramites
  var proceduresSheet = ss.getSheetByName('Tramites');
  var procHeaders = ['id', 'title', 'clientUsername', 'status', 'description', 'createdAt', 'driveFolderId', 'driveUrl', 'technicianUsername', 'completedSteps', 'expectedValue', 'otherAgreements', 'clientName', 'idNumber', 'procedureType'];
  if (!proceduresSheet) {
    proceduresSheet = ss.insertSheet('Tramites');
    proceduresSheet.appendRow(procHeaders);
  } else {
    ensureColumns(proceduresSheet, procHeaders);
  }

  // 3. Finanzas
  var financialSheet = ss.getSheetByName('Finanzas');
  if (!financialSheet) {
    financialSheet = ss.insertSheet('Finanzas');
    financialSheet.appendRow(['id', 'procedureId', 'type', 'category', 'description', 'amount', 'date', 'fileUrl', 'isReimbursable', 'reimburseTo']);
  }

  // 4. Bitacora
  var logsSheet = ss.getSheetByName('Bitacora');
  if (!logsSheet) {
    logsSheet = ss.insertSheet('Bitacora');
    logsSheet.appendRow(['id', 'procedureId', 'date', 'technicianUsername', 'note']);
  }

  // 5. Archivos
  var filesSheet = ss.getSheetByName('Archivos');
  if (!filesSheet) {
    filesSheet = ss.insertSheet('Archivos');
    filesSheet.appendRow(['id', 'procedureId', 'name', 'driveId', 'mimeType', 'url', 'date']);
  }

  // 6. Tipos de Trámite
  var typesSheet = ss.getSheetByName('TiposTramite');
  var typesHeaders = ['id', 'name', 'steps'];
  if (!typesSheet) {
    typesSheet = ss.insertSheet('TiposTramite');
    typesSheet.appendRow(typesHeaders);
    typesSheet.appendRow(['1', 'Legalización de Planos', '["Revisión de documentos","Levantamiento arquitectónico","Dibujo de planos","Ingreso a municipio","Aprobación"]']);
    typesSheet.appendRow(['2', 'Propiedad Horizontal', '["Escrituras","Planos aprobados","Cuadro de alícuotas","Ingreso a catastro","Resolución"]']);
    typesSheet.appendRow(['3', 'Licencia de Construcción', '["Certificado de gravamen","Planos aprobados","Pago de tasas","Emisión de licencia"]']);
  } else {
    ensureColumns(typesSheet, typesHeaders);
  }
}

function ensureColumns(sheet, expectedHeaders) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    sheet.appendRow(expectedHeaders);
    return;
  }
  var actualHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  for (var i = 0; i < expectedHeaders.length; i++) {
    if (actualHeaders.indexOf(expectedHeaders[i]) === -1) {
      sheet.getRange(1, actualHeaders.length + 1).setValue(expectedHeaders[i]);
      actualHeaders.push(expectedHeaders[i]);
    }
  }
}

function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    var action = params.action;
    var data = params.data;
    
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
    else if (action === 'updateProcedureType') result = updateProcedureType(data);
    else if (action === 'deleteProcedureType') result = deleteProcedureType(data);
    else if (action === 'updateProcedure') result = updateProcedure(data);
    else if (action === 'deleteProcedure') result = deleteProcedure(data);
    else if (action === 'createDriveFolder') result = createDriveFolderAction(data);
    else if (action === 'getTechnicianActivityReport') result = getTechnicianActivityReport(data);
    else throw new Error('Acción no válida: ' + action);
    
    return response({success: true, data: result});
  } catch (err) {
    var errorMsg = err.toString();
    if (errorMsg.indexOf('Acceso denegado: DriveApp') !== -1) {
      errorMsg = 'Error de permisos: Debes ejecutar la función "setup" manualmente en el editor de Apps Script para autorizar el acceso a Google Drive.';
    }
    return response({success: false, error: errorMsg});
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
  var username = (data.username || '').toString().trim();
  var password = (data.password || '').toString().trim();
  
  for (var i = 0; i < users.length; i++) {
    var sheetUsername = (users[i].username || '').toString().trim();
    var sheetPassword = (users[i].password || '').toString().trim();
    
    if (sheetUsername === username && sheetPassword === password) {
      return users[i];
    }
  }
  throw new Error('Credenciales incorrectas');
}

function updateUser(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Usuarios');
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var username = (data.username || '').toString().trim();
  
  for (var i = 1; i < rows.length; i++) {
    var sheetUsername = (rows[i][2] || '').toString().trim();
    if (sheetUsername === username) {
      for (var key in data) {
        var colIndex = headers.indexOf(key);
        if (colIndex !== -1 && key !== 'username') {
          sheet.getRange(i + 1, colIndex + 1).setValue(data[key]);
        }
      }
      SpreadsheetApp.flush();
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
  var users = getSheetData('Usuarios');
  
  // Mapa para búsqueda rápida de nombres
  var userMap = {};
  for (var i = 0; i < users.length; i++) {
    userMap[users[i].username] = users[i].name;
  }
  
  // Enriquecer trámites con el nombre del técnico
  for (var j = 0; j < procedures.length; j++) {
    if (procedures[j].technicianUsername) {
      procedures[j].technicianName = userMap[procedures[j].technicianUsername] || procedures[j].technicianUsername;
    }
  }

  if (data.role === 'client') {
    return procedures.filter(function(p) { return p.clientUsername === data.username; });
  }
  if (data.role === 'tech') {
    return procedures.filter(function(p) { return p.technicianUsername === data.username; });
  }
  return procedures;
}

function getOrCreateMainFolder() {
  var parentId = '1HwVT_hs0frirkp4Lznjby8M9oL0-tvm5';
  try {
    return DriveApp.getFolderById(parentId);
  } catch (e) {
    var folders = DriveApp.getFoldersByName("LEGARQ_TRAMITES_PRINCIPAL");
    if (folders.hasNext()) {
      return folders.next();
    } else {
      return DriveApp.createFolder("LEGARQ_TRAMITES_PRINCIPAL");
    }
  }
}

function createProcedure(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Tramites');
  var id = Utilities.getUuid();
  var date = new Date().toISOString();
  
  var clientUsername = data.clientUsername || '';
  if (!clientUsername && data.idNumber) {
    var users = getSheetData('Usuarios');
    var existingUser = null;
    var searchId = (data.idNumber || '').toString().trim();
    
    for (var i = 0; i < users.length; i++) {
      if ((users[i].idNumber || '').toString().trim() === searchId) {
        existingUser = users[i];
        break;
      }
    }
    
    if (existingUser) {
      clientUsername = existingUser.username;
    } else {
      clientUsername = (data.clientName || 'cliente').toLowerCase().replace(/\s+/g, '.') + '.' + data.idNumber.substring(data.idNumber.length - 4);
      var userSheet = ss.getSheetByName('Usuarios');
      userSheet.appendRow([
        Utilities.getUuid(),
        data.clientName || 'Nuevo Cliente',
        clientUsername,
        data.idNumber,
        'client',
        '',
        '',
        data.idNumber
      ]);
    }
  }

  var procFolder;
  try {
    var parentFolder = getOrCreateMainFolder();
    procFolder = parentFolder.createFolder('Trámite: ' + data.title + ' (' + id.substring(0,8) + ')');
    try {
      procFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (sharingError) {}
  } catch (e) {
    throw new Error("Error al crear carpeta en Drive: " + e.toString());
  }
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowData = [];
  for (var i = 0; i < headers.length; i++) { rowData.push(''); }
  
  var dataMap = {
    'id': id,
    'title': data.title,
    'clientUsername': clientUsername,
    'status': 'Nuevo',
    'description': data.description || '',
    'createdAt': date,
    'driveFolderId': procFolder ? procFolder.getId() : '',
    'driveUrl': procFolder ? procFolder.getUrl() : '',
    'technicianUsername': data.technicianUsername || '',
    'completedSteps': '',
    'expectedValue': data.expectedValue || 0,
    'otherAgreements': data.otherAgreements || '',
    'clientName': data.clientName || '',
    'idNumber': data.idNumber || '',
    'procedureType': data.procedureType || ''
  };
  
  for (var i = 0; i < headers.length; i++) {
    if (dataMap[headers[i]] !== undefined) {
      rowData[i] = dataMap[headers[i]];
    }
  }
  
  sheet.appendRow(rowData);
  return { id: id, driveUrl: procFolder ? procFolder.getUrl() : null, clientUsername: clientUsername };
}

function assignTechnician(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tramites');
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var colIndex = headers.indexOf('technicianUsername');
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.procedureId) {
      sheet.getRange(i + 1, colIndex + 1).setValue(data.technicianUsername);
      SpreadsheetApp.flush();
      return { success: true };
    }
  }
  throw new Error('Trámite no encontrado');
}

function updateProcedureSteps(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tramites');
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var colIndex = headers.indexOf('completedSteps');
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.procedureId) {
      sheet.getRange(i + 1, colIndex + 1).setValue(data.completedSteps);
      SpreadsheetApp.flush();
      return { success: true };
    }
  }
  throw new Error('Trámite no encontrado');
}

function getProcedureByClientId(data) {
  var searchId = (data.idNumber || '').toString().trim();
  if (!searchId) throw new Error('Cédula no proporcionada');
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var results = [];
  
  // Términos de búsqueda: original, solo números, y minúsculas
  var searchTerms = [
    searchId, 
    searchId.replace(/[^0-9]/g, ''), 
    searchId.toLowerCase()
  ].filter(function(v, i, a) { return v && a.indexOf(v) === i; });

  var sheetsToSearch = ['Tramites', 'Usuarios'];
  
  sheetsToSearch.forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    
    var values = sheet.getDataRange().getValues();
    var headers = values[0];
    
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var isMatch = false;
      
      for (var j = 0; j < row.length; j++) {
        var cellVal = (row[j] || '').toString().trim();
        var cellNorm = cellVal.replace(/[^0-9]/g, '');
        
        for (var t = 0; t < searchTerms.length; t++) {
          if (cellVal === searchTerms[t] || (cellNorm === searchTerms[t] && cellNorm !== '')) {
            isMatch = true;
            break;
          }
        }
        if (isMatch) break;
      }
      
      if (isMatch) {
        if (sheetName === 'Tramites') {
          var obj = {};
          for (var k = 0; k < headers.length; k++) obj[headers[k]] = row[k];
          results.push(obj);
        } else {
          // Si encontramos el usuario, buscamos sus trámites por username
          var lowerHeaders = headers.map(function(h){return h.toString().toLowerCase();});
          var usernameIdx = lowerHeaders.indexOf('username');
          if (usernameIdx !== -1) {
            var username = (row[usernameIdx] || '').toString().trim();
            var tramitesSheet = ss.getSheetByName('Tramites');
            if (tramitesSheet) {
              var tValues = tramitesSheet.getDataRange().getValues();
              var tHeaders = tValues[0];
              var tLowerHeaders = tHeaders.map(function(h){return h.toString().toLowerCase();});
              var uIdx = tLowerHeaders.indexOf('clientusername');
              if (uIdx !== -1) {
                for (var r = 1; r < tValues.length; r++) {
                  if ((tValues[r][uIdx] || '').toString().trim() === username) {
                    var tObj = {};
                    for (var c = 0; c < tHeaders.length; c++) tObj[tHeaders[c]] = tValues[r][c];
                    results.push(tObj);
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  // Eliminar duplicados por ID
  var uniqueResults = [];
  var seenIds = {};
  results.forEach(function(r) {
    if (r.id && !seenIds[r.id]) {
      uniqueResults.push(r);
      seenIds[r.id] = true;
    }
  });

  if (uniqueResults.length === 0) {
    throw new Error('No se encontraron trámites para la cédula: ' + searchId);
  }
  
  return uniqueResults;
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
  var folder = DriveApp.getFolderById(folderId);
  var contentType = data.base64.substring(5, data.base64.indexOf(';'));
  var bytes = Utilities.base64Decode(data.base64.split(',')[1]);
  var blob = Utilities.newBlob(bytes, contentType, data.name);
  var file = folder.createFile(blob);
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {}
  var filesSheet = ss.getSheetByName('Archivos');
  var fileId = Utilities.getUuid();
  filesSheet.appendRow([fileId, data.procedureId, data.name, file.getId(), contentType, file.getUrl(), new Date().toISOString()]);
  return { id: fileId, url: file.getUrl() };
}

function getFiles(data) {
  var files = getSheetData('Archivos');
  return files.filter(function(f) { return f.procedureId === data.procedureId; });
}

function updateProcedureStatus(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tramites');
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var colIndex = headers.indexOf('status');
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      sheet.getRange(i + 1, colIndex + 1).setValue(data.status);
      SpreadsheetApp.flush();
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
  sheet.appendRow([id, data.procedureId, new Date().toISOString(), data.technicianUsername, data.note]);
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
      if (rows[i][driveUrlCol]) return { driveUrl: rows[i][driveUrlCol] };
      var parentFolder = getOrCreateMainFolder();
      var procFolder = parentFolder.createFolder('Trámite: ' + data.title + ' (' + data.procedureId.substring(0,8) + ')');
      try { procFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
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
        if (colIndex !== -1) { sheet.getRange(i + 1, colIndex + 1).setValue(data[key]); }
      }
      SpreadsheetApp.flush();
      return { success: true };
    }
  }
  throw new Error('Trámite no encontrado');
}

function deleteProcedure(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tramites');
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
  return { procedures: getSheetData('Tramites'), transactions: getSheetData('Finanzas') };
}

function getUsers(data) {
  if (data.role !== 'admin' && data.role !== 'tech') throw new Error('No autorizado');
  var users = getSheetData('Usuarios');
  return users.map(function(u) {
    var copy = JSON.parse(JSON.stringify(u));
    delete copy.password;
    return copy;
  });
}

function getProcedureTypes(data) { return getSheetData('TiposTramite'); }

function createProcedureType(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TiposTramite');
  var id = Utilities.getUuid();
  sheet.appendRow([id, data.name, data.steps || '[]']);
  return { id: id };
}

function updateProcedureType(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TiposTramite');
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
      SpreadsheetApp.flush();
      return { success: true };
    }
  }
  throw new Error('Tipo de trámite no encontrado');
}

function deleteProcedureType(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TiposTramite');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  throw new Error('Tipo de trámite no encontrado');
}

function getTechnicianActivityReport(data) {
  if (data.role !== 'admin') throw new Error('No autorizado');
  var logs = getSheetData('Bitacora');
  var procedures = getSheetData('Tramites');
  var users = getSheetData('Usuarios');
  var technicians = users.filter(function(u) { return u.role === 'tech' || u.role === 'admin'; });
  return {
    logs: logs,
    procedures: procedures,
    technicians: technicians.map(function(u) { return { id: u.id, name: u.name, username: u.username }; })
  };
}

function createUser(data) {
  if (data.requesterRole !== 'admin') throw new Error('No autorizado');
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Usuarios');
  var id = Utilities.getUuid();
  sheet.appendRow([id, data.name, data.username, data.password, data.role, data.phone || '', data.address || '', data.idNumber || '']);
  return { id: id };
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
                    <li>Admin: <strong>admin</strong> / admin123</li>
                    <li>Técnico: <strong>tecnico</strong> / tech123</li>
                    <li>Cliente: <strong>cliente</strong> / cliente123</li>
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
