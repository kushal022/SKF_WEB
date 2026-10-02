const bcrypt = require('bcrypt');
const config = require('../config');

/**
 * Hashes a plaintext password using bcrypt.
 *
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Password hash
 */
const hashPassword = async (password) => {
  const saltRounds = config.bcrypt.saltRounds || 12;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compares a plaintext password against a bcrypt hash.
 *
 * @param {string} plainPassword - Plain text password to check
 * @param {string} hashedPassword - Stored bcrypt hash
 * @returns {Promise<boolean>} True if matched, false otherwise
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  if (!plainPassword || !hashedPassword) {
    return false;
  }
  return bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = {
  hashPassword,
  comparePassword,
};
