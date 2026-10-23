/**
 * Claims a mutex via the shared `mongo-locks` LockManager, so only one
 * instance runs a given scheduled job at a time. Unlike a hand-rolled insert,
 * the underlying lock document carries a TTL (initially 60s) that is
 * refreshed every 10s while held, so a crashed process stops refreshing and
 * the lock is reclaimed automatically instead of blocking all future runs.
 * @param {import('mongo-locks').LockManager} locker
 * @param {string} lockName
 * @returns {Promise<import('mongo-locks').Lock | null>} the held lock (pass to `unlock`), or null if already claimed
 */
async function lock(locker, lockName) {
  return locker.lock(lockName)
}

/**
 * Releases a lock claimed via `lock`. Safe to call with a null/already-freed lock.
 * @param {import('mongo-locks').Lock | null | undefined} heldLock
 * @returns {Promise<void>}
 */
async function unlock(heldLock) {
  await heldLock?.free()
}

export { lock, unlock }
