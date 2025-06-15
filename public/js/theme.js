export function applySavedTheme() {
  const savedTheme = localStorage.getItem('theme') || 'default';
  document.body.className = document.body.className.replace(/\btheme-\S+/g, '');
  document.body.classList.add(`theme-${savedTheme}`);
  document.body.style.backgroundColor = getComputedStyle(document.body).getPropertyValue('--background');
}

// Call on DOMContentLoaded for every page
document.addEventListener('DOMContentLoaded', applySavedTheme);

// Example in profile.js or theme-manager.js
function onThemeChange(theme) {
  localStorage.setItem('theme', theme);
  applySavedTheme();
  // Optionally, update server/user profile as well
}