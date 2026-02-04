/**
 * Character Portrait Module
 * 
 * Handles character portrait display with circular cropping
 * Exports to globalThis for use across all extensions
 */

(function() {
  'use strict';

  /**
   * Crop an image to a circle
   * @param {string} imageUrl - URL of the image to crop
   * @param {number} size - Size of the output image (default: 200)
   * @returns {Promise<string>} - Data URL of the cropped circular image
   */
  function cropToCircle(imageUrl, size = 200) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Handle CORS
      
      img.onload = () => {
        try {
          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          
          // Draw circular clip path
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          
          // Calculate scaling to cover the circle (crop to fit)
          const scale = Math.max(size / img.width, size / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          
          // Center the image
          const x = (size - scaledWidth) / 2;
          const y = (size - scaledHeight) / 2;
          
          // Draw image
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
          
          // Convert to data URL
          resolve(canvas.toDataURL('image/png'));
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = imageUrl;
    });
  }

  // Fallback debug object if not available
  const debug = window.debug || {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console)
  };

  /**
   * Display character portrait in the specified element
   * @param {string} elementId - ID of the img element to display portrait in
   * @param {object} characterData - Character data object
   * @param {number} size - Size of the portrait (default: 120)
   */
  async function displayCharacterPortrait(elementId, characterData, size = 120) {
    const portraitElement = document.getElementById(elementId);
    
    if (!portraitElement) {
      debug.warn(`⚠️ Portrait element not found: ${elementId}`);
      return;
    }
    
    if (!characterData) {
      debug.warn('⚠️ No character data provided for portrait');
      return;
    }
    
    // Try multiple possible portrait URL fields
    const portraitUrl = characterData.picture 
                     || characterData.avatarPicture 
                     || characterData.avatar
                     || characterData.image
                     || (characterData.rawDiceCloudData && characterData.rawDiceCloudData.creature && characterData.rawDiceCloudData.creature.picture)
                     || (characterData.raw && characterData.raw.creature && characterData.raw.creature.picture)
                     || (characterData.raw && characterData.raw.picture)
                     || (characterData.creature && characterData.creature.picture)
                     || null;
    
    if (!portraitUrl) {
      debug.log('ℹ️ No portrait URL found in character data');
      portraitElement.style.display = 'none';
      return;
    }
    
    debug.log('🖼️ Displaying portrait from URL:', portraitUrl);
    
    // Clear any existing content
    portraitElement.innerHTML = '';
    
    // Create img element
    const img = document.createElement('img');
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '50%';
    img.alt = `${characterData.name || 'Character'} portrait`;
    
    try {
      // Try to crop to circle if cropToCircle is available
      if (typeof cropToCircle === 'function') {
        const croppedUrl = await cropToCircle(portraitUrl, size);
        img.src = croppedUrl;
        portraitElement.appendChild(img);
        portraitElement.style.display = 'block';
        debug.log('✅ Portrait displayed (cropped)');
      } else {
        // Fallback: display directly without cropping
        img.src = portraitUrl;
        portraitElement.appendChild(img);
        portraitElement.style.display = 'block';
        debug.log('✅ Portrait displayed (uncropped)');
      }
    } catch (error) {
      debug.warn('⚠️ Failed to crop portrait:', error);
      // Fallback to original image
      img.src = portraitUrl;
      portraitElement.appendChild(img);
      portraitElement.style.display = 'block';
      debug.log('✅ Portrait displayed (uncropped fallback)');
    }
  }

  // Export to global scope
  globalThis.cropToCircle = cropToCircle;
  globalThis.displayCharacterPortrait = displayCharacterPortrait;

  debug.log('✅ Character Portrait module loaded');
})();
