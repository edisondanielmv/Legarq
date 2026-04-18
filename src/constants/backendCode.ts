export const BACKEND_SCRIPT = `
function doGet(e) {
  return handleResponse({ status: 'ok', message: 'LEGARQ Backend Active' });
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var payload = data.payload;
    
    switch(action) {
      case 'ping': return handleResponse({ status: 'ok' });
      case 'setup': return handleResponse(setup());
      case 'login': return handleResponse(login(payload));
      case 'getProcedures': return handleResponse(getProcedures(payload));
      case 'createProcedure': return handleResponse(createProcedure(payload));
      case 'updateProcedureStatus': return handleResponse(updateProcedureStatus(payload));
      case 'assignTechnician': return handleResponse(assignTechnician(payload));
      case 'updateProcedureSteps': return handleResponse(updateProcedureSteps(payload));
      case 'getProcedureByClientId': return handleResponse(getProcedureByClientId(payload));
      case 'addLog': return handleResponse(addLog(payload));
      case 'getLogs': return handleResponse(getLogs(payload));
      case 'getFinancialSummary': return handleResponse(getFinancialSummary(payload));
      case 'uploadFile': return handleResponse(uploadFile(payload));
      case 'getFiles': return handleResponse(getFiles(payload));
      case 'getProcedureTypes': return handleResponse(getProcedureTypes(payload));
      case 'createProcedureType': return handleResponse(createProcedureType(payload));
      case 'updateProcedureType': return handleResponse(updateProcedureType(payload));
      case 'deleteProcedureType': return handleResponse(deleteProcedureType(payload));
      case 'getTechnicianActivityReport': return handleResponse(getTechnicianActivityReport(payload));
      case 'createUser': return handleResponse(createUser(payload));
      case 'updateProcedure': return handleResponse(updateProcedure(payload));
      default: throw new Error('Acción no reconocida: ' + action);
    }
  } catch (error) {
    return handleResponse({ error: error.toString() }, 500);
  }
}

function handleResponse(data, code) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ['Usuarios', 'Tramites', 'Bitacora', 'Finanzas', 'Archivos', 'TiposTramite'];
  
  sheets.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    var headers = [];
    if (name === 'Usuarios') headers = ['id', 'name', 'username', 'password', 'role', 'phone', 'address', 'idNumber', 'email'];
    if (name === 'Tramites') headers = ['id', 'code', 'title', 'clientUsername', 'status', 'description', 'createdAt', 'driveFolderId', 'driveUrl', 'technicianUsername', 'completedSteps', 'expectedValue', 'otherAgreements', 'clientName', 'idNumber', 'procedureType'];
    if (name === 'Bitacora') headers = ['id', 'procedureId', 'timestamp', 'technicianUsername', 'note', 'isExternal'];
    if (name === 'Finanzas') headers = ['id', 'procedureId', 'date', 'amount', 'type', 'description', 'category'];
    if (name === 'Archivos') headers = ['id', 'procedureId', 'name', 'fileId', 'mimeType', 'url', 'createdAt'];
    if (name === 'TiposTramite') headers = ['id', 'name', 'steps'];

    if (!sheet) {
      sheet = ss.insertSheet(name);
      if (headers.length > 0) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.setFrozenRows(1);
      }
    } else if (headers.length > 0) {
      // Check if headers match, if not, update them (safely)
      var existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var missingHeaders = headers.filter(function(h) { return existingHeaders.indexOf(h) === -1; });
      
      if (missingHeaders.length > 0) {
        var newHeaders = existingHeaders.concat(missingHeaders);
        sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);
      }
    }
  });
  
  // Create default admin if not exists
  var userSheet = ss.getSheetByName('Usuarios');
  var users = userSheet.getDataRange().getValues();
  var adminExists = false;
  for (var i = 1; i < users.length; i++) {
    if (users[i][2] === 'admin') { adminExists = true; break; }
  }
  
  if (!adminExists) {
    userSheet.appendRow([Utilities.getUuid(), 'Administrador', 'admin', 'admin', 'admin', '', '', '', '']);
  }
  
  return { success: true, message: 'Sistema inicializado correctamente' };
}

function getSheetData(name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
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
    if (users[i].username === data.username && users[i].password === data.password) {
      return users[i];
    }
  }
  throw new Error('Usuario o contraseña incorrectos');
}

function getProcedures(data) {
  var procedures = getSheetData('Tramites');
  if (data.role === 'tech') {
    return procedures.filter(function(p) { return p.technicianUsername === data.username; });
  } else if (data.role === 'client') {
    return procedures.filter(function(p) { return p.clientUsername === data.username; });
  }
  return procedures;
}

function getOrCreateMainFolder() {
  var folderName = "LEGARQ_Tramites_Files";
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    var folder = DriveApp.createFolder(folderName);
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return folder;
  }
}

function createProcedure(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Tramites');
  var id = Utilities.getUuid();
  var date = new Date().toISOString();
  
  // Generate unique code
  var lastRow = sheet.getLastRow();
  var nextNum = lastRow; // Since row 1 is headers, if lastRow is 1, next is 1
  var code = 'TR-' + nextNum.toString().padStart(4, '0');
  
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
      clientUsername = (data.clientName || 'cliente').toLowerCase().replace(/\\s+/g, '.') + '.' + data.idNumber.substring(data.idNumber.length - 4);
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
    'code': code,
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
    var colName = headers[i];
    if (dataMap[colName] !== undefined) {
      rowData[i] = dataMap[colName];
    }
  }
  
  sheet.appendRow(rowData);
  return { id: id, code: code, driveUrl: procFolder ? procFolder.getUrl() : '' };
}

function updateProcedureStatus(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tramites');
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var colIndex = headers.indexOf('status');
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      sheet.getRange(i + 1, colIndex + 1).setValue(data.status);
      return { success: true };
    }
  }
  throw new Error('Trámite no encontrado');
}

function assignTechnician(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tramites');
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var colIndex = headers.indexOf('technicianUsername');
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.procedureId) {
      sheet.getRange(i + 1, colIndex + 1).setValue(data.technicianUsername);
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
      return { success: true };
    }
  }
  throw new Error('Trámite no encontrado');
}

function getProcedureByClientId(data) {
  var procedures = getSheetData('Tramites');
  var filtered = procedures.filter(function(p) { return p.idNumber === data.idNumber; });
  var allLogs = getSheetData('Bitacora');
  filtered.forEach(function(p) {
    p.logs = allLogs.filter(function(l) { return l.procedureId === p.id && (l.isExternal === true || l.isExternal === 'true'); });
  });
  return filtered;
}

function addLog(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Bitacora');
  var id = Utilities.getUuid();
  sheet.appendRow([id, data.procedureId, new Date().toISOString(), data.technicianUsername, data.note, data.isExternal]);
  return { id: id };
}

function getLogs(data) {
  return getSheetData('Bitacora').filter(function(l) { return l.procedureId === data.procedureId; });
}

function getFinancialSummary(data) {
  return { transactions: getSheetData('Finanzas'), procedures: getSheetData('Tramites') };
}

function uploadFile(data) {
  var parentFolder = getOrCreateMainFolder();
  var bytes = Utilities.base64Decode(data.base64.split(',')[1]);
  var file = parentFolder.createFile(Utilities.newBlob(bytes, data.mimeType, data.name));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var id = Utilities.getUuid();
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Archivos').appendRow([id, data.procedureId, data.name, file.getId(), data.mimeType, file.getUrl(), new Date().toISOString()]);
  return { id: id, url: file.getUrl() };
}

function getFiles(data) {
  return getSheetData('Archivos').filter(function(f) { return f.procedureId === data.procedureId; });
}

function getProcedureTypes(data) {
  return getSheetData('TiposTramite');
}

function createProcedureType(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TiposTramite');
  var id = Utilities.getUuid();
  sheet.appendRow([id, data.name, data.steps]);
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
  throw new Error('Tipo de trámite no encontrado');
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
  sheet.appendRow([id, data.name, data.username, data.password, data.role, data.phone || '', data.address || '', data.idNumber || '', data.email || '']);
  return { id: id };
}
`;
