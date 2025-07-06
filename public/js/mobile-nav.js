class MobileNavigation {
  constructor() {
    this.navToggle = null;
    this.navMenu = null;
    this.isOpen = false;
    this.breakpoint = 768;
    this.debounceTimer = null;
    
    // Bind methods to preserve context
    this.handleToggleClick = this.handleToggleClick.bind(this);
    this.handleMenuClick = this.handleMenuClick.bind(this);
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    
    this.init();
  }

  init() {
    // Use more efficient DOM ready check
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup(), { once: true });
    } else {
      this.setup();
    }
  }

  setup() {
    this.cacheElements();
    
    if (!this.validateElements()) {
      return;
    }

    this.setupEventListeners();
    this.setActiveNavLink();
    this.setupAccessibility();
  }

  cacheElements() {
    this.navToggle = document.querySelector('.nav-toggle');
    this.navMenu = document.querySelector('.nav-menu');
    this.navLinks = document.querySelectorAll('.nav-link');
    this.body = document.body;
  }

  validateElements() {
    if (!this.navToggle || !this.navMenu) {
      console.warn('Mobile navigation: Required elements (.nav-toggle, .nav-menu) not found');
      return false;
    }
    return true;
  }

  setupEventListeners() {
    // Use bound methods for better performance
    this.navToggle.addEventListener('click', this.handleToggleClick);
    this.navMenu.addEventListener('click', this.handleMenuClick);
    document.addEventListener('click', this.handleOutsideClick);
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('keydown', this.handleKeydown);
  }

  setupAccessibility() {
    // Add ARIA attributes for better accessibility
    this.navToggle.setAttribute('aria-expanded', 'false');
    this.navToggle.setAttribute('aria-controls', 'nav-menu');
    this.navToggle.setAttribute('aria-label', 'Toggle navigation menu');
    
    if (!this.navMenu.id) {
      this.navMenu.id = 'nav-menu';
    }
    
    this.navMenu.setAttribute('aria-hidden', 'true');
  }

  handleToggleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    this.toggleMenu();
  }

  handleMenuClick(e) {
    // Close menu when clicking nav links or close button
    if (e.target.classList.contains('nav-link') || 
        e.target.classList.contains('nav-close') ||
        e.target.closest('.nav-close')) {
      this.closeMenu();
    }
  }

  handleOutsideClick(e) {
    if (this.isOpen && 
        !this.navMenu.contains(e.target) && 
        !this.navToggle.contains(e.target)) {
      this.closeMenu();
    }
  }

  handleResize() {
    // Debounce resize events for better performance
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if (window.innerWidth > this.breakpoint && this.isOpen) {
        this.closeMenu();
      }
    }, 150);
  }

  handleKeydown(e) {
    if (!this.isOpen) return;
    
    switch (e.key) {
      case 'Escape':
        this.closeMenu();
        this.navToggle.focus(); // Return focus to toggle button
        break;
      case 'Tab':
        this.handleTabNavigation(e);
        break;
    }
  }

  handleTabNavigation(e) {
    // Trap focus within the menu when open
    const focusableElements = this.navMenu.querySelectorAll(
      'a, button, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }

  toggleMenu() {
    if (this.isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    // Use requestAnimationFrame for smoother animations
    requestAnimationFrame(() => {
      this.navMenu.classList.add('open');
      this.navToggle.classList.add('active');
      this.isOpen = true;
      
      // Update ARIA attributes
      this.navToggle.setAttribute('aria-expanded', 'true');
      this.navMenu.setAttribute('aria-hidden', 'false');
      
      // Prevent body scroll with better method
      this.preventBodyScroll();
      
      // Focus first nav link for keyboard users
      const firstNavLink = this.navMenu.querySelector('.nav-link');
      if (firstNavLink) {
        firstNavLink.focus();
      }
      
      // Dispatch custom event
      this.dispatchEvent('menuOpened');
    });
  }

  closeMenu() {
    requestAnimationFrame(() => {
      this.navMenu.classList.remove('open');
      this.navToggle.classList.remove('active');
      this.isOpen = false;
      
      // Update ARIA attributes
      this.navToggle.setAttribute('aria-expanded', 'false');
      this.navMenu.setAttribute('aria-hidden', 'true');
      
      // Restore body scroll
      this.restoreBodyScroll();
      
      // Dispatch custom event
      this.dispatchEvent('menuClosed');
    });
  }

  preventBodyScroll() {
    // Store current scroll position
    this.scrollPosition = window.pageYOffset;
    
    // Apply styles to prevent scroll
    this.body.style.overflow = 'hidden';
    this.body.style.position = 'fixed';
    this.body.style.top = `-${this.scrollPosition}px`;
    this.body.style.width = '100%';
  }

  restoreBodyScroll() {
    // Restore body styles
    this.body.style.overflow = '';
    this.body.style.position = '';
    this.body.style.top = '';
    this.body.style.width = '';
    
    // Restore scroll position
    if (this.scrollPosition !== undefined) {
      window.scrollTo(0, this.scrollPosition);
    }
  }

  setActiveNavLink() {
    if (!this.navLinks.length) {
      this.navLinks = document.querySelectorAll('.nav-link');
    }
    
    const currentPath = window.location.pathname;
    
    this.navLinks.forEach(link => {
      link.classList.remove('active');
      link.setAttribute('aria-current', 'false');
      
      try {
        const linkPath = new URL(link.href, window.location.origin).pathname;
        
        if (this.isPathMatch(linkPath, currentPath)) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        }
      } catch (error) {
        console.warn('Invalid URL in navigation link:', link.href);
      }
    });
  }

  isPathMatch(linkPath, currentPath) {
    // Handle exact matches and root path
    if (linkPath === currentPath) return true;
    if (currentPath === '/' && linkPath === '/') return true;
    
    // Handle trailing slashes
    const normalizedLinkPath = linkPath.replace(/\/$/, '') || '/';
    const normalizedCurrentPath = currentPath.replace(/\/$/, '') || '/';
    
    return normalizedLinkPath === normalizedCurrentPath;
  }

  dispatchEvent(eventName) {
    const event = new CustomEvent(`mobileNav:${eventName}`, {
      detail: { isOpen: this.isOpen }
    });
    document.dispatchEvent(event);
  }

  // Public method to update active link (useful for SPA navigation)
  updateActiveLink() {
    this.setActiveNavLink();
  }

  // Public method to programmatically close menu
  close() {
    if (this.isOpen) {
      this.closeMenu();
    }
  }

  // Cleanup method for removing event listeners
  destroy() {
    this.navToggle?.removeEventListener('click', this.handleToggleClick);
    this.navMenu?.removeEventListener('click', this.handleMenuClick);
    document.removeEventListener('click', this.handleOutsideClick);
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('keydown', this.handleKeydown);
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // Restore body scroll if menu was open
    if (this.isOpen) {
      this.restoreBodyScroll();
    }
  }
}

// Initialize mobile navigation with error handling
let mobileNav;
try {
  mobileNav = new MobileNavigation();
} catch (error) {
  console.error('Failed to initialize mobile navigation:', error);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileNavigation;
}