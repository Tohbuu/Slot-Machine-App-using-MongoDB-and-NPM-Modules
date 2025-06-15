// public/js/theme-manager.js
class ThemeManager {
  constructor() {
    this.themeOptions = document.querySelectorAll('.theme-option');
    this.init();
  }

  init() {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'default';
    this.setTheme(savedTheme);
    
    // Add event listeners
    this.themeOptions.forEach(option => {
      option.addEventListener('click', () => {
        const theme = option.dataset.theme;
        this.setTheme(theme);
        this.saveTheme(theme);
      });
    });
  }

  setTheme(themeName) {
    document.body.className = `theme-${themeName}`;
    
    // Update active state
    this.themeOptions.forEach(option => {
      option.classList.toggle('active', option.dataset.theme === themeName);
    });
  }

  saveTheme(themeName) {
    localStorage.setItem('theme', themeName);
    // Send to server if user is logged in
    if (localStorage.getItem('token')) {
      fetch('/api/users/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ theme: themeName })
      });
    }
  }
}

// Initialize only if switcher exists
if (document.querySelector('.theme-switcher')) {
  document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
  });
}