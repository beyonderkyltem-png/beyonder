const mongoose = require('mongoose');
const { appLogger } = require('../utils/logger');

let conectado = false;

async function conectarMongo() {
  if (conectado) return mongoose.connection;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Falta MONGODB_URI en el .env. Configurá MongoDB Atlas o Render MongoDB.');
  }

  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    conectado = true;
    appLogger.info(`✅ Conectado a MongoDB: ${mongoose.connection.host}`);
    return mongoose.connection;
  } catch (err) {
    appLogger.error({ err }, '❌ Error conectando a MongoDB');
    throw err;
  }
}

module.exports = { conectarMongo, mongoose };
