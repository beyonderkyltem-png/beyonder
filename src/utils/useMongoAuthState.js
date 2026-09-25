const {
  proto,
  initAuthCreds,
  BufferJSON,
} = require('@whiskeysockets/baileys');
const BaileysSession = require('../database/models/BaileysSession');
const { appLogger } = require('./logger');

function aMongo(valor) {
  return JSON.parse(JSON.stringify(valor, BufferJSON.replacer));
}
function deMongo(valor) {
  if (!valor) return undefined;
  return JSON.parse(JSON.stringify(valor), BufferJSON.reviver);
}

async function useMongoAuthState() {
  let doc = await BaileysSession.findOne({ sessionId: 'default' });
  if (!doc) {
    doc = new BaileysSession({
      creds: null,
      keysCreds: {},
      keysAppStateSync: {},
      keysAppStateMac: {},
    });
    await doc.save();
  }

  const creds = deMongo(doc.creds) || initAuthCreds();
  const keys = {
    creds: deMongo(doc.keysCreds) || {},
    'app-state-sync-key': deMongo(doc.keysAppStateSync) || {},
    'app-state-sync-mac-key': deMongo(doc.keysAppStateMac) || {},
  };

  const setKey = async (type, keyId, keyVal) => {
    const $set = {};
    if (type === 'creds') {
      keys.creds[keyId] = keyVal;
      $set.keysCreds = aMongo(keys.creds);
    } else if (type === 'app-state-sync-key') {
      keys['app-state-sync-key'][keyId] = keyVal;
      $set.keysAppStateSync = aMongo(keys['app-state-sync-key']);
    } else if (type === 'app-state-sync-mac-key') {
      keys['app-state-sync-mac-key'][keyId] = keyVal;
      $set.keysAppStateMac = aMongo(keys['app-state-sync-mac-key']);
    } else {
      return;
    }
    await BaileysSession.updateOne({ sessionId: 'default' }, { $set });
  };

  const getKey = (type, keyId) => {
    if (type === 'creds') return keys.creds[keyId];
    if (type === 'app-state-sync-key') return keys['app-state-sync-key'][keyId];
    if (type === 'app-state-sync-mac-key') return keys['app-state-sync-mac-key'][keyId];
  };

  const saveCreds = async () => {
    await BaileysSession.updateOne(
      { sessionId: 'default' },
      { $set: { creds: aMongo(creds) } }
    );
  };

  appLogger.info('🔐 Sesión WhatsApp cargada desde MongoDB');

  return {
    state: {
      creds,
      keys: { get, set: setKey },
    },
    saveCreds,
  };
}

module.exports = { useMongoAuthState };
