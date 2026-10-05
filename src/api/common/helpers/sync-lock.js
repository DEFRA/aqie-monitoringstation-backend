const LOCKS_COLLECTION = 'sync-locks'

/**
 * Claims a simple mutex via a unique _id insert, so only one instance runs a
 * given scheduled job at a time. Mirrors the pattern used in aqie-back-end.
 * @param {import('mongodb').Db} db
 * @param {string} lockName
 * @returns {Promise<boolean>} true if the lock was claimed
 */
async function lock(db, lockName) {
  try {
    await db
      .collection(LOCKS_COLLECTION)
      .insertOne({ _id: lockName, timestamp: new Date() })
    return true
  } catch {
    return false
  }
}

/**
 * Releases a lock claimed via `lock`.
 * @param {import('mongodb').Db} db
 * @param {string} lockName
 * @returns {Promise<void>}
 */
async function unlock(db, lockName) {
  await db.collection(LOCKS_COLLECTION).deleteOne({ _id: lockName })
}

export { lock, unlock }
