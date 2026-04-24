/**
 * @fileoverview Backend para Gestión de Trámites Legar - VERSION V9 (FINAL STABLE)
 * Resuelve: Sincronización de información de clientes, duplicidad de datos y borrado atómico.
 * Corregido: Mezcla de información entre clientes y errores de referencia.
 */

// ==============================================================================
// 1. INICIALIZACIÓN Y CONFIGURACIÓN
// ==============================================================================

function setup() {
  initSheets();
  Logger.log("✅ SISTEMA INICIALIZADO - V9");
}

function initSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = [
    { name: 'Usuarios', headers: ['id', 'name', 'username', 'password', 'role', 'phone', 'address', 'idNumber', 'permissions', 'email'] },
    { name: 'Tramites', headers: ['id', 'code', 'title', 'clientUsername', 'status', 'description', 'createdAt', 'driveFolderId', 'driveUrl', 'technicianUsername', 'completedSteps', 'expectedValue', 'otherAgreements', 'clientName', 'idNumber', 'procedureType', 'clientEmail', 'propertyNumber'] },
    { name: 'Finanzas', headers: ['id', 'procedureId', 'type', 'category', 'description', 'amount', 'date', 'fileUrl', 'isReimbursable', 'reimburseTo'] },
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
        sheet.appendRow(['1', 'Administrador', 'admin', 'admin123', 'admin', '0999999999', 'Oficina Central', '1700000001', '["all"]', 'admin@legarq.com']);
      }
    } else {
      ensureColumns(sheet, s.headers);
    }
  });
}

function ensureColumns(sheet, expectedHeaders) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) { sheet.appendRow(expectedHeaders); return; }
  var actualHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  expectedHeaders.forEach(function(header) {
    if (actualHeaders.indexOf(header) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
    }
  });
}

// ==============================================================================
// 2. MANEJADOR API (doPost)
// ==============================================================================

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // 30 segundos de espera para concurrencia
    var params = JSON.parse(e.postData.contents);
    var action = params.action;
    var data = params.data;
    
    if (action !== 'ping') initSheets();
    
    var result;
    switch(action) {
      case 'ping': result = { status: 'ok' }; break;
      case 'login': result = login(data); break;
      case 'getProcedures': result = getProcedures(data); break;
      case 'createProcedure': result = createProcedure(data); break;
      case 'updateProcedure': result = updateProcedure(data); break;
      case 'deleteProcedure': result = deleteProcedure(data); break;
      case 'updateProcedureStatus': result = updateProcedureStatus(data); break;
      case 'assignTechnician': result = assignTechnician(data); break;
      case 'updateProcedureSteps': result = updateProcedureSteps(data); break;
      case 'getProcedureByClientId': result = getProcedureByClientId(data); break;
      case 'getLogs': result = getLogs(idFromData(data)); break;
      case 'addLog': result = addLog(data); break;
      case 'updateLog': result = updateLog(data); break;
      case 'deleteLog': result = deleteLog(data); break;
      case 'getUsers': result = getUsers(data); break;
      case 'createUser': result = createUser(data); break;
      case 'updateUser': result = updateUser(data); break;
      case 'deleteUser': result = deleteUser(data); break;
      case 'getFinancials': result = getFinancials(idFromData(data)); break;
      case 'addFinancialItem': result = addFinancialItem(data); break;
      case 'updateFinancialItem': result = updateFinancialItem(data); break;
      case 'deleteFinancialItem': result = deleteFinancialItem(data); break;
      case 'getProcedureTypes': result = getProcedureTypes(); break;
      case 'createProcedureType': result = createProcedureType(data); break;
      case 'updateProcedureType': result = updateProcedureType(data); break;
      case 'deleteProcedureType': result = deleteProcedureType(data); break;
      case 'getFinancialItem': result = getFinancialItem(data); break;
      case 'getFinancialSummary': result = getFinancialSummary(); break;
      case 'getAccounts': result = getAccounts(); break;
      case 'createAccount': result = createAccount(data); break;
      case 'deleteAccount': result = deleteAccount(data); break;
      case 'getFiles': result = getFiles(idFromData(data)); break;
      case 'uploadFile': result = uploadFile(data); break;
      case 'bulkCreateProcedures': result = bulkCreateProcedures(data); break;
      case 'checkDuplicateIdNumber': result = checkDuplicateIdNumber(data); break;
      case 'createDriveFolder': result = createDriveFolder(data); break;
      case 'fullSyncCleanup': result = fullCleanupManual(); break;
      case 'getAllTableData': result = getAllTableData(); break;
      case 'batchUpdateTable': result = batchUpdateTable(data); break;
      default: throw new Error('Acción desconocida: ' + action);
    }
    return response({success: true, data: result});
  } catch (err) {
    return response({success: false, error: err.toString()});
  } finally {
    lock.releaseLock();
  }
}

function getFinancialSummary() {
  return {
    transactions: getSheetData('Finanzas'),
    procedures: getSheetData('Tramites')
  };
}

function getFinancialItem(data) {
  var financials = getSheetData('Finanzas');
  return financials.find(function(f) { return f.id.toString() === data.id.toString(); });
}

function getAllTableData() {
  var tables = ['Usuarios', 'Tramites', 'Finanzas', 'Bitacora', 'Archivos', 'TiposTramite', 'Cuentas'];
  var result = {};
  tables.forEach(function(t) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(t);
    if (sheet) {
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var rows = data.slice(1).map(function(row) {
        var o = {}; headers.forEach(function(h, j) { o[h] = row[j]; }); return o;
      });
      result[t] = { headers: headers, rows: rows };
    } else {
      result[t] = { headers: [], rows: [] };
    }
  });
  return result;
}

function batchUpdateTable(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(data.tableName);
  if (!sheet) throw new Error("Tabla no existe");
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var updates = data.updates; // [{id: '', changes: {}}] 
  
  updates.forEach(function(u) {
    for (var i = 1; i < rows.length; i++) {
      // Find row by primary key (id or username)
      var primaryKey = (data.tableName === 'Usuarios') ? 'username' : 'id';
      var colIdx = headers.indexOf(primaryKey);
      
      if (rows[i][colIdx].toString() === u[primaryKey].toString()) {
        for (var key in u.changes) {
          var kIdx = headers.indexOf(key);
          if (kIdx !== -1 && key !== primaryKey) {
            sheet.getRange(i + 1, kIdx + 1).setValue(u.changes[key]);
          }
        }
        break;
      }
    }
  });
  return { success: true };
}

function idFromData(data) {
  return typeof data === 'string' ? data : (data.procedureId || data.id);
}

function response(res) {
  return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
}

// ==============================================================================
// 3. LÓGICA DE TRÁMITES (CREATE / UPDATE / DELETE)
// ==============================================================================

function getProcedures(data) {
  var procs = getSheetData('Tramites');
  if (data.role === 'client') return procs.filter(function(p) { return p.clientUsername === data.username; });
  if (data.role === 'tech') return procs.filter(function(p) { return p.technicianUsername === data.username; });
  return procs;
}

function createProcedure(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Tramites');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var id = Utilities.getUuid();
  
  // 1. Código Único
  var code = generateUniqueCode(sheet, headers);
  
  // 2. Crear Usuario Independiente (SIEMPRE)
  var searchId = (data.idNumber || '').toString().trim();
  var randomSuffix = Math.floor(1000 + Math.random() * 9000);
  var clientUsername = (data.clientName || 'cliente').toLowerCase().replace(/\s+/g, '.') + '.' + randomSuffix;
  
  // Asegurar que el username sea único en la tabla Usuarios
  var allUsers = getSheetData('Usuarios');
  while (allUsers.some(function(u) { return u.username === clientUsername; })) {
    randomSuffix = Math.floor(1000 + Math.random() * 9000);
    clientUsername = (data.clientName || 'cliente').toLowerCase().replace(/\s+/g, '.') + '.' + randomSuffix;
  }

  createUser({
    name: data.clientName || 'Cliente Nuevo',
    username: clientUsername,
    password: searchId || '12345',
    role: 'client',
    idNumber: searchId,
    email: data.clientEmail || ''
  });

  // 3. Carpeta Drive
  var folderData = { folderId: '', folderUrl: '' };
  try {
    var parent = getOrCreateMainFolder();
    var folder = parent.createFolder('Trámite: ' + (data.title || data.procedureType || 'Nuevo') + ' (' + code + ')');
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    folderData.folderId = folder.getId();
    folderData.folderUrl = folder.getUrl();
  } catch(e) { Logger.log("Error Drive: " + e.toString()); }

  // 4. Guardar Trámite
  var rowData = Object.assign({}, data, {
    id: id,
    code: code,
    clientUsername: clientUsername,
    status: 'En proceso',
    createdAt: new Date().toISOString(),
    driveFolderId: folderData.folderId,
    driveUrl: folderData.folderUrl,
    clientName: data.clientName || '',
    idNumber: searchId,
    clientEmail: data.clientEmail || ''
  });
  
  var row = headers.map(function(h) { return rowData[h] || ''; });
  sheet.appendRow(row);
  
  return { id: id, code: code, driveUrl: folderData.folderUrl, clientUsername: clientUsername };
}

function updateProcedure(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tramites');
  var rows = sheet.getDataRange().getValues();
  var h = rows[0];
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === data.id.toString()) {
      for (var key in data) {
        var idx = h.indexOf(key);
        if (idx !== -1 && key !== 'id') sheet.getRange(i + 1, idx + 1).setValue(data[key]);
      }
      return { success: true };
    }
  }
}

function deleteProcedure(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Tramites');
  var rows = sheet.getDataRange().getValues();
  var h = rows[0];
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === data.id.toString()) {
      var clientUsername = rows[i][h.indexOf('clientUsername')];
      var folderId = rows[i][h.indexOf('driveFolderId')];
      
      // Borrar Carpeta
      if (folderId) { try { DriveApp.getFolderById(folderId).setTrashed(true); } catch(e) {} }
      
      // Borrar Trámite
      sheet.deleteRow(i + 1);
      
      // Borrar Datos Hijos
      deleteRowsByColumn('Finanzas', 1, data.id);
      deleteRowsByColumn('Bitacora', 1, data.id);
      deleteRowsByColumn('Archivos', 1, data.id);
      
      // Limpiar Usuario
      if (clientUsername) {
        var stillHas = getSheetData('Tramites').some(function(p) { return p.clientUsername === clientUsername; });
        if (!stillHas) deleteUser({ username: clientUsername });
      }
      return { success: true };
    }
  }
}

// ==============================================================================
// 4. GESTIÓN DE USUARIOS
// ==============================================================================

function login(data) {
  var users = getSheetData('Usuarios');
  var u = users.find(function(user) { 
    return user.username.toString().toLowerCase() === data.username.toLowerCase() && user.password.toString() === data.password.toString(); 
  });
  if (!u) throw new Error('Credenciales inválidas');
  var safe = Object.assign({}, u); delete safe.password;
  return safe;
}

function getUsers() { return getSheetData('Usuarios').map(function(u) { delete u.password; return u; }); }

function createUser(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Usuarios');
  var id = Utilities.getUuid();
  var h = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = h.map(function(col) { return data[col] || (col === 'id' ? id : ''); });
  sheet.appendRow(row);
  return { id: id };
}

function updateUser(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Usuarios');
  var rows = sheet.getDataRange().getValues();
  var h = rows[0];
  var uIdx = h.indexOf('username');
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][uIdx].toString().toLowerCase() === (data.username || "").toLowerCase()) {
      for (var key in data) {
        var kIdx = h.indexOf(key);
        if (kIdx !== -1 && key !== 'username' && key !== 'id') {
          sheet.getRange(i + 1, kIdx + 1).setValue(data[key]);
        }
      }
      return { success: true };
    }
  }
  return createUser(data);
}

function deleteUser(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Usuarios');
  var rows = sheet.getDataRange().getValues();
  for (var i = rows.length - 1; i >= 1; i--) {
    if (rows[i][2].toString().toLowerCase() === data.username.toLowerCase()) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
}

// ==============================================================================
// 5. FINANZAS / BITÁCORA / ARCHIVOS
// ==============================================================================

function getFinancials(procId) { return getSheetData('Finanzas').filter(function(f) { return f.procedureId === procId; }); }
function addFinancialItem(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Finanzas');
  var id = Utilities.getUuid();
  var h = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowData = Object.assign({}, data, { id: id, date: new Date().toISOString() });
  var row = h.map(function(col) { return rowData[col] || ''; });
  sheet.appendRow(row);
  return { id: id };
}
function updateFinancialItem(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Finanzas');
  var rows = sheet.getDataRange().getValues();
  var h = rows[0];
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === data.id.toString()) {
      for (var key in data) {
        var idx = h.indexOf(key);
        if (idx !== -1 && key !== 'id') sheet.getRange(i + 1, idx + 1).setValue(data[key]);
      }
      return { success: true };
    }
  }
}
function deleteFinancialItem(data) { deleteRowsByColumn('Finanzas', 0, data.id); return { success: true }; }

function getLogs(procId) { return getSheetData('Bitacora').filter(function(l) { return l.procedureId === procId; }); }
function addLog(data) {
  var id = Utilities.getUuid();
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Bitacora').appendRow([id, data.procedureId, new Date().toISOString(), data.technicianUsername, data.note, data.isExternal]);
  return { id: id };
}
function updateLog(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Bitacora');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === data.id.toString()) { 
      sheet.getRange(i+1, 5).setValue(data.note); 
      sheet.getRange(i+1, 6).setValue(data.isExternal);
      return { success: true }; 
    }
  }
}
function deleteLog(data) { deleteRowsByColumn('Bitacora', 0, data.id); return { success: true }; }

function getFiles(procId) { return getSheetData('Archivos').filter(function(f) { return f.procedureId === procId; }); }
function uploadFile(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var id = Utilities.getUuid();
  var driveId = '';
  var driveUrl = data.url || '';
  
  if (data.base64) {
    try {
      var parent = getOrCreateMainFolder();
      var bytes = Utilities.base64Decode(data.base64.split(',')[1]);
      var file = parent.createFile(Utilities.newBlob(bytes, data.mimeType, data.name));
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      driveId = file.getId();
      driveUrl = file.getUrl();
    } catch(e) {}
  }
  
  ss.getSheetByName('Archivos').appendRow([id, data.procedureId, data.name, driveId, data.mimeType, driveUrl, new Date().toISOString()]);
  return { id: id, url: driveUrl };
}

// ==============================================================================
// 6. UTILIDADES Y CARPETAS
// ==============================================================================

function getSheetData(sheetName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var h = data[0];
  return data.slice(1).map(function(row) {
    var o = {}; h.forEach(function(header, j) { o[header] = row[j]; }); return o;
  });
}

function generateUniqueCode(sheet, h) {
  var codeIdx = h.indexOf('code');
  var lastRow = sheet.getLastRow();
  var maxNum = 0;
  if (lastRow > 1) {
    var codes = sheet.getRange(2, codeIdx + 1, lastRow - 1, 1).getValues().flat();
    codes.forEach(function(c) {
      if (c && c.toString().startsWith('TR-')) {
        var num = parseInt(c.toString().split('-')[1]);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
  }
  return 'TR-' + (maxNum + 1).toString().padStart(4, '0');
}

function deleteRowsByColumn(sheetName, colIdx, val) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return;
  var rows = sheet.getDataRange().getValues();
  for (var i = rows.length - 1; i >= 1; i--) {
    if (rows[i][colIdx].toString() === val.toString()) sheet.deleteRow(i + 1);
  }
}

function getOrCreateMainFolder() {
  var name = "LEGARQ_TRAMITES_PRINCIPAL";
  var folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
}

// Otros
function getProcedureTypes() { return getSheetData('TiposTramite'); }
function createProcedureType(data) { var id = Utilities.getUuid(); SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TiposTramite').appendRow([id, data.name, data.steps]); return { id: id }; }
function updateProcedureType(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TiposTramite');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === data.id.toString()) { 
      sheet.getRange(i+1, 2).setValue(data.name); 
      sheet.getRange(i+1, 3).setValue(data.steps); 
      return { success: true }; 
    }
  }
}
function deleteProcedureType(data) { deleteRowsByColumn('TiposTramite', 0, data.id); return { success: true }; }

function getAccounts() { return getSheetData('Cuentas'); }
function createAccount(data) { var id = Utilities.getUuid(); SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Cuentas').appendRow([id, data.name]); return { id: id }; }
function deleteAccount(data) { deleteRowsByColumn('Cuentas', 0, data.id); return { success: true }; }

function updateProcedureStatus(data) { return updateProcedure({ id: data.id, status: data.status }); }
function assignTechnician(data) { return updateProcedure({ id: data.procedureId, technicianUsername: data.technicianUsername }); }
function updateProcedureSteps(data) { return updateProcedure({ id: data.procedureId, completedSteps: data.completedSteps }); }

function checkDuplicateIdNumber(data) {
  var users = getSheetData('Usuarios');
  var dup = users.find(function(u) { return (u.idNumber || "").toString().trim() === data.idNumber.toString().trim() && u.username !== data.excludeUsername; });
  return { exists: !!dup, name: dup ? dup.name : '' };
}

function createDriveFolder(data) {
  var parent = getOrCreateMainFolder();
  var folder = parent.createFolder('Trámite: ' + data.title);
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  updateProcedure({ id: data.procedureId, driveFolderId: folder.getId(), driveUrl: folder.getUrl() });
  return { driveUrl: folder.getUrl() };
}

function bulkCreateProcedures(list) {
  var res = { success: [], errors: [] };
  list.forEach(function(d) {
    try { res.success.push(createProcedure(d)); } catch(e) { res.errors.push(e.toString()); }
  });
  return res;
}

function getProcedureByClientId(data) {
  var users = getSheetData('Usuarios');
  var id = data.idNumber ? data.idNumber.toString() : '';
  var client = users.find(function(u) { return u.idNumber.toString() === id || u.username === id; });
  var username = client ? client.username : id;
  var procs = getSheetData('Tramites').filter(function(p) { return p.clientUsername === username || p.idNumber.toString() === id; });
  var logs = getSheetData('Bitacora');
  procs.forEach(function(p) { 
    p.logs = logs.filter(function(l) { return l.procedureId === p.id && (l.isExternal === true || l.isExternal === 'true'); }); 
  });
  return { client: client, procedures: procs };
}

function fullCleanupManual() {
  var procs = getSheetData('Tramites');
  var activeFolders = procs.map(function(p) { return p.driveFolderId; }).filter(Boolean);
  var activeUsers = procs.map(function(p) { return (p.clientUsername || "").toString().toLowerCase(); });
  
  var parent = getOrCreateMainFolder();
  var folders = parent.getFolders();
  while (folders.hasNext()) {
    var f = folders.next();
    if (activeFolders.indexOf(f.getId()) === -1) f.setTrashed(true);
  }
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var uSheet = ss.getSheetByName('Usuarios');
  var uRows = uSheet.getDataRange().getValues();
  for (var i = uRows.length - 1; i >= 1; i--) {
    if (uRows[i][4] === 'client' && activeUsers.indexOf(uRows[i][2].toString().toLowerCase()) === -1) uSheet.deleteRow(i + 1);
  }
  return "Limpieza completa.";
}
