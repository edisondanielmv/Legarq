export const BACKEND_SCRIPT = `
/**
 * @fileoverview Backend para Gestión de Trámites Legar - VERSION INTEGRAL FINAL
 * Copie y pegue este código en Extensions > Apps Script de su Google Sheet.
 */

function setup() {
  initSheets();
  Logger.log("✅ SISTEMA INICIALIZADO");
}

function initSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = [
    { name: 'Usuarios', headers: ['id', 'name', 'username', 'password', 'role', 'phone', 'address', 'idNumber', 'permissions', 'email', 'status'] },
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
        sheet.appendRow(['1', 'Administrador', 'admin', 'admin123', 'admin', '0999999999', 'Oficina Central', '1700000001', '["all"]', 'admin@legarq.com', 'Activo']);
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

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    
    var params = JSON.parse(e.postData.contents);
    var action = params.action;
    var data = params.data || {};
    
    var result;
    switch(action) {
      case 'ping': result = { status: 'ok' }; break;
      case 'setup': initSheets(); result = { status: 'initialized' }; break;
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
      case 'getUsers': result = getUsers(); break;
      case 'createUser': result = createUser(data); break;
      case 'updateUser': result = updateUser(data); break;
      case 'deleteUser': result = deleteUser(data); break;
      case 'getFinancials': result = getFinancials(idFromData(data)); break;
      case 'addFinancialItem': result = addFinancialItem(data); break;
      case 'updateFinancialItem': result = updateFinancialItem(data); break;
      case 'deleteFinancialItem': result = deleteFinancialItem(data); break;
      case 'getFiles': result = getFiles(idFromData(data)); break;
      case 'uploadFile': result = uploadFile(data); break;
      case 'deleteFile': result = deleteFile(idFromData(data)); break;
      case 'getProcedureTypes': result = getProcedureTypes(); break;
      case 'createProcedureType': result = createProcedureType(data); break;
      case 'updateProcedureType': result = updateProcedureType(data); break;
      case 'deleteProcedureType': result = deleteProcedureType(data); break;
      case 'getAccounts': result = getAccounts(); break;
      case 'createAccount': result = createAccount(data); break;
      case 'deleteAccount': result = deleteAccount(data); break;
      case 'getFinancialItem': result = getFinancialItem(data); break;
      case 'getFinancialSummary': result = getFinancialSummary(); break;
      case 'bulkCreateProcedures': result = bulkCreateProcedures(data); break;
      case 'checkDuplicateIdNumber': result = checkDuplicateIdNumber(data); break;
      case 'createDriveFolder': result = createDriveFolder(data); break;
      case 'getAllTableData': result = getAllTableData(); break;
      case 'batchUpdateTable': result = batchUpdateTable(data); break;
      case 'getTechnicianActivityReport': result = getTechnicianActivityReport(data); break;
      default: throw new Error('Acción no implementada: ' + action);
    }
    return response({success: true, data: result});
  } catch (err) {
    Logger.log("doPost Error: " + err.toString());
    return response({success: false, error: String(err)});
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function idFromData(data) {
  if (data === null || data === undefined) return '';
  if (typeof data === 'string' || typeof data === 'number') return String(data);
  return String(data.id || data.procedureId || data.username || '');
}

function response(res) {
  return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
}

function getSheetData(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var h = data[0];
  return data.slice(1).map(function(row) {
    var o = {}; h.forEach(function(header, j) { o[header] = row[j]; }); return o;
  });
}

function login(data) {
  var users = getSheetData('Usuarios');
  var u = users.find(function(user) { 
    return String(user.username || '').toLowerCase() === String(data.username || '').toLowerCase() && 
           String(user.password || '') === String(data.password || ''); 
  });
  if (!u) throw new Error('Credenciales inválidas');
  if (String(u.status || '').toLowerCase() === 'inactivo') throw new Error('Usuario inactivo');
  var safe = Object.assign({}, u); delete safe.password;
  return safe;
}

function getProcedures(data) {
  var procs = getSheetData('Tramites');
  var username = String(data.username || '').toLowerCase();
  if (data.role === 'client') return procs.filter(function(p) { return String(p.clientUsername || '').toLowerCase() === username; });
  if (data.role === 'tech') return procs.filter(function(p) { return String(p.technicianUsername || '').toLowerCase() === username; });
  return procs;
}

function createProcedure(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Tramites');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var id = Utilities.getUuid();
  var code = generateUniqueCode(sheet, headers);
  
  var searchId = String(data.idNumber || '').trim();
  var randomSuffix = Math.floor(1000 + Math.random() * 9000);
  var clientUsername = String(data.clientName || 'cliente').toLowerCase().replace(/\\s+/g, '.') + '.' + randomSuffix;
  
  createUser({
    name: data.clientName || 'Cliente Nuevo',
    username: clientUsername,
    password: searchId || '12345',
    role: 'client',
    idNumber: searchId,
    email: data.clientEmail || '',
    status: 'Activo'
  });

  var folderData = { folderId: '', folderUrl: '' };
  try {
    var parent = getOrCreateMainFolder();
    var folder = parent.createFolder('Trámite: ' + (data.title || 'Nuevo') + ' (' + code + ')');
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    folderData.folderId = folder.getId();
    folderData.folderUrl = folder.getUrl();
  } catch(e) {}

  var rowData = Object.assign({}, data, {
    id: id,
    code: code,
    clientUsername: clientUsername,
    status: 'En proceso',
    createdAt: new Date().toISOString(),
    driveFolderId: folderData.folderId,
    driveUrl: folderData.folderUrl,
    idNumber: searchId
  });
  
  var row = headers.map(function(h) { return rowData[h] || ''; });
  sheet.appendRow(row);
  return { id: id, code: code, driveUrl: folderData.folderUrl, clientUsername: clientUsername };
}

function updateProcedure(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tramites');
  var rows = sheet.getDataRange().getValues();
  var h = rows[0];
  var updateId = String(data.id || '');
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '') === updateId) {
      for (var key in data) {
        var idx = h.indexOf(key);
        if (idx !== -1 && key !== 'id') sheet.getRange(i + 1, idx + 1).setValue(data[key]);
      }
      return { success: true };
    }
  }
  throw new Error("Trámite no encontrado para actualizar: " + updateId);
}

function deleteProcedure(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Tramites');
  if (!sheet) throw new Error('Hoja Tramites no encontrada');
  var rows = sheet.getDataRange().getValues();
  if (rows.length < 2) throw new Error('No hay trámites para eliminar');
  
  var h = rows[0];
  var rawId = idFromData(data);
  var idToDelete = String(rawId || '').trim();
  
  if (!idToDelete) throw new Error('ID de trámite no proporcionado');

  var idIndex = h.indexOf('id');
  var codeIndex = h.indexOf('code');
  var folderIdIndex = h.indexOf('driveFolderId');
  var clientUsernameIndex = h.indexOf('clientUsername');

  var deleted = false;
  // Buscamos de abajo hacia arriba para evitar problemas con índices al eliminar, 
  // aunque aquí rompemos el ciclo tras el primero, es buena práctica.
  for (var i = rows.length - 1; i >= 1; i--) {
    var uuid = String(rows[i][idIndex] || '').trim();
    var code = String(rows[i][codeIndex] || '').trim();
    
    // Comparación robusta
    if (uuid === idToDelete || code === idToDelete || (uuid.toLowerCase() === idToDelete.toLowerCase()) || (code.toLowerCase() === idToDelete.toLowerCase())) {
      var realId = uuid; 
      var driveFolderId = String(rows[i][folderIdIndex] || '');
      var clientUser = String(rows[i][clientUsernameIndex] || '');

      // 1. Eliminar carpeta de Drive si existe
      if (driveFolderId) {
        try { 
          DriveApp.getFolderById(driveFolderId).setTrashed(true); 
        } catch (e) { Logger.log("Error Drive: " + e); }
      }

      // 2. Limpiar registros relacionados en otras tablas
      cleanRelatedFiles(realId);
      deleteRowsByColumnName('Finanzas', 'procedureId', realId);
      deleteRowsByColumnName('Bitacora', 'procedureId', realId);
      
      // 3. Eliminar la fila del trámite
      sheet.deleteRow(i + 1);
      deleted = true;

      // 4. Limpiar cuenta de usuario si no tiene más trámites
      if (clientUser) {
        try {
          SpreadsheetApp.flush();
          var updatedProcs = getSheetData('Tramites');
          var hasOtherProcs = updatedProcs.some(function(p) {
            return String(p.clientUsername || '').trim() === clientUser.trim() && String(p.id || '') !== realId;
          });
          if (!hasOtherProcs) deleteUser({ username: clientUser });
        } catch (e) {
          Logger.log("Error al limpiar usuario: " + e);
        }
      }
      break;
    }
  }
  
  if (!deleted) throw new Error('Trámite no encontrado con identificador: ' + idToDelete);
  return { success: true, idDeleted: idToDelete };
}

function deleteRowsByColumnName(sheetName, colName, val) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  var rows = sheet.getDataRange().getValues();
  if (rows.length < 1) return;
  var headers = rows[0];
  var colIdx = headers.indexOf(colName);
  if (colIdx === -1) return;
  
  var searchVal = String(val || '').trim();
  for (var i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][colIdx] || '').trim() === searchVal) {
      sheet.deleteRow(i + 1);
    }
  }
}

function cleanRelatedFiles(procedureId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Archivos');
  if (!sheet) return;
  var rows = sheet.getDataRange().getValues();
  if (rows.length < 1) return;
  
  var headers = rows[0];
  var procIdx = headers.indexOf('procedureId');
  var driveIdx = headers.indexOf('driveId');
  
  if (procIdx === -1) return;
  
  var searchVal = String(procedureId || '').trim();
  for (var i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][procIdx] || '').trim() === searchVal) {
      var driveId = driveIdx !== -1 ? String(rows[i][driveIdx] || '') : '';
      if (driveId) {
        try { DriveApp.getFileById(driveId).setTrashed(true); } catch (e) {}
      }
      sheet.deleteRow(i + 1);
    }
  }
}

function getUsers() { 
  return getSheetData('Usuarios').map(function(u) { 
    var safe = Object.assign({}, u); delete safe.password; return safe; 
  }); 
}

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
  var targetUser = String(data.username || '').toLowerCase();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][uIdx] || '').toLowerCase() === targetUser) {
      for (var key in data) {
        var kIdx = h.indexOf(key);
        if (kIdx !== -1 && key !== 'username' && key !== 'id') sheet.getRange(i + 1, kIdx + 1).setValue(data[key]);
      }
      return { success: true };
    }
  }
}

function deleteUser(data) {
  var username = idFromData(data);
  if (!username) throw new Error('Username no proporcionado para eliminar');
  deleteRowsByColumn('Usuarios', 2, username);
  return { success: true };
}

function getFinancials(procId) { 
  var searchId = String(procId || '');
  return getSheetData('Finanzas').filter(function(f) { return String(f.procedureId || '') === searchId; }); 
}

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
  var updateId = String(data.id || '');
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '') === updateId) {
      for (var key in data) {
        var idx = h.indexOf(key);
        if (idx !== -1 && key !== 'id') sheet.getRange(i + 1, idx + 1).setValue(data[key]);
      }
      return { success: true };
    }
  }
}

function deleteFinancialItem(data) { deleteRowsByColumn('Finanzas', 0, data.id); return { success: true }; }

function getLogs(procId) { 
  var searchId = String(procId || '');
  return getSheetData('Bitacora').filter(function(l) { return String(l.procedureId || '') === searchId; }); 
}

function addLog(data) {
  var id = Utilities.getUuid();
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Bitacora').appendRow([id, data.procedureId, new Date().toISOString(), data.technicianUsername, data.note, data.isExternal]);
  return { id: id };
}

function updateLog(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Bitacora');
  var rows = sheet.getDataRange().getValues();
  var updateId = String(data.id || '');
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '') === updateId) { 
      sheet.getRange(i+1, 5).setValue(data.note); 
      sheet.getRange(i+1, 6).setValue(data.isExternal);
      return { success: true }; 
    }
  }
}

function deleteLog(data) { deleteRowsByColumn('Bitacora', 0, data.id); return { success: true }; }

function deleteFile(targetId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Archivos');
  if (!sheet) return { success: false };
  var rows = sheet.getDataRange().getValues();
  var idToDelete = String(targetId || '');
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '') === idToDelete) {
      var driveId = rows[i][3];
      if (driveId) { try { DriveApp.getFileById(driveId).setTrashed(true); } catch (e) {} }
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false };
}

function getFiles(procId) { 
  var searchId = String(procId || '');
  return getSheetData('Archivos').filter(function(f) { return String(f.procedureId || '') === searchId; }); 
}

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
      driveId = file.getId(); driveUrl = file.getUrl();
    } catch(e) {}
  }
  ss.getSheetByName('Archivos').appendRow([id, data.procedureId, data.name, driveId, data.mimeType, driveUrl, new Date().toISOString()]);
  return { id: id, url: driveUrl };
}

function getProcedureTypes() { return getSheetData('TiposTramite'); }
function createProcedureType(data) { var id = Utilities.getUuid(); SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TiposTramite').appendRow([id, data.name, data.steps]); return { id: id }; }
function updateProcedureType(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TiposTramite');
  var rows = sheet.getDataRange().getValues();
  var updateId = String(data.id || '');
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '') === updateId) { 
      sheet.getRange(i+1, 2).setValue(data.name); sheet.getRange(i+1, 3).setValue(data.steps); return { success: true }; 
    }
  }
}
function deleteProcedureType(data) { deleteRowsByColumn('TiposTramite', 0, data.id); return { success: true }; }

function getAccounts() { return getSheetData('Cuentas'); }
function createAccount(data) { var id = Utilities.getUuid(); SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Cuentas').appendRow([id, data.name]); return { id: id }; }
function deleteAccount(data) { deleteRowsByColumn('Cuentas', 0, data.id); return { success: true }; }

function getFinancialItem(data) {
  var searchId = String(data.id || '');
  return getSheetData('Finanzas').find(function(f) { return String(f.id || '') === searchId; });
}

function getFinancialSummary() {
  return {
    transactions: getSheetData('Finanzas'),
    procedures: getSheetData('Tramites')
  };
}

function generateUniqueCode(sheet, h) {
  var codeIdx = h.indexOf('code');
  var lastRow = sheet.getLastRow();
  var maxNum = 0;
  if (lastRow > 1) {
    var codes = sheet.getRange(2, codeIdx + 1, lastRow - 1, 1).getValues().flat();
    codes.forEach(function(c) {
      var s = String(c || '');
      if (s.startsWith('TR-')) {
        var num = parseInt(s.split('-')[1]);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
  }
  return 'TR-' + (maxNum + 1).toString().padStart(4, '0');
}

function deleteRowsByColumn(sheetName, colIdx, val) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  var rows = sheet.getDataRange().getValues();
  var searchVal = String(val || '');
  for (var i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][colIdx] || '') === searchVal) sheet.deleteRow(i + 1);
  }
}

function getOrCreateMainFolder() {
  var name = "LEGARQ_TRAMITES_PRINCIPAL";
  var folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
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
    }
  });
  return result;
}

function batchUpdateTable(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(data.tableName);
  if (!sheet) throw new Error("Tabla no existe: " + data.tableName);
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var primaryKey = (data.tableName === 'Usuarios') ? 'username' : 'id';
  var colIdx = headers.indexOf(primaryKey);
  
  data.updates.forEach(function(u) {
    var uPk = String(u[primaryKey] || '');
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][colIdx] || '') === uPk) {
        for (var key in u.changes) {
          var kIdx = headers.indexOf(key);
          if (kIdx !== -1 && key !== primaryKey) sheet.getRange(i + 1, kIdx + 1).setValue(u.changes[key]);
        }
        break;
      }
    }
  });
  return { success: true };
}

function updateProcedureStatus(data) { return updateProcedure({ id: data.id, status: data.status }); }
function assignTechnician(data) { return updateProcedure({ id: data.procedureId, technicianUsername: data.technicianUsername }); }
function updateProcedureSteps(data) { return updateProcedure({ id: data.procedureId, completedSteps: data.completedSteps }); }

function checkDuplicateIdNumber(data) {
  var users = getSheetData('Usuarios');
  var searchId = String(data.idNumber || '').trim();
  var excludeUser = String(data.excludeUsername || '');
  var dup = users.find(function(u) { 
    return String(u.idNumber || "").trim() === searchId && String(u.username || '') !== excludeUser; 
  });
  return { exists: !!dup, name: dup ? dup.name : '' };
}

function getTechnicianActivityReport(data) {
  return {
    logs: getSheetData('Bitacora'),
    procedures: getSheetData('Tramites'),
    technicians: getSheetData('Usuarios').filter(function(u) { return u.role === 'tech' || u.role === 'admin'; })
      .map(function(u) { return { id: u.id, name: u.name, username: u.username }; })
  };
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
  var id = String(data.idNumber || '').trim();
  var client = users.find(function(u) { return String(u.idNumber || "").trim() === id || String(u.username || '').trim() === id; });
  var username = client ? client.username : id;
  var procs = getSheetData('Tramites').filter(function(p) { 
    return String(p.clientUsername || '') === String(username || '') || String(p.idNumber || "").trim() === id; 
  });
  var logs = getSheetData('Bitacora');
  procs.forEach(function(p) { 
    p.logs = logs.filter(function(l) { 
      return String(l.procedureId || '') === String(p.id || '') && (l.isExternal === true || l.isExternal === 'true'); 
    }); 
  });
  return { client: client, procedures: procs };
}
`;
