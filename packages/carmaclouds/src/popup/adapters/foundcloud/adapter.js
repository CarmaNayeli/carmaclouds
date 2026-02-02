/**
 * FoundCloud Adapter
 * Foundry VTT integration for CarmaClouds
 * Currently under development
 */

export async function init(containerEl) {
  console.log('FoundCloud adapter - not yet implemented');

  // Show "not yet implemented" message
  containerEl.innerHTML = `
    <div style="padding: 40px 20px; text-align: center; color: #b0b0b0;">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#16a75a" stroke-width="2" style="margin-bottom: 20px; opacity: 0.5;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
      <h2 style="color: #e0e0e0; margin-bottom: 12px;">FoundCloud - Coming Soon</h2>
      <p style="margin-bottom: 20px; font-size: 14px; line-height: 1.6;">
        Foundry VTT integration is currently under development.
      </p>
      <p style="font-size: 13px; opacity: 0.7;">
        For now, use RollCloud or OwlCloud to sync your characters.
      </p>
    </div>
  `;
}
