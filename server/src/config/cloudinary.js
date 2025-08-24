const cloudinary = require('cloudinary').v2;

// The main server.js file handles loading environment variables.
// No need to call dotenv.config() here.

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;