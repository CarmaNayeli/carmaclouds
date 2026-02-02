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
  function applyThemeFromSheet() {
    try {
      const currentTheme = localStorage.getItem("owlcloud-theme");
      if (!currentTheme)
        return;
      const themes = {
        purple: {
          primary: "#8B5CF6",
          primaryLight: "#A78BFA",
          primaryLighter: "#C4B5FD",
          gradient: "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)",
          bgPrimary: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          bgSecondary: "rgba(26, 26, 46, 0.8)",
          bgAccent: "rgba(139, 92, 246, 0.15)",
          bgCard: "rgba(139, 92, 246, 0.1)",
          bgHover: "rgba(139, 92, 246, 0.2)",
          textPrimary: "#e0e0e0",
          textSecondary: "#c0c0c0",
          textMuted: "#9ca3af",
          textOnPrimary: "#ffffff",
          textOnLight: "#1f2937"
        },
        blue: {
          primary: "#3B82F6",
          primaryLight: "#60A5FA",
          primaryLighter: "#93C5FD",
          gradient: "linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)",
          bgPrimary: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
          bgSecondary: "rgba(15, 23, 42, 0.8)",
          bgAccent: "rgba(59, 130, 246, 0.15)",
          bgCard: "rgba(59, 130, 246, 0.1)",
          bgHover: "rgba(59, 130, 246, 0.2)",
          textPrimary: "#e0e0e0",
          textSecondary: "#c0c0c0",
          textMuted: "#9ca3af",
          textOnPrimary: "#ffffff",
          textOnLight: "#1f2937"
        },
        green: {
          primary: "#10B981",
          primaryLight: "#34D399",
          primaryLighter: "#6EE7B7",
          gradient: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
          bgPrimary: "linear-gradient(135deg, #052e16 0%, #0a4d2a 50%, #0f6b3e 100%)",
          bgSecondary: "rgba(5, 46, 22, 0.8)",
          bgAccent: "rgba(16, 185, 129, 0.15)",
          bgCard: "rgba(16, 185, 129, 0.1)",
          bgHover: "rgba(16, 185, 129, 0.2)",
          textPrimary: "#e0e0e0",
          textSecondary: "#c0c0c0",
          textMuted: "#9ca3af",
          textOnPrimary: "#ffffff",
          textOnLight: "#1f2937"
        },
        red: {
          primary: "#EF4444",
          primaryLight: "#F87171",
          primaryLighter: "#FCA5A5",
          gradient: "linear-gradient(135deg, #EF4444 0%, #F87171 100%)",
          bgPrimary: "linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #991b1b 100%)",
          bgSecondary: "rgba(69, 10, 10, 0.8)",
          bgAccent: "rgba(239, 68, 68, 0.15)",
          bgCard: "rgba(239, 68, 68, 0.1)",
          bgHover: "rgba(239, 68, 68, 0.2)",
          textPrimary: "#e0e0e0",
          textSecondary: "#c0c0c0",
          textMuted: "#9ca3af",
          textOnPrimary: "#ffffff",
          textOnLight: "#1f2937"
        },
        orange: {
          primary: "#F97316",
          primaryLight: "#FB923C",
          primaryLighter: "#FDBA74",
          gradient: "linear-gradient(135deg, #F97316 0%, #FB923C 100%)",
          bgPrimary: "linear-gradient(135deg, #431407 0%, #7c2d12 50%, #9a3412 100%)",
          bgSecondary: "rgba(67, 20, 7, 0.8)",
          bgAccent: "rgba(249, 115, 22, 0.15)",
          bgCard: "rgba(249, 115, 22, 0.1)",
          bgHover: "rgba(249, 115, 22, 0.2)",
          textPrimary: "#e0e0e0",
          textSecondary: "#c0c0c0",
          textMuted: "#9ca3af",
          textOnPrimary: "#ffffff",
          textOnLight: "#1f2937"
        },
        yellow: {
          primary: "#EAB308",
          primaryLight: "#FACC15",
          primaryLighter: "#FDE047",
          gradient: "linear-gradient(135deg, #EAB308 0%, #FACC15 100%)",
          bgPrimary: "linear-gradient(135deg, #422006 0%, #713f12 50%, #854d0e 100%)",
          bgSecondary: "rgba(66, 34, 6, 0.8)",
          bgAccent: "rgba(234, 179, 8, 0.15)",
          bgCard: "rgba(234, 179, 8, 0.1)",
          bgHover: "rgba(234, 179, 8, 0.2)",
          textPrimary: "#1f2937",
          textSecondary: "#374151",
          textMuted: "#6b7280",
          textOnPrimary: "#ffffff",
          textOnLight: "#1f2937"
        },
        pink: {
          primary: "#EC4899",
          primaryLight: "#F472B6",
          primaryLighter: "#F9A8D4",
          gradient: "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)",
          bgPrimary: "linear-gradient(135deg, #500724 0%, #831843 50%, #9f1239 100%)",
          bgSecondary: "rgba(80, 7, 36, 0.8)",
          bgAccent: "rgba(236, 72, 153, 0.15)",
          bgCard: "rgba(236, 72, 153, 0.1)",
          bgHover: "rgba(236, 72, 153, 0.2)",
          textPrimary: "#e0e0e0",
          textSecondary: "#c0c0c0",
          textMuted: "#9ca3af",
          textOnPrimary: "#ffffff",
          textOnLight: "#1f2937"
        },
        brown: {
          primary: "#92400E",
          primaryLight: "#B45309",
          primaryLighter: "#D97706",
          gradient: "linear-gradient(135deg, #92400E 0%, #B45309 100%)",
          bgPrimary: "linear-gradient(135deg, #1c0f0a 0%, #442c1e 50%, #5c341e 100%)",
          bgSecondary: "rgba(28, 15, 10, 0.8)",
          bgAccent: "rgba(146, 64, 14, 0.15)",
          bgCard: "rgba(146, 64, 14, 0.1)",
          bgHover: "rgba(146, 64, 14, 0.2)",
          textPrimary: "#e0e0e0",
          textSecondary: "#c0c0c0",
          textMuted: "#9ca3af",
          textOnPrimary: "#ffffff",
          textOnLight: "#1f2937"
        },
        grey: {
          primary: "#6B7280",
          primaryLight: "#9CA3AF",
          primaryLighter: "#D1D5DB",
          gradient: "linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)",
          bgPrimary: "linear-gradient(135deg, #1f2937 0%, #374151 50%, #4b5563 100%)",
          bgSecondary: "rgba(31, 41, 55, 0.8)",
          bgAccent: "rgba(107, 114, 128, 0.15)",
          bgCard: "rgba(107, 114, 128, 0.1)",
          bgHover: "rgba(107, 114, 128, 0.2)",
          textPrimary: "#e0e0e0",
          textSecondary: "#c0c0c0",
          textMuted: "#9ca3af",
          textOnPrimary: "#ffffff",
          textOnLight: "#1f2937"
        },
        black: {
          primary: "#1F2937",
          primaryLight: "#374151",
          primaryLighter: "#4B5563",
          gradient: "linear-gradient(135deg, #1F2937 0%, #374151 100%)",
          bgPrimary: "linear-gradient(135deg, #000000 0%, #111827 50%, #1f2937 100%)",
          bgSecondary: "rgba(0, 0, 0, 0.8)",
          bgAccent: "rgba(31, 41, 55, 0.15)",
          bgCard: "rgba(31, 41, 55, 0.1)",
          bgHover: "rgba(31, 41, 55, 0.2)",
          textPrimary: "#ffffff",
          textSecondary: "#e5e7eb",
          textMuted: "#9ca3af",
          textOnPrimary: "#ffffff",
          textOnLight: "#1f2937"
        },
        white: {
          primary: "#F9FAFB",
          primaryLight: "#F3F4F6",
          primaryLighter: "#E5E7EB",
          gradient: "linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)",
          bgPrimary: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)",
          bgSecondary: "rgba(248, 250, 252, 0.9)",
          bgAccent: "rgba(249, 250, 251, 0.5)",
          bgCard: "rgba(249, 250, 251, 0.8)",
          bgHover: "rgba(241, 245, 249, 0.9)",
          textPrimary: "#1f2937",
          textSecondary: "#374151",
          textMuted: "#6b7280",
          textOnPrimary: "#ffffff",
          textOnLight: "#1f2937"
        }
      };
      const theme = themes[currentTheme];
      if (!theme)
        return;
      const root = document.documentElement;
      root.style.setProperty("--theme-primary", theme.primary);
      root.style.setProperty("--theme-primary-light", theme.primaryLight);
      root.style.setProperty("--theme-primary-lighter", theme.primaryLighter);
      root.style.setProperty("--theme-gradient", theme.gradient);
      root.style.setProperty("--theme-bg-primary", theme.bgPrimary);
      root.style.setProperty("--theme-bg-secondary", theme.bgSecondary);
      root.style.setProperty("--theme-bg-accent", theme.bgAccent);
      root.style.setProperty("--theme-bg-card", theme.bgCard);
      root.style.setProperty("--theme-bg-hover", theme.bgHover);
      root.style.setProperty("--theme-text-primary", theme.textPrimary);
      root.style.setProperty("--theme-text-secondary", theme.textSecondary);
      root.style.setProperty("--theme-text-muted", theme.textMuted);
      root.style.setProperty("--theme-text-on-primary", theme.textOnPrimary);
      root.style.setProperty("--theme-text-on-light", theme.textOnLight);
      document.body.style.background = theme.bgPrimary;
      document.body.style.color = theme.textPrimary;
      console.log(`\u{1F3A8} Chat applied theme: ${currentTheme}`);
    } catch (error) {
      console.error("Failed to apply theme to chat:", error);
    }
  }
  function setupThemeListener() {
    window.addEventListener("storage", (e) => {
      if (e.key === "owlcloud-theme") {
        applyThemeFromSheet();
      }
    });
    setInterval(() => {
      applyThemeFromSheet();
    }, 1e3);
  }
  var chatMessages = document.getElementById("chat-messages");
  var chatInput = document.getElementById("chat-input");
  var chatSendBtn = document.getElementById("chat-send-btn");
  var chatCloseBtn = document.getElementById("chat-close-btn");
  var characterNameEl = document.getElementById("character-name");
  OBR.onReady(async () => {
    isOwlbearReady = true;
    console.log("\u{1F989} Owlbear SDK ready in chat window");
    setupThemeListener();
    applyThemeFromSheet();
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
        characterNameEl.textContent = currentCharacter.character_name || "Unknown Character";
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
          displayChatMessage(msg.text, msg.type, msg.author, msg.timestamp, msg.details, msg.themeColor);
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
      displayChatMessage(msg.text, msg.type, msg.author, msg.timestamp, msg.details, msg.themeColor);
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
  function displayChatMessage(text, type = "system", author = null, timestamp = null, details = null, themeColor = null) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${type}`;
    const now = timestamp ? new Date(timestamp) : /* @__PURE__ */ new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    let messageHTML = "";
    if (author) {
      const authorStyle = themeColor ? `style="color: ${themeColor}"` : "";
      messageHTML = `
      <div class="chat-message-header">
        <span class="chat-message-author" ${authorStyle}>${author}</span>
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
      <div class="chat-message-details" style="display: none; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--theme-border); font-size: 12px; color: var(--theme-text-muted);">
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
    scrollChatToBottom();
  }
  async function addChatMessageToMetadata(text, type = "system", author = null) {
    if (!isOwlbearReady)
      return;
    try {
      const metadata = await OBR.room.getMetadata();
      const messages = metadata["com.owlcloud.chat/messages"] || [];
      const plainText = text.replace(/<[^>]*>/g, "");
      const truncatedText = plainText.length > 500 ? plainText.substring(0, 497) + "..." : plainText;
      const currentTheme = localStorage.getItem("owlcloud-theme") || "purple";
      const themeColors = {
        purple: "#8B5CF6",
        blue: "#3B82F6",
        green: "#10B981",
        red: "#EF4444",
        orange: "#F97316",
        yellow: "#EAB308",
        pink: "#EC4899",
        brown: "#92400E",
        grey: "#6B7280",
        black: "#1F2937",
        white: "#F9FAFB"
      };
      const themeColor = themeColors[currentTheme] || themeColors.purple;
      const newMessage = {
        id: Date.now() + Math.random(),
        // Unique ID
        text: truncatedText,
        type,
        author,
        playerId: currentPlayerId,
        timestamp: Date.now(),
        themeColor
        // Add theme color to message
      };
      const thirtyMinutesAgo = Date.now() - 30 * 60 * 1e3;
      const recentMessages = messages.filter((msg) => msg.timestamp > thirtyMinutesAgo);
      const updatedMessages = [...recentMessages, newMessage].slice(-10);
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
