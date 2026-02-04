/**
 * Sheet Builder Module
 * Builds and populates the character sheet UI
 */

// Make buildSheet available globally
window.buildSheet = function(characterData) {
  if (!characterData) {
    console.warn('⚠️ No character data provided to buildSheet');
    return;
  }

  console.log('🎨 Building character sheet for:', characterData.name);
  console.log('📊 Character data:', characterData);

  // Update character name (without Local/Cloud badge)
  const nameElement = document.getElementById('char-name');
  console.log('📝 Name element:', nameElement);
  if (nameElement) {
    nameElement.textContent = characterData.name || 'Unknown Character';
    console.log('✅ Set name to:', nameElement.textContent);
  } else {
    console.warn('⚠️ Could not find char-name element');
  }

  // Update character portrait
  const portraitElement = document.getElementById('char-portrait');
  console.log('🖼️ Portrait element:', portraitElement);
  console.log('🖼️ Portrait URL from data:', characterData.picture, characterData.avatarPicture);
  
  if (portraitElement && characterData) {
    const portraitUrl = characterData.picture || characterData.avatarPicture;
    if (portraitUrl) {
      console.log('🖼️ Using portrait URL:', portraitUrl);
      // Use the cropToCircle function if available
      if (typeof cropToCircle === 'function') {
        console.log('✂️ cropToCircle function available, cropping...');
        cropToCircle(portraitUrl, 120).then(croppedUrl => {
          portraitElement.src = croppedUrl;
          portraitElement.style.display = 'block';
          console.log('✅ Portrait cropped and displayed');
        }).catch(err => {
          console.warn('⚠️ Failed to crop portrait:', err);
          // Fallback to original image
          portraitElement.src = portraitUrl;
          portraitElement.style.display = 'block';
          console.log('✅ Portrait displayed (uncropped fallback)');
        });
      } else {
        console.log('ℹ️ cropToCircle not available, displaying directly');
        // Direct display if cropToCircle not available
        portraitElement.src = portraitUrl;
        portraitElement.style.display = 'block';
        console.log('✅ Portrait displayed directly');
      }
    } else {
      console.log('ℹ️ No portrait URL found, hiding portrait element');
      portraitElement.style.display = 'none';
    }
  } else {
    if (!portraitElement) console.warn('⚠️ Could not find char-portrait element');
  }

  // Update class
  const classElement = document.getElementById('char-class');
  if (classElement) {
    classElement.textContent = characterData.classes || characterData.class || 'Unknown';
  }

  // Update level
  const levelElement = document.getElementById('char-level');
  if (levelElement) {
    levelElement.textContent = characterData.level || 1;
  }

  // Update race
  const raceElement = document.getElementById('char-race');
  if (raceElement) {
    raceElement.textContent = characterData.race || 'Unknown';
  }

  // Update hit dice
  const hitDiceElement = document.getElementById('char-hit-dice');
  if (hitDiceElement) {
    const current = characterData.hitDiceUsed || 0;
    const max = characterData.level || 1;
    const type = characterData.hitDiceType || 'd8';
    hitDiceElement.textContent = `${max - current}/${max} ${type}`;
  }

  // Update AC
  const acElement = document.getElementById('char-ac');
  if (acElement) {
    acElement.textContent = characterData.armorClass || characterData.ac || 10;
  }

  // Update speed
  const speedElement = document.getElementById('char-speed');
  if (speedElement) {
    speedElement.textContent = `${characterData.speed || 30} ft`;
  }

  // Update proficiency
  const profElement = document.getElementById('char-proficiency');
  if (profElement) {
    profElement.textContent = `+${characterData.proficiencyBonus || 2}`;
  }

  // Update death saves
  const deathSavesElement = document.getElementById('char-death-saves');
  if (deathSavesElement && characterData.deathSaves) {
    const successes = characterData.deathSaves.successes || 0;
    const failures = characterData.deathSaves.failures || 0;
    deathSavesElement.innerHTML = `<span style="color: var(--accent-success);">✓${successes}</span> / <span style="color: var(--accent-danger);">✗${failures}</span>`;
  }

  // Update inspiration
  const inspirationElement = document.getElementById('char-inspiration');
  if (inspirationElement) {
    inspirationElement.textContent = characterData.inspiration ? '★ Yes' : '☆ None';
  }

  // Update HP
  const hpElement = document.getElementById('char-hp');
  if (hpElement && characterData.hitPoints) {
    const current = characterData.hitPoints.current || 0;
    const max = characterData.hitPoints.max || 0;
    const temp = characterData.temporaryHP || 0;
    hpElement.innerHTML = `${current} / ${max}${temp > 0 ? `<br><small>+${temp} temp</small>` : ''}`;
  }

  // Update initiative
  const initiativeElement = document.getElementById('char-initiative');
  if (initiativeElement) {
    const init = characterData.initiative || characterData.initiativeBonus || 0;
    initiativeElement.textContent = init >= 0 ? `+${init}` : `${init}`;
  }

  console.log('✅ Character sheet built successfully');
};

// Export for use in other modules
if (typeof globalThis !== 'undefined') {
  globalThis.buildSheet = window.buildSheet;
}
