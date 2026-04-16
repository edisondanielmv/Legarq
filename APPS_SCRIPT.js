/**
 * @fileoverview Backend para Gestión de Trámites Legar - FULL VERSION
 * @author Edison Daniel
 * 
 * INSTRUCCIONES:
 * 1. Copie todo este código.
 * 2. En su Google Sheet, vaya a Extensiones > Apps Script.
 * 3. Borre todo el código existente y pegue este.
 * 4. Guarde (Ctrl+S).
 * 5. Haga clic en "Implementar" > "Nueva implementación".
 * 6. Tipo: "Aplicación web".
 * 7. Ejecutar como: "Yo".
 * 8. Quién tiene acceso: "Cualquier persona".
 * 9. Copie la URL de la aplicación web y péguela en la configuración de su App.
 */

// ==============================================================================
// 1. CONFIGURACIÓN INICIAL
// ==============================================================================

function setup() {
  initSheets();
  Logger.log("✅ SISTEMA INICIALIZADO CORRECTAMENTE");
}

function initSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var sheets = [
    { name: 'Usuarios', headers: ['id', 'name', 'username', 'password', 'role', 'phone', 'address', 'idNumber', 'permissions', 'email'] },
    { name: 'Tramites', headers: ['id', 'code', 'title', 'clientUsername', 'status', 'description', 'createdAt', 'driveFolderId', 'driveUrl', 'technicianUsername', 'completedSteps', 'expectedValue', 'otherAgreements', 'clientName', 'idNumber', 'procedureType', 'clientEmail'] },
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

// ==============================================================================
// 2. MANEJADOR DE PETICIONES (API)
// ==============================================================================

function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    var action = params.action;
    var data = params.data;
    
    // Inicializar si es necesario (excepto para ping)
    if (action !== 'ping') initSheets();
    
    var result;
    switch(action) {
      case 'ping': result = { status: 'ok', timestamp: new Date().toISOString() }; break;
      case 'login': result = login(data); break;
      case 'getProcedures': result = getProcedures(data); break;
      case 'createProcedure': result = createProcedure(data); break;
      case 'updateProcedure': result = updateProcedure(data); break;
      case 'deleteProcedure': result = deleteProcedure(data); break;
      case 'updateProcedureStatus': result = updateProcedureStatus(data); break;
      case 'assignTechnician': result = assignTechnician(data); break;
      case 'updateProcedureSteps': result = updateProcedureSteps(data); break;
      case 'getProcedureByClientId': result = getProcedureByClientId(data); break;
      case 'getLogs': result = getLogs(data); break;
      case 'addLog': result = addLog(data); break;
      case 'updateLog': result = updateLog(data); break;
      case 'deleteLog': result = deleteLog(data); break;
      case 'getUsers': result = getUsers(data); break;
      case 'createUser': result = createUser(data); break;
      case 'updateUser': result = updateUser(data); break;
      case 'deleteUser': result = deleteUser(data); break;
      case 'createDriveFolder': result = createDriveFolder(data); break;
      case 'getFinancials': result = getFinancials(data); break;
      case 'addFinancialItem': result = addFinancialItem(data); break;
      case 'updateFinancialItem': result = updateFinancialItem(data); break;
      case 'deleteFinancialItem': result = deleteFinancialItem(data); break;
      case 'getFinancialSummary': result = getFinancialSummary(); break;
      case 'uploadFile': result = uploadFile(data); break;
      case 'getFiles': result = getFiles(data); break;
      case 'getProcedureTypes': result = getProcedureTypes(); break;
      case 'createProcedureType': result = createProcedureType(data); break;
      case 'updateProcedureType': result = updateProcedureType(data); break;
      case 'deleteProcedureType': result = deleteProcedureType(data); break;
      case 'getTechnicianActivityReport': result = getTechnicianActivityReport(); break;
      case 'getAccounts': result = getAccounts(); break;
      case 'createAccount': result = createAccount(data); break;
      case 'updateAccount': result = updateAccount(data); break;
      case 'deleteAccount': result = deleteAccount(data); break;
      case 'checkDuplicateIdNumber': result = checkDuplicateIdNumber(data); break;
      default: throw new Error('Acción no reconocida: ' + action);
    }
    
    return response({success: true, data: result});
  } catch (err) {
    Logger.log("ERROR en doPost: " + err.toString());
    return response({success: false, error: err.toString()});
  }
}

function response(res) {
  return ContentService.createTextOutput(JSON.stringify(res))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==============================================================================
// 3. FUNCIONES DE UTILIDAD
// ==============================================================================

function getSheetData(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
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

function getOrCreateMainFolder() {
  var folderName = "LEGARQ_TRAMITES_PRINCIPAL";
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(folderName);
}

// ==============================================================================
// 4. LÓGICA DE NEGOCIO
// ==============================================================================

function login(data) {
  var users = getSheetData('Usuarios');
  var inputUser = (data.username || "").toString().trim().toLowerCase();
  var inputPass = (data.password || "").toString().trim();

  var user = users.find(function(u) { 
    var sheetUser = (u.username || "").toString().trim().toLowerCase();
    var sheetPass = (u.password || "").toString().trim();
    return sheetUser === inputUser && sheetPass === inputPass; 
  });
  
  if (!user) throw new Error('ERROR: CREDENCIALES INCORRECTAS');
  
  // No devolver el password al frontend
  var userSafe = JSON.parse(JSON.stringify(user));
  delete userSafe.password;
  return userSafe;
}

function getProcedures(data) {
  var procedures = getSheetData('Tramites');
  var users = getSheetData('Usuarios');
  var userMap = {};
  users.forEach(function(u) { userMap[u.username] = u.name; });
  
  procedures.forEach(function(p) { 
    if (p.technicianUsername) p.technicianName = userMap[p.technicianUsername] || p.technicianUsername; 
  });

  if (data.role === 'client') return procedures.filter(function(p) { return p.clientUsername === data.username; });
  if (data.role === 'tech') return procedures.filter(function(p) { return p.technicianUsername === data.username; });
  return procedures;
}

function createProcedure(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Tramites');
  var id = Utilities.getUuid();
  
  // Generar código automático
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
  
  // Crear usuario si no existe
  if (!clientUsername && data.clientName) {
    var users = getSheetData('Usuarios');
    var searchId = (data.idNumber || '').toString().trim();
    var existing = searchId ? users.find(function(u) { return u.idNumber.toString().trim() === searchId; }) : null;
    
    if (existing) {
      clientUsername = existing.username;
    } else {
      var suffix = searchId ? searchId.substring(searchId.length - 4) : Math.floor(1000 + Math.random() * 9000);
      clientUsername = (data.clientName || 'cliente').toLowerCase().replace(/\s+/g, '.') + '.' + suffix;
      ss.getSheetByName('Usuarios').appendRow([
        Utilities.getUuid(), data.clientName, clientUsername, searchId || '12345', 'client', '', '', searchId || '', '[]', data.clientEmail || ''
      ]);
    }
  }

  var procFolder;
  try {
    var parent = getOrCreateMainFolder();
    procFolder = parent.createFolder('Trámite: ' + data.title + ' (' + code + ')');
    procFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) { Logger.log("Error Drive: " + e.toString()); }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowData = {
    id: id, code: code, title: data.title, clientUsername: clientUsername,
    status: 'En proceso', description: data.description || '', createdAt: new Date().toISOString(),
    driveFolderId: procFolder ? procFolder.getId() : '', driveUrl: procFolder ? procFolder.getUrl() : '',
    technicianUsername: data.technicianUsername || '', expectedValue: data.expectedValue || 0,
    clientName: data.clientName || '', idNumber: data.idNumber || '', procedureType: data.procedureType || '', clientEmail: data.clientEmail || ''
  };
  
  var row = headers.map(function(h) { return rowData[h] || ''; });
  sheet.appendRow(row);
  return { id: id, code: code, driveUrl: procFolder ? procFolder.getUrl() : null };
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
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Tramites');
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var idIdx = headers.indexOf('id');
  var clientUsernameIdx = headers.indexOf('clientUsername');
  var folderIdIdx = headers.indexOf('driveFolderId');
  
  var clientUsernameToDelete = null;

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][idIdx].toString() === data.id.toString()) { 
      clientUsernameToDelete = rows[i][clientUsernameIdx];
      
      // Borrar carpeta de Drive si existe
      if (folderIdIdx !== -1) {
        var folderId = rows[i][folderIdIdx];
        if (folderId) {
          try { DriveApp.getFolderById(folderId).setTrashed(true); } catch (e) {}
        }
      }
      
      sheet.deleteRow(i + 1); 
      
      // Limpiar tablas relacionadas
      deleteRowsByColumn('Finanzas', 1, data.id);
      deleteRowsByColumn('Bitacora', 1, data.id);
      deleteRowsByColumn('Archivos', 1, data.id);
      
      // Verificar si el cliente tiene otros trámites
      if (clientUsernameToDelete) {
        var remainingProcedures = getSheetData('Tramites');
        var hasOtherProcs = remainingProcedures.some(function(p) { 
          return p.clientUsername === clientUsernameToDelete; 
        });
        
        if (!hasOtherProcs) {
          // Si no tiene más trámites, verificar si es un rol 'client' y borrarlo
          var usersSheet = ss.getSheetByName('Usuarios');
          var usersData = usersSheet.getDataRange().getValues();
          var userHeaders = usersData[0];
          var uUsernameIdx = userHeaders.indexOf('username');
          var uRoleIdx = userHeaders.indexOf('role');
          
          for (var j = 1; j < usersData.length; j++) {
            if (usersData[j][uUsernameIdx] === clientUsernameToDelete && usersData[j][uRoleIdx] === 'client') {
              usersSheet.deleteRow(j + 1);
              break;
            }
          }
        }
      }
      
      return { success: true }; 
    }
  }
  throw new Error('Trámite no encontrado');
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

function getProcedureByClientId(data) {
  var searchId = (data.idNumber || '').toString().trim();
  if (!searchId) throw new Error('Cédula no proporcionada');
  
  var clientData = null;
  var users = getSheetData('Usuarios');
  var searchTerms = [searchId, searchId.replace(/[^0-9]/g, '')].filter(Boolean);
  
  var client = users.find(function(u) {
    var uId = (u.idNumber || '').toString().trim();
    return searchTerms.some(function(t) { return uId === t || uId.replace(/[^0-9]/g, '') === t; });
  });
  
  if (client) {
    clientData = JSON.parse(JSON.stringify(client));
    delete clientData.password;
  }

  var procedures = getSheetData('Tramites');
  var filteredProcedures = procedures.filter(function(p) {
    if (clientData && p.clientUsername === clientData.username) return true;
    var pId = (p.idNumber || '').toString().trim();
    return searchTerms.some(function(t) { return pId === t || pId.replace(/[^0-9]/g, '') === t; });
  });

  var allLogs = getSheetData('Bitacora');
  filteredProcedures.forEach(function(p) {
    p.logs = allLogs.filter(function(l) { 
      return l.procedureId === p.id && (l.isExternal === true || l.isExternal === 'true'); 
    });
  });

  if (filteredProcedures.length === 0 && !clientData) throw new Error('No se encontraron datos para la cédula: ' + searchId);
  return { client: clientData, procedures: filteredProcedures };
}

function addLog(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Bitacora');
  var id = Utilities.getUuid();
  sheet.appendRow([id, data.procedureId, new Date().toISOString(), data.technicianUsername, data.note, data.isExternal]);
  return { id: id };
}

function updateLog(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Bitacora');
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var idIdx = headers.indexOf('id');
  var noteIdx = headers.indexOf('note');
  var isExternalIdx = headers.indexOf('isExternal');
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][idIdx].toString() === data.id.toString()) {
      sheet.getRange(i + 1, noteIdx + 1).setValue(data.note);
      sheet.getRange(i + 1, isExternalIdx + 1).setValue(data.isExternal);
      return { success: true };
    }
  }
  throw new Error('Log no encontrado');
}

function deleteLog(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Bitacora');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === data.id.toString()) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  throw new Error('Log no encontrado');
}

function getLogs(data) { 
  return getSheetData('Bitacora').filter(function(l) { return l.procedureId === data.procedureId; }); 
}

function getUsers() { 
  return getSheetData('Usuarios').map(function(u) { delete u.password; return u; }); 
}

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
  var inputUser = (data.username || "").toString().trim().toLowerCase();

  for (var i = 1; i < rows.length; i++) {
    var sheetUser = (rows[i][2] || "").toString().trim().toLowerCase();
    if (sheetUser === inputUser) {
      for (var key in data) {
        var idx = headers.indexOf(key);
        if (idx !== -1 && key !== 'username') sheet.getRange(i + 1, idx + 1).setValue(data[key]);
      }
      return { success: true };
    }
  }
  
  // Si no se encuentra, lo creamos (para evitar el error "User not found")
  return createUser(data);
}

function deleteUser(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Usuarios');
  var rows = sheet.getDataRange().getValues();
  var inputUser = (data.username || "").toString().trim().toLowerCase();

  for (var i = 1; i < rows.length; i++) {
    var sheetUser = (rows[i][2] || "").toString().trim().toLowerCase();
    if (sheetUser === inputUser) { sheet.deleteRow(i + 1); return { success: true }; }
  }
  throw new Error('Usuario no encontrado');
}

function createDriveFolder(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tramites');
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var folderIdIdx = headers.indexOf('driveFolderId');
  var folderUrlIdx = headers.indexOf('driveUrl');
  
  var parent = getOrCreateMainFolder();
  var folder = parent.createFolder('Trámite: ' + data.title);
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === data.procedureId.toString()) {
      sheet.getRange(i + 1, folderIdIdx + 1).setValue(folder.getId());
      sheet.getRange(i + 1, folderUrlIdx + 1).setValue(folder.getUrl());
      return { driveUrl: folder.getUrl() };
    }
  }
  return { driveUrl: folder.getUrl() };
}

function getFinancials(data) { 
  return getSheetData('Finanzas').filter(function(f) { return f.procedureId === data.procedureId; }); 
}

function addFinancialItem(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Finanzas');
  var id = Utilities.getUuid();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowData = {
    id: id, procedureId: data.procedureId, type: data.type, category: data.category,
    description: data.description, amount: data.amount, date: new Date().toISOString(),
    fileUrl: data.fileUrl || '', isReimbursable: data.isReimbursable || false,
    reimburseTo: data.reimburseTo || ''
  };
  var row = headers.map(function(h) { return rowData[h] || ''; });
  sheet.appendRow(row);
  return { id: id };
}

function updateFinancialItem(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Finanzas');
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === data.id.toString()) {
      for (var key in data) {
        var idx = headers.indexOf(key);
        if (idx !== -1 && key !== 'id') sheet.getRange(i + 1, idx + 1).setValue(data[key]);
      }
      return { success: true };
    }
  }
  throw new Error('Rubro no encontrado');
}

function deleteFinancialItem(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Finanzas');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === data.id.toString()) { sheet.deleteRow(i + 1); return { success: true }; }
  }
  throw new Error('Rubro no encontrado');
}

function getFinancialSummary() { 
  return { transactions: getSheetData('Finanzas'), procedures: getSheetData('Tramites') }; 
}

function uploadFile(data) {
  var parent = getOrCreateMainFolder();
  var bytes = Utilities.base64Decode(data.base64.split(',')[1]);
  var file = parent.createFile(Utilities.newBlob(bytes, data.mimeType, data.name));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var id = Utilities.getUuid();
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Archivos').appendRow([
    id, data.procedureId, data.name, file.getId(), data.mimeType, file.getUrl(), new Date().toISOString()
  ]);
  return { id: id, url: file.getUrl() };
}

function getFiles(data) { 
  return getSheetData('Archivos').filter(function(f) { return f.procedureId === data.procedureId; }); 
}

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
    if (rows[i][0] === data.id) { 
      sheet.getRange(i + 1, 2).setValue(data.name); 
      sheet.getRange(i + 1, 3).setValue(data.steps); 
      return { success: true }; 
    }
  }
  throw new Error('Tipo no encontrado');
}

function deleteProcedureType(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TiposTramite');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === data.id.toString()) { sheet.deleteRow(i + 1); return { success: true }; }
  }
  throw new Error('Tipo no encontrado');
}

function getTechnicianActivityReport() { 
  return { 
    logs: getSheetData('Bitacora'), 
    procedures: getSheetData('Tramites'), 
    technicians: getSheetData('Usuarios').filter(function(u) { return u.role === 'tech'; }) 
  }; 
}

function getAccounts() { return getSheetData('Cuentas'); }
function createAccount(data) { 
  var id = Utilities.getUuid(); 
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Cuentas').appendRow([id, data.name]); 
  return { id: id }; 
}
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
  var dup = users.find(function(u) { 
    return u.idNumber.toString().trim() === data.idNumber.toString().trim() && u.username !== data.excludeUsername; 
  });
  return { exists: !!dup, name: dup ? dup.name : '' };
}

function deleteRowsByColumn(sheetName, colIndex, value) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) { 
    if (data[i][colIndex].toString() === value.toString()) { sheet.deleteRow(i + 1); } 
  }
}
