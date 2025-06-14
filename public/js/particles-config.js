const particlesConfig = {
  particles: {
    number: {
      value: 80,
      density: {
        enable: true,
        value_area: 800
      }
    },
    color: {
      value: ["#6e48aa", "#9d50bb", "#4776e6"]
    },
    shape: {
      type: "circle",
      stroke: {
        width: 0,
        color: "#000000"
      }
    },
    opacity: {
      value: 0.8,
      random: true,
      anim: {
        enable: true,
        speed: 1,
        opacity_min: 0.1,
        sync: false
      }
    },
    size: {
      value: 5,
      random: true,
      anim: {
        enable: true,
        speed: 2,
        size_min: 0.1,
        sync: false
      }
    },
    line_linked: {
      enable: false
    },
    move: {
      enable: true,
      speed: 6,
      direction: "none",
      random: true,
      straight: false,
      out_mode: "out",
      bounce: false,
      attract: {
        enable: true,
        rotateX: 600,
        rotateY: 1200
      }
    }
  },
  interactivity: {
    detect_on: "canvas",
    events: {
      onhover: {
        enable: false
      },
      onclick: {
        enable: false
      },
      resize: true
    }
  },
  retina_detect: true
};

// Enhanced particle loader with error handling
function loadParticles() {
  return new Promise((resolve, reject) => {
    if (window.particlesJS) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js';
    script.onload = () => {
      if (window.particlesJS) {
        resolve();
      } else {
        reject(new Error('Particles.js failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load particles.js script'));
    document.body.appendChild(script);
  });
}

// Improved particle trigger with cleanup and performance optimizations
function triggerParticles() {
  // Check if particles container already exists
  if (document.getElementById('particles-js')) {
    return;
  }

  const particlesDiv = document.createElement('div');
  particlesDiv.id = 'particles-js';
  particlesDiv.style.position = 'absolute';
  particlesDiv.style.width = '100%';
  particlesDiv.style.height = '100%';
  particlesDiv.style.top = '0';
  particlesDiv.style.left = '0';
  particlesDiv.style.zIndex = '100';
  particlesDiv.style.pointerEvents = 'none';
  
  const slotMachine = document.querySelector('.slot-machine');
  if (!slotMachine) {
    console.warn('Slot machine container not found');
    return;
  }

  slotMachine.appendChild(particlesDiv);

  loadParticles()
    .then(() => {
      if (window.particlesJS) {
        window.particlesJS('particles-js', particlesConfig);
        
        // Remove after 3 seconds
        setTimeout(() => {
          particlesDiv.remove();
        }, 3000);
      }
    })
    .catch(error => {
      console.error('Particles error:', error);
      particlesDiv.remove();
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    particlesConfig, 
    triggerParticles,
    loadParticles
  };
}