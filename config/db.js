const mongoose = require('mongoose');
const dns = require('dns')

dns.setServers(['1.1.1.1',
  '8.8.4.4'])


/**
* Connect to MongoDB with retry logic.
* Uses the MONGODB_URI from environment variables.
*/
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(` MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(` MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
