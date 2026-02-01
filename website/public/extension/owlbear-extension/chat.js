// Initialize debug globally
if (typeof window !== "undefined" && !window.debug) { window.debug = { log: console.log, warn: console.warn, error: console.error, info: console.info, group: console.group, groupEnd: console.groupEnd, table: console.table, time: console.time, timeEnd: console.timeEnd, isEnabled: () => true }; }
const debug = window.debug;
// Supabase config will be set by browser.js
const SUPABASE_URL = typeof window !== "undefined" ? window.SUPABASE_URL : undefined;
const SUPABASE_ANON_KEY = typeof window !== "undefined" ? window.SUPABASE_ANON_KEY : undefined;
// SupabaseTokenManager will be set by browser.js
const SupabaseTokenManager = typeof window !== "undefined" ? window.SupabaseTokenManager : undefined;
(() => {
  // owlbear-extension/chat.js
  var currentCharacter = null;
  var isOwlbearReady = false;
  var currentPlayerId = null;
  var lastLoadedMessageId = null;
  var SUPABASE_URL = "https://luiesmfjdcmpywavvfqm.supabase.co";
  var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aWVzbWZqZGNtcHl3YXZ2ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODYxNDksImV4cCI6MjA4NTQ2MjE0OX0.oqjHFf2HhCLcanh0HVryoQH7iSV7E9dHHZJdYehxZ0U";
  var SUPABASE_HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Content-Type": "application/json"
  };
  var chatMessages = document.getElementById("chat-messages");
  var chatInput = document.getElementById("chat-input");
  var chatSendBtn = document.getElementById("chat-send-btn");
  var chatCloseBtn = document.getElementById("chat-close-btn");
  var characterNameEl = document.getElementById("character-name");
  OBR.onReady(async () => {
    isOwlbearReady = true;
    console.log("\u{1F989} Owlbear SDK ready in chat window");
    currentPlayerId = await OBR.player.getId();
    await checkForActiveCharacter();
    await loadChatHistory();
    OBR.room.onMetadataChange((metadata) => {
      const message = metadata["com.owlcloud.chat/latest-message"];
      if (message && message.timestamp) {
        handleCharacterSheetMessage(message);
      }
      const messages = metadata["com.owlcloud.chat/messages"];
      if (messages && Array.isArray(messages)) {
        loadNewMessages(messages);
      }
    });
    OBR.player.onChange(async (player2) => {
      const rollMode = player2.metadata?.["owlcloud.rollMode"];
      updateRollModeIndicator(rollMode || "normal");
    });
    const player = await OBR.player.getMetadata();
    updateRollModeIndicator(player["owlcloud.rollMode"] || "normal");
  });
  async function checkForActiveCharacter() {
    try {
      const playerId = await OBR.player.getId();
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/characters?owlbear_player_id=${encodeURIComponent(playerId)}&fields=essential`,
        { headers: SUPABASE_HEADERS }
      );
      if (!response.ok) {
        console.error("Failed to get character:", response.statusText);
        return;
      }
      const data = await response.json();
      if (data.success && data.character) {
        currentCharacter = data.character;
        characterNameEl.textContent = currentCharacter.name || "Unknown Character";
      }
    } catch (error) {
      console.error("Error checking for active character:", error);
    }
  }
  var lastProcessedTimestamp = 0;
  function handleCharacterSheetMessage(message) {
    if (message.timestamp <= lastProcessedTimestamp) {
      return;
    }
    lastProcessedTimestamp = message.timestamp;
    const characterName = message.character?.name || "Character";
    switch (message.type) {
      case "roll":
        if (message.data) {
          const { name, rolls, modifier, total } = message.data;
          const rollsText = rolls.join(" + ");
          const modText = modifier !== 0 ? ` ${modifier >= 0 ? "+" : ""}${modifier}` : "";
          const text = `\u{1F3B2} ${name}: ${rollsText}${modText} = <strong>${total}</strong>`;
          addChatMessageToMetadata(text, "roll", characterName);
        }
        break;
      case "action":
        if (message.data) {
          const { actionName, details } = message.data;
          addChatMessageToMetadata(`\u2694\uFE0F ${actionName} - ${details}`, "action", characterName);
        }
        break;
      case "spell":
        if (message.data) {
          const { spellName, level } = message.data;
          const levelText = level === 0 ? "Cantrip" : `Level ${level}`;
          addChatMessageToMetadata(`\u2728 ${spellName} (${levelText})`, "spell", characterName);
        }
        break;
      case "combat":
        if (message.data && message.data.text) {
          addChatMessageToMetadata(message.data.text, "combat", characterName);
        }
        break;
      default:
        console.warn("Unknown message type:", message.type);
    }
  }
  async function loadChatHistory() {
    try {
      const metadata = await OBR.room.getMetadata();
      const messages = metadata["com.owlcloud.chat/messages"];
      if (messages && Array.isArray(messages)) {
        messages.forEach((msg) => {
          displayChatMessage(msg.text, msg.type, msg.author, msg.timestamp, msg.details);
          lastLoadedMessageId = msg.id;
        });
        scrollChatToBottom();
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  }
  function loadNewMessages(messages) {
    if (!Array.isArray(messages))
      return;
    const newMessages = messages.filter(
      (msg) => !lastLoadedMessageId || msg.id > lastLoadedMessageId
    );
    newMessages.forEach((msg) => {
      displayChatMessage(msg.text, msg.type, msg.author, msg.timestamp, msg.details);
      lastLoadedMessageId = msg.id;
    });
    if (newMessages.length > 0) {
      scrollChatToBottom();
    }
  }
  function scrollChatToBottom() {
    setTimeout(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
  }
  function displayChatMessage(text, type = "system", author = null, timestamp = null, details = null) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${type}`;
    const now = timestamp ? new Date(timestamp) : /* @__PURE__ */ new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    let messageHTML = "";
    if (author) {
      messageHTML = `
      <div class="chat-message-header">
        <span class="chat-message-author">${author}</span>
        <span class="chat-message-time">${timeStr}</span>
      </div>
      <div class="chat-message-text">${text}</div>
    `;
    } else {
      messageHTML = `<div class="chat-message-text">${text}</div>`;
    }
    if (details) {
      const detailsHTML = typeof details === "string" ? details : JSON.stringify(details, null, 2);
      messageHTML += `
      <div class="chat-message-details" style="display: none; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(138, 92, 246, 0.2); font-size: 12px; color: #aaa;">
        ${detailsHTML}
      </div>
    `;
      messageDiv.style.cursor = "pointer";
      messageDiv.title = "Click to expand details";
      messageDiv.onclick = function() {
        const detailsEl = this.querySelector(".chat-message-details");
        if (detailsEl) {
          const isHidden = detailsEl.style.display === "none";
          detailsEl.style.display = isHidden ? "block" : "none";
          this.title = isHidden ? "Click to collapse" : "Click to expand details";
        }
      };
    }
    messageDiv.innerHTML = messageHTML;
    chatMessages.appendChild(messageDiv);
    const messages = chatMessages.querySelectorAll(".chat-message");
    if (messages.length > 100) {
      messages[0].remove();
    }
  }
  async function addChatMessageToMetadata(text, type = "system", author = null) {
    if (!isOwlbearReady)
      return;
    try {
      const metadata = await OBR.room.getMetadata();
      const messages = metadata["com.owlcloud.chat/messages"] || [];
      const newMessage = {
        id: Date.now() + Math.random(),
        // Unique ID
        text,
        type,
        author,
        playerId: currentPlayerId,
        timestamp: Date.now()
      };
      const updatedMessages = [...messages, newMessage].slice(-100);
      await OBR.room.setMetadata({
        "com.owlcloud.chat/messages": updatedMessages
      });
    } catch (error) {
      console.error("Error adding message to metadata:", error);
    }
  }
  async function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text)
      return;
    const characterName = currentCharacter?.name || "You";
    await addChatMessageToMetadata(text, "user", characterName);
    chatInput.value = "";
  }
  chatSendBtn.addEventListener("click", sendChatMessage);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendChatMessage();
    }
  });
  chatCloseBtn.addEventListener("click", async () => {
    if (isOwlbearReady) {
      try {
        await OBR.popover.close("com.owlcloud.chat");
      } catch (error) {
        console.error("Error closing chat:", error);
      }
    }
  });
  window.owlcloudChat = {
    addMessage: addChatMessageToMetadata,
    announceRoll: async (rollName, formula, result) => {
      const characterName = currentCharacter?.name || "Character";
      const text = `\u{1F3B2} ${rollName}: ${formula} = <strong>${result}</strong>`;
      await addChatMessageToMetadata(text, "roll", characterName);
    },
    announceAction: async (actionName, details = "") => {
      const characterName = currentCharacter?.name || "Character";
      const text = details ? `\u2694\uFE0F ${actionName} - ${details}` : `\u2694\uFE0F ${actionName}`;
      await addChatMessageToMetadata(text, "action", characterName);
    },
    announceSpell: async (spellName, level, details = "") => {
      const characterName = currentCharacter?.name || "Character";
      const levelText = level === 0 ? "Cantrip" : `Level ${level}`;
      const text = details ? `\u2728 ${spellName} (${levelText}) - ${details}` : `\u2728 ${spellName} (${levelText})`;
      await addChatMessageToMetadata(text, "spell", characterName);
    },
    announceCombat: async (text) => {
      const characterName = currentCharacter?.name || "Character";
      await addChatMessageToMetadata(text, "combat", characterName);
    }
  };
  function updateRollModeIndicator(mode) {
    const indicator = document.getElementById("roll-mode-indicator");
    if (!indicator)
      return;
    indicator.classList.remove("advantage", "disadvantage");
    if (mode === "advantage") {
      indicator.classList.add("advantage");
      indicator.textContent = "ADV";
    } else if (mode === "disadvantage") {
      indicator.classList.add("disadvantage");
      indicator.textContent = "DIS";
    } else {
      indicator.textContent = "";
    }
  }
  console.log("\u{1F4AC} Chat window initialized");
})();
//# sourceMappingURL=chat.js.map
