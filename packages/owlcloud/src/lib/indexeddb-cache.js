/**
 * IndexedDB Cache Wrapper for OwlCloud
 * Service worker compatible caching layer for character data and token images
 * Supports TTL-based expiration and version-based cache invalidation
 */

class IndexedDBCache {
  constructor(dbName = 'owlcloud_cache', version = 1) {
    this.dbName = dbName
    this.version = version
    this.db = null
  }

  /**
   * Open the IndexedDB database and create object stores
   * @returns {Promise<IDBDatabase>}
   */
  async open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Characters store
        if (!db.objectStoreNames.contains('characters')) {
          const charStore = db.createObjectStore('characters', { keyPath: 'characterId' })
          charStore.createIndex('expiresAt', 'expiresAt', { unique: false })
          charStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Token images store
        if (!db.objectStoreNames.contains('token_images')) {
          const imgStore = db.createObjectStore('token_images', { keyPath: 'characterId' })
          imgStore.createIndex('expiresAt', 'expiresAt', { unique: false })
        }

        // Metadata store for cache statistics
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' })
        }
      }
    })
  }

  /**
   * Get a character from cache
   * @param {string} characterId - Character ID to retrieve
   * @returns {Promise<Object|null>} Character data or null if not found/expired
   */
  async getCharacter(characterId) {
    if (!this.db) throw new Error('Database not opened')

    const tx = this.db.transaction(['characters'], 'readonly')
    const store = tx.objectStore('characters')
    const request = store.get(characterId)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result
        if (!result || (result.expiresAt && Date.now() > result.expiresAt)) {
          if (result) this.deleteCharacter(characterId)
          resolve(null)
          return
        }
        resolve(result)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Store a character in cache
   * @param {string} characterId - Character ID
   * @param {Object} data - Character data to store
   * @param {number} ttlSeconds - Time to live in seconds (default 300 = 5 minutes)
   * @returns {Promise<boolean>}
   */
  async setCharacter(characterId, data, ttlSeconds = 300) {
    if (!this.db) throw new Error('Database not opened')

    const entry = {
      characterId,
      data,
      timestamp: Date.now(),
      version: data.updated_at || data.updatedAt || Date.now(),
      expiresAt: Date.now() + (ttlSeconds * 1000)
    }

    const tx = this.db.transaction(['characters'], 'readwrite')
    const store = tx.objectStore('characters')
    const request = store.put(entry)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Delete a character from cache
   * @param {string} characterId - Character ID to delete
   * @returns {Promise<boolean>}
   */
  async deleteCharacter(characterId) {
    if (!this.db) throw new Error('Database not opened')

    const tx = this.db.transaction(['characters'], 'readwrite')
    const store = tx.objectStore('characters')
    const request = store.delete(characterId)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get a token image from cache
   * @param {string} characterId - Character ID
   * @returns {Promise<Object|null>} Token image data or null if not found/expired
   */
  async getTokenImage(characterId) {
    if (!this.db) throw new Error('Database not opened')

    const tx = this.db.transaction(['token_images'], 'readonly')
    const store = tx.objectStore('token_images')
    const request = store.get(characterId)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result
        if (!result || (result.expiresAt && Date.now() > result.expiresAt)) {
          if (result) this.deleteTokenImage(characterId)
          resolve(null)
          return
        }
        resolve(result)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Store a token image in cache
   * @param {string} characterId - Character ID
   * @param {string} imageUrl - URL of the image
   * @param {Blob} blob - Image blob data
   * @param {number} ttlSeconds - Time to live in seconds (default 3600 = 1 hour)
   * @returns {Promise<boolean>}
   */
  async setTokenImage(characterId, imageUrl, blob, ttlSeconds = 3600) {
    if (!this.db) throw new Error('Database not opened')

    const entry = {
      characterId,
      imageUrl,
      blob,
      timestamp: Date.now(),
      expiresAt: Date.now() + (ttlSeconds * 1000)
    }

    const tx = this.db.transaction(['token_images'], 'readwrite')
    const store = tx.objectStore('token_images')
    const request = store.put(entry)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Delete a token image from cache
   * @param {string} characterId - Character ID
   * @returns {Promise<boolean>}
   */
  async deleteTokenImage(characterId) {
    if (!this.db) throw new Error('Database not opened')

    const tx = this.db.transaction(['token_images'], 'readwrite')
    const store = tx.objectStore('token_images')
    const request = store.delete(characterId)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Clean up expired entries from all stores
   * @returns {Promise<number>} Number of entries deleted
   */
  async cleanupExpired() {
    if (!this.db) throw new Error('Database not opened')

    const now = Date.now()
    let deletedCount = 0

    // Clean characters
    try {
      const charTx = this.db.transaction(['characters'], 'readwrite')
      const charStore = charTx.objectStore('characters')
      const charIndex = charStore.index('expiresAt')
      const charRange = IDBKeyRange.upperBound(now)
      const charRequest = charIndex.openCursor(charRange)

      await new Promise((resolve, reject) => {
        charRequest.onsuccess = (event) => {
          const cursor = event.target.result
          if (cursor) {
            cursor.delete()
            deletedCount++
            cursor.continue()
          } else {
            resolve()
          }
        }
        charRequest.onerror = () => reject(charRequest.error)
      })
    } catch (err) {
      console.error('Error cleaning character cache:', err)
    }

    // Clean token images
    try {
      const imgTx = this.db.transaction(['token_images'], 'readwrite')
      const imgStore = imgTx.objectStore('token_images')
      const imgIndex = imgStore.index('expiresAt')
      const imgRange = IDBKeyRange.upperBound(now)
      const imgRequest = imgIndex.openCursor(imgRange)

      await new Promise((resolve, reject) => {
        imgRequest.onsuccess = (event) => {
          const cursor = event.target.result
          if (cursor) {
            cursor.delete()
            deletedCount++
            cursor.continue()
          } else {
            resolve()
          }
        }
        imgRequest.onerror = () => reject(imgRequest.error)
      })
    } catch (err) {
      console.error('Error cleaning token image cache:', err)
    }

    return deletedCount
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache stats
   */
  async getStats() {
    if (!this.db) throw new Error('Database not opened')

    const stats = {
      characters: 0,
      tokenImages: 0,
      totalSize: 0
    }

    // Count characters
    const charTx = this.db.transaction(['characters'], 'readonly')
    const charStore = charTx.objectStore('characters')
    const charCountRequest = charStore.count()

    stats.characters = await new Promise((resolve, reject) => {
      charCountRequest.onsuccess = () => resolve(charCountRequest.result)
      charCountRequest.onerror = () => reject(charCountRequest.error)
    })

    // Count token images
    const imgTx = this.db.transaction(['token_images'], 'readonly')
    const imgStore = imgTx.objectStore('token_images')
    const imgCountRequest = imgStore.count()

    stats.tokenImages = await new Promise((resolve, reject) => {
      imgCountRequest.onsuccess = () => resolve(imgCountRequest.result)
      imgCountRequest.onerror = () => reject(imgCountRequest.error)
    })

    return stats
  }

  /**
   * Clear all cache data
   * @returns {Promise<boolean>}
   */
  async clearAll() {
    if (!this.db) throw new Error('Database not opened')

    const tx = this.db.transaction(['characters', 'token_images'], 'readwrite')
    const charStore = tx.objectStore('characters')
    const imgStore = tx.objectStore('token_images')

    charStore.clear()
    imgStore.clear()

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => reject(tx.error)
    })
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IndexedDBCache
}
