/**
 * @fileoverview Backend para Gestión de Trámites Legar - FULL VERSION
 * @author Edison Daniel
 */

// ==============================================================================
// 1. EJECUTA ESTA FUNCIÓN PRIMERO PARA FORZAR LOS PERMISOS
// ==============================================================================
function FORZAR_PERMISOS_NUCLEARES() {
  try {
    var doc = DocumentApp.create('TEST_PERMISOS_LEGARQ');
    var file = DriveApp.getFileById(doc.getId());
    file.setTrashed(true);
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
    folder = DriveApp.getFolderById(parentId);
    Logger.log("✅ Carpeta original encontrada: " + folder.getName());
  } catch (e) {
    Logger.log("⚠️ Creando una nueva carpeta principal en tu Drive...");
    folder = DriveApp.createFolder("LEGARQ_TRAMITES_PRINCIPAL");
    Logger.log("✅ NUEVA CARPETA CREADA CON ÉXITO.");
  }
  
  initSheets();
  Logger.log("✅ SISTEMA INICIALIZADO CORRECTAMENTE");
}

function initSheets() {
  try { DriveApp.getRootFolder(); } catch (e) { Logger.log(e); }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var sheets = [
    { name: 'Usuarios', headers: ['id', 'name', 'username', 'password', 'role', 'phone', 'address', 'idNumber', 'permissions'] },
    { name: 'Tramites', headers: ['id', 'code', 'title', 'clientUsername', 'status', 'description', 'createdAt', 'driveFolderId', 'driveUrl', 'technicianUsername', 'completedSteps', 'expectedValue', 'otherAgreements', 'clientName', 'idNumber', 'procedureType'] },
    { name: 'Finanzas', headers: ['id', 'procedureId', 'type', 'category', 'description', 'amount', 'date', 'fileUrl'] },
    { name: 'Bitacora', headers: ['id', 'procedureId', 'date', 'technicianUsername', 'note', 'isExternal'] },
    { name: 'Archivos', headers: ['id', 'procedureId', 'name', 'driveId', 'mimeType', 'url', 'date'] },
    { name: 'TiposTramite', headers: ['id', 'name', 'steps'] },
    { name: 'Cuentas', headers: ['id', 'name'] }
  ];

  sheets.forEach(function(s) {
    var sheet = ss.getSheetByName(s.name);
    if (!sheet) {
      sheet = ss.insertSheet(s.name);
      sheet.appendRow(s.headers);
      if (s.name === 'Usuarios') {
        sheet.appendRow(['1', 'Administrador', 'admin', 'admin123', 'admin', '0999999999', 'Oficina Central', '1700000001', '["all"]']);
      }
    } else {
      ensureColumns(sheet, s.headers);
    }
  });
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
    if (action !== 'ping') initSheets();
    
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
    else if (action === 'deleteUser') result = deleteUser(data);
    else if (action === 'createDriveFolder') result = createDriveFolderAction(data);
    else if (action === 'getTechnicianActivityReport') result = getTechnicianActivityReport(data);
    else if (action === 'getAccounts') result = getAccounts(data);
    else if (action === 'createAccount') result = createAccount(data);
    else if (action === 'updateAccount') result = updateAccount(data);
    else if (action === 'deleteAccount') result = deleteAccount(data);
    else if (action === 'checkDuplicateIdNumber') result = checkDuplicateIdNumber(data);
    else throw new Error('Acción no válida: ' + action);
    
    return response({success: true, data: result});
  } catch (err) {
    return response({success: false, error: err.toString()});
  }
}

function response(res) {
  return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
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
    for (var j = 0; j < headers.length; j++) { obj[headers[j]] = data[i][j]; }
    result.push(obj);
  }
  return result;
}

function login(data) {
  var users = getSheetData('Usuarios');
  var user = users.find(function(u) { 
    return u.username.toString().trim() === data.username.toString().trim() && 
           u.password.toString().trim() === data.password.toString().trim(); 
  });
  if (!user) throw new Error('Credenciales incorrectas');
  return user;
}

function getProcedures(data) {
  var procedures = getSheetData('Tramites');
  var users = getSheetData('Usuarios');
  var userMap = {};
  users.forEach(function(u) { userMap[u.username] = u.name; });
  procedures.forEach(function(p) { if (p.technicianUsername) p.technicianName = userMap[p.technicianUsername] || p.technicianUsername; });

  if (data.role === 'client') return procedures.filter(function(p) { return p.clientUsername === data.username; });
  if (data.role === 'tech') return procedures.filter(function(p) { return p.technicianUsername === data.username; });
  return procedures;
}

function getProcedureByClientId(data) {
  var searchId = (data.idNumber || '').toString().trim();
  if (!searchId) throw new Error('Cédula no proporcionada');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var procedures = [];
  var clientData = null;
  var searchTerms = [searchId, searchId.replace(/[^0-9]/g, ''), searchId.toLowerCase()].filter(function(v, i, a) { return v && a.indexOf(v) === i; });

  var userSheet = ss.getSheetByName('Usuarios');
  if (userSheet) {
    var userValues = userSheet.getDataRange().getValues();
    var userHeaders = userValues[0];
    for (var i = 1; i < userValues.length; i++) {
      var isMatch = userValues[i].some(function(cell) {
        var val = (cell || '').toString().trim();
        return searchTerms.some(function(t) { return val === t || val.replace(/[^0-9]/g, '') === t; });
      });
      if (isMatch) {
        clientData = {};
        userHeaders.forEach(function(h, k) { if (h !== 'password') clientData[h] = userValues[i][k]; });
        break;
      }
    }
  }

  var tramitesSheet = ss.getSheetByName('Tramites');
  var logsSheet = ss.getSheetByName('Bitacora');
  var allLogs = logsSheet ? getSheetData('Bitacora') : [];

  if (tramitesSheet) {
    var tValues = tramitesSheet.getDataRange().getValues();
    var tHeaders = tValues[0];
    for (var r = 1; r < tValues.length; r++) {
      var isMatch = false;
      if (clientData && clientData.username && tValues[r][tHeaders.indexOf('clientUsername')] === clientData.username) isMatch = true;
      if (!isMatch) {
        isMatch = tValues[r].some(function(cell) {
          var val = (cell || '').toString().trim();
          return searchTerms.some(function(t) { return val === t || val.replace(/[^0-9]/g, '') === t; });
        });
      }
      if (isMatch) {
        var tObj = {};
        tHeaders.forEach(function(h, c) { tObj[h] = tValues[r][c]; });
        tObj.logs = allLogs.filter(function(l) { return l.procedureId === tObj.id && (l.isExternal === true || l.isExternal === 'true'); });
        procedures.push(tObj);
      }
    }
  }

  var unique = [];
  var seen = {};
  procedures.forEach(function(p) { if (p.id && !seen[p.id]) { unique.push(p); seen[p.id] = true; } });
  if (unique.length === 0 && !clientData) throw new Error('No se encontraron datos para la cédula: ' + searchId);
  return { client: clientData, procedures: unique };
}

function getOrCreateMainFolder() {
  var folders = DriveApp.getFoldersByName("LEGARQ_TRAMITES_PRINCIPAL");
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder("LEGARQ_TRAMITES_PRINCIPAL");
}

function createProcedure(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Tramites');
  var id = Utilities.getUuid();
  
  // Generar código automático único (TR-0001, TR-0002, etc)
  var lastRow = sheet.getLastRow();
  var code = 'TR-0001';
  if (lastRow > 1) {
    var codes = sheet.getRange(2, 2, lastRow - 1, 1).getValues().flat();
    var maxNum = 0;
    codes.forEach(function(c) {
      if (c && c.toString().startsWith('TR-')) {
        var num = parseInt(c.toString().split('-')[1]);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    code = 'TR-' + (maxNum + 1).toString().padStart(4, '0');
  }
  
  var clientUsername = data.clientUsername || '';
  
  // Si no hay username pero hay nombre, creamos un usuario base
  if (!clientUsername && data.clientName) {
    var users = getSheetData('Usuarios');
    var searchId = (data.idNumber || '').toString().trim();
    var existing = searchId ? users.find(function(u) { return u.idNumber.toString().trim() === searchId; }) : null;
    
    if (existing) {
      clientUsername = existing.username;
    } else {
      // Crear usuario base
      var suffix = searchId ? searchId.substring(searchId.length - 4) : Math.floor(1000 + Math.random() * 9000);
      clientUsername = (data.clientName || 'cliente').toLowerCase().replace(/\s+/g, '.') + '.' + suffix;
      ss.getSheetByName('Usuarios').appendRow([
        Utilities.getUuid(), 
        data.clientName, 
        clientUsername, 
        searchId || '12345', 
        'client', 
        '', 
        '', 
        searchId || '', 
        '[]'
      ]);
    }
  }

  var procFolder;
  try {
    var parent = getOrCreateMainFolder();
    procFolder = parent.createFolder('Trámite: ' + data.title + ' (' + id.substring(0,8) + ')');
    procFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) { Logger.log(e); }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function(h) {
    return {
      id: id, code: code, title: data.title, clientUsername: clientUsername,
      status: 'En proceso', description: data.description || '', createdAt: new Date().toISOString(),
      driveFolderId: procFolder ? procFolder.getId() : '', driveUrl: procFolder ? procFolder.getUrl() : '',
      technicianUsername: data.technicianUsername || '', expectedValue: data.expectedValue || 0,
      clientName: data.clientName || '', idNumber: data.idNumber || '', procedureType: data.procedureType || ''
    }[h] || '';
  });
  sheet.appendRow(row);
  return { id: id, code: code, driveUrl: procFolder ? procFolder.getUrl() : null };
}

function updateProcedureStatus(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tramites');
  var rows = sheet.getDataRange().getValues();
  var idx = rows[0].indexOf('status');
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) { sheet.getRange(i + 1, idx + 1).setValue(data.status); return { success: true }; }
  }
  throw new Error('Trámite no encontrado');
}

function assignTechnician(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tramites');
  var rows = sheet.getDataRange().getValues();
  var idx = rows[0].indexOf('technicianUsername');
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.procedureId) { sheet.getRange(i + 1, idx + 1).setValue(data.technicianUsername); return { success: true }; }
  }
  throw new Error('Trámite no encontrado');
}

function updateProcedureSteps(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tramites');
  var rows = sheet.getDataRange().getValues();
  var idx = rows[0].indexOf('completedSteps');
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.procedureId) { sheet.getRange(i + 1, idx + 1).setValue(data.completedSteps); return { success: true }; }
  }
  throw new Error('Trámite no encontrado');
}

function addLog(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Bitacora');
  var id = Utilities.getUuid();
  sheet.appendRow([id, data.procedureId, new Date().toISOString(), data.technicianUsername, data.note, data.isExternal]);
  return { id: id };
}

function getLogs(data) { return getSheetData('Bitacora').filter(function(l) { return l.procedureId === data.procedureId; }); }

function getUsers(data) { return getSheetData('Usuarios').map(function(u) { delete u.password; return u; }); }

function createUser(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Usuarios');
  var id = Utilities.getUuid();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function(h) { return data[h] || (h === 'id' ? id : ''); });
  sheet.appendRow(row);
  return { id: id };
}

function updateUser(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Usuarios');
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][2] === data.username) {
      for (var key in data) {
        var idx = headers.indexOf(key);
        if (idx !== -1 && key !== 'username') sheet.getRange(i + 1, idx + 1).setValue(data[key]);
      }
      return { success: true };
    }
  }
  throw new Error('Usuario no encontrado');
}

function deleteUser(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Usuarios');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][2] === data.username) { sheet.deleteRow(i + 1); return { success: true }; }
  }
  throw new Error('Usuario no encontrado');
}

function getFinancials(data) { return getSheetData('Finanzas').filter(function(f) { return f.procedureId === data.procedureId; }); }

function addFinancialItem(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Finanzas');
  var id = Utilities.getUuid();
  sheet.appendRow([id, data.procedureId, data.type, data.category, data.description, data.amount, new Date().toISOString(), data.fileUrl, data.isReimbursable || false, data.reimburseTo || '']);
  return { id: id };
}

function updateFinancialItem(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Finanzas');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      if (data.type !== undefined) sheet.getRange(i + 1, 3).setValue(data.type);
      if (data.category !== undefined) sheet.getRange(i + 1, 4).setValue(data.category);
      if (data.description !== undefined) sheet.getRange(i + 1, 5).setValue(data.description);
      if (data.amount !== undefined) sheet.getRange(i + 1, 6).setValue(data.amount);
      if (data.fileUrl !== undefined) sheet.getRange(i + 1, 8).setValue(data.fileUrl);
      if (data.isReimbursable !== undefined) sheet.getRange(i + 1, 9).setValue(data.isReimbursable);
      if (data.reimburseTo !== undefined) sheet.getRange(i + 1, 10).setValue(data.reimburseTo);
      return { success: true };
    }
  }
  throw new Error('Rubro no encontrado');
}

function deleteFinancialItem(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Finanzas');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) { sheet.deleteRow(i + 1); return { success: true }; }
  }
  throw new Error('Rubro no encontrado');
}

function getFinancialSummary() { return { transactions: getSheetData('Finanzas'), procedures: getSheetData('Tramites') }; }

function uploadFile(data) {
  var parent = getOrCreateMainFolder();
  var bytes = Utilities.base64Decode(data.base64.split(',')[1]);
  var file = parent.createFile(Utilities.newBlob(bytes, data.mimeType, data.name));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var id = Utilities.getUuid();
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Archivos').appendRow([id, data.procedureId, data.name, file.getId(), data.mimeType, file.getUrl(), new Date().toISOString()]);
  return { id: id, url: file.getUrl() };
}

function getFiles(data) { return getSheetData('Archivos').filter(function(f) { return f.procedureId === data.procedureId; }); }

function getProcedureTypes() { return getSheetData('TiposTramite'); }

function createProcedureType(data) {
  var id = Utilities.getUuid();
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TiposTramite').appendRow([id, data.name, data.steps]);
  return { id: id };
}

function updateProcedureType(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TiposTramite');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) { sheet.getRange(i + 1, 2).setValue(data.name); sheet.getRange(i + 1, 3).setValue(data.steps); return { success: true }; }
  }
  throw new Error('Tipo no encontrado');
}

function deleteProcedureType(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TiposTramite');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) { sheet.deleteRow(i + 1); return { success: true }; }
  }
  throw new Error('Tipo no encontrado');
}

function updateProcedure(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tramites');
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      for (var key in data) {
        var idx = headers.indexOf(key);
        if (idx !== -1 && key !== 'id') sheet.getRange(i + 1, idx + 1).setValue(data[key]);
      }
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
      // Delete related data
      deleteRowsByColumn('Finanzas', 1, data.id); // procedureId is column 1 (0-indexed is 1)
      deleteRowsByColumn('Bitacora', 1, data.id);
      deleteRowsByColumn('Archivos', 1, data.id);
      return { success: true }; 
    }
  }
  throw new Error('Trámite no encontrado');
}

function createDriveFolderAction(data) {
  var parent = getOrCreateMainFolder();
  var folder = parent.createFolder('Trámite: ' + data.title);
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tramites');
  var rows = sheet.getDataRange().getValues();
  var idx = rows[0].indexOf('driveUrl');
  var idIdx = rows[0].indexOf('driveFolderId');
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.procedureId) {
      sheet.getRange(i + 1, idIdx + 1).setValue(folder.getId());
      sheet.getRange(i + 1, idx + 1).setValue(folder.getUrl());
      return { driveUrl: folder.getUrl() };
    }
  }
  return { driveUrl: folder.getUrl() };
}

function getTechnicianActivityReport() { return { logs: getSheetData('Bitacora'), procedures: getSheetData('Tramites'), technicians: getSheetData('Usuarios').filter(function(u) { return u.role === 'tech'; }) }; }
function getAccounts() { return getSheetData('Cuentas'); }
function createAccount(data) { var id = Utilities.getUuid(); SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Cuentas').appendRow([id, data.name]); return { id: id }; }
function updateAccount(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Cuentas');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === data.id.toString()) { sheet.getRange(i + 1, 2).setValue(data.name); return { success: true }; }
  }
  throw new Error('Cuenta no encontrada');
}
function deleteAccount(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Cuentas');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === data.id.toString()) { sheet.deleteRow(i + 1); return { success: true }; }
  }
  throw new Error('Cuenta no encontrada');
}

function checkDuplicateIdNumber(data) {
  var users = getSheetData('Usuarios');
  var dup = users.find(function(u) { return u.idNumber.toString().trim() === data.idNumber.toString().trim() && u.username !== data.excludeUsername; });
  return { exists: !!dup, name: dup ? dup.name : '' };
}

function deleteRowsByColumn(sheetName, colIndex, value) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) { if (data[i][colIndex].toString() === value.toString()) { sheet.deleteRow(i + 1); } }
}
