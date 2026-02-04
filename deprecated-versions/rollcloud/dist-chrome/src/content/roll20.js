(() => {
  // src/lib/meteor-ddp-client.js
  var MeteorDDPClient = class {
    constructor(url) {
      this.url = url;
      this.ws = null;
      this.sessionId = null;
      this.connected = false;
      this.nextId = 1;
      this.pendingMethods = /* @__PURE__ */ new Map();
      this.subscriptions = /* @__PURE__ */ new Map();
      this.heartbeatInterval = null;
      this.reconnectAttempts = 0;
      this.maxReconnectAttempts = 5;
      this.onConnected = null;
      this.onDisconnected = null;
      this.onError = null;
    }
    /**
     * Connect to DiceCloud Meteor server
     */
    async connect() {
      return new Promise((resolve, reject) => {
        const wsUrl = this.url.replace("https://", "wss://").replace("http://", "ws://");
        console.log("[DDP] Connecting to:", wsUrl);
        this.ws = new WebSocket(wsUrl);
        this.ws.onopen = () => {
          console.log("[DDP] WebSocket opened");
          this.send({
            msg: "connect",
            version: "1",
            support: ["1", "pre2", "pre1"]
          });
        };
        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
            if (message.msg === "connected" && !this.connected) {
              this.connected = true;
              this.sessionId = message.session;
              this.reconnectAttempts = 0;
              this.startHeartbeat();
              console.log("[DDP] Connected with session:", this.sessionId);
              if (this.onConnected)
                this.onConnected();
              resolve(this.sessionId);
            }
          } catch (error) {
            console.error("[DDP] Failed to parse message:", error);
            if (this.onError)
              this.onError(error);
          }
        };
        this.ws.onerror = (error) => {
          console.error("[DDP] WebSocket error:", error);
          if (this.onError)
            this.onError(error);
          reject(error);
        };
        this.ws.onclose = () => {
          console.log("[DDP] WebSocket closed");
          this.connected = false;
          this.stopHeartbeat();
          if (this.onDisconnected)
            this.onDisconnected();
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1e3 * Math.pow(2, this.reconnectAttempts), 3e4);
            console.log(`[DDP] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
            setTimeout(() => this.connect(), delay);
          }
        };
      });
    }
    /**
     * Disconnect from server
     */
    disconnect() {
      this.stopHeartbeat();
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      this.connected = false;
      this.sessionId = null;
    }
    /**
     * Send a message to the server
     */
    send(message) {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        console.warn("[DDP] Cannot send message - WebSocket not open");
        return false;
      }
      const json = JSON.stringify(message);
      if (message.msg !== "ping" && message.msg !== "pong") {
        console.log("[DDP] Sending:", message.msg, message);
      }
      this.ws.send(json);
      return true;
    }
    /**
     * Handle incoming messages from server
     */
    handleMessage(message) {
      if (message.msg !== "ping" && message.msg !== "pong") {
        console.log("[DDP] Received:", message.msg, message);
      }
      switch (message.msg) {
        case "connected":
          break;
        case "failed":
          console.error("[DDP] Connection failed:", message);
          break;
        case "ping":
          this.send({ msg: "pong", id: message.id });
          break;
        case "pong":
          break;
        case "result":
          this.handleMethodResult(message);
          break;
        case "updated":
          console.log("[DDP] Methods updated:", message.methods);
          break;
        case "ready":
          this.handleSubscriptionReady(message);
          break;
        case "nosub":
          this.handleSubscriptionError(message);
          break;
        case "added":
        case "changed":
        case "removed":
          break;
        case "error":
          console.error("[DDP] Protocol error:", message);
          break;
        default:
          console.warn("[DDP] Unknown message type:", message.msg);
      }
    }
    /**
     * Handle method call result
     */
    handleMethodResult(message) {
      const { id, error, result } = message;
      const pending = this.pendingMethods.get(id);
      if (!pending) {
        console.warn("[DDP] Received result for unknown method:", id);
        return;
      }
      this.pendingMethods.delete(id);
      if (error) {
        console.error("[DDP] Method error:", error);
        pending.reject(new Error(error.message || error.reason || "Method call failed"));
      } else {
        console.log("[DDP] Method result:", result);
        pending.resolve(result);
      }
    }
    /**
     * Handle subscription ready
     */
    handleSubscriptionReady(message) {
      const { subs } = message;
      for (const id of subs) {
        const sub = this.subscriptions.get(id);
        if (sub && sub.resolve) {
          sub.resolve();
        }
      }
    }
    /**
     * Handle subscription error
     */
    handleSubscriptionError(message) {
      const { id, error } = message;
      const sub = this.subscriptions.get(id);
      if (sub && sub.reject) {
        sub.reject(new Error(error?.message || "Subscription failed"));
      }
      this.subscriptions.delete(id);
    }
    /**
     * Call a Meteor method
     */
    async call(methodName, ...params) {
      if (!this.connected) {
        throw new Error("Not connected to server");
      }
      const id = String(this.nextId++);
      return new Promise((resolve, reject) => {
        this.pendingMethods.set(id, { resolve, reject });
        this.send({
          msg: "method",
          method: methodName,
          params,
          id
        });
        setTimeout(() => {
          if (this.pendingMethods.has(id)) {
            this.pendingMethods.delete(id);
            reject(new Error(`Method call timeout: ${methodName}`));
          }
        }, 3e4);
      });
    }
    /**
     * Subscribe to a publication
     */
    async subscribe(name, ...params) {
      if (!this.connected) {
        throw new Error("Not connected to server");
      }
      const id = String(this.nextId++);
      return new Promise((resolve, reject) => {
        this.subscriptions.set(id, { name, params, resolve, reject });
        this.send({
          msg: "sub",
          id,
          name,
          params
        });
        setTimeout(() => {
          if (this.subscriptions.has(id)) {
            const sub = this.subscriptions.get(id);
            this.subscriptions.delete(id);
            reject(new Error(`Subscription timeout: ${name}`));
          }
        }, 3e4);
      });
    }
    /**
     * Unsubscribe from a publication
     */
    unsubscribe(subscriptionId) {
      this.send({
        msg: "unsub",
        id: subscriptionId
      });
      this.subscriptions.delete(subscriptionId);
    }
    /**
     * Login with token (resume token from API)
     */
    async loginWithToken(token) {
      try {
        const result = await this.call("login", {
          resume: token
        });
        console.log("[DDP] Logged in:", result);
        return result;
      } catch (error) {
        console.error("[DDP] Login failed:", error);
        throw error;
      }
    }
    /**
     * Start heartbeat ping-pong
     */
    startHeartbeat() {
      this.stopHeartbeat();
      this.heartbeatInterval = setInterval(() => {
        if (this.connected) {
          const pingId = String(this.nextId++);
          this.send({
            msg: "ping",
            id: pingId
          });
        }
      }, 25e3);
    }
    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
    }
    /**
     * Get connection status
     */
    isConnected() {
      return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
    }
  };
  if (typeof window !== "undefined") {
    window.DDPClient = MeteorDDPClient;
  }
  var meteor_ddp_client_default = MeteorDDPClient;

  // src/lib/dicecloud-sync.js
  var DiceCloudSync = class {
    constructor(ddpClient) {
      this.ddp = ddpClient;
      this.characterId = null;
      this.propertyCache = /* @__PURE__ */ new Map();
      this.previousValues = /* @__PURE__ */ new Map();
      this.enabled = false;
      this.requestQueue = [];
      this.isProcessingQueue = false;
      this.minRequestDelay = 250;
      this.lastRequestTime = 0;
      this.maxRetries = 3;
      this.propertyVariants = {
        "Channel Divinity": ["channelDivinity", "channelDivinityCleric", "channelDivinityPaladin"],
        "Ki Points": ["kiPoints", "ki", "kiPoint"],
        "Sorcery Points": ["sorceryPoints", "sorceryPoint", "sorceryPt"],
        "Bardic Inspiration": ["bardicInspiration", "bardic", "inspiration"],
        "Superiority Dice": ["superiorityDice", "superiority"],
        "Lay on Hands": ["layOnHands", "layOnHandsPool"],
        "Wild Shape": ["wildShape", "wildShapeUses"],
        "Rage": ["rage", "rageUses", "rages"],
        "Action Surge": ["actionSurge", "actionSurgeUses"],
        "Indomitable": ["indomitable", "indomitableUses"],
        "Second Wind": ["secondWind", "secondWindUses"],
        "Sneak Attack": ["sneakAttack", "sneakAttackDice"],
        "Cunning Action": ["cunningAction"],
        "Arcane Recovery": ["arcaneRecovery", "arcaneRecoveryUses"],
        "Song of Rest": ["songOfRest"],
        "Font of Magic": ["fontOfMagic"],
        "Metamagic": ["metamagic"],
        "Warlock Spell Slots": ["warlockSpellSlots", "pactMagicSlots"],
        "Pact Magic": ["pactMagic", "pactMagicSlots"],
        "Divine Sense": ["divineSense", "divineSenseUses"],
        "Divine Smite": ["divineSmite"],
        "Aura of Protection": ["auraOfProtection"],
        "Cleansing Touch": ["cleansingTouch", "cleansingTouchUses"],
        "Harness Divine Power": ["harnessDivinePower"],
        "Wild Companion": ["wildCompanion", "wildCompanionUses"],
        "Natural Recovery": ["naturalRecovery"],
        "Beast Spells": ["beastSpells"],
        "Favored Foe": ["favoredFoe", "favoredFoeUses"],
        "Deft Explorer": ["deftExplorer"],
        "Primal Awareness": ["primalAwareness"],
        "Eldritch Invocations": ["eldritchInvocations"],
        "Pact Boon": ["pactBoon"],
        "Mystic Arcanum": ["mysticArcanum"],
        "Eldritch Master": ["eldritchMaster"],
        "Signature Spells": ["signatureSpells"],
        "Spell Mastery": ["spellMastery"],
        "Heroic Inspiration": ["heroicInspiration", "inspiration"],
        "Temporary Hit Points": ["temporaryHitPoints", "tempHitPoints", "tempHP"],
        "Hit Points": ["hitPoints", "hp", "health"],
        "Death Saves - Success": ["deathSaveSuccesses", "succeededSaves", "deathSaves.successes"],
        "Death Saves - Failure": ["deathSaveFails", "failedSaves", "deathSaves.failures"]
      };
    }
    /**
     * Add a request to the queue
     * @param {Function} requestFn - Async function that makes the DDP call
     * @param {string} description - Description for logging
     * @returns {Promise} - Resolves when request completes
     */
    async queueRequest(requestFn, description = "DDP Request") {
      return new Promise((resolve, reject) => {
        const queueItem = {
          requestFn,
          description,
          resolve,
          reject,
          retries: 0,
          timestamp: Date.now()
        };
        this.requestQueue.push(queueItem);
        console.log(`[DiceCloud Sync] Queued: ${description} (Queue size: ${this.requestQueue.length})`);
        if (!this.isProcessingQueue) {
          this.processQueue();
        }
      });
    }
    /**
     * Process the request queue sequentially
     */
    async processQueue() {
      if (this.isProcessingQueue) {
        return;
      }
      this.isProcessingQueue = true;
      while (this.requestQueue.length > 0) {
        const item = this.requestQueue[0];
        try {
          const timeSinceLastRequest = Date.now() - this.lastRequestTime;
          if (timeSinceLastRequest < this.minRequestDelay) {
            const delayNeeded = this.minRequestDelay - timeSinceLastRequest;
            console.log(`[DiceCloud Sync] Rate limiting: waiting ${delayNeeded}ms before next request`);
            await this.sleep(delayNeeded);
          }
          console.log(`[DiceCloud Sync] Processing: ${item.description} (${this.requestQueue.length} remaining)`);
          this.lastRequestTime = Date.now();
          const result = await item.requestFn();
          this.requestQueue.shift();
          item.resolve(result);
          console.log(`[DiceCloud Sync] Completed: ${item.description}`);
        } catch (error) {
          console.error(`[DiceCloud Sync] Error: ${item.description}`, error);
          const isTooManyRequests = error.message?.includes("too many requests") || error.message?.includes("rate limit") || error.error === "too-many-requests" || error.error === 429;
          if (isTooManyRequests && item.retries < this.maxRetries) {
            item.retries++;
            const backoffDelay = Math.min(1e3 * Math.pow(2, item.retries), 1e4);
            console.warn(`[DiceCloud Sync] Rate limited. Retry ${item.retries}/${this.maxRetries} after ${backoffDelay}ms`);
            await this.sleep(backoffDelay);
          } else {
            this.requestQueue.shift();
            item.reject(error);
            if (isTooManyRequests) {
              console.error(`[DiceCloud Sync] Max retries reached for: ${item.description}`);
            }
          }
        }
      }
      this.isProcessingQueue = false;
      console.log("[DiceCloud Sync] Queue processing complete");
    }
    /**
     * Sleep utility
     * @param {number} ms - Milliseconds to sleep
     */
    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Initialize sync for a character
     * @param {string} characterId - DiceCloud character ID
     */
    async initialize(characterId) {
      this.characterId = characterId;
      this.propertyCache.clear();
      console.log("[DiceCloud Sync] Initializing for character:", characterId);
      console.log("[DiceCloud Sync] DDP client status:", this.ddp.isConnected());
      try {
        if (!this.ddp.isConnected()) {
          console.log("[DiceCloud Sync] Connecting to DDP...");
          await this.ddp.connect();
          console.log("[DiceCloud Sync] DDP connected successfully");
        }
        await this.buildPropertyCache();
        const result = await browserAPI.storage.local.get(["autoBackwardsSync"]);
        const autoBackwardsSync = result.autoBackwardsSync !== false;
        this.enabled = autoBackwardsSync;
        console.log("[DiceCloud Sync] Initialized successfully");
        console.log("[DiceCloud Sync] Auto backwards sync preference:", autoBackwardsSync);
        console.log("[DiceCloud Sync] Sync enabled:", this.enabled);
      } catch (error) {
        console.error("[DiceCloud Sync] Initialization failed:", error);
        throw error;
      }
    }
    /**
     * Map all variant names to a single property ID
     * @param {string} canonicalName - The canonical property name
     * @param {string} foundVariableName - The variable name that was actually found in DiceCloud
     * @param {string} propertyId - The property _id from DiceCloud
     */
    cachePropertyWithVariants(canonicalName, foundVariableName, propertyId) {
      this.propertyCache.set(canonicalName, propertyId);
      const variants = this.propertyVariants[canonicalName];
      if (variants) {
        for (const variant of variants) {
          this.propertyCache.set(variant, propertyId);
        }
        console.log(`[DiceCloud Sync] \u{1F5FA}\uFE0F  Mapped ${canonicalName} (found as "${foundVariableName}") to ${propertyId}`);
        console.log(`[DiceCloud Sync]     All variants cached: ${variants.join(", ")}`);
      } else {
        console.log(`[DiceCloud Sync] Cached property: ${canonicalName} -> ${propertyId}`);
      }
    }
    /**
     * Find a property in the raw API data by checking all possible variant names
     * @param {Array} properties - Array of properties from DiceCloud API
     * @param {string} canonicalName - The canonical property name to search for
     * @param {Object} filter - Optional filter criteria (type, attributeType, etc.)
     * @returns {Object|null} The found property or null
     */
    findPropertyByVariants(properties, canonicalName, filter = {}) {
      const variants = this.propertyVariants[canonicalName];
      if (!variants) {
        return properties.find((p) => {
          if (p.removed || p.inactive)
            return false;
          if (p.name !== canonicalName && p.variableName !== canonicalName)
            return false;
          for (const [key, value] of Object.entries(filter)) {
            if (p[key] !== value)
              return false;
          }
          return true;
        });
      }
      for (const variant of variants) {
        const property = properties.find((p) => {
          if (p.removed || p.inactive)
            return false;
          if (p.variableName !== variant && p.name !== variant)
            return false;
          for (const [key, value] of Object.entries(filter)) {
            if (p[key] !== value)
              return false;
          }
          return true;
        });
        if (property) {
          console.log(`[DiceCloud Sync] \u{1F50D} Found ${canonicalName} using variant "${variant}" (variableName: ${property.variableName})`);
          return property;
        }
      }
      return null;
    }
    /**
     * Build cache of property names to IDs
     */
    async buildPropertyCache() {
      console.log("[DiceCloud Sync] Building property cache...");
      const result = await browserAPI.storage.local.get(["activeCharacterId", "characterProfiles"]);
      const { activeCharacterId, characterProfiles } = result;
      console.log("[DiceCloud Sync] Storage result:", { activeCharacterId, characterProfilesKeys: characterProfiles ? Object.keys(characterProfiles) : null });
      if (activeCharacterId && characterProfiles && characterProfiles[activeCharacterId]) {
        const characterData = characterProfiles[activeCharacterId];
        console.log("[DiceCloud Sync] Building cache from character data:", characterData.name);
        if (!characterData.id) {
          console.warn("[DiceCloud Sync] Character data has no DiceCloud ID, skipping cache build");
          console.warn("[DiceCloud Sync] This is likely the default/placeholder character");
          return;
        }
        const currentValuesFromAPI = {};
        const tokenResult = await browserAPI.storage.local.get(["diceCloudToken"]);
        const { diceCloudToken } = tokenResult;
        if (diceCloudToken && characterData.id) {
          console.log("[DiceCloud Sync] Fetching raw DiceCloud API data for property cache...");
          try {
            const response = await browserAPI.runtime.sendMessage({
              action: "fetchDiceCloudAPI",
              url: `https://dicecloud.com/api/creature/${characterData.id}`,
              token: diceCloudToken
            });
            if (response.success && response.data) {
              const apiData = response.data;
              console.log("[DiceCloud Sync] Received API data for property cache");
              if (apiData.creatureProperties && Array.isArray(apiData.creatureProperties)) {
                console.log(`[DiceCloud Sync] Processing ${apiData.creatureProperties.length} raw properties`);
                const allProperties = {};
                for (const property of apiData.creatureProperties) {
                  if (property._id && property.name) {
                    if (!allProperties[property.name]) {
                      allProperties[property.name] = [];
                    }
                    allProperties[property.name].push(property);
                  }
                }
                const selectBestProperty = (name, properties, criteria = {}) => {
                  if (properties.length === 1)
                    return properties[0];
                  const {
                    requiredType,
                    requiredAttributeType,
                    requiredFields = [],
                    sortBy = null,
                    debug: debug2 = false
                  } = criteria;
                  if (debug2) {
                    console.log(`[DiceCloud Sync] All ${name} properties found:`);
                    properties.forEach((p) => {
                      console.log(`  - ${p.name} (${p.type}): id=${p._id}, value=${p.value}, baseValue=${p.baseValue}, total=${p.total}, damage=${p.damage}, attributeType=${p.attributeType || "none"}`);
                    });
                  }
                  if (requiredType && requiredAttributeType && requiredFields.length > 0) {
                    const exactMatches = properties.filter(
                      (p) => p.type === requiredType && p.attributeType === requiredAttributeType && requiredFields.every((field) => p[field] !== void 0) && !p.removed && !p.inactive
                    );
                    if (exactMatches.length > 0) {
                      return sortBy ? exactMatches.sort(sortBy)[0] : exactMatches[0];
                    }
                  }
                  if (requiredType && requiredAttributeType) {
                    const typeMatches = properties.filter(
                      (p) => p.type === requiredType && p.attributeType === requiredAttributeType && !p.removed && !p.inactive
                    );
                    if (typeMatches.length > 0) {
                      return sortBy ? typeMatches.sort(sortBy)[0] : typeMatches[0];
                    }
                  }
                  if (requiredType) {
                    const typeOnly = properties.filter(
                      (p) => p.type === requiredType && !p.removed && !p.inactive
                    );
                    if (typeOnly.length > 0) {
                      return sortBy ? typeOnly.sort(sortBy)[0] : typeOnly[0];
                    }
                  }
                  if (requiredFields.length > 0) {
                    const withFields = properties.filter(
                      (p) => requiredFields.every((field) => p[field] !== void 0) && !p.removed && !p.inactive
                    );
                    if (withFields.length > 0) {
                      return sortBy ? withFields.sort(sortBy)[0] : withFields[0];
                    }
                  }
                  const active = properties.find((p) => !p.removed && !p.inactive);
                  return active || properties[0];
                };
                for (const [propertyName, properties] of Object.entries(allProperties)) {
                  let selectedProperty = properties[0];
                  if (propertyName === "Hit Points") {
                    selectedProperty = selectBestProperty("Hit Points", properties, {
                      requiredType: "attribute",
                      requiredAttributeType: "healthBar",
                      requiredFields: ["damage"],
                      sortBy: (a, b) => (b.total || 0) - (a.total || 0),
                      debug: true
                    });
                    if (selectedProperty) {
                      this.propertyCache.set("Hit Points", selectedProperty._id);
                      console.log(`[DiceCloud Sync] Selected Hit Points property: ${selectedProperty.name} -> ${selectedProperty._id} (type: ${selectedProperty.type}, attributeType: ${selectedProperty.attributeType || "none"}, value: ${selectedProperty.value}, total: ${selectedProperty.total}, baseValue: ${selectedProperty.baseValue}, damage: ${selectedProperty.damage})`);
                      const currentHP = (selectedProperty.total || 0) - (selectedProperty.damage || 0);
                      currentValuesFromAPI["Hit Points"] = currentHP;
                      console.log(`[DiceCloud Sync] \u{1F4CA} Extracted current HP value: ${currentHP} (total: ${selectedProperty.total}, damage: ${selectedProperty.damage})`);
                    } else {
                      console.log(`[DiceCloud Sync] No suitable Hit Points property found`);
                    }
                    continue;
                  }
                  if (propertyName.includes("Hit Points") && propertyName !== "Hit Points" && !propertyName.includes("Temporary")) {
                    const classHP = properties.find(
                      (p) => p.type !== "skill" && (p.value !== void 0 || p.skillValue !== void 0)
                    );
                    if (classHP) {
                      this.propertyCache.set("Hit Points", classHP._id);
                      console.log(`[DiceCloud Sync] Cached class-specific HP as main Hit Points: ${propertyName} -> ${classHP._id} (type: ${classHP.type})`);
                    }
                    continue;
                  }
                  const spellSlotMatch = propertyName.match(/^(\d+(?:st|nd|rd|th)) Level$/);
                  if (spellSlotMatch) {
                    selectedProperty = selectBestProperty(propertyName, properties, {
                      requiredType: "attribute",
                      requiredAttributeType: "spellSlot",
                      requiredFields: ["value"],
                      debug: properties.length > 1
                    });
                    if (selectedProperty) {
                      this.propertyCache.set(propertyName, selectedProperty._id);
                      const slotLevel = spellSlotMatch[1].replace(/\D/g, "");
                      this.propertyCache.set(`spellSlot${slotLevel}`, selectedProperty._id);
                      console.log(`[DiceCloud Sync] Cached spell slot: ${propertyName} -> ${selectedProperty._id} (attributeType: ${selectedProperty.attributeType})`);
                      const currentSlots = selectedProperty.value || 0;
                      currentValuesFromAPI[`spellSlot${slotLevel}`] = currentSlots;
                      console.log(`[DiceCloud Sync] \u{1F4CA} Extracted current spell slot value for level ${slotLevel}: ${currentSlots}`);
                    }
                    continue;
                  }
                  if (propertyName === "Channel Divinity") {
                    selectedProperty = selectBestProperty("Channel Divinity", properties, {
                      requiredType: "attribute",
                      requiredAttributeType: "resource",
                      requiredFields: ["damage"],
                      debug: properties.length > 1
                    });
                    if (selectedProperty) {
                      this.propertyCache.set("Channel Divinity", selectedProperty._id);
                      console.log(`[DiceCloud Sync] Cached Channel Divinity: ${selectedProperty._id} (attributeType: ${selectedProperty.attributeType})`);
                      const currentCD = selectedProperty.value || 0;
                      currentValuesFromAPI["Channel Divinity"] = currentCD;
                      console.log(`[DiceCloud Sync] \u{1F4CA} Extracted current Channel Divinity value: ${currentCD}`);
                    }
                    continue;
                  }
                  this.propertyCache.set(propertyName, selectedProperty._id);
                  console.log(`[DiceCloud Sync] Cached property: ${propertyName} -> ${selectedProperty._id}`);
                }
                const actionsByName = {};
                apiData.creatureProperties.forEach((p) => {
                  if (p.type === "action" && p.name && p.uses !== void 0 && p.uses !== null && !p.removed && !p.inactive && !this.propertyCache.has(p.name)) {
                    if (!actionsByName[p.name]) {
                      actionsByName[p.name] = [];
                    }
                    actionsByName[p.name].push(p);
                  }
                });
                let actionCount = 0;
                for (const [actionName, actions] of Object.entries(actionsByName)) {
                  const action = selectBestProperty(actionName, actions, {
                    requiredType: "action",
                    requiredFields: ["uses"],
                    debug: actions.length > 1
                  });
                  if (action) {
                    this.propertyCache.set(action.name, action._id);
                    const maxUses = action.uses?.value ?? action.uses;
                    const usedUses = action.usesUsed ?? 0;
                    console.log(`[DiceCloud Sync] Cached action with uses: ${action.name} -> ${action._id} (${usedUses}/${maxUses} used)`);
                    actionCount++;
                  }
                }
                console.log(`[DiceCloud Sync] Found ${actionCount} actions with limited uses`);
                if (allProperties["Temporary Hit Points"]) {
                  const tempHP = selectBestProperty("Temporary Hit Points", allProperties["Temporary Hit Points"], {
                    requiredType: "attribute",
                    requiredAttributeType: "healthBar",
                    requiredFields: ["value"],
                    debug: allProperties["Temporary Hit Points"].length > 1
                  });
                  if (tempHP) {
                    this.propertyCache.set("Temporary Hit Points", tempHP._id);
                    console.log(`[DiceCloud Sync] Cached Temporary Hit Points: ${tempHP._id} (attributeType: ${tempHP.attributeType})`);
                    const currentTempHP = tempHP.value || 0;
                    currentValuesFromAPI["Temporary Hit Points"] = currentTempHP;
                    console.log(`[DiceCloud Sync] \u{1F4CA} Extracted current Temp HP value: ${currentTempHP}`);
                  }
                }
                ["Succeeded Saves", "Failed Saves"].forEach((saveName) => {
                  if (allProperties[saveName]) {
                    const deathSave = selectBestProperty(saveName, allProperties[saveName], {
                      requiredType: "attribute",
                      requiredAttributeType: "spellSlot",
                      debug: allProperties[saveName].length > 1
                    });
                    if (deathSave) {
                      this.propertyCache.set(saveName, deathSave._id);
                      console.log(`[DiceCloud Sync] Cached Death Save: ${saveName} -> ${deathSave._id} (attributeType: ${deathSave.attributeType})`);
                    }
                  }
                });
                ["d6 Hit Dice", "d8 Hit Dice", "d10 Hit Dice", "d12 Hit Dice"].forEach((diceName) => {
                  if (allProperties[diceName]) {
                    const hitDie = selectBestProperty(diceName, allProperties[diceName], {
                      requiredType: "attribute",
                      requiredAttributeType: "hitDice",
                      debug: allProperties[diceName].length > 1
                    });
                    if (hitDie) {
                      this.propertyCache.set(diceName, hitDie._id);
                      console.log(`[DiceCloud Sync] Cached Hit Die: ${diceName} -> ${hitDie._id} (attributeType: ${hitDie.attributeType})`);
                    }
                  }
                });
                if (allProperties["Heroic Inspiration"] || allProperties["Inspiration"]) {
                  const inspirationProps = allProperties["Heroic Inspiration"] || allProperties["Inspiration"];
                  const inspiration = selectBestProperty("Inspiration", inspirationProps, {
                    requiredType: "attribute",
                    requiredAttributeType: "resource",
                    debug: inspirationProps.length > 1
                  });
                  if (inspiration) {
                    this.propertyCache.set("Heroic Inspiration", inspiration._id);
                    this.propertyCache.set("Inspiration", inspiration._id);
                    console.log(`[DiceCloud Sync] Cached Inspiration: ${inspiration._id} (attributeType: ${inspiration.attributeType})`);
                  }
                }
                const classResourceNames = [
                  "Ki Points",
                  "Sorcery Points",
                  "Bardic Inspiration",
                  "Superiority Dice",
                  "Lay on Hands",
                  "Wild Shape",
                  "Rage",
                  "Action Surge",
                  "Indomitable",
                  "Second Wind",
                  "Sneak Attack",
                  "Cunning Action",
                  "Arcane Recovery",
                  "Song of Rest",
                  "Font of Magic",
                  "Metamagic",
                  "Sorcery Point",
                  "Warlock Spell Slots",
                  "Pact Magic",
                  "Eldritch Invocations"
                ];
                let classResourceCount = 0;
                for (const resourceName of classResourceNames) {
                  if (allProperties[resourceName] && !this.propertyCache.has(resourceName)) {
                    const resource = selectBestProperty(resourceName, allProperties[resourceName], {
                      requiredType: "attribute",
                      requiredAttributeType: "resource",
                      requiredFields: ["damage"],
                      debug: allProperties[resourceName].length > 1
                    });
                    if (resource) {
                      this.propertyCache.set(resourceName, resource._id);
                      console.log(`[DiceCloud Sync] Cached class resource: ${resourceName} -> ${resource._id} (attributeType: ${resource.attributeType})`);
                      const currentValue = resource.value || 0;
                      currentValuesFromAPI[resourceName] = currentValue;
                      console.log(`[DiceCloud Sync] \u{1F4CA} Extracted current value for ${resourceName}: ${currentValue}`);
                      classResourceCount++;
                    }
                  }
                }
                console.log(`[DiceCloud Sync] Found ${classResourceCount} class resources`);
                const restorableByName = {};
                apiData.creatureProperties.forEach((p) => {
                  if (p.type === "attribute" && p.name && p.reset && p.reset !== "none" && !p.removed && !p.inactive && !this.propertyCache.has(p.name)) {
                    if (!restorableByName[p.name]) {
                      restorableByName[p.name] = [];
                    }
                    restorableByName[p.name].push(p);
                  }
                });
                let restorableCount = 0;
                for (const [attrName, attrs] of Object.entries(restorableByName)) {
                  const attr = selectBestProperty(attrName, attrs, {
                    requiredType: "attribute",
                    requiredFields: ["reset"],
                    debug: attrs.length > 1
                  });
                  if (attr) {
                    this.propertyCache.set(attr.name, attr._id);
                    console.log(`[DiceCloud Sync] Cached restorable attribute: ${attr.name} (resets on ${attr.reset}) -> ${attr._id}`);
                    restorableCount++;
                  }
                }
                console.log(`[DiceCloud Sync] Found ${restorableCount} additional restorable attributes`);
                const customAttrsByName = {};
                apiData.creatureProperties.forEach((p) => {
                  if (p.type === "attribute" && p.name && !p.removed && !p.inactive && !this.propertyCache.has(p.name) && (p.value !== void 0 || p.baseValue !== void 0)) {
                    if (!customAttrsByName[p.name]) {
                      customAttrsByName[p.name] = [];
                    }
                    customAttrsByName[p.name].push(p);
                  }
                });
                let customAttrCount = 0;
                for (const [attrName, attrs] of Object.entries(customAttrsByName)) {
                  const attr = selectBestProperty(attrName, attrs, {
                    requiredType: "attribute",
                    requiredFields: ["value"],
                    debug: attrs.length > 1
                  });
                  if (attr) {
                    this.propertyCache.set(attr.name, attr._id);
                    console.log(`[DiceCloud Sync] Cached custom attribute: ${attr.name} -> ${attr._id} (value: ${attr.value}, baseValue: ${attr.baseValue})`);
                    const currentValue = attr.value !== void 0 ? attr.value : attr.baseValue || 0;
                    currentValuesFromAPI[attr.name] = currentValue;
                    console.log(`[DiceCloud Sync] \u{1F4CA} Extracted current value for ${attr.name}: ${currentValue}`);
                    customAttrCount++;
                  }
                }
                console.log(`[DiceCloud Sync] Found ${customAttrCount} additional custom attributes to cache`);
                const togglesByName = {};
                apiData.creatureProperties.forEach((p) => {
                  if (p.type === "toggle" && p.name && !p.removed && !p.inactive && !this.propertyCache.has(p.name)) {
                    if (!togglesByName[p.name]) {
                      togglesByName[p.name] = [];
                    }
                    togglesByName[p.name].push(p);
                  }
                });
                let toggleCount = 0;
                for (const [toggleName, toggles] of Object.entries(togglesByName)) {
                  const toggle = selectBestProperty(toggleName, toggles, {
                    requiredType: "toggle",
                    debug: toggles.length > 1
                  });
                  if (toggle) {
                    this.propertyCache.set(toggle.name, toggle._id);
                    console.log(`[DiceCloud Sync] Cached toggle: ${toggle.name} -> ${toggle._id}`);
                    toggleCount++;
                  }
                }
                console.log(`[DiceCloud Sync] Found ${toggleCount} toggles`);
                console.log("[DiceCloud Sync] \u{1F5FA}\uFE0F  Starting comprehensive variant mapping...");
                for (const [canonicalName, variants] of Object.entries(this.propertyVariants)) {
                  let foundProperty = null;
                  let foundVariant = null;
                  for (const variant of variants) {
                    const property = apiData.creatureProperties.find((p) => {
                      if (p.removed || p.inactive)
                        return false;
                      if (p.variableName === variant || p.name === variant) {
                        if (canonicalName === "Channel Divinity" || canonicalName === "Ki Points" || canonicalName === "Sorcery Points" || canonicalName === "Bardic Inspiration") {
                          return p.type === "attribute" && p.attributeType === "resource";
                        }
                        if (canonicalName === "Temporary Hit Points") {
                          return p.type === "attribute" && p.attributeType === "healthBar";
                        }
                        if (canonicalName === "Hit Points") {
                          return p.type === "attribute" && p.attributeType === "healthBar";
                        }
                        return p.type === "attribute" || p.type === "action";
                      }
                      return false;
                    });
                    if (property) {
                      foundProperty = property;
                      foundVariant = variant;
                      break;
                    }
                  }
                  if (foundProperty) {
                    this.cachePropertyWithVariants(canonicalName, foundVariant, foundProperty._id);
                    if (foundProperty.value !== void 0) {
                      currentValuesFromAPI[canonicalName] = foundProperty.value;
                      console.log(`[DiceCloud Sync] \u{1F4CA} Extracted current value for ${canonicalName}: ${foundProperty.value}`);
                    }
                  }
                }
                console.log("[DiceCloud Sync] \u2705 Comprehensive variant mapping complete");
              }
            } else {
              console.warn("[DiceCloud Sync] Failed to fetch API data for property cache:", response.error);
            }
          } catch (error) {
            console.error("[DiceCloud Sync] Error fetching API data for property cache:", error);
          }
        }
        if (characterData.actions && Array.isArray(characterData.actions)) {
          console.log(`[DiceCloud Sync] Processing ${characterData.actions.length} actions`);
          for (const action of characterData.actions) {
            if (action.name) {
              if (!this.propertyCache.has(action.name)) {
                const propertyId = this.findPropertyId(action.name);
                if (propertyId) {
                  this.propertyCache.set(action.name, propertyId);
                  console.log(`[DiceCloud Sync] Cached action: ${action.name} -> ${propertyId}`);
                } else {
                  console.warn(`[DiceCloud Sync] No property ID found for action: ${action.name}`);
                }
              }
            }
          }
        }
        console.log(`[DiceCloud Sync] Property cache built with ${this.propertyCache.size} entries`);
        console.log("[DiceCloud Sync] Available properties:", Array.from(this.propertyCache.keys()));
        console.log("[DiceCloud Sync] Initializing previousValues from current character data...");
        await this.initializePreviousValues(characterData, currentValuesFromAPI);
      } else {
        console.warn("[DiceCloud Sync] No character data available for cache building");
        console.warn("[DiceCloud Sync] activeCharacterId:", activeCharacterId);
        console.warn("[DiceCloud Sync] characterProfiles:", characterProfiles);
      }
    }
    /**
     * Initialize previousValues from character data to avoid syncing everything on first update
     * @param {Object} characterData - Character data object
     * @param {Object} apiValues - Current values extracted from DiceCloud API (optional)
     */
    async initializePreviousValues(characterData, apiValues = {}) {
      console.log("[DiceCloud Sync] Populating previousValues to establish baseline...");
      if (apiValues["Hit Points"] !== void 0) {
        this.previousValues.set("Hit Points", apiValues["Hit Points"]);
        console.log(`[DiceCloud Sync] \u{1F4CA} Initialized Hit Points from API: ${apiValues["Hit Points"]}`);
      } else if (characterData.hp !== void 0) {
        this.previousValues.set("Hit Points", characterData.hp);
      }
      if (apiValues["Temporary Hit Points"] !== void 0) {
        this.previousValues.set("Temporary Hit Points", apiValues["Temporary Hit Points"]);
        console.log(`[DiceCloud Sync] \u{1F4CA} Initialized Temp HP from API: ${apiValues["Temporary Hit Points"]}`);
      } else if (characterData.tempHp !== void 0) {
        this.previousValues.set("Temporary Hit Points", characterData.tempHp);
      }
      if (characterData.maxHp !== void 0) {
        this.previousValues.set("Max Hit Points", characterData.maxHp);
      }
      for (let level = 1; level <= 9; level++) {
        const cacheKey = `spellSlot${level}`;
        if (characterData.spellSlots) {
          const currentKey = `level${level}SpellSlots`;
          const maxKey = `level${level}SpellSlotsMax`;
          if (characterData.spellSlots[currentKey] !== void 0 && characterData.spellSlots[maxKey] !== void 0) {
            if (characterData.spellSlots[maxKey] > 0) {
              this.previousValues.set(cacheKey, characterData.spellSlots[currentKey]);
              console.log(`[DiceCloud Sync] \u{1F4CA} Initialized spell slot level ${level} from extension: ${characterData.spellSlots[currentKey]}`);
            }
          }
        } else if (apiValues[cacheKey] !== void 0) {
          this.previousValues.set(cacheKey, apiValues[cacheKey]);
          console.log(`[DiceCloud Sync] \u{1F4CA} Initialized spell slot level ${level} from API (fallback): ${apiValues[cacheKey]}`);
        }
      }
      if (apiValues["Channel Divinity"] !== void 0) {
        this.previousValues.set("Channel Divinity", apiValues["Channel Divinity"]);
        console.log(`[DiceCloud Sync] \u{1F4CA} Initialized Channel Divinity from API: ${apiValues["Channel Divinity"]}`);
      } else if (characterData.channelDivinity && characterData.channelDivinity.current !== void 0) {
        this.previousValues.set("Channel Divinity", characterData.channelDivinity.current);
      }
      if (characterData.resources && Array.isArray(characterData.resources)) {
        for (const resource of characterData.resources) {
          if (resource.name && resource.current !== void 0) {
            this.previousValues.set(resource.name, resource.current);
          }
        }
      }
      if (characterData.actions && Array.isArray(characterData.actions)) {
        for (const action of characterData.actions) {
          if (action.name && action.uses && action.usesUsed !== void 0) {
            const cacheKey = `action_${action.name}`;
            this.previousValues.set(cacheKey, action.usesUsed);
          }
        }
      }
      if (characterData.deathSaves) {
        if (characterData.deathSaves.successes !== void 0) {
          this.previousValues.set("Succeeded Saves", characterData.deathSaves.successes);
        }
        if (characterData.deathSaves.failures !== void 0) {
          this.previousValues.set("Failed Saves", characterData.deathSaves.failures);
        }
      }
      if (characterData.inspiration !== void 0) {
        this.previousValues.set("Inspiration", characterData.inspiration);
      }
      if (apiValues && Object.keys(apiValues).length > 0) {
        for (const [key, value] of Object.entries(apiValues)) {
          if (!this.previousValues.has(key)) {
            this.previousValues.set(key, value);
            console.log(`[DiceCloud Sync] \u{1F4CA} Initialized ${key} from API: ${value}`);
          }
        }
      }
      console.log(`[DiceCloud Sync] Initialized ${this.previousValues.size} previous values`);
    }
    /**
     * Increment action uses (e.g., used 1 of 3 uses)
     * @param {string} actionName - Name of the action
     * @param {number} amount - Amount to increment (usually 1)
     */
    async incrementActionUses(actionName, amount = 1) {
      if (!this.enabled) {
        console.warn("[DiceCloud Sync] Sync not enabled");
        return;
      }
      const propertyId = this.findPropertyId(actionName);
      if (!propertyId) {
        console.warn(`[DiceCloud Sync] Property not found: ${actionName}`);
        return;
      }
      return this.queueRequest(
        async () => {
          console.log(`[DiceCloud Sync] Incrementing uses for ${actionName} (${propertyId}) by ${amount}`);
          const result = await this.ddp.call("creatureProperties.update", {
            _id: propertyId,
            path: ["usesUsed"],
            value: amount
          });
          console.log("[DiceCloud Sync] \u23F3 Increment request sent:", result);
          return result;
        },
        `Increment ${actionName} uses`
      );
    }
    /**
     * Set action uses to a specific value
     * @param {string} actionName - Name of the action
     * @param {number} value - New value for usesUsed
     */
    async setActionUses(actionName, value) {
      if (!this.enabled) {
        console.warn("[DiceCloud Sync] Sync not enabled");
        return;
      }
      const propertyId = this.findPropertyId(actionName);
      if (!propertyId) {
        console.warn(`[DiceCloud Sync] Property not found: ${actionName}`);
        return;
      }
      return this.queueRequest(
        async () => {
          console.log(`[DiceCloud Sync] Setting uses for ${actionName} (${propertyId}) to ${value}`);
          const result = await this.ddp.call("creatureProperties.update", {
            _id: propertyId,
            path: ["usesUsed"],
            value
          });
          console.log("[DiceCloud Sync] \u23F3 Set uses request sent:", result);
          return result;
        },
        `Set ${actionName} uses to ${value}`
      );
    }
    /**
     * Update attribute value (HP, Ki Points, Sorcery Points, etc.)
     * @param {string} attributeName - Name of the attribute
     * @param {number} value - New value
     */
    async updateAttributeValue(attributeName, value) {
      if (!this.enabled) {
        console.warn("[DiceCloud Sync] Sync not enabled");
        return;
      }
      const propertyId = this.findPropertyId(attributeName);
      if (!propertyId) {
        console.warn(`[DiceCloud Sync] Property not found: ${attributeName}`);
        return;
      }
      console.log(`[DiceCloud Sync] Updating attribute ${attributeName} (${propertyId}) to ${value}`);
      const updatePayload = {
        _id: propertyId,
        path: ["value"],
        // Default, will be updated based on property type
        value
      };
      try {
        const tokenResult = await browserAPI.storage.local.get(["diceCloudToken"]);
        const { diceCloudToken } = tokenResult;
        if (diceCloudToken) {
          const characterId = this.characterId;
          const currentResponse = await browserAPI.runtime.sendMessage({
            action: "fetchDiceCloudAPI",
            url: `https://dicecloud.com/api/creature/${characterId}`,
            token: diceCloudToken
          });
          if (currentResponse.success && currentResponse.data) {
            const property = currentResponse.data.creatureProperties.find((p) => p._id === propertyId);
            if (property) {
              console.log("[DiceCloud Sync] Property before update:", {
                id: property._id,
                name: property.name,
                type: property.type,
                attributeType: property.attributeType,
                value: property.value,
                baseValue: property.baseValue,
                total: property.total,
                damage: property.damage,
                skillValue: property.skillValue,
                dirty: property.dirty
              });
              let fieldName = "value";
              let updateValue = value;
              let useHealthBarMethod = false;
              if (property.type === "skill") {
                fieldName = "skillValue";
              } else if (property.type === "effect") {
                fieldName = property.calculation ? "calculation" : "value";
              } else if (property.type === "attribute" && property.attributeType === "healthBar") {
                console.log(`[DiceCloud Sync] HealthBar update: currentHP=${property.value}, newCurrentHP=${value}, total=${property.total}, currentDamage=${property.damage}`);
                useHealthBarMethod = true;
                updateValue = value;
              } else if (property.type === "attribute") {
                fieldName = "value";
              }
              console.log(`[DiceCloud Sync] Using field name: ${fieldName} for property type: ${property.type}, attributeType: ${property.attributeType || "none"}`);
              console.log(`[DiceCloud Sync] Use healthBar method: ${useHealthBarMethod}`);
              if (useHealthBarMethod) {
                updatePayload.operation = "set";
                updatePayload.value = updateValue;
                delete updatePayload.path;
              } else {
                updatePayload.path = [fieldName];
                updatePayload.value = updateValue;
              }
            }
          }
        } else {
          console.warn("[DiceCloud Sync] No DiceCloud token available for verification");
        }
      } catch (error) {
        console.error("[DiceCloud Sync] Failed to get current property value:", error);
      }
      let methodName = "creatureProperties.update";
      if (updatePayload.operation === "set" && !updatePayload.path) {
        methodName = "creatureProperties.damage";
      }
      console.log(`[DiceCloud Sync] Using DDP method: ${methodName}`);
      console.log("[DiceCloud Sync] DDP update payload:", JSON.stringify(updatePayload, null, 2));
      return this.queueRequest(
        async () => {
          const result = await this.ddp.call(methodName, updatePayload);
          console.log(`[DiceCloud Sync] \u23F3 Update request sent using ${methodName}:`, result);
          console.log("[DiceCloud Sync] Checking if update was applied...");
          setTimeout(async () => {
            try {
              const tokenResult = await browserAPI.storage.local.get(["diceCloudToken"]);
              const { diceCloudToken } = tokenResult;
              if (diceCloudToken) {
                console.log("[DiceCloud Sync] Verifying update for property:", propertyId);
                console.log("[DiceCloud Sync] Character ID available:", this.characterId);
                const characterId = this.characterId;
                if (!characterId) {
                  console.error("[DiceCloud Sync] No character ID available for verification");
                  return;
                }
                const verifyResponse = await browserAPI.runtime.sendMessage({
                  action: "fetchDiceCloudAPI",
                  url: `https://dicecloud.com/api/creature/${characterId}`,
                  token: diceCloudToken
                });
                console.log("[DiceCloud Sync] Verification API response:", verifyResponse);
                if (verifyResponse.success && verifyResponse.data) {
                  console.log("[DiceCloud Sync] Verification API data received, looking for property:", propertyId);
                  console.log("[DiceCloud Sync] Total properties in response:", verifyResponse.data.creatureProperties?.length);
                  const property = verifyResponse.data.creatureProperties.find((p) => p._id === propertyId);
                  if (property) {
                    console.log("[DiceCloud Sync] Property after update:", {
                      id: property._id,
                      name: property.name,
                      type: property.type,
                      attributeType: property.attributeType,
                      value: property.value,
                      total: property.total,
                      baseValue: property.baseValue,
                      damage: property.damage,
                      dirty: property.dirty,
                      lastUpdated: property.lastUpdated
                    });
                    if (property.value === value) {
                      console.log("[DiceCloud Sync] \u2705 SUCCESS: Value updated correctly!");
                    } else {
                      console.warn("[DiceCloud Sync] \u274C ISSUE: Value did not change. Expected:", value, "Actual:", property.value);
                      if (property.total && property.damage !== void 0) {
                        const calculatedValue = property.total - property.damage;
                        console.log(`[DiceCloud Sync] Calculated value: ${property.total} - ${property.damage} = ${calculatedValue}`);
                      }
                    }
                  } else {
                    console.warn("[DiceCloud Sync] Property not found in character data");
                    console.log(
                      "[DiceCloud Sync] Available HP properties:",
                      verifyResponse.data.creatureProperties.filter((p) => p.name && p.name.toLowerCase().includes("hit points")).map((p) => ({ id: p._id, name: p.name, value: p.value }))
                    );
                  }
                } else {
                  console.error("[DiceCloud Sync] Failed to verify update:", verifyResponse.error);
                }
              } else {
                console.warn("[DiceCloud Sync] No DiceCloud token available for verification");
              }
            } catch (error) {
              console.error("[DiceCloud Sync] Failed to verify update:", error);
            }
          }, 1e3);
          return result;
        },
        `Update ${attributeName} to ${value}`
      );
    }
    /**
     * Update spell slot current value
     * @param {number} level - Spell level (1-9)
     * @param {number} slotsRemaining - Number of slots remaining
     */
    async updateSpellSlot(level, slotsRemaining) {
      if (!this.enabled) {
        console.warn("[DiceCloud Sync] Sync not enabled");
        return;
      }
      try {
        const slotKey = `spellSlot${level}`;
        const slotName = `${level}${this.getOrdinalSuffix(level)} Level`;
        let propertyId = this.findPropertyId(slotKey);
        if (!propertyId) {
          propertyId = this.findPropertyId(slotName);
        }
        if (!propertyId) {
          console.warn(`[DiceCloud Sync] \u274C Spell slot level ${level} not found in property cache`);
          console.warn(`[DiceCloud Sync] Tried keys: "${slotKey}", "${slotName}"`);
          const spellSlotProps = Array.from(this.propertyCache.keys()).filter((name) => name.toLowerCase().includes("level") || name.toLowerCase().includes("spell"));
          console.warn(`[DiceCloud Sync] Cached spell-related properties:`, spellSlotProps);
          return;
        }
        console.log(`[DiceCloud Sync] Updating spell slot level ${level} to ${slotsRemaining} remaining`);
        const debugTokenResult = await browserAPI.storage.local.get(["diceCloudToken"]);
        if (debugTokenResult.diceCloudToken && this.characterId) {
          const debugResponse = await browserAPI.runtime.sendMessage({
            action: "fetchDiceCloudAPI",
            url: `https://dicecloud.com/api/creature/${this.characterId}`,
            token: debugTokenResult.diceCloudToken
          });
          if (debugResponse.success && debugResponse.data) {
            const spellSlotProp = debugResponse.data.creatureProperties.find((p) => p._id === propertyId);
            if (spellSlotProp) {
              console.log(`[DiceCloud Sync] \u{1F50D} Spell slot property structure:
` + JSON.stringify(spellSlotProp, null, 2));
            }
          }
        }
        const result = await this.queueRequest(
          () => this.ddp.call("creatureProperties.update", {
            _id: propertyId,
            path: ["value"],
            value: slotsRemaining
          }),
          `Update spell slot level ${level} to ${slotsRemaining}`
        );
        console.log(`[DiceCloud Sync] \u23F3 Spell slot level ${level} update request sent:`, result);
        return result;
      } catch (error) {
        console.error(`[DiceCloud Sync] \u274C Failed to update spell slot level ${level}:`, error);
        throw error;
      }
    }
    /**
     * Fetch character data from DiceCloud API
     * @param {string} characterId - The character ID
     * @returns {Promise<object>} The API response data
     */
    async fetchDiceCloudData(characterId) {
      const tokenResult = await browserAPI.storage.local.get(["diceCloudToken"]);
      if (!tokenResult.diceCloudToken) {
        throw new Error("No DiceCloud token found");
      }
      const response = await browserAPI.runtime.sendMessage({
        action: "fetchDiceCloudAPI",
        url: `https://dicecloud.com/api/creature/${characterId}`,
        token: tokenResult.diceCloudToken
      });
      if (!response.success) {
        throw new Error("API request failed");
      }
      return response.data;
    }
    /**
     * Update Channel Divinity uses
     * @param {number} usesRemaining - Number of uses remaining
     */
    async updateChannelDivinity(usesRemaining) {
      if (!this.enabled) {
        console.warn("[DiceCloud Sync] Sync not enabled");
        return;
      }
      try {
        const propertyId = this.findPropertyId("Channel Divinity");
        if (!propertyId) {
          console.warn("[DiceCloud Sync] Channel Divinity not found");
          return;
        }
        console.log(`[DiceCloud Sync] Updating Channel Divinity to ${usesRemaining} uses remaining`);
        const apiData = await this.fetchDiceCloudData(this.characterId);
        const property = apiData?.creatureProperties?.find((p) => p._id === propertyId);
        if (!property) {
          console.error("[DiceCloud Sync] Could not find Channel Divinity property in API data");
          return;
        }
        const total = property.total || property.baseValue?.value || 3;
        console.log(`[DiceCloud Sync] Resource calculation: total=${total}, usesRemaining=${usesRemaining}, damage=${property.damage || 0}`);
        console.log(`[DiceCloud Sync] Channel Divinity before update:`, {
          value: property.value,
          damage: property.damage,
          total: property.total
        });
        const result = await this.queueRequest(
          () => this.ddp.call("creatureProperties.damage", {
            _id: propertyId,
            value: usesRemaining,
            operation: "set"
          }),
          `Update Channel Divinity to ${usesRemaining}`
        );
        console.log("[DiceCloud Sync] \u23F3 Channel Divinity update request sent:", result);
        if (this.characterId) {
          console.log("[DiceCloud Sync] Verifying Channel Divinity update...");
          try {
            const verifyData = await this.fetchDiceCloudData(this.characterId);
            if (verifyData && verifyData.creatureProperties) {
              const verifiedProperty = verifyData.creatureProperties.find((p) => p._id === propertyId);
              if (verifiedProperty) {
                const actualUsesRemaining = (verifiedProperty.total || total) - (verifiedProperty.damage || 0);
                console.log(`[DiceCloud Sync] Channel Divinity after update:`, {
                  value: verifiedProperty.value,
                  damage: verifiedProperty.damage,
                  total: verifiedProperty.total,
                  calculatedUsesRemaining: actualUsesRemaining
                });
                if (actualUsesRemaining === usesRemaining || verifiedProperty.value === usesRemaining) {
                  console.log("[DiceCloud Sync] \u2705 SUCCESS: Channel Divinity updated correctly!");
                } else {
                  console.warn(`[DiceCloud Sync] \u26A0\uFE0F WARNING: Channel Divinity value mismatch! Expected ${usesRemaining}, got ${actualUsesRemaining}`);
                }
              }
            }
          } catch (verifyError) {
            console.warn("[DiceCloud Sync] Could not verify Channel Divinity update:", verifyError);
          }
        }
        return result;
      } catch (error) {
        console.error("[DiceCloud Sync] Failed to update Channel Divinity:", error);
        throw error;
      }
    }
    /**
     * Update any generic resource by name
     * @param {string} resourceName - Name of the resource (Ki Points, Sorcery Points, etc.)
     * @param {number} value - New value
     */
    async updateResource(resourceName, value) {
      if (!this.enabled) {
        console.warn("[DiceCloud Sync] Sync not enabled");
        return;
      }
      try {
        const propertyId = this.findPropertyId(resourceName);
        if (!propertyId) {
          console.warn(`[DiceCloud Sync] \u274C Resource "${resourceName}" not found in property cache`);
          console.warn(`[DiceCloud Sync] Available cached properties:`, Array.from(this.propertyCache.keys()).sort());
          const similarNames = Array.from(this.propertyCache.keys()).filter((name) => name.toLowerCase().includes(resourceName.toLowerCase()) || resourceName.toLowerCase().includes(name.toLowerCase())).slice(0, 5);
          if (similarNames.length > 0) {
            console.warn(`[DiceCloud Sync] \u{1F4A1} Did you mean one of these? ${similarNames.join(", ")}`);
          }
          return;
        }
        console.log(`[DiceCloud Sync] Updating ${resourceName} to ${value}`);
        const result = await this.queueRequest(
          () => this.ddp.call("creatureProperties.update", {
            _id: propertyId,
            path: ["value"],
            value
          }),
          `Update ${resourceName} to ${value}`
        );
        console.log(`[DiceCloud Sync] \u23F3 ${resourceName} update request sent:`, result);
        return result;
      } catch (error) {
        console.error(`[DiceCloud Sync] \u274C Failed to update ${resourceName}:`, error);
        throw error;
      }
    }
    /**
     * Update Temporary Hit Points
     * @param {number} tempHP - Temporary HP value
     */
    async updateTemporaryHP(tempHP) {
      return this.updateResource("Temporary Hit Points", tempHP);
    }
    /**
     * Update Death Saves
     * @param {number} succeeded - Number of succeeded death saves
     * @param {number} failed - Number of failed death saves
     */
    async updateDeathSaves(succeeded, failed) {
      const results = [];
      if (succeeded !== void 0) {
        results.push(await this.updateResource("Succeeded Saves", succeeded));
      }
      if (failed !== void 0) {
        results.push(await this.updateResource("Failed Saves", failed));
      }
      return results;
    }
    /**
     * Update Hit Dice remaining
     * @param {string} dieType - Die type ('d6', 'd8', 'd10', 'd12')
     * @param {number} remaining - Number of hit dice remaining
     */
    async updateHitDice(dieType, remaining) {
      const resourceName = `${dieType} Hit Dice`;
      return this.updateResource(resourceName, remaining);
    }
    /**
     * Update Inspiration/Heroic Inspiration
     * @param {number} value - Inspiration value (typically 0 or 1)
     */
    async updateInspiration(value) {
      return this.updateResource("Heroic Inspiration", value);
    }
    /**
     * Update toggle state (conditions, active features, etc.)
     * @param {string} toggleName - Name of the toggle
     * @param {boolean} enabled - Whether the toggle is enabled
     */
    async updateToggle(toggleName, enabled) {
      if (!this.enabled) {
        console.warn("[DiceCloud Sync] Sync not enabled");
        return;
      }
      try {
        const propertyId = this.findPropertyId(toggleName);
        if (!propertyId) {
          console.warn(`[DiceCloud Sync] Toggle "${toggleName}" not found`);
          return;
        }
        console.log(`[DiceCloud Sync] Setting toggle ${toggleName} to ${enabled ? "enabled" : "disabled"}`);
        const result = await this.queueRequest(
          () => this.ddp.call("creatureProperties.update", {
            _id: propertyId,
            path: ["enabled"],
            value: enabled
          }),
          `Update toggle ${toggleName} to ${enabled ? "enabled" : "disabled"}`
        );
        console.log(`[DiceCloud Sync] \u23F3 Toggle ${toggleName} update request sent:`, result);
        return result;
      } catch (error) {
        console.error(`[DiceCloud Sync] Failed to update toggle ${toggleName}:`, error);
        throw error;
      }
    }
    /**
     * Helper to get ordinal suffix (1st, 2nd, 3rd, etc.)
     */
    getOrdinalSuffix(num) {
      const j = num % 10;
      const k = num % 100;
      if (j === 1 && k !== 11)
        return "st";
      if (j === 2 && k !== 12)
        return "nd";
      if (j === 3 && k !== 13)
        return "rd";
      return "th";
    }
    findPropertyId(attributeName) {
      const propertyId = this.propertyCache.get(attributeName);
      if (propertyId) {
        console.log(`[DiceCloud Sync] \u2705 Found property ID for "${attributeName}": ${propertyId}`);
        return propertyId;
      }
      for (const [canonicalName, variants] of Object.entries(this.propertyVariants)) {
        if (variants.includes(attributeName) || canonicalName === attributeName) {
          const canonicalId = this.propertyCache.get(canonicalName);
          if (canonicalId) {
            console.log(`[DiceCloud Sync] \u{1F50D} Found "${attributeName}" via canonical name "${canonicalName}": ${canonicalId}`);
            this.propertyCache.set(attributeName, canonicalId);
            return canonicalId;
          }
          for (const variant of variants) {
            const variantId = this.propertyCache.get(variant);
            if (variantId) {
              console.log(`[DiceCloud Sync] \u{1F50D} Found "${attributeName}" via variant "${variant}": ${variantId}`);
              this.propertyCache.set(attributeName, variantId);
              return variantId;
            }
          }
        }
      }
      if (attributeName === "Hit Points" || attributeName === "hitPoints" || attributeName === "hp") {
        console.log("[DiceCloud Sync] Looking for Hit Points alternatives...");
        const hpRelatedProps = Array.from(this.propertyCache.keys()).filter(
          (name) => name.toLowerCase().includes("hit points") || name.toLowerCase().includes("hp") || name.toLowerCase().includes("health")
        );
        console.log("[DiceCloud Sync] HP-related properties found:", hpRelatedProps);
        const classSpecificHP = hpRelatedProps.find((name) => name !== "Hit Points" && name.includes("Hit Points"));
        if (classSpecificHP) {
          const classSpecificId = this.propertyCache.get(classSpecificHP);
          console.log(`[DiceCloud Sync] Using class-specific HP: ${classSpecificHP} -> ${classSpecificId}`);
          return classSpecificId;
        }
      }
      if (attributeName === "Channel Divinity" || attributeName === "channelDivinity" || attributeName === "channelDivinityCleric" || attributeName === "channelDivinityPaladin") {
        console.log("[DiceCloud Sync] Looking for Channel Divinity alternatives...");
        const cdRelatedProps = Array.from(this.propertyCache.keys()).filter(
          (name) => name.toLowerCase().includes("channel divinity") || name.toLowerCase().includes("channeldivinity")
        );
        console.log("[DiceCloud Sync] Channel Divinity-related properties found:", cdRelatedProps);
        const classSpecificCD = cdRelatedProps.find(
          (name) => name !== "Channel Divinity" && (name.includes("Channel Divinity") || name.includes("channelDivinity"))
        );
        if (classSpecificCD) {
          const classSpecificId = this.propertyCache.get(classSpecificCD);
          console.log(`[DiceCloud Sync] Using class-specific Channel Divinity: ${classSpecificCD} -> ${classSpecificId}`);
          return classSpecificId;
        }
        if (cdRelatedProps.length > 0) {
          const anyCD = cdRelatedProps[0];
          const anyCDId = this.propertyCache.get(anyCD);
          console.log(`[DiceCloud Sync] Using Channel Divinity variant: ${anyCD} -> ${anyCDId}`);
          return anyCDId;
        }
      }
      console.warn(`[DiceCloud Sync] \u274C Property ID not found for: "${attributeName}"`);
      console.warn(`[DiceCloud Sync] Available properties (showing first 20):`, Array.from(this.propertyCache.keys()).slice(0, 20));
      const potentialMatches = Array.from(this.propertyCache.keys()).filter(
        (name) => name.toLowerCase().includes(attributeName.toLowerCase()) || attributeName.toLowerCase().includes(name.toLowerCase())
      );
      if (potentialMatches.length > 0) {
        console.warn(`[DiceCloud Sync] \u{1F4A1} Potential matches:`, potentialMatches);
      }
      return null;
    }
    setupRoll20EventListeners() {
      console.log("[DiceCloud Sync] Setting up Roll20 event listeners...");
      window.addEventListener("message", (event) => {
        if (event.data.type === "characterDataUpdate") {
          console.log("[SYNC DEBUG] Received characterDataUpdate message");
          console.log("[SYNC DEBUG] Full event.data:", event.data);
          console.log("[SYNC DEBUG] event.data.characterData:", event.data.characterData);
          console.log("[SYNC DEBUG] channelDivinity in message:", event.data.characterData?.channelDivinity);
          console.log("[SYNC DEBUG] resources in message:", event.data.characterData?.resources);
          this.handleCharacterDataUpdate(event.data.characterData);
        }
      });
      window.addEventListener("message", (event) => {
        if (event.data.type === "actionUsageUpdate") {
          this.handleActionUsageUpdate(event.data.actionName, event.data.usesUsed);
        }
      });
      window.addEventListener("message", (event) => {
        if (event.data.type === "attributeUpdate") {
          this.handleAttributeUpdate(event.data.attributeName, event.data.value);
        }
      });
      console.log("[DiceCloud Sync] Roll20 event listeners set up");
    }
    /**
     * Handle character data updates from Roll20
     * @param {Object} characterData - Updated character data
     */
    async handleCharacterDataUpdate(characterData) {
      if (!this.enabled) {
        console.warn("[DiceCloud Sync] Sync not enabled, ignoring update");
        return;
      }
      console.log("[DiceCloud Sync] ========== HANDLING CHARACTER DATA UPDATE ==========");
      console.log("[DiceCloud Sync] Character:", characterData.name);
      console.log("[DiceCloud Sync] Received data keys:", Object.keys(characterData));
      console.log("[DiceCloud Sync] Resources:", characterData.resources);
      console.log("[DiceCloud Sync] Channel Divinity:", characterData.channelDivinity);
      console.log("[DiceCloud Sync] Death Saves:", characterData.deathSaves);
      console.log("[DiceCloud Sync] Inspiration:", characterData.inspiration);
      console.log("[DiceCloud Sync] Actions:", characterData.actions);
      console.log("[DiceCloud Sync] Property Cache size:", this.propertyCache.size);
      console.log("[DiceCloud Sync] Property Cache keys:", Array.from(this.propertyCache.keys()));
      console.log("[DiceCloud Sync] ========================================");
      if (this.previousValues.size === 0) {
        console.log("[DiceCloud Sync] \u{1F527} previousValues is empty, initializing from first update (no sync)");
        await this.initializePreviousValues(characterData);
        return;
      }
      const hasChanged = (key, newValue) => {
        const oldValue = this.previousValues.get(key);
        if (oldValue === void 0) {
          console.log(`[DiceCloud Sync] \u{1F4E5} Initializing ${key}: ${newValue} (no sync)`);
          this.previousValues.set(key, newValue);
          return false;
        }
        const changed = oldValue !== newValue;
        if (changed) {
          console.log(`[DiceCloud Sync] \u270F\uFE0F Value changed for ${key}: ${oldValue} -> ${newValue} (will sync)`);
          this.previousValues.set(key, newValue);
        }
        return changed;
      };
      if (characterData.hp !== void 0 && hasChanged("Hit Points", characterData.hp)) {
        await this.updateAttributeValue("Hit Points", characterData.hp);
      }
      if (characterData.tempHp !== void 0 && hasChanged("Temporary Hit Points", characterData.tempHp)) {
        await this.updateAttributeValue("Temporary Hit Points", characterData.tempHp);
      }
      if (characterData.maxHp !== void 0 && hasChanged("Max Hit Points", characterData.maxHp)) {
        await this.updateAttributeValue("Max Hit Points", characterData.maxHp);
      }
      if (characterData.spellSlots) {
        for (let level = 1; level <= 9; level++) {
          const currentKey = `level${level}SpellSlots`;
          const maxKey = `level${level}SpellSlotsMax`;
          if (characterData.spellSlots[currentKey] !== void 0 && characterData.spellSlots[maxKey] !== void 0) {
            if (characterData.spellSlots[maxKey] > 0) {
              const cacheKey = `spellSlot${level}`;
              const currentValue = characterData.spellSlots[currentKey];
              const previousValue = this.previousValues.get(cacheKey);
              console.log(`[SYNC DEBUG] Spell Slot Level ${level} - previous: ${previousValue}, current: ${currentValue}`);
              if (hasChanged(cacheKey, currentValue)) {
                console.log(`[DiceCloud Sync] \u2705 Syncing spell slot level ${level}: ${currentValue}/${characterData.spellSlots[maxKey]}`);
                await this.updateSpellSlot(level, currentValue);
              } else {
                console.log(`[SYNC DEBUG] \u23ED\uFE0F Spell slot level ${level} unchanged (${currentValue}), skipping sync`);
              }
            }
          }
        }
      }
      console.log("[SYNC DEBUG] characterData.channelDivinity:", characterData.channelDivinity);
      console.log("[SYNC DEBUG] characterData.resources:", characterData.resources);
      if (characterData.channelDivinity && characterData.channelDivinity.current !== void 0) {
        const currentValue = characterData.channelDivinity.current;
        const previousValue = this.previousValues.get("Channel Divinity");
        console.log(`[SYNC DEBUG] Channel Divinity - previous: ${previousValue}, current: ${currentValue}`);
        if (hasChanged("Channel Divinity", currentValue)) {
          console.log(`[DiceCloud Sync] \u2705 Syncing Channel Divinity: ${currentValue}/${characterData.channelDivinity.max}`);
          await this.updateChannelDivinity(currentValue);
        } else {
          console.log(`[SYNC DEBUG] \u23ED\uFE0F Channel Divinity unchanged (${currentValue}), skipping sync`);
        }
      } else {
        console.log("[SYNC DEBUG] Channel Divinity check failed - object is null or current is undefined");
      }
      console.log("[SYNC DEBUG] Checking resources for sync...");
      if (characterData.resources && Array.isArray(characterData.resources)) {
        console.log(`[SYNC DEBUG] Found ${characterData.resources.length} resources in characterData`);
        for (const resource of characterData.resources) {
          console.log(`[SYNC DEBUG] Resource: ${resource.name} - current: ${resource.current}, max: ${resource.max}`);
          if (resource.name && resource.current !== void 0) {
            const propertyId = this.findPropertyId(resource.name);
            console.log(`[SYNC DEBUG] Property ID for ${resource.name}: ${propertyId || "NOT FOUND"}`);
            if (hasChanged(resource.name, resource.current)) {
              console.log(`[DiceCloud Sync] \u2705 Syncing resource ${resource.name}: ${resource.current}/${resource.max}`);
              await this.updateResource(resource.name, resource.current);
            } else {
              console.log(`[SYNC DEBUG] \u23ED\uFE0F Resource ${resource.name} unchanged, skipping sync`);
            }
          } else {
            console.log(`[SYNC DEBUG] \u274C Resource ${resource.name} missing name or current value`);
          }
        }
      } else {
        console.log("[SYNC DEBUG] No resources array in characterData");
      }
      console.log("[SYNC DEBUG] Checking death saves for sync...");
      if (characterData.deathSaves) {
        console.log(`[SYNC DEBUG] Death saves object:`, characterData.deathSaves);
        if (characterData.deathSaves.successes !== void 0) {
          const propertyId = this.findPropertyId("Succeeded Saves");
          console.log(`[SYNC DEBUG] Property ID for Succeeded Saves: ${propertyId || "NOT FOUND"}`);
          if (hasChanged("Succeeded Saves", characterData.deathSaves.successes)) {
            console.log(`[DiceCloud Sync] \u2705 Syncing Succeeded Saves: ${characterData.deathSaves.successes}`);
            await this.updateDeathSaves(characterData.deathSaves.successes, void 0);
          } else {
            console.log(`[SYNC DEBUG] \u23ED\uFE0F Succeeded Saves unchanged, skipping sync`);
          }
        }
        if (characterData.deathSaves.failures !== void 0) {
          const propertyId = this.findPropertyId("Failed Saves");
          console.log(`[SYNC DEBUG] Property ID for Failed Saves: ${propertyId || "NOT FOUND"}`);
          if (hasChanged("Failed Saves", characterData.deathSaves.failures)) {
            console.log(`[DiceCloud Sync] \u2705 Syncing Failed Saves: ${characterData.deathSaves.failures}`);
            await this.updateDeathSaves(void 0, characterData.deathSaves.failures);
          } else {
            console.log(`[SYNC DEBUG] \u23ED\uFE0F Failed Saves unchanged, skipping sync`);
          }
        }
      } else {
        console.log("[SYNC DEBUG] No deathSaves object in characterData");
      }
      console.log("[SYNC DEBUG] Checking inspiration for sync...");
      if (characterData.inspiration !== void 0) {
        const propertyId = this.findPropertyId("Inspiration");
        console.log(`[SYNC DEBUG] Inspiration value: ${characterData.inspiration}, Property ID: ${propertyId || "NOT FOUND"}`);
        if (hasChanged("Inspiration", characterData.inspiration)) {
          console.log(`[DiceCloud Sync] \u2705 Syncing Inspiration: ${characterData.inspiration}`);
          await this.updateInspiration(characterData.inspiration);
        } else {
          console.log(`[SYNC DEBUG] \u23ED\uFE0F Inspiration unchanged, skipping sync`);
        }
      } else {
        console.log("[SYNC DEBUG] No inspiration value in characterData");
      }
      console.log("[SYNC DEBUG] Checking actions for sync...");
      if (characterData.actions && Array.isArray(characterData.actions)) {
        console.log(`[SYNC DEBUG] Found ${characterData.actions.length} actions in characterData`);
        for (const action of characterData.actions) {
          console.log(`[SYNC DEBUG] Action: ${action.name} - uses: ${action.uses}, usesUsed: ${action.usesUsed}, _id: ${action._id}`);
          if (action.name && action.uses && action.usesUsed !== void 0 && action._id) {
            const cacheKey = `action_${action.name}`;
            if (hasChanged(cacheKey, action.usesUsed)) {
              console.log(`[DiceCloud Sync] \u2705 Syncing action ${action.name}: ${action.usesUsed} uses used`);
              await this.setActionUses(action._id, action.usesUsed);
            } else {
              console.log(`[SYNC DEBUG] \u23ED\uFE0F Action ${action.name} unchanged, skipping sync`);
            }
          } else {
            console.log(`[SYNC DEBUG] \u274C Action ${action.name} missing required fields (uses: ${action.uses}, usesUsed: ${action.usesUsed}, _id: ${action._id})`);
          }
        }
      } else {
        console.log("[SYNC DEBUG] No actions array in characterData");
      }
    }
    /**
     * Handle action usage updates from Roll20
     * @param {string} actionName - Name of the action
     * @param {number} usesUsed - New uses used value
     */
    async handleActionUsageUpdate(actionName, usesUsed) {
      if (!this.enabled) {
        console.warn("[DiceCloud Sync] Sync not enabled, ignoring action update");
        return;
      }
      console.log(`[DiceCloud Sync] Handling action usage update: ${actionName} -> ${usesUsed}`);
      await this.setActionUses(actionName, usesUsed);
    }
    /**
     * Handle attribute updates from Roll20
     * @param {string} attributeName - Name of the attribute
     * @param {number} value - New value
     */
    async handleAttributeUpdate(attributeName, value) {
      if (!this.enabled) {
        console.warn("[DiceCloud Sync] Sync not enabled, ignoring attribute update");
        return;
      }
      console.log(`[DiceCloud Sync] Handling attribute update: ${attributeName} -> ${value}`);
      await this.updateAttributeValue(attributeName, value);
    }
    /**
     * Check if sync is enabled
     * @returns {boolean} True if sync is enabled
     */
    isEnabled() {
      return this.enabled;
    }
    /**
     * Disable sync
     */
    disable() {
      this.enabled = false;
      console.log("[DiceCloud Sync] Sync disabled");
    }
    /**
     * Enable sync
     */
    enable() {
      if (this.characterId && this.ddp.isConnected()) {
        this.enabled = true;
        console.log("[DiceCloud Sync] Sync enabled");
      } else {
        console.warn("[DiceCloud Sync] Cannot enable sync - not initialized");
      }
    }
  };
  var dicecloud_sync_default = DiceCloudSync;
  if (typeof window !== "undefined") {
    window.initializeDiceCloudSync = async function() {
      console.log("[DiceCloud Sync] Global initialization called");
      console.log("[DiceCloud Sync] Current URL:", window.location.href);
      try {
        const tokenResult = await browserAPI.storage.local.get(["diceCloudToken"]);
        const { diceCloudToken } = tokenResult;
        if (window.diceCloudSync && window.diceCloudSync.ddp && window.diceCloudSync.ddp.isConnected()) {
          console.log("[DiceCloud Sync] DDP already connected, checking authentication...");
          if (diceCloudToken) {
            console.log("[DiceCloud Sync] Authenticating existing DDP connection...");
            try {
              const result = await window.diceCloudSync.ddp.call("login", {
                resume: diceCloudToken
              });
              console.log("[DiceCloud Sync] DDP authentication successful:", result);
              const charResult = await browserAPI.storage.local.get(["activeCharacterId", "characterProfiles"]);
              const { activeCharacterId, characterProfiles } = charResult;
              if (activeCharacterId && characterProfiles && characterProfiles[activeCharacterId]) {
                const profileData = characterProfiles[activeCharacterId];
                if (profileData && profileData.id) {
                  console.log("[DiceCloud Sync] Re-initializing with character:", profileData.id);
                  await window.diceCloudSync.initialize(profileData.id);
                }
              }
              return;
            } catch (error) {
              console.error("[DiceCloud Sync] Authentication failed:", error);
            }
          } else {
            console.log("[DiceCloud Sync] Already initialized, skipping");
            return;
          }
        }
        console.log("[DiceCloud Sync] Creating new DDP client...");
        const ddpClient = new DDPClient("wss://dicecloud.com/websocket");
        if (diceCloudToken) {
          console.log("[DiceCloud Sync] Setting up DDP authentication...");
          ddpClient.onConnected = async () => {
            console.log("[DiceCloud Sync] DDP connected, authenticating...");
            try {
              const result = await ddpClient.call("login", {
                resume: diceCloudToken
              });
              console.log("[DiceCloud Sync] DDP authentication successful:", result);
            } catch (error) {
              console.error("[DiceCloud Sync] DDP authentication failed:", error);
            }
          };
          console.log("[DiceCloud Sync] About to connect to DDP...");
          try {
            await ddpClient.connect();
            console.log("[DiceCloud Sync] DDP connect() completed");
          } catch (error) {
            console.error("[DiceCloud Sync] DDP connect() failed:", error);
          }
        } else {
          console.warn("[DiceCloud Sync] No DiceCloud token found for DDP authentication");
          console.log("[DiceCloud Sync] About to connect to DDP without token...");
          try {
            await ddpClient.connect();
            console.log("[DiceCloud Sync] DDP connect() completed without token");
          } catch (error) {
            console.error("[DiceCloud Sync] DDP connect() failed without token:", error);
          }
        }
        const sync = new DiceCloudSync(ddpClient);
        window.diceCloudSync = sync;
        console.log("[DiceCloud Sync] Sync instance created, checking for active character...");
        const tryInitialize = async () => {
          try {
            console.log("[DiceCloud Sync] Trying to initialize...");
            if (typeof browserAPI !== "undefined" && browserAPI && browserAPI.storage && browserAPI.storage.local) {
              console.log("[DiceCloud Sync] Browser API available, checking storage...");
              const result = await browserAPI.storage.local.get(["activeCharacterId", "characterProfiles"]);
              const { activeCharacterId, characterProfiles } = result;
              console.log("[DiceCloud Sync] Storage result:", { activeCharacterId, characterProfilesKeys: characterProfiles ? Object.keys(characterProfiles) : null });
              if (activeCharacterId && characterProfiles && characterProfiles[activeCharacterId]) {
                const characterData = characterProfiles[activeCharacterId];
                console.log("[DiceCloud Sync] Character data for key:", activeCharacterId, characterData);
                if (characterProfiles && typeof characterProfiles === "object") {
                  console.log("[DiceCloud Sync] Checking characterProfiles object:", Object.keys(characterProfiles));
                  const profileData = characterProfiles[activeCharacterId] || characterProfiles.default || characterProfiles["slot-1"];
                  if (profileData && profileData.id) {
                    console.log("[DiceCloud Sync] Found character data in characterProfiles:", profileData);
                    console.log("[DiceCloud Sync] Found DiceCloud character ID:", profileData.id);
                    await sync.initialize(profileData.id);
                    sync.setupRoll20EventListeners();
                    console.log("[DiceCloud Sync] Event listeners set up");
                    console.log("[DiceCloud Sync] Global initialization complete");
                    return;
                  }
                }
              } else {
                console.warn("[DiceCloud Sync] No active character found in storage");
                console.log("[DiceCloud Sync] All storage keys:", Object.keys(result));
                console.log("[DiceCloud Sync] All storage data:", result);
              }
            } else {
              console.warn("[DiceCloud Sync] Browser API not available");
            }
            console.log("[DiceCloud Sync] Retrying in 2 seconds...");
            setTimeout(tryInitialize, 2e3);
          } catch (error) {
            if (error.message && error.message.includes("Extension context invalidated")) {
              console.warn("[DiceCloud Sync] Extension context invalidated - service worker terminated.");
              console.warn("[DiceCloud Sync] This happens when Chrome terminates the background service worker.");
              console.warn("[DiceCloud Sync] The extension will reinitialize when the page is refreshed or the extension is reloaded.");
              return;
            }
            console.error("[DiceCloud Sync] Error during initialization:", error);
            console.log("[DiceCloud Sync] Retrying in 5 seconds...");
            setTimeout(tryInitialize, 5e3);
          }
        };
        tryInitialize();
      } catch (error) {
        console.error("[DiceCloud Sync] Failed to create sync instance:", error);
        console.error("[DiceCloud Sync] Error details:", error.stack);
      }
    };
    if (window.location.hostname === "app.roll20.net") {
      console.log("[DiceCloud Sync] Detected Roll20, initializing sync...");
      setTimeout(() => {
        window.initializeDiceCloudSync();
      }, 1e3);
      if (typeof browserAPI !== "undefined" && browserAPI && browserAPI.storage && browserAPI.storage.onChanged) {
        browserAPI.storage.onChanged.addListener((changes, areaName) => {
          if (areaName === "local" && changes.diceCloudToken) {
            const newToken = changes.diceCloudToken.newValue;
            const oldToken = changes.diceCloudToken.oldValue;
            if (newToken && newToken !== oldToken) {
              console.log("[DiceCloud Sync] Token detected, re-initializing with authentication...");
              window.initializeDiceCloudSync();
            }
          }
        });
        console.log("[DiceCloud Sync] Storage listener registered for token changes");
      }
    }
    ;
  }

  // src/content/roll20.js
  window.DDPClient = meteor_ddp_client_default;
  window.DiceCloudSync = dicecloud_sync_default;
  (function() {
    "use strict";
    debug.log("RollCloud: Roll20 content script loaded");
    function postChatMessage(message) {
      try {
        const chatInput = document.querySelector("#textchat-input textarea");
        if (!chatInput) {
          debug.error("\u274C Could not find Roll20 chat input textarea (#textchat-input textarea)");
          return false;
        }
        debug.log("\u{1F4DD} Setting chat input value:", message.substring(0, 80) + (message.length > 80 ? "..." : ""));
        chatInput.focus();
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          "value"
        ).set;
        nativeInputValueSetter.call(chatInput, message);
        try {
          if (typeof cloneInto === "function") {
            const eventInit = cloneInto({ bubbles: true, cancelable: true }, window);
            chatInput.dispatchEvent(new window.wrappedJSObject.Event("input", eventInit));
            chatInput.dispatchEvent(new window.wrappedJSObject.Event("change", eventInit));
          } else {
            chatInput.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
            chatInput.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
          }
        } catch (eventError) {
          debug.warn("\u26A0\uFE0F Event dispatch encountered an error (non-fatal):", eventError.message);
        }
        const sendButton = document.querySelector("#textchat-input .btn");
        if (!sendButton) {
          debug.error("\u274C Could not find Roll20 chat send button (#textchat-input .btn)");
          return false;
        }
        sendButton.click();
        debug.log("\u2705 Message posted to Roll20 chat");
        return true;
      } catch (error) {
        debug.error("\u274C Error posting to Roll20 chat:", error);
        return false;
      }
    }
    function handleDiceCloudRoll(rollData) {
      try {
        debug.log("\u{1F3B2} Handling roll:", rollData);
        debug.log("\u{1F3B2} Roll data keys:", Object.keys(rollData || {}));
        if (rollData && rollData.source === "discord") {
          debug.log("\u{1F4E1} Roll originated from Discord command");
        }
        if (!rollData) {
          debug.error("\u274C No roll data provided");
          return { success: false, error: "No roll data provided" };
        }
        let formattedMessage;
        try {
          formattedMessage = rollData.message || formatRollForRoll20(rollData);
        } catch (formatError) {
          debug.error("\u274C Error formatting roll:", formatError);
          formattedMessage = `&{template:default} {{name=${rollData.name || "Roll"}}} {{Roll=[[${rollData.formula || "1d20"}]]}}`;
        }
        debug.log("\u{1F3B2} Formatted message:", formattedMessage);
        const success = postChatMessage(formattedMessage);
        if (success) {
          debug.log("\u2705 Roll successfully posted to Roll20");
          try {
            observeNextRollResult(rollData);
          } catch (observeError) {
            debug.warn("\u26A0\uFE0F Could not set up roll observer:", observeError.message);
          }
          return { success: true };
        } else {
          debug.error("\u274C Failed to post roll to Roll20 - chat input or send button not found");
          return { success: false, error: "Roll20 chat not ready. Make sure you are in a Roll20 game." };
        }
      } catch (error) {
        debug.error("\u274C Unexpected error in handleDiceCloudRoll:", error);
        return { success: false, error: "Unexpected error: " + error.message };
      }
    }
    function observeNextRollResult(originalRollData) {
      debug.log("\u{1F440} Setting up observer for Roll20 roll result...");
      const chatLog = document.querySelector("#textchat .content");
      if (!chatLog) {
        debug.error("\u274C Could not find Roll20 chat log");
        return;
      }
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const inlineRoll = node.querySelector(".inlinerollresult");
              if (inlineRoll) {
                debug.log("\u{1F3B2} Found new Roll20 inline roll:", inlineRoll);
                const rollResult = parseRoll20InlineRoll(inlineRoll, originalRollData);
                if (rollResult) {
                  debug.log("\u{1F3B2} Parsed Roll20 roll result:", rollResult);
                  if (rollResult.baseRoll === 1 || rollResult.baseRoll === 20) {
                    const rollType = rollResult.baseRoll === 1 ? "Natural 1" : "Natural 20";
                    debug.log(`\u{1F3AF} ${rollType} detected in Roll20 roll!`);
                    browserAPI.runtime.sendMessage({
                      action: "rollResult",
                      rollResult: rollResult.total.toString(),
                      baseRoll: rollResult.baseRoll.toString(),
                      rollType: originalRollData.formula,
                      rollName: originalRollData.name,
                      checkRacialTraits: true
                    });
                    debug.log(`\u{1F9EC} Sent ${rollType} result to popup`);
                  }
                }
                observer.disconnect();
                break;
              }
            }
          }
        }
      });
      observer.observe(chatLog, { childList: true, subtree: true });
      debug.log("\u2705 Observer set up for Roll20 chat");
      setTimeout(() => {
        observer.disconnect();
        debug.log("\u23F1\uFE0F Roll observer timed out and disconnected");
      }, 5e3);
    }
    function parseRoll20InlineRoll(inlineRollElement, originalRollData) {
      try {
        const title = inlineRollElement.getAttribute("title") || "";
        debug.log("\u{1F4CA} Roll20 inline roll title:", title);
        const plainTitle = title.replace(/<[^>]*>/g, "");
        debug.log("\u{1F4CA} Plain title:", plainTitle);
        const baseRollMatch = plainTitle.match(/=\s*\(\s*(\d+)\s*\)/);
        const baseRoll = baseRollMatch ? parseInt(baseRollMatch[1]) : null;
        const totalText = inlineRollElement.textContent?.trim() || "";
        const total = parseInt(totalText);
        debug.log(`\u{1F4CA} Extracted: baseRoll=${baseRoll}, total=${total}`);
        if (baseRoll && baseRoll >= 1 && baseRoll <= 20) {
          return {
            baseRoll,
            total,
            formula: originalRollData.formula,
            name: originalRollData.name
          };
        }
        return null;
      } catch (error) {
        debug.error("\u274C Error parsing Roll20 inline roll:", error);
        return null;
      }
    }
    function calculateBaseRoll(formula, result) {
      try {
        debug.log(`\u{1F9EE} Calculating base roll - Formula: "${formula}", Result: "${result}"`);
        const modifierMatch = formula.match(/1d20([+-]\d+)/i);
        if (modifierMatch) {
          const modifier = parseInt(modifierMatch[1]);
          const totalResult = parseInt(result);
          const baseRoll = totalResult - modifier;
          debug.log(`\u{1F9EE} Calculation: ${totalResult} - (${modifier}) = ${baseRoll}`);
          if (baseRoll >= 1 && baseRoll <= 20) {
            return baseRoll;
          } else {
            debug.warn(`\u26A0\uFE0F Calculated base roll ${baseRoll} is outside valid d20 range (1-20)`);
            return baseRoll;
          }
        } else {
          debug.log(`\u{1F9EE} No modifier found in formula, using result as base roll: ${result}`);
          return parseInt(result);
        }
      } catch (error) {
        debug.error("\u274C Error calculating base roll:", error);
        return parseInt(result);
      }
    }
    function checkRoll20InlineRolls(characterName) {
      debug.log("\u{1F50D} Checking Roll20 inline rolls for natural 1s for:", characterName);
      const inlineRolls = document.querySelectorAll(".inlinerollresult, .rollresult");
      debug.log(`\u{1F50D} Found ${inlineRolls.length} inline roll elements`);
      inlineRolls.forEach((rollElement, index) => {
        try {
          const rollData = getRoll20RollData(rollElement);
          debug.log(`\u{1F50D} Checking inline roll ${index + 1}:`, rollData);
          if (rollData && rollData.baseRoll === 1 && rollData.name.includes(characterName)) {
            debug.log("\u{1F340} Natural 1 detected in Roll20 inline roll!");
            debug.log("\u{1F340} Roll data:", rollData);
            browserAPI.runtime.sendMessage({
              action: "rollResult",
              rollResult: rollData.total.toString(),
              baseRoll: rollData.baseRoll.toString(),
              rollType: rollData.formula,
              rollName: rollData.name,
              checkRacialTraits: true
            });
            debug.log("\u{1F9EC} Sent natural 1 result to popup for Halfling Luck");
          }
        } catch (error) {
          debug.warn("\u26A0\uFE0F Error checking inline roll:", error);
        }
      });
      debug.log("\u{1F50D} Finished checking inline rolls");
    }
    function getRoll20RollData(rollElement) {
      try {
        const rollName = rollElement.closest(".message")?.querySelector(".message-name")?.textContent || rollElement.closest(".message")?.textContent?.split("\n")[0]?.trim() || "";
        const formulaElement = rollElement.querySelector(".formula") || rollElement;
        const formula = formulaElement.textContent?.trim() || "";
        const rollDetails = rollElement.textContent || rollElement.innerText || "";
        const baseRollMatch = rollDetails.match(/^(\d+)/);
        const baseRoll = baseRollMatch ? parseInt(baseRollMatch[1]) : null;
        const totalMatch = rollDetails.match(/(\d+)\s*$/);
        const total = totalMatch ? parseInt(totalMatch[1]) : baseRoll;
        debug.log(`\u{1F50D} Extracted roll data - Name: ${rollName}, Formula: ${formula}, Base: ${baseRoll}, Total: ${total}`);
        return {
          name: rollName,
          formula,
          baseRoll,
          total
        };
      } catch (error) {
        debug.warn("\u26A0\uFE0F Error extracting roll data:", error);
        return null;
      }
    }
    function isOurCharacter(characterName) {
      if (!characterName)
        return false;
      if (characterPopups && characterPopups[characterName]) {
        return true;
      }
      if (playerData && playerData[characterName]) {
        return true;
      }
      const hasAnyCharacters = characterPopups && Object.keys(characterPopups).length > 0 || playerData && Object.keys(playerData).length > 0;
      if (!hasAnyCharacters) {
        debug.log(`\u2705 Allowing ${characterName} (no characters registered yet)`);
        return true;
      }
      return false;
    }
    function getColorEmoji(color) {
      const colorEmojiMap = {
        "#3498db": "\u{1F535}",
        // Blue
        "#e74c3c": "\u{1F534}",
        // Red
        "#c2185b": "\u{1F7E2}",
        // Green
        "#9b59b6": "\u{1F7E3}",
        // Purple
        "#e67e22": "\u{1F7E0}",
        // Orange
        "#f1c40f": "\u{1F7E1}",
        // Yellow
        "#95a5a6": "\u26AA",
        // Grey
        "#34495e": "\u26AB",
        // Black
        "#8b4513": "\u{1F7E4}"
        // Brown
      };
      return colorEmojiMap[color] || "\u{1F535}";
    }
    function formatRollForRoll20(rollData) {
      const { name, formula, characterName, advantage, disadvantage, checkType, prerolledResult, color } = rollData;
      let rollFormula = formula;
      let rollType = "";
      if ((advantage || disadvantage) && formula.includes("d20")) {
        if (advantage && !disadvantage) {
          rollFormula = formula.replace("1d20", "2d20kh1");
          rollType = " (Advantage)";
        } else if (disadvantage && !advantage) {
          rollFormula = formula.replace("1d20", "2d20kl1");
          rollType = " (Disadvantage)";
        }
      }
      const colorEmoji = color ? getColorEmoji(color) : "";
      const colorPrefix = colorEmoji ? `${colorEmoji} ` : "";
      let displayName = name;
      if (characterName && !name.includes(characterName)) {
        displayName = `${colorPrefix}${characterName} - ${name}`;
      } else {
        displayName = `${colorPrefix}${name}`;
      }
      if (prerolledResult !== null && prerolledResult !== void 0) {
        debug.log(`\u{1F3B2} Using prerolled result: ${prerolledResult} instead of rolling ${rollFormula}`);
        return `&{template:default} {{name=${displayName}${rollType}}} {{Roll=${prerolledResult}}}`;
      }
      return `&{template:default} {{name=${displayName}${rollType}}} {{Roll=[[${rollFormula}]]}}`;
    }
    function normalizePopupSpellData(eventData) {
      const spell = eventData.spellData || {};
      let castLevel = eventData.castLevel || parseInt(spell.level) || 0;
      if (typeof castLevel === "string" && castLevel.startsWith("pact:")) {
        castLevel = parseInt(castLevel.split(":")[1]) || 0;
      } else {
        castLevel = parseInt(castLevel) || 0;
      }
      const spellLevel = parseInt(spell.level) || 0;
      const characterName = eventData.characterName || "Character";
      const notificationColor = eventData.color || eventData.notificationColor || "#3498db";
      return {
        // Basic spell info
        name: spell.name || eventData.spellName || "Unknown Spell",
        characterName,
        level: spellLevel,
        castLevel,
        school: spell.school,
        // Spell details
        castingTime: spell.castingTime,
        range: spell.range,
        duration: spell.duration,
        components: spell.components,
        source: spell.source,
        summary: spell.summary,
        description: spell.description,
        // Tags and modifiers
        concentration: spell.concentration,
        ritual: spell.ritual,
        isCantrip: spellLevel === 0,
        isFreecast: false,
        isUpcast: castLevel > spellLevel,
        // Metamagic and effects (popup doesn't send these yet, but prepared for future)
        metamagicUsed: eventData.metamagicUsed || [],
        effects: eventData.effects || [],
        // Resource usage (popup doesn't send these yet, but prepared for future)
        slotUsed: eventData.slotUsed,
        resourceChanges: eventData.resourceChanges || [],
        // Rolls (popup sends these separately via roll() function, but prepared for future)
        attackRoll: spell.attackRoll,
        damageRolls: spell.damageRolls || [],
        fallbackDamage: spell.damage,
        fallbackDamageType: spell.damageType,
        // Visual
        notificationColor
      };
    }
    function normalizeDiscordSpellData(spellData) {
      const spell = spellData.spell_data || spellData.spell || {};
      const castLevel = parseInt(spellData.cast_level) || parseInt(spell.level) || 0;
      const spellLevel = parseInt(spell.level) || 0;
      return {
        // Basic spell info
        name: spell.name || "Unknown Spell",
        characterName: spellData.character_name || "Character",
        level: spellLevel,
        castLevel,
        school: spell.school,
        // Spell details
        castingTime: spell.castingTime || spell.casting_time,
        range: spell.range,
        duration: spell.duration,
        components: spell.components,
        source: spell.source,
        summary: spell.summary || spellData.summary,
        description: spell.description || spellData.description,
        // Tags and modifiers
        concentration: spell.concentration,
        ritual: spell.ritual,
        isCantrip: spellData.isCantrip || spellLevel === 0,
        isFreecast: spellData.isFreecast || false,
        isUpcast: spellData.isUpcast || castLevel > spellLevel,
        // Metamagic and effects
        metamagicUsed: spellData.metamagicUsed || [],
        effects: spellData.effects || [],
        // Resource usage
        slotUsed: spellData.slotUsed,
        resourceChanges: spellData.resourceChanges || [],
        // Rolls
        attackRoll: spell.attackRoll || spell.attack_roll,
        damageRolls: spellData.damageRolls || spellData.damage_rolls || [],
        fallbackDamage: spell.damage,
        fallbackDamageType: spell.damageType || spell.damage_type,
        // Visual - check multiple possible field names
        notificationColor: spellData.notification_color || spellData.notificationColor || spell.notification_color || spell.notificationColor || "#3498db"
      };
    }
    function postSpellToRoll20(normalizedSpellData) {
      const {
        name,
        characterName,
        level,
        castLevel,
        school,
        castingTime,
        range,
        duration,
        components,
        source,
        summary,
        description,
        concentration,
        ritual,
        isCantrip,
        isFreecast,
        isUpcast,
        metamagicUsed,
        effects,
        slotUsed,
        resourceChanges,
        attackRoll,
        damageRolls,
        fallbackDamage,
        fallbackDamageType,
        notificationColor
      } = normalizedSpellData;
      const colorEmoji = getColorEmoji(notificationColor);
      let tags = "";
      if (concentration)
        tags += " \u{1F9E0} Concentration";
      if (ritual)
        tags += " \u{1F4D6} Ritual";
      if (metamagicUsed && metamagicUsed.length > 0) {
        const metamagicNames = metamagicUsed.map((m) => m.name).join(", ");
        tags += ` \u2728 ${metamagicNames}`;
      }
      if (isCantrip)
        tags += " \u{1F3AF} Cantrip";
      if (isFreecast)
        tags += " \u{1F193} Free Cast";
      if (isUpcast)
        tags += ` \u2B06\uFE0F Upcast to Level ${castLevel}`;
      let announcement = `&{template:default} {{name=${colorEmoji} ${characterName} casts ${name}!${tags}}}`;
      if (level > 0) {
        let levelText = `Level ${level}`;
        if (school)
          levelText += ` ${school}`;
        if (isUpcast) {
          levelText += ` (Upcast to Level ${castLevel})`;
        }
        announcement += ` {{Level=${levelText}}}`;
      } else if (school) {
        announcement += ` {{Level=${school} cantrip}}`;
      }
      if (castingTime)
        announcement += ` {{Casting Time=${castingTime}}}`;
      if (range)
        announcement += ` {{Range=${range}}}`;
      if (duration)
        announcement += ` {{Duration=${duration}}}`;
      if (components)
        announcement += ` {{Components=${components}}}`;
      if (source)
        announcement += ` {{Source=${source}}}`;
      if (slotUsed && !isCantrip && !isFreecast) {
        announcement += ` {{Slot Used=${slotUsed.level} (${slotUsed.remaining}/${slotUsed.total} remaining)}}`;
      }
      if (resourceChanges && resourceChanges.length > 0) {
        const resourceText = resourceChanges.map(
          (change) => `${change.resource}: ${change.current}/${change.max}`
        ).join(", ");
        announcement += ` {{Resources=${resourceText}}}`;
      }
      if (effects && effects.length > 0) {
        const effectsText = effects.map((effect) => effect.description || effect.type).join(", ");
        announcement += ` {{Effects=${effectsText}}}`;
      }
      if (summary) {
        announcement += ` {{Summary=${summary}}}`;
      }
      if (description) {
        announcement += ` {{Description=${description}}}`;
      }
      postChatMessage(announcement);
      const scaleFormulaForUpcast = (formula, baseLevel, actualCastLevel) => {
        if (!formula || baseLevel <= 0 || actualCastLevel <= baseLevel)
          return formula;
        let scaledFormula = formula.replace(/slotLevel/gi, actualCastLevel);
        if (scaledFormula === formula) {
          const levelDiff = actualCastLevel - baseLevel;
          const diceMatch = formula.match(/^(\d+)d(\d+)/);
          if (diceMatch && levelDiff > 0) {
            const baseDice = parseInt(diceMatch[1]);
            const dieSize = parseInt(diceMatch[2]);
            const scaledDice = baseDice + levelDiff;
            scaledFormula = formula.replace(/^(\d+)d(\d+)/, `${scaledDice}d${dieSize}`);
            debug.log(`\u{1F4C8} Scaled formula from ${formula} to ${scaledFormula} (upcast by ${levelDiff} levels)`);
          }
        }
        return scaledFormula;
      };
      if (attackRoll && attackRoll !== "(none)") {
        setTimeout(() => {
          try {
            const attackMsg = formatRollForRoll20({
              name: `${name} - Attack`,
              formula: attackRoll,
              characterName
            });
            postChatMessage(attackMsg);
          } catch (attackError) {
            debug.error(`\u274C Failed to roll attack for ${name}:`, attackError);
            postChatMessage(`&{template:default} {{name=\u26A0\uFE0F Roll Failed}} {{error=Attack roll for ${name} failed: ${attackError.message}}}`);
          }
        }, 100);
      }
      if (damageRolls && Array.isArray(damageRolls) && damageRolls.length > 0) {
        damageRolls.forEach((roll, index) => {
          if (roll.damage) {
            setTimeout(() => {
              try {
                const damageType = roll.damageType || "damage";
                const isHealing = damageType.toLowerCase() === "healing";
                const isTempHP = damageType.toLowerCase().includes("temp");
                let rollName;
                if (isHealing) {
                  rollName = `${name} - Healing`;
                } else if (isTempHP) {
                  rollName = `${name} - Temp HP`;
                } else {
                  rollName = roll.name || `${name} - ${damageType}`;
                }
                const scaledFormula = scaleFormulaForUpcast(roll.damage, level, castLevel);
                const damageMsg = formatRollForRoll20({
                  name: rollName,
                  formula: scaledFormula,
                  characterName
                });
                postChatMessage(damageMsg);
              } catch (damageError) {
                debug.error(`\u274C Failed to roll damage for ${name}:`, damageError);
                postChatMessage(`&{template:default} {{name=\u26A0\uFE0F Roll Failed}} {{error=Damage roll ${index + 1} for ${name} failed: ${damageError.message}}}`);
              }
            }, 200 + index * 100);
          }
        });
      } else if (fallbackDamage) {
        setTimeout(() => {
          try {
            const damageType = fallbackDamageType || "damage";
            const isHealing = damageType.toLowerCase() === "healing";
            const rollName = isHealing ? `${name} - Healing` : `${name} - ${damageType}`;
            const scaledFormula = scaleFormulaForUpcast(fallbackDamage, level, castLevel);
            const damageMsg = formatRollForRoll20({
              name: rollName,
              formula: scaledFormula,
              characterName
            });
            postChatMessage(damageMsg);
          } catch (damageError) {
            debug.error(`\u274C Failed to roll damage for ${name}:`, damageError);
            postChatMessage(`&{template:default} {{name=\u26A0\uFE0F Roll Failed}} {{error=Damage roll for ${name} failed: ${damageError.message}}}`);
          }
        }, 200);
      }
    }
    browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
      try {
        debug.log("\u{1F4E8} Roll20 content script received message:", request.action, request);
        if (request.action === "postRollToChat") {
          try {
            const result = handleDiceCloudRoll(request.roll);
            sendResponse(result || { success: true });
          } catch (rollError) {
            debug.error("\u274C Error handling postRollToChat:", rollError);
            sendResponse({ success: false, error: rollError.message });
          }
          return true;
        } else if (request.action === "sendRollToRoll20") {
          debug.log("\u{1F3B2} Received sendRollToRoll20 message:", request.roll);
          try {
            const result = handleDiceCloudRoll(request.roll);
            sendResponse(result || { success: true });
          } catch (rollError) {
            debug.error("\u274C Error handling sendRollToRoll20:", rollError);
            sendResponse({ success: false, error: rollError.message || "Failed to process roll" });
          }
          return true;
        } else if (request.action === "rollFromPopout") {
          if (request.roll && request.roll.action === "announceSpell") {
            debug.log("\u2728 Detected announceSpell wrapped in rollFromPopout, routing to announcement handler");
            if (request.roll.message) {
              postChatMessage(request.roll.message);
              sendResponse({ success: true });
            } else if (request.roll.spellData) {
              const normalizedSpellData = normalizePopupSpellData(request.roll);
              postSpellToRoll20(normalizedSpellData);
              sendResponse({ success: true });
            }
            return true;
          }
          debug.log("\u{1F3B2} Received roll request from popup:", request);
          const rollData = {
            name: request.name || request.roll?.name,
            formula: request.formula || request.roll?.formula,
            characterName: request.characterName || request.roll?.characterName,
            color: request.color || request.roll?.color
          };
          if (silentRollsEnabled) {
            debug.log("\u{1F507} Silent rolls active - hiding roll instead of posting");
            const hiddenRoll = {
              id: Date.now() + Math.random(),
              // Unique ID
              name: rollData.name,
              formula: rollData.formula,
              characterName: rollData.characterName,
              timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
              result: null
              // Will be filled when revealed
            };
            hiddenRolls.push(hiddenRoll);
            updateHiddenRollsDisplay();
            sendResponse({ success: true, hidden: true });
          } else {
            const formattedMessage = formatRollForRoll20(rollData);
            const success = postChatMessage(formattedMessage);
            if (success) {
              debug.log("\u2705 Roll posted directly to Roll20 (no DiceCloud!)");
              observeNextRollResult(rollData);
            }
            sendResponse({ success });
          }
        } else if (request.action === "announceSpell") {
          if (request.spellData) {
            debug.log("\u{1F52E} Received structured spell data from background script:", request);
            const normalizedSpellData = normalizePopupSpellData(request);
            postSpellToRoll20(normalizedSpellData);
          } else if (request.message) {
            postChatMessage(request.message);
          } else {
            handleDiceCloudRoll(request);
          }
          sendResponse({ success: true });
        } else if (request.action === "postChatMessageFromPopup") {
          if (request.message) {
            debug.log("\u{1F4E8} Received postChatMessageFromPopup:", request.message);
            const success = postChatMessage(request.message);
            sendResponse({ success });
          } else {
            debug.warn("\u26A0\uFE0F postChatMessageFromPopup missing message");
            sendResponse({ success: false, error: "No message provided" });
          }
        } else if (request.action === "testRoll20Connection") {
          const chatInput = document.querySelector("#textchat-input textarea");
          sendResponse({
            success: !!chatInput,
            message: chatInput ? "Roll20 chat accessible" : "Roll20 chat not found"
          });
        } else if (request.action === "showCharacterSheet") {
          debug.log("\u{1F50D} showCharacterSheet called, checking playerData:", playerData);
          debug.log("\u{1F50D} playerData keys:", Object.keys(playerData || {}));
          if (!playerData || Object.keys(playerData).length === 0) {
            debug.log("\u26A0\uFE0F No character data found - asking user about GM mode");
            const userConfirmed = confirm("No character data found.\n\nWould you like to open GM mode instead?");
            if (userConfirmed) {
              try {
                postChatMessage("\u{1F451} Opening GM mode...");
                debug.log("\u2705 Chat message posted successfully");
              } catch (error) {
                debug.error("\u274C Error posting chat message:", error);
              }
              try {
                toggleGMMode(true);
                debug.log("\u2705 GM panel opened successfully");
              } catch (error) {
                debug.error("\u274C Error opening GM panel:", error);
              }
              sendResponse({ success: true, message: "GM mode opened" });
            } else {
              debug.log("\u2139\uFE0F User cancelled GM mode opening");
              sendResponse({ success: false, error: "No character data found" });
            }
            return;
          }
          try {
            const overlayElement = document.getElementById("rollcloud-character-overlay");
            if (overlayElement) {
              overlayElement.style.display = "block";
              sendResponse({ success: true });
            } else {
              const event = new CustomEvent("showRollCloudSheet");
              document.dispatchEvent(event);
              sendResponse({ success: true });
            }
          } catch (error) {
            debug.error("Error showing character sheet:", error);
            sendResponse({ success: false, error: error.message });
          }
        } else if (request.action === "forwardToPopup") {
          debug.log("\u{1F9EC} Forwarding roll result to popup:", request);
          debug.log("\u{1F9EC} Available popups:", Object.keys(characterPopups));
          Object.keys(characterPopups).forEach((characterName) => {
            const popup = characterPopups[characterName];
            try {
              if (popup && !popup.closed) {
                debug.log(`\u{1F9EC} Sending to popup for ${characterName}:`, popup);
                popup.postMessage({
                  action: "rollResult",
                  rollResult: request.rollResult,
                  baseRoll: request.baseRoll,
                  rollType: request.rollType,
                  rollName: request.rollName,
                  checkRacialTraits: request.checkRacialTraits
                }, "*");
                debug.log(`\u{1F4E4} Sent rollResult to popup for ${characterName}`);
              } else {
                delete characterPopups[characterName];
                debug.log(`\u{1F5D1}\uFE0F Removed closed popup for ${characterName}`);
              }
            } catch (error) {
              debug.warn(`\u26A0\uFE0F Error sending rollResult to popup "${characterName}":`, error);
              delete characterPopups[characterName];
            }
          });
          sendResponse({ success: true });
        } else if (request.action === "setAutoBackwardsSync") {
          debug.log("\u{1F504} Setting auto backwards sync:", request.enabled);
          if (window.diceCloudSync) {
            if (request.enabled) {
              window.diceCloudSync.enable();
              debug.log("\u2705 Auto backwards sync enabled");
            } else {
              window.diceCloudSync.disable();
              debug.log("\u274C Auto backwards sync disabled");
            }
            sendResponse({ success: true });
          } else {
            debug.warn("\u26A0\uFE0F diceCloudSync not available (not experimental build?)");
            sendResponse({ success: false, error: "Sync not available" });
          }
        } else if (request.action === "useActionFromDiscord") {
          try {
            debug.log("\u2694\uFE0F Received useActionFromDiscord:", request);
            const actionName = request.actionName || "Unknown Action";
            const commandData = request.commandData || {};
            const charName = commandData.character_name || "Character";
            if (!isOurCharacter(charName)) {
              debug.log(`\u23ED\uFE0F Ignoring Discord action for ${charName} (not our character)`);
              sendResponse({ success: true, ignored: true });
              return true;
            }
            const actionData = commandData.action_data || commandData || {};
            debug.log("\u2694\uFE0F Action data:", actionData);
            let announcement = `&{template:default} {{name=${charName} uses ${actionData.name || actionName}!}}`;
            if (actionData.actionType) {
              announcement += ` {{Type=${actionData.actionType}}}`;
            }
            if (actionData.description) {
              announcement += ` {{Description=${actionData.description}}}`;
            }
            postChatMessage(announcement);
            const attackRoll = actionData.attackRoll || actionData.attackBonus;
            if (attackRoll) {
              setTimeout(() => {
                const attackFormula = attackRoll.includes("d") ? attackRoll : `1d20+${attackRoll}`;
                const attackMsg = formatRollForRoll20({
                  name: `${actionData.name || actionName} - Attack`,
                  formula: attackFormula,
                  characterName: charName
                });
                postChatMessage(attackMsg);
              }, 100);
            }
            const damageRoll = actionData.damage || actionData.damageRoll;
            if (damageRoll) {
              setTimeout(() => {
                const damageType = actionData.damageType || "damage";
                const damageMsg = formatRollForRoll20({
                  name: `${actionData.name || actionName} - ${damageType}`,
                  formula: damageRoll,
                  characterName: charName
                });
                postChatMessage(damageMsg);
              }, 200);
            }
            sendResponse({ success: true });
          } catch (useActionError) {
            debug.error("\u274C Error in useActionFromDiscord:", useActionError);
            sendResponse({ success: false, error: useActionError.message });
          }
        } else if (request.action === "castSpellFromDiscord") {
          try {
            debug.log("\u{1F52E} Received castSpellFromDiscord:", request);
            const characterName = request.spellData?.character_name;
            if (characterName && !isOurCharacter(characterName)) {
              debug.log(`\u23ED\uFE0F Ignoring Discord spell for ${characterName} (not our character)`);
              sendResponse({ success: true, ignored: true });
              return true;
            }
            const normalizedSpellData = normalizeDiscordSpellData(request.spellData || {});
            postSpellToRoll20(normalizedSpellData);
            sendResponse({ success: true });
          } catch (castError) {
            debug.error("\u274C Error in castSpellFromDiscord:", castError);
            sendResponse({ success: false, error: castError.message });
          }
        } else if (request.action === "useAbilityFromDiscord") {
          try {
            debug.log("\u2728 Received useAbilityFromDiscord:", request);
            const abilityName = request.abilityName || "Unknown Ability";
            const abilityData = request.abilityData || {};
            const charName = abilityData.character_name || "Character";
            if (!isOurCharacter(charName)) {
              debug.log(`\u23ED\uFE0F Ignoring Discord ability for ${charName} (not our character)`);
              sendResponse({ success: true, ignored: true });
              return true;
            }
            const action = abilityData.action_data || abilityData.action || {};
            const notificationColor = abilityData.notification_color || "#3498db";
            const colorEmoji = getColorEmoji(notificationColor);
            let announcement = `&{template:default} {{name=${colorEmoji} ${charName} uses ${action.name || abilityName}!}}`;
            if (action.actionType) {
              announcement += ` {{Type=${action.actionType}}}`;
            }
            if (action.range) {
              announcement += ` {{Range=${action.range}}}`;
            }
            if (action.description) {
              announcement += ` {{Description=${action.description}}}`;
            }
            postChatMessage(announcement);
            if (action.attackRoll || action.attackBonus) {
              setTimeout(() => {
                try {
                  const attackFormula = action.attackRoll || `1d20+${action.attackBonus}`;
                  const attackMsg = formatRollForRoll20({
                    name: `${action.name || abilityName} - Attack`,
                    formula: attackFormula,
                    characterName: charName
                  });
                  postChatMessage(attackMsg);
                } catch (attackError) {
                  debug.error(`\u274C Failed to roll attack for ${action.name || abilityName}:`, attackError);
                  postChatMessage(`&{template:default} {{name=\u26A0\uFE0F Roll Failed}} {{error=Attack roll for ${action.name || abilityName} failed: ${attackError.message}}}`);
                }
              }, 100);
            }
            if (action.damageRoll || action.damage) {
              setTimeout(() => {
                try {
                  const damageFormula = action.damageRoll || action.damage;
                  const damageType = action.damageType || "damage";
                  const isHealing = damageType.toLowerCase() === "healing";
                  const rollName = isHealing ? `${action.name || abilityName} - Healing` : `${action.name || abilityName} - ${damageType}`;
                  const damageMsg = formatRollForRoll20({
                    name: rollName,
                    formula: damageFormula,
                    characterName: charName
                  });
                  postChatMessage(damageMsg);
                } catch (damageError) {
                  debug.error(`\u274C Failed to roll damage for ${action.name || abilityName}:`, damageError);
                  postChatMessage(`&{template:default} {{name=\u26A0\uFE0F Roll Failed}} {{error=Damage roll for ${action.name || abilityName} failed: ${damageError.message}}}`);
                }
              }, 200);
            }
            sendResponse({ success: true });
          } catch (abilityError) {
            debug.error("\u274C Error in useAbilityFromDiscord:", abilityError);
            sendResponse({ success: false, error: abilityError.message });
          }
        } else if (request.action === "healFromDiscord") {
          try {
            debug.log("\u{1F49A} Received healFromDiscord:", request);
            const amount = request.amount || 0;
            const isTemp = request.isTemp || false;
            const charName = request.characterName || "Character";
            if (!isOurCharacter(charName)) {
              debug.log(`\u23ED\uFE0F Ignoring Discord heal for ${charName} (not our character)`);
              sendResponse({ success: true, ignored: true });
              return true;
            }
            const healType = isTemp ? "Temporary HP" : "HP";
            const emoji = isTemp ? "\u{1F6E1}\uFE0F" : "\u{1F49A}";
            const announcement = `&{template:default} {{name=${emoji} ${charName} ${isTemp ? "gains" : "is healed"}}} {{${healType}=+${amount}}}`;
            postChatMessage(announcement);
            sendResponse({ success: true });
          } catch (healError) {
            debug.error("\u274C Error in healFromDiscord:", healError);
            sendResponse({ success: false, error: healError.message });
          }
        } else if (request.action === "takeDamageFromDiscord") {
          try {
            debug.log("\u{1F494} Received takeDamageFromDiscord:", request);
            const amount = request.amount || 0;
            const damageType = request.damageType || "untyped";
            const charName = request.characterName || "Character";
            if (!isOurCharacter(charName)) {
              debug.log(`\u23ED\uFE0F Ignoring Discord damage for ${charName} (not our character)`);
              sendResponse({ success: true, ignored: true });
              return true;
            }
            const damageTypeDisplay = damageType !== "untyped" ? ` (${damageType})` : "";
            const announcement = `&{template:default} {{name=\u{1F494} ${charName} takes damage}} {{Damage=${amount}${damageTypeDisplay}}}`;
            postChatMessage(announcement);
            sendResponse({ success: true });
          } catch (damageError) {
            debug.error("\u274C Error in takeDamageFromDiscord:", damageError);
            sendResponse({ success: false, error: damageError.message });
          }
        } else if (request.action === "restFromDiscord") {
          try {
            debug.log("\u{1F6CF}\uFE0F Received restFromDiscord:", request);
            const restType = request.restType || "short";
            const charName = request.characterName || "Character";
            if (!isOurCharacter(charName)) {
              debug.log(`\u23ED\uFE0F Ignoring Discord rest for ${charName} (not our character)`);
              sendResponse({ success: true, ignored: true });
              return true;
            }
            const emoji = restType === "short" ? "\u2615" : "\u{1F6CF}\uFE0F";
            const restName = restType === "short" ? "Short Rest" : "Long Rest";
            const announcement = `&{template:default} {{name=${emoji} ${charName} takes a ${restName}}} {{Rest Type=${restName}}}`;
            postChatMessage(announcement);
            sendResponse({ success: true });
          } catch (restError) {
            debug.error("\u274C Error in restFromDiscord:", restError);
            sendResponse({ success: false, error: restError.message });
          }
        } else if (request.action === "endTurnFromDiscord") {
          try {
            debug.log("\u23ED\uFE0F Received endTurnFromDiscord");
            postChatMessage("/e ends their turn.");
            sendResponse({ success: true });
          } catch (endTurnError) {
            debug.error("\u274C Error in endTurnFromDiscord:", endTurnError);
            sendResponse({ success: false, error: endTurnError.message });
          }
        }
      } catch (outerError) {
        debug.error("\u274C Unexpected error in message listener:", outerError);
        try {
          sendResponse({ success: false, error: "Unexpected error: " + outerError.message });
        } catch (e) {
        }
      }
      return true;
    });
    window.addEventListener("message", (event) => {
      if (event.data.action === "postRollToChat") {
        handleDiceCloudRoll(event.data.roll);
      } else if (event.data.action === "postChat") {
        postChatMessage(event.data.message);
      } else if (event.data.action === "rollFromPopout") {
        debug.log("\u{1F3B2} Received roll request from popup via postMessage:", event.data);
        const rollData = {
          name: event.data.name,
          formula: event.data.formula,
          characterName: event.data.characterName
        };
        if (silentRollsEnabled) {
          debug.log("\u{1F507} Silent rolls active - hiding roll instead of posting");
          const hiddenRoll = {
            id: Date.now() + Math.random(),
            // Unique ID
            name: rollData.name,
            formula: rollData.formula,
            characterName: rollData.characterName,
            timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
            result: null
            // Will be filled when revealed
          };
          hiddenRolls.push(hiddenRoll);
          updateHiddenRollsDisplay();
          if (event.source) {
            event.source.postMessage({
              action: "rollHidden",
              roll: hiddenRoll
            }, "*");
          }
        } else {
          const formattedMessage = formatRollForRoll20(rollData);
          const success = postChatMessage(formattedMessage);
          if (success) {
            debug.log("\u2705 Roll posted directly to Roll20 (no DiceCloud!)");
            observeNextRollResult(rollData);
          }
        }
      } else if (event.data.action === "announceSpell") {
        if (event.data.spellData) {
          debug.log("\u{1F52E} Received structured spell data from popup:", event.data);
          const normalizedSpellData = normalizePopupSpellData(event.data);
          postSpellToRoll20(normalizedSpellData);
        } else if (event.data.message) {
          postChatMessage(event.data.message);
        } else {
          handleDiceCloudRoll(event.data);
        }
      }
    });
    let gmModeEnabled = false;
    let silentRollsEnabled = false;
    let gmPanel = null;
    const characterPopups = {};
    let combatStarted = false;
    let initiativeTracker = {
      combatants: [],
      currentTurnIndex: 0,
      round: 1,
      delayedCombatants: []
      // Track combatants who have delayed their turn
    };
    let hiddenRolls = [];
    let turnHistory = [];
    let playerData = {};
    function createGMPanel() {
      if (gmPanel)
        return gmPanel;
      gmPanel = document.createElement("div");
      gmPanel.id = "gm-panel";
      gmPanel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 500px;
      height: 600px;
      min-width: 400px;
      min-height: 400px;
      max-width: 90vw;
      max-height: 90vh;
      background: #1e1e1e;
      border: 2px solid #FC57F9;
      border-radius: 12px;
      z-index: 999998;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      color: #fff;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      display: none;
      flex-direction: column;
      overflow: hidden;
      resize: both;
      visibility: visible;
      opacity: 1;
    `;
      const initiativeTab = document.createElement("div");
      initiativeTab.className = "gm-tab-content";
      initiativeTab.dataset.tab = "initiative";
      initiativeTab.style.display = "block";
      const hiddenRollsTab = document.createElement("div");
      hiddenRollsTab.className = "gm-tab-content";
      hiddenRollsTab.dataset.tab = "hidden-rolls";
      hiddenRollsTab.style.display = "none";
      const playersTab = document.createElement("div");
      playersTab.className = "gm-tab-content";
      playersTab.dataset.tab = "players";
      playersTab.style.display = "none";
      const historyTab = document.createElement("div");
      historyTab.className = "gm-tab-content";
      historyTab.dataset.tab = "history";
      historyTab.style.display = "none";
      const controls = document.createElement("div");
      controls.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 15px;
    `;
      controls.innerHTML = `
      <button id="start-combat-btn" style="padding: 12px; background: #c2185b; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1em; grid-column: span 2; box-shadow: 0 2px 8px rgba(39, 174, 96, 0.3);">\u2694\uFE0F Start Combat</button>
      <button id="prev-turn-btn" style="padding: 8px 12px; background: #3498db; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85em; display: none;">\u2190 Prev</button>
      <button id="next-turn-btn" style="padding: 8px 12px; background: #FC57F9; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85em; display: none;">Next \u2192</button>
      <button id="clear-all-btn" style="padding: 8px 12px; background: #e74c3c; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85em; grid-column: span 2;">\u{1F5D1}\uFE0F Clear All</button>
    `;
      const roundDisplay = document.createElement("div");
      roundDisplay.id = "round-display";
      roundDisplay.style.cssText = `
      text-align: center;
      padding: 8px;
      background: #34495e;
      border-radius: 6px;
      margin-bottom: 15px;
      font-weight: bold;
    `;
      roundDisplay.textContent = "Round 1";
      const initiativeList = document.createElement("div");
      initiativeList.id = "initiative-list";
      initiativeList.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 15px;
    `;
      const addFormSection = document.createElement("div");
      addFormSection.style.cssText = `
      margin-top: 15px;
      padding-top: 15px;
      border-top: 2px solid #34495e;
    `;
      const addFormHeader = document.createElement("div");
      addFormHeader.style.cssText = `
      cursor: pointer;
      user-select: none;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      margin-bottom: 10px;
      background: #34495e;
      border-radius: 6px;
      font-weight: bold;
      transition: background 0.2s;
    `;
      addFormHeader.innerHTML = `
      <span>\u2795 Add Combatant</span>
      <span id="add-form-toggle" style="transition: transform 0.3s; transform: rotate(-90deg);">\u25BC</span>
    `;
      const addForm = document.createElement("div");
      addForm.id = "add-combatant-form";
      addForm.style.cssText = `
      display: block;
      transition: max-height 0.3s ease-out, opacity 0.3s ease-out;
      overflow: hidden;
      max-height: 0;
      opacity: 0;
    `;
      addForm.innerHTML = `
      <input type="text" id="combatant-name-input" placeholder="Combatant name" style="width: 100%; padding: 8px; margin-bottom: 8px; border: 2px solid #34495e; border-radius: 4px; background: #34495e; color: #fff; font-size: 0.9em;" />
      <input type="number" id="combatant-init-input" placeholder="Initiative" style="width: 100%; padding: 8px; margin-bottom: 8px; border: 2px solid #34495e; border-radius: 4px; background: #34495e; color: #fff; font-size: 0.9em;" />
      <button id="add-combatant-btn" style="width: 100%; padding: 8px 12px; background: #3498db; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">\u2795 Add</button>
    `;
      addFormSection.appendChild(addFormHeader);
      addFormSection.appendChild(addForm);
      initiativeTab.appendChild(controls);
      initiativeTab.appendChild(roundDisplay);
      initiativeTab.appendChild(initiativeList);
      initiativeTab.appendChild(addFormSection);
      hiddenRollsTab.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #888;">
        <div style="font-size: 3em; margin-bottom: 10px;">\u{1F3B2}</div>
        <p style="margin: 0;">No hidden rolls yet</p>
        <p style="font-size: 0.85em; margin-top: 8px;">Rolls made while GM Mode is active will appear here</p>
      </div>
      <div id="hidden-rolls-list" style="display: flex; flex-direction: column; gap: 8px;"></div>
    `;
      playersTab.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0; font-size: 1.2em; color: #FC57F9;">Party Overview</h3>
        <div style="display: flex; gap: 8px;">
          <button id="import-players-btn" style="padding: 8px 14px; background: #c2185b; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 0.95em; font-weight: bold;">\u{1F4E5} Import</button>
          <button id="refresh-players-btn" style="padding: 8px 14px; background: #9b59b6; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 0.95em; font-weight: bold;">\u{1F504} Refresh</button>
        </div>
      </div>
      <div style="text-align: center; padding: 20px; color: #888;">
        <div style="font-size: 3em; margin-bottom: 10px;">\u{1F465}</div>
        <p style="margin: 0; font-size: 1.1em;">No players tracked yet</p>
        <p style="font-size: 1em; margin-top: 8px;">Click Import to load character data from storage</p>
      </div>
      <div id="player-overview-list" style="display: flex; flex-direction: column; gap: 10px;"></div>
    `;
      historyTab.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0; font-size: 1em; color: #FC57F9;">Last 10 Turns</h3>
        <button id="export-history-btn" style="padding: 6px 12px; background: #3498db; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 0.8em;">\u{1F4CB} Copy</button>
      </div>
      <div id="turn-history-empty-state" style="text-align: center; padding: 20px; color: #888;">
        <div style="font-size: 3em; margin-bottom: 10px;">\u{1F4DC}</div>
        <p style="margin: 0;">No turn history yet</p>
        <p style="font-size: 0.85em; margin-top: 8px;">Combat actions will be logged here</p>
      </div>
      <div id="turn-history-list" style="display: flex; flex-direction: column; gap: 8px;"></div>
    `;
      const header = document.createElement("div");
      header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      background: #1e1e1e;
      border-bottom: 2px solid #FC57F9;
      cursor: move;
      user-select: none;
    `;
      header.innerHTML = `
      <div>
        <h2 style="margin: 0; font-size: 1.2em; color: #FC57F9;">\u{1F451} GM Panel</h2>
        <div style="display: flex; align-items: center; gap: 15px; margin-top: 8px;">
          <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9em; color: #aaa; cursor: pointer;">
            <input type="checkbox" id="silent-rolls-toggle" style="width: 16px; height: 16px; cursor: pointer;" />
            <span>\u{1F507} Silent Rolls</span>
          </label>
        </div>
      </div>
      <button id="gm-panel-close" style="background: #e74c3c; color: #fff; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.9em;">\u2716</button>
    `;
      const tabNav = document.createElement("div");
      tabNav.style.cssText = `
      display: flex;
      gap: 0;
      background: #1e1e1e;
      border-bottom: 1px solid #34495e;
    `;
      tabNav.innerHTML = `
      <button class="gm-tab-btn" data-tab="initiative" style="flex: 1; padding: 12px; background: #2a2a2a; color: #FC57F9; border: none; border-bottom: 3px solid #FC57F9; cursor: pointer; font-weight: bold; font-size: 0.9em; transition: all 0.2s;">\u2694\uFE0F Initiative</button>
      <button class="gm-tab-btn" data-tab="history" style="flex: 1; padding: 12px; background: transparent; color: #888; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-weight: bold; font-size: 0.9em; transition: all 0.2s;">\u{1F4DC} History</button>
      <button class="gm-tab-btn" data-tab="hidden-rolls" style="flex: 1; padding: 12px; background: transparent; color: #888; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-weight: bold; font-size: 0.9em; transition: all 0.2s;">\u{1F3B2} Hidden Rolls</button>
      <button class="gm-tab-btn" data-tab="players" style="flex: 1; padding: 12px; background: transparent; color: #888; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-weight: bold; font-size: 0.9em; transition: all 0.2s;">\u{1F465} Players</button>
    `;
      const contentWrapper = document.createElement("div");
      contentWrapper.style.cssText = `
      padding: 15px;
      background: #2a2a2a;
      color: #fff;
      border-radius: 0 0 12px 12px;
      overflow-y: auto;
      flex: 1;
    `;
      contentWrapper.appendChild(initiativeTab);
      contentWrapper.appendChild(hiddenRollsTab);
      contentWrapper.appendChild(playersTab);
      contentWrapper.appendChild(historyTab);
      gmPanel.appendChild(header);
      gmPanel.appendChild(tabNav);
      gmPanel.appendChild(contentWrapper);
      document.body.appendChild(gmPanel);
      makeDraggable(gmPanel, header);
      startCharacterBroadcastListener();
      loadPlayerDataFromStorage();
      debug.log("\u{1F9EA} Testing storage functionality...");
      if (browserAPI.storage.local.get instanceof Function) {
        browserAPI.storage.local.get(["characterProfiles"]).then((result) => {
          debug.log("\u{1F9EA} Promise storage test result:", result);
          if (result.characterProfiles) {
            debug.log("\u{1F9EA} Found characterProfiles:", Object.keys(result.characterProfiles));
            Object.keys(result.characterProfiles).forEach((key) => {
              debug.log(`\u{1F9EA} Profile ${key}:`, result.characterProfiles[key].type);
            });
          } else {
            debug.log("\u{1F9EA} No characterProfiles found in storage (Promise)");
          }
        }).catch((error) => {
          debug.error("\u{1F9EA} Promise storage error:", error);
        });
      }
      try {
        browserAPI.storage.local.get(["characterProfiles"], (result) => {
          debug.log("\u{1F9EA} Callback storage test result:", result);
          if (browserAPI.runtime.lastError) {
            debug.error("\u{1F9EA} Callback storage error:", browserAPI.runtime.lastError);
          } else if (result.characterProfiles) {
            debug.log("\u{1F9EA} Found characterProfiles (callback):", Object.keys(result.characterProfiles));
          } else {
            debug.log("\u{1F9EA} No characterProfiles found in storage (callback)");
          }
        });
      } catch (error) {
        debug.error("\u{1F9EA} Callback storage test failed:", error);
      }
      attachGMPanelListeners();
      debug.log("\u2705 GM Panel created");
      return gmPanel;
    }
    function startCharacterBroadcastListener() {
      const chatObserver2 = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const messageContent = node.textContent || node.innerText || "";
              debug.log("\u{1F50D} Chat message detected:", messageContent.substring(0, 100));
              if (messageContent.includes("\u{1F451}[ROLLCLOUD:CHARACTER:") && messageContent.includes("]\u{1F451}")) {
                debug.log("\u{1F451} Detected character broadcast in chat");
                parseCharacterBroadcast(messageContent);
              }
            }
          });
        });
      });
      const chatContainer = document.querySelector(".chat-content") || document.querySelector(".chatlog") || document.querySelector("#textchat") || document.querySelector(".chat");
      if (chatContainer) {
        chatObserver2.observe(chatContainer, {
          childList: true,
          subtree: true
        });
        debug.log("\u{1F451} Started listening for character broadcasts in chat");
      } else {
        debug.warn("\u26A0\uFE0F Could not find chat container for character broadcast listener");
      }
    }
    function parseCharacterBroadcast(message) {
      try {
        const match = message.match(/👑\[ROLLCLOUD:CHARACTER:(.+?)\]👑/);
        if (!match) {
          debug.warn("\u26A0\uFE0F Invalid character broadcast format");
          return;
        }
        const encodedData = match[1];
        const decodedData = JSON.parse(decodeURIComponent(escape(atob(encodedData))));
        if (decodedData.type !== "ROLLCLOUD_CHARACTER_BROADCAST") {
          debug.warn("\u26A0\uFE0F Not a character broadcast message");
          return;
        }
        const character = decodedData.character;
        const fullSheet = decodedData.fullSheet || character;
        debug.log("\u{1F451} Received character broadcast:", character.name);
        debug.log("\u{1F50D} Full sheet data keys:", fullSheet ? Object.keys(fullSheet) : "null");
        debug.log("\u{1F50D} Full sheet sample:", fullSheet ? JSON.stringify(fullSheet, null, 2).substring(0, 500) + "..." : "null");
        updatePlayerData(character.name, fullSheet);
        debug.log(`\u2705 ${character.name} shared their character sheet! \u{1F451}`);
      } catch (error) {
        debug.error("\u274C Error parsing character broadcast:", error);
      }
    }
    function makeDraggable(element, handle) {
      let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
      handle.onmousedown = dragMouseDown;
      function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
      }
      function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        requestAnimationFrame(() => {
          const offsetTop = element.offsetTop;
          const offsetLeft = element.offsetLeft;
          const offsetWidth = element.offsetWidth;
          const offsetHeight = element.offsetHeight;
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          let newTop = offsetTop - pos2;
          let newLeft = offsetLeft - pos1;
          const minTop = 0;
          const minLeft = 0;
          const maxLeft = viewportWidth - offsetWidth;
          const maxTop = viewportHeight - offsetHeight;
          newTop = Math.max(minTop, Math.min(newTop, maxTop));
          newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
          element.style.top = newTop + "px";
          element.style.left = newLeft + "px";
          element.style.right = "auto";
        });
      }
      function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
      }
    }
    function attachGMPanelListeners() {
      const silentRollsToggle = document.getElementById("silent-rolls-toggle");
      if (silentRollsToggle) {
        silentRollsToggle.addEventListener("change", (e) => {
          silentRollsEnabled = e.target.checked;
          debug.log(`\u{1F507} Silent rolls ${silentRollsEnabled ? "enabled" : "disabled"}`);
          const hiddenRollsTab = gmPanel.querySelector('[data-tab="hidden-rolls"]');
          if (hiddenRollsTab) {
            const description = hiddenRollsTab.querySelector("p:nth-child(2)");
            if (description) {
              description.textContent = silentRollsEnabled ? "Rolls made while silent rolls is enabled will appear here" : "Rolls made while GM Mode is active will appear here";
            }
          }
        });
      }
      const tabButtons = gmPanel.querySelectorAll(".gm-tab-btn");
      const tabContents = gmPanel.querySelectorAll(".gm-tab-content");
      tabButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const targetTab = btn.dataset.tab;
          tabButtons.forEach((b) => {
            if (b.dataset.tab === targetTab) {
              b.style.background = "#2a2a2a";
              b.style.color = "#FC57F9";
              b.style.borderBottom = "3px solid #FC57F9";
            } else {
              b.style.background = "transparent";
              b.style.color = "#888";
              b.style.borderBottom = "3px solid transparent";
            }
          });
          tabContents.forEach((content) => {
            content.style.display = content.dataset.tab === targetTab ? "block" : "none";
          });
          debug.log(`\u{1F4D1} Switched to GM tab: ${targetTab}`);
        });
      });
      const closeBtn = document.getElementById("gm-panel-close");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => toggleGMMode(false));
      }
      const startCombatBtn = document.getElementById("start-combat-btn");
      const nextBtn = document.getElementById("next-turn-btn");
      const prevBtn = document.getElementById("prev-turn-btn");
      const clearAllBtn = document.getElementById("clear-all-btn");
      debug.log("\u{1F50D} GM Panel controls found:", {
        startCombatBtn: !!startCombatBtn,
        nextBtn: !!nextBtn,
        prevBtn: !!prevBtn,
        clearAllBtn: !!clearAllBtn
      });
      if (startCombatBtn)
        startCombatBtn.addEventListener("click", startCombat);
      if (nextBtn)
        nextBtn.addEventListener("click", nextTurn);
      if (prevBtn)
        prevBtn.addEventListener("click", prevTurn);
      if (clearAllBtn)
        clearAllBtn.addEventListener("click", clearAllCombatants);
      const addFormHeader = gmPanel.querySelector('div[style*="cursor: pointer"]');
      const addForm = document.getElementById("add-combatant-form");
      const addFormToggle = document.getElementById("add-form-toggle");
      let isFormCollapsed = true;
      if (addFormHeader && addForm && addFormToggle) {
        addFormHeader.addEventListener("click", () => {
          isFormCollapsed = !isFormCollapsed;
          if (isFormCollapsed) {
            addForm.style.maxHeight = "0";
            addForm.style.opacity = "0";
            addFormToggle.style.transform = "rotate(-90deg)";
          } else {
            addForm.style.maxHeight = "500px";
            addForm.style.opacity = "1";
            addFormToggle.style.transform = "rotate(0deg)";
          }
        });
      }
      const addBtn = document.getElementById("add-combatant-btn");
      const nameInput = document.getElementById("combatant-name-input");
      const initInput = document.getElementById("combatant-init-input");
      if (addBtn && nameInput && initInput) {
        addBtn.addEventListener("click", () => {
          const name = nameInput.value.trim();
          const initiative = parseInt(initInput.value);
          if (name && !isNaN(initiative)) {
            addCombatant(name, initiative, "manual");
            nameInput.value = "";
            initInput.value = "";
          }
        });
        initInput.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            addBtn.click();
          }
        });
      }
      const exportHistoryBtn = document.getElementById("export-history-btn");
      if (exportHistoryBtn) {
        exportHistoryBtn.addEventListener("click", exportTurnHistory);
      }
      const importPlayersBtn = document.getElementById("import-players-btn");
      if (importPlayersBtn) {
        importPlayersBtn.addEventListener("click", importPlayerData);
      }
      const refreshPlayersBtn = document.getElementById("refresh-players-btn");
      if (refreshPlayersBtn) {
        refreshPlayersBtn.addEventListener("click", () => {
          updatePlayerOverviewDisplay();
          debug.log("\u{1F504} Refreshed player overview");
        });
      }
      debug.log("\u2705 GM Panel listeners attached");
    }
    function updateHiddenRollsDisplay() {
      const hiddenRollsList = document.getElementById("hidden-rolls-list");
      if (!hiddenRollsList)
        return;
      if (hiddenRolls.length === 0) {
        hiddenRollsList.innerHTML = "";
        const tabContent2 = gmPanel.querySelector('[data-tab="hidden-rolls"]');
        if (tabContent2) {
          const emptyState = tabContent2.querySelector('div[style*="text-align: center"]');
          if (emptyState)
            emptyState.style.display = "block";
        }
        return;
      }
      const tabContent = gmPanel.querySelector('[data-tab="hidden-rolls"]');
      if (tabContent) {
        const emptyState = tabContent.querySelector('div[style*="text-align: center"]');
        if (emptyState)
          emptyState.style.display = "none";
      }
      hiddenRollsList.innerHTML = hiddenRolls.map((roll, index) => `
      <div style="background: #34495e; padding: 12px; border-radius: 8px; border-left: 4px solid #f39c12;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
          <div style="flex: 1;">
            <div style="font-weight: bold; color: #f39c12; margin-bottom: 4px;">${roll.characterName}</div>
            <div style="font-size: 0.9em; color: #ccc;">${roll.name}</div>
            <div style="font-size: 0.85em; color: #888; margin-top: 4px;">${roll.timestamp}</div>
          </div>
          <div style="font-size: 1.2em; color: #f39c12;">\u{1F512}</div>
        </div>
        <div style="background: #2c3e50; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 0.9em; margin-bottom: 10px;">
          ${roll.formula}
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="reveal-roll-btn" data-roll-id="${roll.id}" style="flex: 1; padding: 8px; background: #c2185b; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85em;">
            \u{1F4E2} Publish Roll
          </button>
          <button class="delete-roll-btn" data-roll-id="${roll.id}" style="padding: 8px 12px; background: #e74c3c; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85em;">
            \u{1F5D1}\uFE0F
          </button>
        </div>
      </div>
    `).join("");
      const revealRollBtns = hiddenRollsList.querySelectorAll(".reveal-roll-btn");
      const deleteRollBtns = hiddenRollsList.querySelectorAll(".delete-roll-btn");
      revealRollBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const rollId = btn.dataset.rollId;
          revealHiddenRoll(rollId);
        });
      });
      deleteRollBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const rollId = btn.dataset.rollId;
          deleteHiddenRoll(rollId);
        });
      });
      debug.log(`\u{1F4CB} Updated hidden rolls display: ${hiddenRolls.length} rolls`);
    }
    window.revealHiddenRoll = function(rollId) {
      const rollIndex = hiddenRolls.findIndex((r) => r.id === rollId);
      if (rollIndex === -1)
        return;
      const roll = hiddenRolls[rollIndex];
      debug.log("\u{1F513} Revealing hidden roll:", roll);
      const formattedMessage = `GM roll: **${roll.characterName}** rolled ${roll.name}! **[[${roll.formula}]]**`;
      const success = postChatMessage(formattedMessage);
      if (success) {
        debug.log("\u2705 Hidden roll revealed to Roll20");
        hiddenRolls.splice(rollIndex, 1);
        updateHiddenRollsDisplay();
      } else {
        debug.error("\u274C Failed to reveal hidden roll");
      }
    };
    window.deleteHiddenRoll = function(rollId) {
      const rollIndex = hiddenRolls.findIndex((r) => r.id === rollId);
      if (rollIndex === -1)
        return;
      hiddenRolls.splice(rollIndex, 1);
      updateHiddenRollsDisplay();
      debug.log("\u{1F5D1}\uFE0F Deleted hidden roll");
    };
    function createPlayerHeader(name, player, playerId) {
      const hpPercent = player.maxHp > 0 ? player.hp / player.maxHp * 100 : 0;
      const hpColor = hpPercent > 50 ? "#c2185b" : hpPercent > 25 ? "#f39c12" : "#e74c3c";
      return `
      <div style="background: #34495e; border-radius: 8px; border-left: 4px solid ${hpColor}; overflow: hidden;">
        <!-- Player Header (always visible) -->
        <div class="player-header-btn" data-player-name="${name}" style="padding: 12px; cursor: pointer; user-select: none; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s;" onmouseover="this.style.background='#3d5a6e'" onmouseout="this.style.background='transparent'">
          <div style="flex: 1;">
            <div style="font-weight: bold; font-size: 1.1em; color: #FC57F9; margin-bottom: 4px;">${name}</div>
            <div style="display: flex; gap: 12px; font-size: 0.95em; color: #ccc;">
              <span>HP: ${player.hp}/${player.maxHp}</span>
              <span>AC: ${player.ac || "\u2014"}</span>
              <span>Init: ${player.initiative || "\u2014"}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span id="${playerId}-toggle" style="transition: transform 0.3s; transform: rotate(-90deg); color: #888; font-size: 1.1em;">\u25BC</span>
            <button class="player-delete-btn" data-player-name="${name}" style="padding: 4px 8px; background: #e74c3c; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8em; font-weight: bold;" title="Remove player">\u{1F5D1}\uFE0F</button>
          </div>
        </div>
    `;
    }
    function updatePlayerOverviewDisplay() {
      const playerOverviewList = document.getElementById("player-overview-list");
      if (!playerOverviewList)
        return;
      const players = Object.keys(playerData);
      if (players.length === 0) {
        playerOverviewList.innerHTML = "";
        const tabContent2 = gmPanel.querySelector('[data-tab="players"]');
        if (tabContent2) {
          const emptyState = tabContent2.querySelector('div[style*="text-align: center"]');
          if (emptyState)
            emptyState.style.display = "block";
        }
        return;
      }
      const tabContent = gmPanel.querySelector('[data-tab="players"]');
      if (tabContent) {
        const emptyState = tabContent.querySelector('div[style*="text-align: center"]');
        if (emptyState)
          emptyState.style.display = "none";
      }
      playerOverviewList.innerHTML = players.map((name, index) => {
        const player = playerData[name];
        const playerId = `player-${index}`;
        const hpPercent = player.maxHp > 0 ? player.hp / player.maxHp * 100 : 0;
        const hpColor = hpPercent > 50 ? "#c2185b" : hpPercent > 25 ? "#f39c12" : "#e74c3c";
        return createPlayerHeader(name, player, playerId) + `

          <!-- Detailed View (collapsible) -->
          <div id="${playerId}-details" style="max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.3s ease-out, opacity 0.3s ease-out;">
            <div style="padding: 0 12px 12px 12px;">
              <!-- Character Sub-tabs -->
              <div style="display: flex; gap: 4px; margin-bottom: 10px; border-bottom: 1px solid #2c3e50;">
                <button class="player-subtab-btn" data-player="${playerId}" data-subtab="overview" style="padding: 8px 12px; background: transparent; color: #FC57F9; border: none; border-bottom: 2px solid #FC57F9; cursor: pointer; font-size: 0.9em; font-weight: bold;">Overview</button>
                <button class="player-subtab-btn" data-player="${playerId}" data-subtab="combat" style="padding: 8px 12px; background: transparent; color: #888; border: none; border-bottom: 2px solid transparent; cursor: pointer; font-size: 0.9em;">Combat</button>
                <button class="player-subtab-btn" data-player="${playerId}" data-subtab="status" style="padding: 8px 12px; background: transparent; color: #888; border: none; border-bottom: 2px solid transparent; cursor: pointer; font-size: 0.9em;">Status</button>
              </div>

              <!-- Overview Tab -->
              <div class="player-subtab-content" data-player="${playerId}" data-subtab="overview" style="display: block;">
                <!-- HP Bar -->
                <div style="margin-bottom: 10px;">
                  <div style="display: flex; justify-content: space-between; font-size: 0.95em; color: #ccc; margin-bottom: 4px;">
                    <span>Hit Points</span>
                    <span>${player.hp}/${player.maxHp}</span>
                  </div>
                  <div style="width: 100%; height: 12px; background: #2c3e50; border-radius: 5px; overflow: hidden;">
                    <div style="width: ${hpPercent}%; height: 100%; background: ${hpColor}; transition: width 0.3s;"></div>
                  </div>
                </div>

                <!-- Stats Grid -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                  <div style="background: #2c3e50; padding: 8px; border-radius: 4px; text-align: center;">
                    <div style="font-size: 0.85em; color: #888;">Armor Class</div>
                    <div style="font-weight: bold; color: #fff; font-size: 1.3em;">${player.ac || "\u2014"}</div>
                  </div>
                  <div style="background: #2c3e50; padding: 8px; border-radius: 4px; text-align: center;">
                    <div style="font-size: 0.85em; color: #888;">Passive Perception</div>
                    <div style="font-weight: bold; color: #fff; font-size: 1.3em;">${player.passivePerception || "\u2014"}</div>
                  </div>
                  <div style="background: #2c3e50; padding: 8px; border-radius: 4px; text-align: center;">
                    <div style="font-size: 0.85em; color: #888;">Initiative</div>
                    <div style="font-weight: bold; color: #fff; font-size: 1.3em;">${player.initiative || "\u2014"}</div>
                  </div>
                </div>
              </div>

              <!-- Combat Tab -->
              <div class="player-subtab-content" data-player="${playerId}" data-subtab="combat" style="display: none;">
                <div style="background: #2c3e50; padding: 10px; border-radius: 4px; margin-bottom: 8px;">
                  <div style="font-size: 0.95em; color: #888; margin-bottom: 6px;">Attack Roll</div>
                  <div style="font-size: 0.9em; color: #ccc;">Click character sheet to make attacks</div>
                </div>
                <div style="background: #2c3e50; padding: 10px; border-radius: 4px;">
                  <div style="font-size: 0.95em; color: #888; margin-bottom: 6px;">Combat Stats</div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="font-size: 0.9em; color: #ccc;">AC:</span>
                    <span style="font-size: 0.9em; color: #fff; font-weight: bold;">${player.ac || "\u2014"}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="font-size: 0.9em; color: #ccc;">Initiative:</span>
                    <span style="font-size: 0.9em; color: #fff; font-weight: bold;">${player.initiative || "\u2014"}</span>
                  </div>
                </div>
              </div>

              <!-- Status Tab -->
              <div class="player-subtab-content" data-player="${playerId}" data-subtab="status" style="display: none;">
                <!-- Conditions -->
                ${player.conditions && player.conditions.length > 0 ? `
                  <div style="margin-bottom: 10px;">
                    <div style="font-size: 0.95em; color: #888; margin-bottom: 6px;">Active Conditions</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                      ${player.conditions.map((c) => `<span style="background: #e74c3c; padding: 5px 12px; border-radius: 4px; font-size: 0.9em; font-weight: bold;">${c}</span>`).join("")}
                    </div>
                  </div>
                ` : '<div style="padding: 10px; text-align: center; color: #888; font-size: 0.95em;">No active conditions</div>'}

                <!-- Concentration -->
                ${player.concentrationSpell ? `
                  <div style="background: #9b59b6; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
                    <div style="font-size: 0.95em; font-weight: bold; margin-bottom: 4px;">\u{1F9E0} Concentrating</div>
                    <div style="font-size: 0.9em;">${player.concentrationSpell}</div>
                  </div>
                ` : ""}

                <!-- Death Saves (if unconscious) -->
                ${player.deathSaves ? `
                  <div style="background: #c0392b; padding: 10px; border-radius: 4px;">
                    <div style="font-size: 0.95em; font-weight: bold; margin-bottom: 6px;">\u{1F480} Death Saving Throws</div>
                    <div style="display: flex; justify-content: space-around; font-size: 0.9em;">
                      <div>
                        <div style="color: #c2185b; font-weight: bold;">Successes</div>
                        <div style="font-size: 1.3em; text-align: center;">\u2713 ${player.deathSaves.successes || 0}</div>
                      </div>
                      <div>
                        <div style="color: #e74c3c; font-weight: bold;">Failures</div>
                        <div style="font-size: 1.3em; text-align: center;">\u2717 ${player.deathSaves.failures || 0}</div>
                      </div>
                    </div>
                  </div>
                ` : ""}
              </div>
            </div>
          </div>
        </div>
      `;
      }).join("");
      debug.log(`\u{1F465} Updated player overview: ${players.length} players`);
      document.querySelectorAll(".player-header-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const playerName = btn.dataset.playerName;
          showFullCharacterModal(playerName);
        });
      });
      document.querySelectorAll(".player-delete-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const playerName = btn.dataset.playerName;
          deletePlayerFromGM(playerName);
        });
      });
    }
    function updatePlayerData(characterName, data) {
      if (!playerData[characterName]) {
        playerData[characterName] = {};
      }
      Object.assign(playerData[characterName], data);
      savePlayerDataToStorage();
      if (gmModeEnabled) {
        updatePlayerOverviewDisplay();
      }
      debug.log(`\u{1F464} Updated player data for ${characterName}:`, playerData[characterName]);
    }
    function savePlayerDataToStorage() {
      debug.log("\u{1F4BE} Attempting to save player data:", Object.keys(playerData));
      return browserAPI.storage.local.get(["characterProfiles"]).then((result) => {
        const existingProfiles = result.characterProfiles || {};
        Object.keys(existingProfiles).forEach((key) => {
          if (existingProfiles[key].type === "rollcloudPlayer") {
            delete existingProfiles[key];
          }
        });
        Object.keys(playerData).forEach((playerName) => {
          existingProfiles[playerName] = {
            ...playerData[playerName],
            type: "rollcloudPlayer",
            lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
          };
          debug.log(`\u{1F4BE} Preparing to save player: ${playerName}, type: rollcloudPlayer`);
        });
        return new Promise((resolve, reject) => {
          browserAPI.storage.local.set({
            characterProfiles: existingProfiles
          }, () => {
            if (browserAPI.runtime.lastError) {
              debug.error("\u274C Error saving to storage:", browserAPI.runtime.lastError);
              reject(browserAPI.runtime.lastError);
            } else {
              debug.log("\u2705 Successfully saved player data to characterProfiles storage");
              debug.log("\u{1F4BE} Total profiles in storage:", Object.keys(existingProfiles).length);
              resolve();
            }
          });
        });
      }).catch((error) => {
        debug.error("\u274C Error reading existing profiles before save:", error);
        throw error;
      });
    }
    function loadPlayerDataFromStorage() {
      return browserAPI.storage.local.get(["characterProfiles"]).then((result) => {
        if (result.characterProfiles) {
          playerData = {};
          Object.keys(result.characterProfiles).forEach((key) => {
            const profile = result.characterProfiles[key];
            if (profile.type === "rollcloudPlayer") {
              playerData[key] = profile;
            }
          });
          debug.log(`\u{1F4C2} Loaded ${Object.keys(playerData).length} GM players from storage`);
          if (gmModeEnabled) {
            updatePlayerOverviewDisplay();
          }
        }
      }).catch((error) => {
        debug.error("\u274C Error loading player data from storage:", error);
      });
    }
    function deletePlayerData(characterName) {
      if (playerData[characterName]) {
        delete playerData[characterName];
        savePlayerDataToStorage();
        if (gmModeEnabled) {
          updatePlayerOverviewDisplay();
        }
        debug.log(`\u{1F5D1}\uFE0F Deleted player data for ${characterName}`);
      }
    }
    window.deletePlayerFromGM = function(characterName) {
      if (confirm(`Remove ${characterName} from GM Panel?`)) {
        deletePlayerData(characterName);
      }
    };
    window.togglePlayerDetails = function(playerId) {
      const details = document.getElementById(`${playerId}-details`);
      const toggle = document.getElementById(`${playerId}-toggle`);
      if (!details || !toggle)
        return;
      const isExpanded = details.style.maxHeight && details.style.maxHeight !== "0px";
      if (isExpanded) {
        details.style.maxHeight = "0";
        details.style.opacity = "0";
        toggle.style.transform = "rotate(-90deg)";
      } else {
        details.style.maxHeight = "1000px";
        details.style.opacity = "1";
        toggle.style.transform = "rotate(0deg)";
        attachPlayerSubtabListeners(playerId);
      }
    };
    window.showFullCharacterModal = function(playerName) {
      const player = playerData[playerName];
      if (!player) {
        debug.warn(`\u26A0\uFE0F No data found for player: ${playerName}`);
        return;
      }
      const openPopups = Object.entries(characterPopups).filter(([name, popup2]) => popup2 && !popup2.closed);
      if (openPopups.length > 0) {
        const [existingPlayerName, existingPopup] = openPopups[0];
        if (existingPlayerName === playerName) {
          existingPopup.focus();
          debug.log(`\u{1F441}\uFE0F Focused existing character popup for ${playerName}`);
          return;
        }
        debug.log(`\u{1F504} Closing popup for ${existingPlayerName} to open ${playerName}`);
        existingPopup.close();
        delete characterPopups[existingPlayerName];
      }
      const popup = window.open(browserAPI.runtime.getURL("src/popup-sheet.html"), `character-${playerName}`, "width=900,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no");
      if (!popup) {
        debug.error("\u274C Failed to open popup window - please allow popups for this site");
        return;
      }
      characterPopups[playerName] = popup;
      window.currentPopoutPlayer = player;
      window.currentPopoutPlayerName = playerName;
      window.addEventListener("message", function(event) {
        if (event.data && event.data.action === "requestCharacterData") {
          popup.postMessage({
            action: "loadCharacterData",
            characterData: window.currentPopoutPlayer
          }, "*");
        }
      });
      debug.log(`\u{1FA9F} Opened character popup for ${playerName}`);
    };
    function attachPlayerSubtabListeners(playerId) {
      const subtabBtns = document.querySelectorAll(`.player-subtab-btn[data-player="${playerId}"]`);
      const subtabContents = document.querySelectorAll(`.player-subtab-content[data-player="${playerId}"]`);
      subtabBtns.forEach((btn) => {
        btn.replaceWith(btn.cloneNode(true));
      });
      const newSubtabBtns = document.querySelectorAll(`.player-subtab-btn[data-player="${playerId}"]`);
      newSubtabBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const targetSubtab = btn.dataset.subtab;
          newSubtabBtns.forEach((b) => {
            if (b.dataset.subtab === targetSubtab) {
              b.style.color = "#FC57F9";
              b.style.borderBottom = "2px solid #FC57F9";
            } else {
              b.style.color = "#888";
              b.style.borderBottom = "2px solid transparent";
            }
          });
          subtabContents.forEach((content) => {
            content.style.display = content.dataset.subtab === targetSubtab ? "block" : "none";
          });
        });
      });
    }
    function importPlayerData() {
      debug.log("\u{1F4E5} Importing player data from storage...");
      chrome.storage.local.get(["characterProfiles"], (result) => {
        if (chrome.runtime.lastError) {
          debug.error("\u274C Failed to import player data:", chrome.runtime.lastError);
          postChatMessage("\u274C Failed to import character data");
          return;
        }
        const characterProfiles = result.characterProfiles || {};
        const profileKeys = Object.keys(characterProfiles);
        if (profileKeys.length === 0) {
          debug.log("\u26A0\uFE0F No character profiles found in storage");
          postChatMessage("\u26A0\uFE0F No character data found. Please sync a character from Dice Cloud first.");
          return;
        }
        playerData = {};
        profileKeys.forEach((profileId) => {
          const character = characterProfiles[profileId];
          if (!character || !character.name) {
            debug.warn(`\u26A0\uFE0F Skipping invalid character profile: ${profileId}`);
            return;
          }
          playerData[character.name] = {
            // Basic stats
            hp: character.hp?.current ?? character.hitPoints?.current ?? 0,
            maxHp: character.hp?.max ?? character.hitPoints?.max ?? 0,
            ac: character.armorClass ?? character.ac ?? 10,
            initiative: character.initiative ?? 0,
            passivePerception: character.passivePerception ?? 10,
            proficiency: character.proficiency ?? 0,
            speed: character.speed ?? "30 ft",
            // Character info
            name: character.name,
            class: character.class || "Unknown",
            level: character.level || 1,
            race: character.race || "Unknown",
            hitDice: character.hitDice || "10",
            // Abilities
            attributes: character.attributes || {
              strength: 10,
              dexterity: 10,
              constitution: 10,
              intelligence: 10,
              wisdom: 10,
              charisma: 10
            },
            // Skills
            skills: character.skills || [],
            // Actions
            actions: character.actions || [],
            // Combat status
            conditions: character.conditions || [],
            concentration: character.concentration || null,
            deathSaves: character.deathSaves || null,
            // Type marking for storage
            type: "rollcloudPlayer",
            lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
          };
          debug.log(`\u2705 Imported player: ${character.name} (HP: ${character.hp?.current ?? character.hitPoints?.current ?? 0}/${character.hp?.max ?? character.hitPoints?.max ?? 0}, AC: ${character.armorClass ?? character.ac ?? 10})`);
        });
        updatePlayerOverviewDisplay();
        const playerCount = Object.keys(playerData).length;
        debug.log(`\u2705 Successfully imported ${playerCount} player(s)`);
        postChatMessage(`\u2705 GM imported ${playerCount} character(s) to party overview`);
      });
    }
    function exportPlayerData() {
      if (Object.keys(playerData).length === 0) {
        debug.log("\u26A0\uFE0F No player data to export");
        return;
      }
      const exportText = Object.keys(playerData).map((name) => {
        const player = playerData[name];
        return `**${name}**
HP: ${player.hp}/${player.maxHp}
AC: ${player.ac || "\u2014"}
Initiative: ${player.initiative || "\u2014"}
Passive Perception: ${player.passivePerception || "\u2014"}
${player.conditions && player.conditions.length > 0 ? `Conditions: ${player.conditions.join(", ")}` : ""}
${player.concentration ? `Concentrating: ${player.concentration}` : ""}
${player.deathSaves ? `Death Saves: \u2713${player.deathSaves.successes || 0} / \u2717${player.deathSaves.failures || 0}` : ""}
`;
      }).join("\n---\n\n");
      navigator.clipboard.writeText(exportText).then(() => {
        debug.log("\u2705 Player data copied to clipboard");
        postChatMessage("\u{1F4CB} GM exported party overview to clipboard");
      }).catch((err) => {
        debug.error("\u274C Failed to copy player data:", err);
      });
    }
    function logTurnAction(action) {
      const historyEntry = {
        timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
        round: initiativeTracker.round,
        turnIndex: initiativeTracker.currentTurnIndex,
        combatant: getCurrentCombatant()?.name || "Unknown",
        ...action
      };
      turnHistory.unshift(historyEntry);
      if (turnHistory.length > 10) {
        turnHistory = turnHistory.slice(0, 10);
      }
      updateTurnHistoryDisplay();
      debug.log("\u{1F4DC} Logged turn action:", historyEntry);
    }
    function updateTurnHistoryDisplay() {
      const turnHistoryList = document.getElementById("turn-history-list");
      const emptyState = document.getElementById("turn-history-empty-state");
      if (!turnHistoryList)
        return;
      if (turnHistory.length === 0) {
        turnHistoryList.innerHTML = "";
        if (emptyState)
          emptyState.style.display = "block";
        return;
      }
      if (emptyState)
        emptyState.style.display = "none";
      turnHistoryList.innerHTML = turnHistory.map((entry, index) => {
        const actionIcon = entry.action === "attack" ? "\u2694\uFE0F" : entry.action === "spell" ? "\u2728" : entry.action === "damage" ? "\u{1F494}" : entry.action === "healing" ? "\u{1F49A}" : entry.action === "condition" ? "\u{1F3AF}" : entry.action === "turn" ? "\u{1F504}" : "\u{1F4DD}";
        return `
        <div style="background: #34495e; padding: 10px; border-radius: 6px; border-left: 4px solid #3498db;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
            <div>
              <span style="font-weight: bold; color: #FC57F9;">${entry.combatant}</span>
              <span style="font-size: 0.75em; color: #888; margin-left: 8px;">Round ${entry.round}</span>
            </div>
            <span style="font-size: 0.75em; color: #888;">${entry.timestamp}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 0.9em;">
            <span style="font-size: 1.2em;">${actionIcon}</span>
            <span style="color: #ccc;">${entry.description}</span>
          </div>
          ${entry.damage ? `<div style="margin-top: 4px; font-size: 0.85em; color: #e74c3c;">Damage: ${entry.damage}</div>` : ""}
          ${entry.healing ? `<div style="margin-top: 4px; font-size: 0.85em; color: #c2185b;">Healing: ${entry.healing}</div>` : ""}
          ${entry.condition ? `<div style="margin-top: 4px; font-size: 0.85em; color: #f39c12;">Condition: ${entry.condition}</div>` : ""}
        </div>
      `;
      }).join("");
      debug.log(`\u{1F4DC} Updated turn history: ${turnHistory.length} entries`);
    }
    function exportTurnHistory() {
      const historyText = turnHistory.map((entry) => {
        let text = `[Round ${entry.round}] ${entry.combatant} - ${entry.description}`;
        if (entry.damage)
          text += ` (Damage: ${entry.damage})`;
        if (entry.healing)
          text += ` (Healing: ${entry.healing})`;
        if (entry.condition)
          text += ` (Condition: ${entry.condition})`;
        return text;
      }).join("\n");
      navigator.clipboard.writeText(historyText).then(() => {
        postChatMessage("\u{1F4CB} Turn history copied to clipboard");
        debug.log("\u{1F4CB} Turn history exported to clipboard");
      }).catch((err) => {
        debug.error("\u274C Failed to copy turn history:", err);
      });
    }
    function toggleGMMode(enabled) {
      const previousState = gmModeEnabled;
      gmModeEnabled = enabled !== void 0 ? enabled : !gmModeEnabled;
      debug.log(`\u{1F451} toggleGMMode called with enabled=${enabled}, previousState=${previousState}, newState=${gmModeEnabled}`);
      if (!gmPanel) {
        debug.log("\u{1F451} Creating GM panel...");
        createGMPanel();
      }
      if (!gmPanel) {
        debug.error("\u274C Failed to create GM panel!");
        return;
      }
      gmPanel.style.display = gmModeEnabled ? "flex" : "none";
      if (gmModeEnabled) {
        debug.log("\u{1F50D} GM Panel display set to flex");
        debug.log("\u{1F50D} GM Panel offsetWidth:", gmPanel.offsetWidth);
        debug.log("\u{1F50D} GM Panel offsetHeight:", gmPanel.offsetHeight);
        debug.log("\u{1F50D} GM Panel computed display:", window.getComputedStyle(gmPanel).display);
        debug.log("\u{1F50D} GM Panel parent:", gmPanel.parentElement);
        debug.log("\u{1F50D} GM Panel style:", gmPanel.style.cssText);
        const rect = gmPanel.getBoundingClientRect();
        debug.log("\u{1F50D} GM Panel bounding rect:", rect);
        debug.log("\u{1F50D} Is panel in viewport:", rect.width > 0 && rect.height > 0);
        setTimeout(() => {
          debug.log("\u{1F50D} Delayed check - GM Panel display:", window.getComputedStyle(gmPanel).display);
          debug.log("\u{1F50D} Delayed check - GM Panel visible:", gmPanel.offsetWidth > 0);
          if (gmPanel.offsetWidth === 0) {
            debug.warn("\u26A0\uFE0F GM Panel has zero width, trying to force visibility...");
            gmPanel.style.visibility = "visible";
            gmPanel.style.opacity = "1";
            gmPanel.style.display = "flex";
            gmPanel.style.width = "500px";
            gmPanel.style.height = "600px";
            debug.log("\u{1F50D} Forced visibility styles applied");
          }
        }, 100);
      }
      if (gmModeEnabled) {
        gmPanel.style.borderColor = "#FC57F9";
        gmPanel.style.boxShadow = "0 8px 32px rgba(78, 205, 196, 0.6)";
      } else {
        gmPanel.style.borderColor = "#FC57F9";
        gmPanel.style.boxShadow = "0 8px 32px rgba(0,0,0,0.5)";
      }
      if (gmModeEnabled) {
        startChatMonitoring();
      } else {
        stopChatMonitoring();
        Object.keys(characterPopups).forEach((characterName) => {
          const popup = characterPopups[characterName];
          try {
            if (popup && !popup.closed) {
              popup.close();
              debug.log(`\u{1F512} Closed shared character sheet for: ${characterName}`);
            }
          } catch (error) {
            debug.warn(`\u26A0\uFE0F Error closing popup for ${characterName}:`, error);
          }
          delete characterPopups[characterName];
        });
        debug.log("\u{1F512} All shared character sheets closed");
      }
      if (previousState !== gmModeEnabled) {
        const message = gmModeEnabled ? "\u{1F451} GM Panel is now active" : "\u{1F451} GM Panel deactivated";
        setTimeout(() => {
          postChatMessage(message);
        }, 100);
      }
      debug.log(`\u{1F451} GM Mode ${gmModeEnabled ? "enabled" : "disabled"}`);
    }
    function addCombatant(name, initiative, source = "chat") {
      const exists = initiativeTracker.combatants.find((c) => c.name === name);
      if (exists) {
        debug.log(`\u26A0\uFE0F Combatant ${name} already in tracker, updating initiative`);
        exists.initiative = initiative;
        updateInitiativeDisplay();
        return;
      }
      initiativeTracker.combatants.push({
        name,
        initiative,
        source
      });
      initiativeTracker.combatants.sort((a, b) => b.initiative - a.initiative);
      updateInitiativeDisplay();
      debug.log(`\u2705 Added combatant: ${name} (Init: ${initiative})`);
    }
    function removeCombatant(name) {
      const index = initiativeTracker.combatants.findIndex((c) => c.name === name);
      if (index !== -1) {
        initiativeTracker.combatants.splice(index, 1);
        if (initiativeTracker.currentTurnIndex >= initiativeTracker.combatants.length) {
          initiativeTracker.currentTurnIndex = 0;
        }
        updateInitiativeDisplay();
        debug.log(`\u{1F5D1}\uFE0F Removed combatant: ${name}`);
      }
    }
    function clearAllCombatants() {
      if (confirm("Clear all combatants from initiative tracker?")) {
        initiativeTracker.combatants = [];
        initiativeTracker.currentTurnIndex = 0;
        initiativeTracker.round = 1;
        combatStarted = false;
        const startBtn = document.getElementById("start-combat-btn");
        const prevBtn = document.getElementById("prev-turn-btn");
        const nextBtn = document.getElementById("next-turn-btn");
        if (startBtn)
          startBtn.style.display = "block";
        if (prevBtn)
          prevBtn.style.display = "none";
        if (nextBtn)
          nextBtn.style.display = "none";
        updateInitiativeDisplay();
        postChatMessage("\u{1F6D1} Combat ended. Initiative tracker cleared.");
        debug.log("\u{1F5D1}\uFE0F All combatants cleared");
      }
    }
    function startCombat() {
      if (initiativeTracker.combatants.length === 0) {
        debug.warn("\u26A0\uFE0F Cannot start combat with no combatants");
        return;
      }
      initiativeTracker.currentTurnIndex = 0;
      initiativeTracker.round = 1;
      combatStarted = true;
      document.getElementById("round-display").textContent = "Round 1";
      const startBtn = document.getElementById("start-combat-btn");
      const prevBtn = document.getElementById("prev-turn-btn");
      const nextBtn = document.getElementById("next-turn-btn");
      if (startBtn) {
        startBtn.style.display = "none";
      }
      if (prevBtn)
        prevBtn.style.display = "block";
      if (nextBtn)
        nextBtn.style.display = "block";
      updateInitiativeDisplay();
      notifyCurrentTurn();
      postChatMessage("\u2694\uFE0F Combat has begun! Round 1 starts!");
      announceTurn();
      debug.log("\u2694\uFE0F Combat started!");
    }
    function nextTurn() {
      if (initiativeTracker.combatants.length === 0)
        return;
      initiativeTracker.currentTurnIndex++;
      if (initiativeTracker.currentTurnIndex >= initiativeTracker.combatants.length) {
        initiativeTracker.currentTurnIndex = 0;
        initiativeTracker.round++;
        document.getElementById("round-display").textContent = `Round ${initiativeTracker.round}`;
        postChatMessage(`\u2694\uFE0F Round ${initiativeTracker.round} begins!`);
        postRoundChangeToDiscord(initiativeTracker.round);
      }
      updateInitiativeDisplay();
      notifyCurrentTurn();
      announceTurn();
      const current = getCurrentCombatant();
      if (current) {
        logTurnAction({
          action: "turn",
          description: `${current.name}'s turn begins`
        });
      }
      debug.log(`\u23ED\uFE0F Next turn: ${getCurrentCombatant()?.name}`);
    }
    function prevTurn() {
      if (initiativeTracker.combatants.length === 0)
        return;
      initiativeTracker.currentTurnIndex--;
      if (initiativeTracker.currentTurnIndex < 0) {
        initiativeTracker.currentTurnIndex = initiativeTracker.combatants.length - 1;
        initiativeTracker.round = Math.max(1, initiativeTracker.round - 1);
        document.getElementById("round-display").textContent = `Round ${initiativeTracker.round}`;
      }
      updateInitiativeDisplay();
      notifyCurrentTurn();
      announceTurn();
      debug.log(`\u23EE\uFE0F Prev turn: ${getCurrentCombatant()?.name}`);
    }
    function getCurrentCombatant() {
      return initiativeTracker.combatants[initiativeTracker.currentTurnIndex];
    }
    function delayTurn(combatantIndex) {
      const combatant = initiativeTracker.combatants[combatantIndex];
      if (!combatant)
        return;
      debug.log(`\u23F8\uFE0F Delaying turn for: ${combatant.name}`);
      initiativeTracker.delayedCombatants.push({
        name: combatant.name,
        initiative: combatant.initiative,
        originalIndex: combatantIndex
      });
      logTurnAction({
        action: "turn",
        description: `${combatant.name} delays their turn`
      });
      postChatMessage(`\u23F8\uFE0F ${combatant.name} delays their turn`);
      nextTurn();
      updateInitiativeDisplay();
    }
    function undelayTurn(combatantName) {
      const delayedIndex = initiativeTracker.delayedCombatants.findIndex((d) => d.name === combatantName);
      if (delayedIndex === -1)
        return;
      debug.log(`\u25B6\uFE0F Undelaying: ${combatantName}`);
      initiativeTracker.delayedCombatants.splice(delayedIndex, 1);
      logTurnAction({
        action: "turn",
        description: `${combatantName} resumes their turn`
      });
      postChatMessage(`\u25B6\uFE0F ${combatantName} resumes their turn`);
      updateInitiativeDisplay();
    }
    function insertDelayedTurn(combatantName) {
      const delayedIndex = initiativeTracker.delayedCombatants.findIndex((d) => d.name === combatantName);
      if (delayedIndex === -1)
        return;
      const delayed = initiativeTracker.delayedCombatants[delayedIndex];
      debug.log(`\u25B6\uFE0F Inserting delayed turn for: ${delayed.name}`);
      initiativeTracker.delayedCombatants.splice(delayedIndex, 1);
      logTurnAction({
        action: "turn",
        description: `${delayed.name} acts on delayed turn`
      });
      postChatMessage(`\u25B6\uFE0F ${delayed.name} acts now (delayed turn)`);
      notifyCurrentTurn();
      updateInitiativeDisplay();
    }
    function updateInitiativeDisplay() {
      const list = document.getElementById("initiative-list");
      if (!list)
        return;
      if (initiativeTracker.combatants.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: #7f8c8d; padding: 20px;">No combatants yet. Add manually or roll initiative in Roll20 chat!</div>';
        return;
      }
      list.innerHTML = initiativeTracker.combatants.map((combatant, index) => {
        const isActive = index === initiativeTracker.currentTurnIndex;
        const isDelayed = initiativeTracker.delayedCombatants.some((d) => d.name === combatant.name);
        return `
        <div style="padding: 10px; background: ${isActive ? "#FC57F9" : isDelayed ? "#9b59b6" : "#34495e"}; border: 2px solid ${isActive ? "#FC57F9" : isDelayed ? "#8e44ad" : "#2c3e50"}; border-radius: 6px; ${isActive ? "box-shadow: 0 0 15px rgba(78, 205, 196, 0.4);" : ""}">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: ${isActive ? "8px" : "0"};">
            <div style="font-weight: bold; font-size: 1.2em; min-width: 30px; text-align: center;">${combatant.initiative}</div>
            <div style="flex: 1; font-weight: bold;">
              ${combatant.name}
              ${isDelayed ? '<span style="font-size: 0.85em; color: #f39c12; margin-left: 8px;">\u23F8\uFE0F Delayed</span>' : ""}
            </div>
            <button class="rollcloud-remove-combatant" data-combatant-name="${combatant.name}" style="background: #e74c3c; color: #fff; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 0.85em;">\u2715</button>
          </div>
          ${isActive && !isDelayed ? `
            <button class="rollcloud-delay-turn" data-combatant-index="${index}" style="width: 100%; background: #f39c12; color: #fff; border: none; border-radius: 4px; padding: 6px; cursor: pointer; font-weight: bold; font-size: 0.85em;">\u23F8\uFE0F Delay Turn</button>
          ` : ""}
          ${isActive && isDelayed ? `
            <button class="rollcloud-undelay-turn" data-combatant-name="${combatant.name}" style="width: 100%; background: #c2185b; color: #fff; border: none; border-radius: 4px; padding: 6px; cursor: pointer; font-weight: bold; font-size: 0.85em;">\u25B6\uFE0F Resume Turn</button>
          ` : ""}
        </div>
      `;
      }).join("");
      if (initiativeTracker.delayedCombatants.length > 0) {
        list.innerHTML += `
        <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #34495e;">
          <div style="font-weight: bold; color: #f39c12; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
            <span>\u23F8\uFE0F</span> Delayed Actions
          </div>
          ${initiativeTracker.delayedCombatants.map((delayed) => `
            <div style="padding: 8px; background: #9b59b6; border-radius: 6px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
              <div style="flex: 1;">
                <div style="font-weight: bold;">${delayed.name}</div>
                <div style="font-size: 0.75em; opacity: 0.8;">Initiative: ${delayed.initiative}</div>
              </div>
              <button class="rollcloud-insert-delayed" data-delayed-name="${delayed.name}" style="background: #c2185b; color: #fff; border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer; font-weight: bold; font-size: 0.85em;">\u25B6\uFE0F Act Now</button>
            </div>
          `).join("")}
        </div>
      `;
      }
      const removeButtons = list.querySelectorAll(".rollcloud-remove-combatant");
      removeButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const name = button.getAttribute("data-combatant-name");
          removeCombatant(name);
        });
      });
      const delayButtons = list.querySelectorAll(".rollcloud-delay-turn");
      delayButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const index = parseInt(button.getAttribute("data-combatant-index"));
          delayTurn(index);
        });
      });
      const undelayButtons = list.querySelectorAll(".rollcloud-undelay-turn");
      undelayButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const name = button.getAttribute("data-combatant-name");
          undelayTurn(name);
        });
      });
      const insertDelayedButtons = list.querySelectorAll(".rollcloud-insert-delayed");
      insertDelayedButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const name = button.getAttribute("data-delayed-name");
          insertDelayedTurn(name);
        });
      });
    }
    function notifyCurrentTurn() {
      const current = getCurrentCombatant();
      if (!current)
        return;
      debug.log(`\u{1F3AF} Notifying turn for: "${current.name}"`);
      debug.log(`\u{1F4CB} Registered popups: ${Object.keys(characterPopups).map((n) => `"${n}"`).join(", ")}`);
      function normalizeName(name) {
        return name.replace(/^(?:🔵|🔴|⚪|⚫|🟢|🟡|🟠|🟣|🟤)\s*/, "").replace(/^It's\s+/i, "").replace(/'s\s+turn.*$/i, "").trim();
      }
      const normalizedCurrentName = normalizeName(current.name);
      debug.log(`\u{1F50D} Normalized current combatant: "${normalizedCurrentName}"`);
      Object.keys(characterPopups).forEach((characterName) => {
        const popup = characterPopups[characterName];
        try {
          if (popup && !popup.closed) {
            const normalizedCharName = normalizeName(characterName);
            const isTheirTurn = normalizedCharName === normalizedCurrentName;
            debug.log(`\u{1F50D} Comparing: "${characterName}" (normalized: "${normalizedCharName}") vs "${current.name}" (normalized: "${normalizedCurrentName}") \u2192 ${isTheirTurn ? "ACTIVATE" : "DEACTIVATE"}`);
            debug.log(`\u{1F50D} Raw comparison: "${characterName}" === "${current.name}" \u2192 ${characterName === current.name}`);
            popup.postMessage({
              action: isTheirTurn ? "activateTurn" : "deactivateTurn",
              combatant: current.name
            }, "*");
            debug.log(`\u{1F4E4} Sent ${isTheirTurn ? "activateTurn" : "deactivateTurn"} to "${characterName}"`);
          } else {
            delete characterPopups[characterName];
            debug.log(`\u{1F5D1}\uFE0F Removed closed popup for ${characterName}`);
          }
        } catch (error) {
          debug.warn(`\u26A0\uFE0F Error sending message to popup "${characterName}":`, error);
          delete characterPopups[characterName];
        }
      });
      postTurnToDiscord(current);
    }
    function postTurnToDiscord(combatant) {
      if (!combatant)
        return;
      browserAPI.runtime.sendMessage({
        action: "postToDiscord",
        payload: {
          type: "turnStart",
          characterName: combatant.name,
          combatant: combatant.name,
          initiative: combatant.initiative,
          round: initiativeTracker.round
        }
      }).then((response) => {
        if (response && response.success) {
          debug.log(`\u{1F3AE} Discord: Posted turn for ${combatant.name}`);
        }
      }).catch((err) => {
        debug.log("Discord webhook not configured or failed:", err.message);
      });
    }
    function postRoundChangeToDiscord(round) {
      const current = getCurrentCombatant();
      browserAPI.runtime.sendMessage({
        action: "postToDiscord",
        payload: {
          type: "roundChange",
          round,
          combatant: current ? current.name : null
        }
      }).then((response) => {
        if (response && response.success) {
          debug.log(`\u{1F3AE} Discord: Posted round ${round} change`);
        }
      }).catch((err) => {
        debug.log("Discord webhook not configured or failed:", err.message);
      });
    }
    function announceTurn() {
      const current = getCurrentCombatant();
      if (!current)
        return;
      postChatMessage(`\u{1F3AF} It's ${current.name}'s turn! (Initiative: ${current.initiative})`);
    }
    let chatObserver = null;
    function startChatMonitoring() {
      const chatLog = document.getElementById("textchat");
      if (!chatLog) {
        debug.warn("\u26A0\uFE0F Roll20 chat not found, cannot monitor for initiative");
        return;
      }
      chatObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.classList && node.classList.contains("message")) {
              checkForInitiativeRoll(node);
              checkForPlayerRoll(node);
            }
          });
        });
      });
      chatObserver.observe(chatLog, {
        childList: true,
        subtree: true
      });
      debug.log("\u{1F440} Monitoring Roll20 chat for initiative rolls and player tracking");
    }
    function stopChatMonitoring() {
      if (chatObserver) {
        chatObserver.disconnect();
        chatObserver = null;
        debug.log("\u{1F6D1} Stopped monitoring chat");
      }
    }
    function checkForInitiativeRoll(messageNode) {
      const text = messageNode.textContent || "";
      const innerHTML = messageNode.innerHTML || "";
      debug.log("\u{1F4E8} Chat message (text):", text);
      debug.log("\u{1F4E8} Chat message (html):", innerHTML);
      const ownAnnouncementPrefixes = ["\u{1F3AF}", "\u2694\uFE0F", "\u{1F451}"];
      const trimmedText = text.trim();
      for (const prefix of ownAnnouncementPrefixes) {
        if (trimmedText.includes(prefix)) {
          debug.log("\u23ED\uFE0F Skipping own announcement message");
          return;
        }
      }
      const inlineRolls = messageNode.querySelectorAll(".inlinerollresult");
      if (inlineRolls.length > 0) {
        const lowerText = text.toLowerCase();
        if (lowerText.includes("initiative") || lowerText.includes("init")) {
          let characterName = null;
          const rollTemplate = messageNode.querySelector(".sheet-rolltemplate-default, .sheet-rolltemplate-custom");
          if (rollTemplate) {
            const caption = rollTemplate.querySelector("caption, .sheet-template-name, .charname");
            if (caption) {
              const captionText = caption.textContent.trim();
              const nameMatch = captionText.match(/^(?:🔵|🔴|⚪|⚫|🟢|🟡|🟠|🟣|🟤)?\s*(.+?)\s+(?:rolls?\s+)?[Ii]nitiative/i);
              if (nameMatch) {
                characterName = nameMatch[1].trim();
              }
            }
          }
          if (!characterName) {
            const byElement = messageNode.querySelector(".by");
            characterName = byElement ? byElement.textContent.trim().replace(/:/g, "") : null;
          }
          const lastRoll = inlineRolls[inlineRolls.length - 1];
          const rollResult = lastRoll.textContent.trim();
          const initiative = parseInt(rollResult);
          if (characterName && !isNaN(initiative) && initiative >= 0 && initiative <= 50) {
            debug.log(`\u{1F3B2} Detected initiative roll (inline): ${characterName} = ${initiative}`);
            addCombatant(characterName, initiative, "chat");
            return;
          }
        }
      }
      const initiativePatterns = [
        // Pattern 1: "Name rolls Initiative Roll 21" or "Name: rolls Initiative 21"
        /^(.+?)(?::)?\s+rolls?\s+[Ii]nitiative.*?(\d+)/,
        // Pattern 2: "Name rolled 15 for initiative"
        /^(.+?)\s+rolled?\s+(?:a\s+)?(\d+)\s+for\s+[Ii]nitiative/,
        // Pattern 3: Generic "Name ... initiative ... 15" (case insensitive)
        /^(.+?).*?[Ii]nitiative.*?(\d+)/,
        // Pattern 4: "Name ... Init ... 15"
        /^(.+?).*?[Ii]nit.*?(\d+)/
      ];
      for (const pattern of initiativePatterns) {
        const match = text.match(pattern);
        if (match) {
          let name = match[1].trim();
          name = name.replace(/\s*:?\s*rolls?$/i, "").trim();
          const initiative = parseInt(match[2]);
          if (name && !isNaN(initiative) && initiative >= 0 && initiative <= 50) {
            debug.log(`\u{1F3B2} Detected initiative roll (text): ${name} = ${initiative}`);
            addCombatant(name, initiative, "chat");
            return;
          }
        }
      }
    }
    function checkForPlayerRoll(messageNode) {
      const text = messageNode.textContent || "";
      const ownAnnouncementPrefixes = ["\u{1F3AF}", "\u2694\uFE0F", "\u{1F451}", "\u{1F513}", "\u23F8\uFE0F", "\u25B6\uFE0F", "\u{1F4CB}"];
      const trimmedText = text.trim();
      for (const prefix of ownAnnouncementPrefixes) {
        if (trimmedText.includes(prefix)) {
          return;
        }
      }
      if (text.includes("created the character") || text.includes("Welcome to Roll20") || text.includes("has joined the game")) {
        return;
      }
      if (/\binitiative\b/i.test(text) || /\binit\b/i.test(text)) {
        debug.log("\u23ED\uFE0F Skipping initiative roll for player tracking");
        return;
      }
      const inlineRolls = messageNode.querySelectorAll(".inlinerollresult");
      if (inlineRolls.length === 0) {
        return;
      }
      let characterName = null;
      const rollTemplate = messageNode.querySelector('.sheet-rolltemplate-default, .sheet-rolltemplate-custom, [class*="rolltemplate"]');
      if (rollTemplate) {
        const caption = rollTemplate.querySelector('caption, .sheet-template-name, .charname, [class*="charname"]');
        if (caption) {
          const captionText = caption.textContent.trim();
          const nameMatch = captionText.match(/^(?:🔵|🔴|⚪|⚫|🟢|🟡|🟠|🟣|🟤)?\s*(.+?)\s*(?:rolls?\s+|\s*:\s*|$)/i);
          if (nameMatch) {
            characterName = nameMatch[1].trim();
          }
        }
      }
      if (!characterName) {
        const byElement = messageNode.querySelector(".by");
        if (byElement) {
          characterName = byElement.textContent.trim();
        }
      }
      if (!characterName) {
        const patterns = [
          /^(?:🔵|🔴|⚪|⚫|🟢|🟡|🟠|🟣|🟤)?\s*(.+?)\s*:/,
          /^(?:🔵|🔴|⚪|⚫|🟢|🟡|🟠|🟣|🟤)?\s*(.+?)\s+rolls?/i
        ];
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match) {
            characterName = match[1].trim();
            break;
          }
        }
      }
      if (characterName && characterName.length > 0) {
        const skipNames = ["gm", "dm", "roll20", "system", "the", "a ", "an "];
        const lowerName = characterName.toLowerCase();
        if (skipNames.some((skip) => lowerName === skip || lowerName.startsWith(skip + " "))) {
          return;
        }
        if (!playerData[characterName]) {
          debug.log(`\u{1F465} New player detected from roll: ${characterName}`);
          playerData[characterName] = {
            hp: null,
            // Will be updated when popup sends data
            maxHp: null,
            ac: null,
            passivePerception: null,
            initiative: null,
            conditions: [],
            concentration: null,
            deathSaves: null
          };
          updatePlayerOverviewDisplay();
          logTurnAction({
            action: "turn",
            description: `${characterName} detected in combat`
          });
        }
      }
    }
    window.rollcloudRegisterPopup = function(characterName, popupWindow) {
      if (characterName && popupWindow) {
        characterPopups[characterName] = popupWindow;
        debug.log(`\u2705 Registered popup for: ${characterName}`);
      }
    };
    function checkRecentChatForCurrentTurn(characterName, popupWindow) {
      try {
        let normalizeName = function(name) {
          return name.replace(/^(?:🔵|🔴|⚪|⚫|🟢|🟡|🟠|🟣|🟤)\s*/, "").replace(/^It's\s+/i, "").replace(/'s\s+turn.*$/i, "").trim();
        };
        const chatLog = document.getElementById("textchat");
        if (!chatLog) {
          debug.warn("\u26A0\uFE0F Roll20 chat not found for turn check");
          return;
        }
        const messages = chatLog.querySelectorAll(".message");
        const recentMessages = Array.from(messages).slice(-20);
        debug.log(`\u{1F50D} Checking recent ${recentMessages.length} messages for current turn of: ${characterName}`);
        const normalizedCharacterName = normalizeName(characterName);
        for (let i = recentMessages.length - 1; i >= 0; i--) {
          const message = recentMessages[i];
          const text = message.textContent || "";
          const turnMatch = text.match(/🎯 It's (.+?)'s turn! \(Initiative: (\d+)\)/);
          if (turnMatch) {
            const announcedCharacter = normalizeName(turnMatch[1]);
            const initiative = parseInt(turnMatch[2]);
            debug.log(`\u{1F50D} Found turn announcement: "${turnMatch[1]}" (normalized: "${announcedCharacter}") vs "${characterName}" (normalized: "${normalizedCharacterName}")`);
            if (announcedCharacter === normalizedCharacterName) {
              debug.log(`\u2705 It's ${characterName}'s turn! Activating action economy...`);
              popupWindow.postMessage({
                action: "activateTurn",
                combatant: characterName
              }, "*");
              return;
            } else {
              debug.log(`\u23F8\uFE0F It's ${turnMatch[1]}'s turn, not ${characterName}. Deactivating...`);
              popupWindow.postMessage({
                action: "deactivateTurn",
                combatant: characterName
              }, "*");
              return;
            }
          }
        }
        debug.log(`\u{1F50D} No recent turn announcement found for ${characterName}`);
      } catch (error) {
        debug.error("Error checking recent chat for current turn:", error);
      }
    }
    window.addEventListener("message", (event) => {
      debug.log("\u{1F4E8} Received message:", event.data);
      if (event.data && event.data.action === "toggleGMMode") {
        debug.log("\u{1F451} Processing toggleGMMode message:", event.data.enabled);
        toggleGMMode(event.data.enabled);
      } else if (event.data && event.data.action === "registerPopup") {
        if (event.data.characterName && event.source) {
          window.rollcloudRegisterPopup(event.data.characterName, event.source);
          debug.log(`\u2705 Registered popup via message for: ${event.data.characterName}`);
        }
      } else if (event.data && event.data.action === "postChatMessageFromPopup") {
        postChatMessage(event.data.message);
      } else if (event.data && event.data.action === "checkCurrentTurn") {
        if (event.data.characterName) {
          checkRecentChatForCurrentTurn(event.data.characterName, event.source);
        }
      } else if (event.data && event.data.action === "updatePlayerData") {
        if (event.data.characterName && event.data.data) {
          updatePlayerData(event.data.characterName, event.data.data);
        }
      } else if (event.data && event.data.action === "postToDiscordFromPopup") {
        if (event.data.payload) {
          browserAPI.runtime.sendMessage({
            action: "postToDiscord",
            payload: event.data.payload
          }).then((response) => {
            if (response && response.success) {
              debug.log(`\u{1F3AE} Discord: Forwarded action update from popup`);
            }
          }).catch((err) => {
            debug.log("Discord webhook not configured or failed:", err.message);
          });
        }
      }
    });
    browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "toggleGMMode") {
        toggleGMMode(request.enabled);
        sendResponse({ success: true });
      }
      if (request.action === "activeCharacterChanged") {
        debug.log("\u{1F504} Active character changed, re-initializing sync:", request.characterId);
        if (window.diceCloudSync && typeof window.diceCloudSync.initialize === "function") {
          debug.log("\u{1F504} Re-initializing DiceCloud sync with character:", request.characterId);
          window.diceCloudSync.initialize(request.characterId).then(() => {
            debug.log("\u2705 DiceCloud sync re-initialized successfully");
            sendResponse({ success: true });
          }).catch((error) => {
            debug.error("\u274C Failed to re-initialize DiceCloud sync:", error);
            sendResponse({ success: false, error: error.message });
          });
          return true;
        } else {
          debug.warn("\u26A0\uFE0F DiceCloud sync not available for re-initialization");
          sendResponse({ success: false, error: "Sync not available" });
        }
      }
    });
    function startCharacterSelectionMonitor() {
      debug.log("\u{1F50D} Starting character selection monitor...");
      let lastSelectedCharacter = null;
      function checkSelectedCharacter() {
        try {
          let selectedCharacter = null;
          const selectedTokens = document.querySelectorAll(".token.selected, .token.selected-token");
          if (selectedTokens.length > 0) {
            const token = selectedTokens[0];
            const tokenName = token.getAttribute("data-name") || token.getAttribute("title") || token.querySelector(".token-name")?.textContent || token.textContent;
            if (tokenName && tokenName.trim()) {
              selectedCharacter = tokenName.trim();
              debug.log(`\u{1F3AF} Detected selected token: ${selectedCharacter}`);
            }
          }
          if (!selectedCharacter) {
            const activeCharElement = document.querySelector(".character-item.active, .character.active, [data-character-id].active");
            if (activeCharElement) {
              selectedCharacter = activeCharElement.textContent?.trim() || activeCharElement.getAttribute("data-character-name");
              debug.log(`\u{1F3AF} Detected active character in UI: ${selectedCharacter}`);
            }
          }
          if (!selectedCharacter && typeof window !== "undefined" && window.Campaign) {
            try {
              const activeCharacter = window.Campaign.activeCharacter();
              if (activeCharacter && activeCharacter.attributes && activeCharacter.attributes.name) {
                selectedCharacter = activeCharacter.attributes.name;
                debug.log(`\u{1F3AF} Detected active character from Campaign: ${selectedCharacter}`);
              }
            } catch (e) {
            }
          }
          if (selectedCharacter && selectedCharacter !== lastSelectedCharacter) {
            debug.log(`\u2705 Character selection changed: "${lastSelectedCharacter}" \u2192 "${selectedCharacter}"`);
            lastSelectedCharacter = selectedCharacter;
            markCharacterAsActive(selectedCharacter);
          }
        } catch (error) {
          debug.warn("\u26A0\uFE0F Error checking selected character:", error);
        }
      }
      checkSelectedCharacter();
      const checkInterval = setInterval(checkSelectedCharacter, 2e3);
      document.addEventListener("click", () => {
        setTimeout(checkSelectedCharacter, 100);
      });
      window.addEventListener("beforeunload", () => {
        clearInterval(checkInterval);
      });
      debug.log("\u2705 Character selection monitor started");
    }
    async function markCharacterAsActive(characterName) {
      try {
        debug.log(`\u{1F3AF} Marking character as active: ${characterName}`);
        const result = await browserAPI.storage.local.get(["characterProfiles"]);
        const characterProfiles = result.characterProfiles || {};
        let characterId = null;
        for (const [id, profile] of Object.entries(characterProfiles)) {
          if (profile.name === characterName || profile.character_name === characterName) {
            characterId = id;
            break;
          }
        }
        if (characterId) {
          const response = await browserAPI.runtime.sendMessage({
            action: "setActiveCharacter",
            characterId
          });
          if (response && response.success) {
            debug.log(`\u2705 Successfully marked ${characterName} as active`);
          } else {
            debug.warn(`\u26A0\uFE0F Failed to mark ${characterName} as active:`, response);
          }
        } else {
          debug.warn(`\u26A0\uFE0F Could not find character ID for ${characterName} in local storage`);
        }
      } catch (error) {
        debug.error(`\u274C Error marking character as active:`, error);
      }
    }
    document.addEventListener("openGMMode", () => {
      debug.log("\u2705 Received openGMMode event - opening GM panel");
      try {
        postChatMessage("\u{1F451} Opening GM mode...");
      } catch (error) {
        debug.error(" Error posting chat message:", error);
      }
      toggleGMMode(true);
    });
    loadPlayerDataFromStorage();
    startCharacterSelectionMonitor();
    if (typeof browserAPI !== "undefined" && browserAPI.runtime) {
      browserAPI.runtime.sendMessage({ action: "getManifest" }).then((response) => {
        if (response && response.success && response.manifest) {
          debug.log("\u{1F50D} Manifest check:", response.manifest);
          debug.log("\u{1F50D} Manifest name:", response.manifest.name);
          if (response.manifest.name && response.manifest.name.toLowerCase().includes("experimental")) {
            debug.log("\u{1F9EA} Experimental build detected, initializing two-way sync...");
            setTimeout(() => {
              debug.log("\u{1F50D} Window objects check:", {
                DDPClient: typeof window.DDPClient,
                initializeDiceCloudSync: typeof window.initializeDiceCloudSync,
                DiceCloudSync: typeof window.DiceCloudSync
              });
              if (typeof window.initializeDiceCloudSync === "function") {
                debug.log("\u2705 Calling initializeDiceCloudSync function...");
                window.initializeDiceCloudSync();
                debug.log("\u2705 Experimental two-way sync initialized");
              } else {
                debug.warn("\u26A0\uFE0F DiceCloud sync initialization function not found");
                debug.warn("\u26A0\uFE0F Available window properties:", Object.keys(window).filter((key) => key.toLowerCase().includes("dicecloud") || key.toLowerCase().includes("sync")));
              }
            }, 500);
          } else {
            debug.log("\u{1F4E6} Standard build detected, skipping experimental sync");
          }
        } else {
          debug.log("\u{1F4E6} Could not get manifest info, assuming standard build");
        }
      }).catch((error) => {
        debug.log("\u{1F4E6} Standard build detected (error), skipping experimental sync:", error);
      });
    } else {
      debug.log("\u274C browserAPI.runtime not available");
    }
    debug.log(" Roll20 script ready - listening for roll announcements and GM mode");
  })();
})();
//# sourceMappingURL=roll20.js.map
