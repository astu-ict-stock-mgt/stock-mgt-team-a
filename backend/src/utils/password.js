/**
 * Password Hashing & Verification Utility Module
 * Task: BE-026 (Implement Password Hashing)
 * SRS Traceability: Section 13 (Security Requirements), FR-01 (Authentication), NFR-05
 */

import bcrypt from 'bcryptjs'

const DEFAULT_SALT_ROUNDS = 10

/**
 * Hash a plaintext password securely using bcrypt
 * @param {string} password - Candidate plaintext password
 * @param {number} [saltRounds=10] - Work factor salt rounds
 * @returns {Promise<string>} Securely hashed password string
 */
export const hashPassword = async (password, saltRounds = DEFAULT_SALT_ROUNDS) => {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a valid non-empty string')
  }
  const salt = await bcrypt.genSalt(saltRounds)
  return bcrypt.hash(password, salt)
}

/**
 * Verify a candidate plaintext password against a stored bcrypt hash
 * @param {string} password - Candidate plaintext password
 * @param {string} hash - Stored bcrypt hash
 * @returns {Promise<boolean>} True if password matches hash, false otherwise
 */
export const verifyPassword = async (password, hash) => {
  if (!password || !hash) {
    return false
  }
  return bcrypt.compare(password, hash)
}
