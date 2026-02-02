/**
 * CarmaClouds Unified Popup
 * Tab-based interface with lazy loading for VTT adapters
 */

// Track loaded adapters
const loadedAdapters = {
  rollcloud: null,
  owlcloud: null,
  foundcloud: null
};

// Get saved settings
async function getSettings() {
  const result = await chrome.storage.local.get('carmaclouds_settings') || {};
  return result.carmaclouds_settings || {
    lastActiveTab: 'rollcloud',
    enabledVTTs: ['rollcloud', 'owlcloud', 'foundcloud']
  };
}

// Save settings
async function saveSettings(settings) {
  await chrome.storage.local.set({ carmaclouds_settings: settings });
}

// Show login required message
function showLoginRequired(contentEl, tabName) {
  const tabNames = {
    rollcloud: 'RollCloud',
    owlcloud: 'OwlCloud',
    foundcloud: 'FoundCloud'
  };

  contentEl.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; text-align: center;">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#16a75a" stroke-width="2" style="margin-bottom: 20px;">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
      <h2 style="color: #e0e0e0; margin: 0 0 10px 0; font-size: 20px;">DiceCloud Login Required</h2>
      <p style="color: #b0b0b0; margin: 0 0 20px 0; font-size: 14px; line-height: 1.5;">
        ${tabNames[tabName]} needs access to your DiceCloud account to sync characters.<br>
        Click the <strong style="color: #16a75a;">Login</strong> button in the header to get started.
      </p>
      <button
        id="open-auth-from-tab"
        style="background: #16a75a; color: #000; font-weight: 700; border: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; cursor: pointer; transition: background 0.2s ease;"
      >
        🔐 Open Login Modal
      </button>
    </div>
  `;

  // Add event listeners to the button
  const btn = contentEl.querySelector('#open-auth-from-tab');
  if (btn) {
    btn.addEventListener('click', openAuthModal);
    btn.addEventListener('mouseover', () => {
      btn.style.background = '#1bc76b';
    });
    btn.addEventListener('mouseout', () => {
      btn.style.background = '#16a75a';
    });
  }
}

// Switch to a tab
async function switchTab(tabName) {
  console.log(`Switching to ${tabName} tab`);

  // Update tab buttons
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Update tab panes
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `${tabName}-content`);
  });

  const contentEl = document.getElementById(`${tabName}-content`);

  // Check if user is authenticated
  const token = await getAuthToken();
  if (!token) {
    // Show login required message
    showLoginRequired(contentEl, tabName);
    // Clear the loaded adapter so it can be reloaded after login
    loadedAdapters[tabName] = null;
  } else {
    // Lazy load adapter if not already loaded
    if (!loadedAdapters[tabName]) {
      console.log(`Loading ${tabName} adapter for the first time...`);
      try {
        const module = await import(`./adapters/${tabName}/adapter.js`);
        loadedAdapters[tabName] = module;

        // Initialize the adapter
        if (module.init && typeof module.init === 'function') {
          await module.init(contentEl);
        }
      } catch (error) {
        console.error(`Failed to load ${tabName} adapter:`, error);
        contentEl.innerHTML = `
          <div class="error">
            <strong>Failed to load ${tabName}</strong>
            <p>${error.message}</p>
          </div>
        `;
      }
    }
  }

  // Save last active tab
  const settings = await getSettings();
  settings.lastActiveTab = tabName;
  await saveSettings(settings);
}

// Settings modal functions
function openSettingsModal() {
  const modal = document.getElementById('settings-modal');
  modal.classList.add('active');
}

function closeSettingsModal() {
  const modal = document.getElementById('settings-modal');
  modal.classList.remove('active');
}

// DiceCloud Auth modal functions
function openAuthModal() {
  const modal = document.getElementById('dicecloud-auth-modal');
  modal.classList.add('active');
  updateAuthView();
}

function closeAuthModal() {
  const modal = document.getElementById('dicecloud-auth-modal');
  modal.classList.remove('active');
}

// Get auth token from storage
async function getAuthToken() {
  const result = await chrome.storage.local.get('dicecloud_auth_token');
  return result?.dicecloud_auth_token || null;
}

// Save auth token to storage
async function saveAuthToken(token) {
  await chrome.storage.local.set({ dicecloud_auth_token: token });
  await updateAuthStatus();
  await updateAuthView();
  
  // Also sync to database if SupabaseTokenManager is available
  try {
    if (typeof SupabaseTokenManager !== 'undefined') {
      const supabaseManager = new SupabaseTokenManager();
      
      // Get user info for the token
      const result = await chrome.storage.local.get(['username', 'diceCloudUserId']);
      
      // Store token in database
      const dbResult = await supabaseManager.storeToken({
        token: token,
        userId: result.diceCloudUserId || result.username,
        expires: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString(), // 24 hours from now
        lastChecked: new Date().toISOString()
      });
      
      if (dbResult.success) {
        console.log('✅ Auth token synced to database');
      } else {
        console.log('⚠️ Failed to sync auth token to database:', dbResult.error);
      }
    }
  } catch (dbError) {
    console.log('⚠️ Database sync not available:', dbError);
    // Don't show error to user as this is non-critical
  }
  
  // Reload current tab to show adapter content
  await reloadCurrentTab();
}

// Clear auth token
async function clearAuthToken() {
  await chrome.storage.local.remove('dicecloud_auth_token');
  updateAuthStatus();
  updateAuthView();
  // Reload current tab to show login message
  await reloadCurrentTab();
}

// Reload the currently active tab
async function reloadCurrentTab() {
  const activeTab = document.querySelector('.tab-button.active');
  if (activeTab) {
    const tabName = activeTab.dataset.tab;
    // Clear the loaded adapter
    loadedAdapters[tabName] = null;
    // Reload the tab
    await switchTab(tabName);
  }
}

// Update auth status in header button
async function updateAuthStatus() {
  const token = await getAuthToken();
  const statusText = document.getElementById('auth-status-text');

  if (token) {
    statusText.textContent = 'Logged In';
    statusText.style.color = '#000000'; // Black text on green background
  } else {
    statusText.textContent = 'Login';
    statusText.style.color = 'white';
  }
}

// Update auth view in modal
async function updateAuthView() {
  const token = await getAuthToken();
  const loginView = document.getElementById('auth-login-view');
  const loggedInView = document.getElementById('auth-logged-in-view');

  if (token) {
    loginView.classList.add('hidden');
    loggedInView.classList.remove('hidden');
  } else {
    loginView.classList.remove('hidden');
    loggedInView.classList.add('hidden');
  }
}

// Auto-connect to DiceCloud
async function autoConnect() {
  const btn = document.getElementById('autoConnectBtn');
  const errorDiv = document.getElementById('loginError');

  try {
    btn.disabled = true;
    btn.textContent = '⏳ Checking...';
    errorDiv.classList.add('hidden');

    // Check if user has a DiceCloud tab open
    const tabs = await chrome.tabs.query({ url: '*://*.dicecloud.com/*' });

    if (!tabs || tabs.length === 0) {
      // No DiceCloud tab found
      errorDiv.innerHTML = '<div style="background: #0d4a30; color: #16a75a; padding: 12px; border-radius: 6px; border: 1px solid #16a75a;"><strong>Navigate to DiceCloud First</strong><br>Open <a href="https://dicecloud.com" target="_blank" style="color: #1bc76b; text-decoration: underline;">dicecloud.com</a> in a tab, log in, then click this button to connect.</div>';
      errorDiv.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = '🔐 Connect with DiceCloud';
      return;
    }

    // Try to inject a content script to get auth data from the page
    try {
      // Use different APIs for Chrome vs Firefox
      let results;
      
      if (typeof chrome !== 'undefined' && chrome.scripting) {
        // Chrome (Manifest V3) - use chrome.scripting
        results = await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            // Try to get auth data from localStorage, sessionStorage, or window object
            const authData = {
              localStorage: {},
              sessionStorage: {},
              meteor: null,
              authToken: null
            };
            
            // Check localStorage
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.includes('auth') || key.includes('token') || key.includes('meteor') || key.includes('login'))) {
                authData.localStorage[key] = localStorage.getItem(key);
              }
            }
            
            // Check sessionStorage
            for (let i = 0; i < sessionStorage.length; i++) {
              const key = sessionStorage.key(i);
              if (key && (key.includes('auth') || key.includes('token') || key.includes('meteor') || key.includes('login'))) {
                authData.sessionStorage[key] = sessionStorage.getItem(key);
              }
            }
            
            // Check for Meteor/MongoDB auth (common in DiceCloud)
            if (window.Meteor && window.Meteor.userId) {
              authData.meteor = {
                userId: window.Meteor.userId(),
                loginToken: window.Meteor._localStorage && window.Meteor._localStorage.getItem('Meteor.loginToken')
              };
            }
            
            // Check for any global auth variables
            if (window.authToken) authData.authToken = window.authToken;
            if (window.token) authData.authToken = window.token;
            
            return authData;
          }
        });
      } else if (typeof browser !== 'undefined' && browser.tabs) {
        // Firefox (Manifest V2) - use browser.tabs.executeScript
        results = await browser.tabs.executeScript(tabs[0].id, {
          code: `
            // Try to get auth data from localStorage, sessionStorage, or window object
            const authData = {
              localStorage: {},
              sessionStorage: {},
              meteor: null,
              authToken: null
            };
            
            // Check localStorage
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.includes('auth') || key.includes('token') || key.includes('meteor') || key.includes('login'))) {
                authData.localStorage[key] = localStorage.getItem(key);
              }
            }
            
            // Check sessionStorage
            for (let i = 0; i < sessionStorage.length; i++) {
              const key = sessionStorage.key(i);
              if (key && (key.includes('auth') || key.includes('token') || key.includes('meteor') || key.includes('login'))) {
                authData.sessionStorage[key] = sessionStorage.getItem(key);
              }
            }
            
            // Check for Meteor/MongoDB auth (common in DiceCloud)
            if (window.Meteor && window.Meteor.userId) {
              authData.meteor = {
                userId: window.Meteor.userId(),
                loginToken: window.Meteor._localStorage && window.Meteor._localStorage.getItem('Meteor.loginToken')
              };
            }
            
            // Check for any global auth variables
            if (window.authToken) authData.authToken = window.authToken;
            if (window.token) authData.authToken = window.token;
            
            authData;
          `
        });
      } else {
        throw new Error('No scripting API available');
      }
      
      const authData = results[0]?.result;
      console.log('Auth data from DiceCloud page:', authData);
      
      // Try to extract a token from the collected data
      let token = null;
      
      if (authData?.meteor?.loginToken) {
        token = authData.meteor.loginToken;
      } else if (authData?.authToken) {
        token = authData.authToken;
      } else {
        // Check localStorage for tokens
        for (const [key, value] of Object.entries(authData?.localStorage || {})) {
          if (value && value.length > 10) { // Assume tokens are longer than 10 chars
            token = value;
            break;
          }
        }
      }
      
      if (token) {
        await saveAuthToken(token);
        errorDiv.classList.add('hidden');
        closeAuthModal();
        return;
      }
      
    } catch (scriptError) {
      console.warn('Could not inject script:', scriptError);
    }

    // Fallback to cookie method if script injection fails
    const cookies = await chrome.cookies.getAll({ domain: '.dicecloud.com' });
    console.log('Available DiceCloud cookies:', cookies.map(c => ({ name: c.name, domain: c.domain, value: c.value ? '***' : 'empty' })));
    
    const authCookie = cookies.find(c => 
      c.name === 'dicecloud_auth' || 
      c.name === 'meteor_login_token' ||
      c.name === 'authToken' ||
      c.name === 'loginToken' ||
      c.name === 'userId' ||
      c.name === 'token' ||
      c.name.includes('auth') ||
      c.name.includes('token')
    );

    if (authCookie && authCookie.value) {
      await saveAuthToken(authCookie.value);
      errorDiv.classList.add('hidden');
      closeAuthModal();
    } else {
      const cookieNames = cookies.map(c => c.name).join(', ');
      const cookieCount = cookies.length;
      errorDiv.innerHTML = `<div style="color: #ff6b6b;">No login detected. Found ${cookieCount} cookies: ${cookieNames || 'none'}. Make sure you're logged in to DiceCloud in your open tab, then click the button again.</div>`;
      errorDiv.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = '🔐 Connect with DiceCloud';
    }

  } catch (error) {
    console.error('Auto-connect error:', error);
    errorDiv.innerHTML = `<div style="color: #ff6b6b;">Error: ${error.message}</div>`;
    errorDiv.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = '🔐 Connect with DiceCloud';
  }
}

// Manual login to DiceCloud
async function manualLogin(username, password) {
  const btn = document.getElementById('usernameLoginBtn');
  const errorDiv = document.getElementById('loginError');

  try {
    btn.disabled = true;
    btn.textContent = '⏳ Logging in...';
    errorDiv.classList.add('hidden');

    // Try multiple possible DiceCloud API endpoints
    const endpoints = [
      'https://dicecloud.com/api/login',
      'https://v2.dicecloud.com/api/login',
      'https://app.dicecloud.com/api/login',
      'https://dicecloud.com/login',
      'https://v2.dicecloud.com/login'
    ];

    let lastError = null;
    let success = false;

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying login endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
          mode: 'cors',
          credentials: 'omit'
        });

        console.log(`Response status: ${response.status}`);

        if (response.ok) {
          const data = await response.json();
          console.log(`Success with ${endpoint}:`, data);
          
          if (data.token || data.authToken || data.loginToken) {
            const token = data.token || data.authToken || data.loginToken;
            await saveAuthToken(token);
            errorDiv.classList.add('hidden');
            closeAuthModal();
            success = true;
            break;
          }
        } else {
          console.warn(`Failed with ${endpoint}: ${response.status} ${response.statusText}`);
        }
      } catch (endpointError) {
        console.warn(`Failed with ${endpoint}:`, endpointError.message);
        lastError = endpointError;
      }
    }

    if (!success) {
      throw new Error(`Login failed. Tried ${endpoints.length} endpoints. Last error: ${lastError?.message || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('Manual login error:', error);
    errorDiv.innerHTML = `<div style="color: #ff6b6b;">${error.message}</div>`;
    errorDiv.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = '🔐 Login to DiceCloud';
  }
}

// Logout
async function logout() {
  await clearAuthToken();
  closeAuthModal();
}

/**
 * Check and update auth token if available
 * This function validates the current auth token and updates the auth_tokens table if necessary
 */
async function checkAndUpdateAuthToken() {
  try {
    // Check if SupabaseTokenManager is available
    if (typeof SupabaseTokenManager === 'undefined') {
      console.log('⚠️ SupabaseTokenManager not available, skipping auth token check');
      return;
    }

    const supabaseManager = new SupabaseTokenManager();
    
    // Get current token from storage
    const result = await chrome.storage.local.get(['diceCloudToken', 'username', 'tokenExpires', 'diceCloudUserId', 'authId']);
    
    if (!result.diceCloudToken) {
      console.log('⚠️ No auth token found, skipping auth token check');
      return;
    }

    console.log('🔍 Checking auth token validity...');
    
    // Always try to sync the current token to database to ensure it's up to date
    try {
      const syncResult = await supabaseManager.storeToken({
        token: result.diceCloudToken,
        userId: result.diceCloudUserId || result.username,
        expires: result.tokenExpires || new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString(),
        lastChecked: new Date().toISOString()
      });
      
      if (syncResult.success) {
        console.log('✅ Auth token synced to database');
      } else {
        console.log('⚠️ Failed to sync auth token to database:', syncResult.error);
      }
    } catch (syncError) {
      console.log('⚠️ Database sync failed:', syncError);
    }
    
    // Check session validity
    const sessionCheck = await supabaseManager.checkSessionValidity();
    
    if (!sessionCheck.valid) {
      console.log('⚠️ Auth token session is invalid, attempting to refresh...');
      
      // Try to refresh the token
      const refreshResult = await supabaseManager.refreshToken();
      
      if (refreshResult.success) {
        console.log('✅ Auth token refreshed successfully');
        
        // Update local storage with new token
        await chrome.storage.local.set({
          diceCloudToken: refreshResult.token,
          tokenExpires: refreshResult.expires,
          diceCloudUserId: refreshResult.userId
        });
        
        // Sync the refreshed token to database
        try {
          await supabaseManager.storeToken({
            token: refreshResult.token,
            userId: refreshResult.userId,
            expires: refreshResult.expires,
            lastChecked: new Date().toISOString()
          });
          console.log('✅ Refreshed token synced to database');
        } catch (refreshSyncError) {
          console.log('⚠️ Failed to sync refreshed token:', refreshSyncError);
        }
        
        // Update auth status display
        await updateAuthStatus();
        
        showNotification('✅ Authentication refreshed', 'success');
      } else {
        console.log('❌ Failed to refresh auth token');
        showNotification('❌ Authentication expired. Please log in again.', 'error');
      }
    } else {
      console.log('✅ Auth token is valid and synced');
    }
  } catch (error) {
    console.error('❌ Error checking auth token:', error);
    // Don't show error to user as this is non-critical functionality
  }
}

// Initialize popup
async function init() {
  console.log('Initializing CarmaClouds popup...');

  // Get settings
  const settings = await getSettings();
  const lastTab = settings.lastActiveTab || 'rollcloud';

  // Set up tab click handlers
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // Set up settings button
  document.getElementById('settings-button').addEventListener('click', openSettingsModal);
  document.getElementById('close-settings').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeSettingsModal();
  });

  // Set up refresh button
  document.getElementById('refresh-button').addEventListener('click', async () => {
    // Get current active tab
    const activeTab = document.querySelector('.tab-button.active')?.dataset.tab;
    if (activeTab) {
      // Check and update auth token if available
      await checkAndUpdateAuthToken();
      
      // Clear the loaded adapter
      loadedAdapters[activeTab] = null;
      // Reload the current tab
      await switchTab(activeTab);
    }
  });

  // Close modal when clicking outside
  document.getElementById('settings-modal').addEventListener('click', (e) => {
    if (e.target.id === 'settings-modal') {
      closeSettingsModal();
    }
  });

  // Set up auth button and modal
  document.getElementById('dicecloud-auth-button').addEventListener('click', openAuthModal);
  document.getElementById('close-dicecloud-auth').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeAuthModal();
  });

  // Close auth modal when clicking outside
  document.getElementById('dicecloud-auth-modal').addEventListener('click', (e) => {
    if (e.target.id === 'dicecloud-auth-modal') {
      closeAuthModal();
    }
  });

  // Auto-connect button
  document.getElementById('autoConnectBtn').addEventListener('click', autoConnect);

  // Manual login form
  document.getElementById('usernameLoginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    manualLogin(username, password);
  });

  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // Check and update auth status
  await updateAuthStatus();

  // Set up external links
  document.getElementById('open-website').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://carmaclouds.vercel.app' });
  });

  document.getElementById('open-github').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/CarmaNayeli/carmaclouds' });
  });

  document.getElementById('open-issues').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/CarmaNayeli/carmaclouds/issues' });
  });

  document.getElementById('open-sponsor').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/sponsors/CarmaNayeli/' });
  });

  // Load the last active tab
  await switchTab(lastTab);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
