/**
 * Portrait Uploader
 * Handles cropping, bordering, and uploading character portraits to Supabase storage
 */

export class PortraitUploader {
  /**
   * Create a circular cropped portrait with colored border
   * @param {string} imageUrl - Original portrait URL
   * @param {string} borderColor - Hex color for border
   * @returns {Promise<Blob>} - Cropped and bordered image as blob
   */
  static async createCroppedPortrait(imageUrl, borderColor) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          // Create canvas for circular crop with border
          const size = 256; // Output size
          const borderWidth = 8; // Border thickness
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');

          // Calculate source dimensions (center crop to square)
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          // Draw circular clip path
          ctx.save();
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, (size / 2) - borderWidth, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();

          // Draw image
          ctx.drawImage(img, sx, sy, minDim, minDim, borderWidth, borderWidth, size - (borderWidth * 2), size - (borderWidth * 2));
          ctx.restore();

          // Draw colored border
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = borderWidth;
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, (size / 2) - (borderWidth / 2), 0, Math.PI * 2);
          ctx.stroke();

          // Convert to blob
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          }, 'image/png');
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }

  /**
   * Upload cropped portrait to Supabase storage
   * @param {Blob} imageBlob - Cropped portrait blob
   * @param {string} characterId - DiceCloud character ID
   * @param {string} characterName - Character name (for filename)
   * @returns {Promise<string>} - Public URL of uploaded image
   */
  static async uploadToSupabase(imageBlob, characterId, characterName) {
    const supabase = game.foundcloud?.supabaseClient;
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Create filename: character-name-characterId-timestamp.png
    const safeName = characterName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const timestamp = Date.now();
    const filename = `${safeName}-${characterId}-${timestamp}.png`;
    const filepath = `portraits/${filename}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('character-portraits')
      .upload(filepath, imageBlob, {
        contentType: 'image/png',
        upsert: false
      });

    if (error) {
      console.error('Failed to upload portrait:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('character-portraits')
      .getPublicUrl(filepath);

    return publicUrl;
  }

  /**
   * Update cropped portrait URL in database
   * @param {string} characterId - DiceCloud character ID
   * @param {string} croppedUrl - URL of cropped portrait
   */
  static async updateCroppedPortraitUrl(characterId, croppedUrl) {
    const supabase = game.foundcloud?.supabaseClient;
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await supabase
      .from('clouds_characters')
      .update({ cropped_portrait_url: croppedUrl })
      .eq('dicecloud_character_id', characterId);

    if (error) {
      console.error('Failed to update cropped portrait URL:', error);
      throw new Error(`Database update failed: ${error.message}`);
    }
  }

  /**
   * Generate and upload cropped portrait, then update database
   * @param {Actor} actor - Foundry actor
   * @param {string} borderColor - Hex color for border
   * @returns {Promise<string>} - Public URL of cropped portrait
   */
  static async processAndUploadPortrait(actor, borderColor) {
    try {
      const originalUrl = actor.img;
      const characterId = actor.getFlag('foundcloud', 'diceCloudId');

      if (!characterId) {
        throw new Error('Character missing DiceCloud ID');
      }

      // Create cropped portrait
      ui.notifications.info('Generating portrait...');
      const blob = await this.createCroppedPortrait(originalUrl, borderColor);

      // Upload to Supabase
      ui.notifications.info('Uploading portrait...');
      const publicUrl = await this.uploadToSupabase(blob, characterId, actor.name);

      // Update database
      await this.updateCroppedPortraitUrl(characterId, publicUrl);

      ui.notifications.success('Portrait updated successfully!');
      return publicUrl;
    } catch (error) {
      console.error('Failed to process portrait:', error);
      ui.notifications.error(`Failed to update portrait: ${error.message}`);
      throw error;
    }
  }
}
