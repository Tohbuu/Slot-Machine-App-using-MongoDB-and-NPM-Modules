class MobileNavigation {
  constructor() {
    this.navToggle = null;
    this.navMenu = null;
    this.isOpen = false;
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.navToggle = document.querySelector('.nav-toggle');
    this.navMenu = document.querySelector('.nav-menu');
    
    if (!this.navToggle || !this.navMenu) {
      console.warn('Mobile navigation elements not found');
      return;
    }

    this.setupEventListeners();
    this.setActiveNavLink();
  }

  setupEventListeners() {
    // Toggle menu on button click
    this.navToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleMenu();
    });

    // Close menu when clicking nav links
    this.navMenu.addEventListener('click', (e) => {
      if (e.target.classList.contains('nav-link')) {
        this.closeMenu();
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.navMenu.contains(e.target) && !this.navToggle.contains(e.target)) {
        this.closeMenu();
      }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && this.isOpen) {
        this.closeMenu();
      }
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeMenu();
      }
    });
  }

  toggleMenu() {
    if (this.isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    this.navMenu.classList.add('open');
    this.navToggle.classList.add('active');
    this.isOpen = true;
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = 'hidden';
  }

  closeMenu() {
    this.navMenu.classList.remove('open');
    this.navToggle.classList.remove('active');
    this.isOpen = false;
    
    // Restore body scroll
    document.body.style.overflow = '';
  }

  setActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      
      // Check if link href matches current path
      const linkPath = new URL(link.href).pathname;
      if (linkPath === currentPath || (currentPath === '/' && linkPath === '/')) {
        link.classList.add('active');
      }
    });
  }
}

// Initialize mobile navigation
const mobileNav = new MobileNavigation();