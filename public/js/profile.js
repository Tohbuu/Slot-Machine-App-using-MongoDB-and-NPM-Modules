document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.profile-form')) {
    loadProfile();
    setupProfileForm();
    setupThemeSelector();
    setupAvatarUpload();
  }
  updateHeaderUserInfo();
  applySavedTheme(); // Apply theme on load
});

// Fetch user profile
async function fetchProfile() {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/users/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return;
  const user = await res.json();
  updateProfileDisplay(user);
}

// Update profile
async function updateProfile(data) {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/users', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  if (result.success) {
    showMessage('Profile updated successfully!', true);
    updateProfileDisplay(result.user);
  } else {
    showMessage(result.message || 'Update failed', false);
  }
}

// Update theme (save to server and localStorage, apply globally)
async function updateTheme(theme) {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/users/theme', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ theme })
  });
  const result = await res.json();
  if (result.success) {
    // Save to localStorage and apply globally
    localStorage.setItem('theme', theme);
    applyTheme(theme);
    // Update active theme indicator
    document.querySelectorAll('.theme-option').forEach(option => {
      option.classList.remove('active');
    });
    document.querySelector(`.theme-option[data-theme="${theme}"]`).classList.add('active');
  }
}

// Apply theme globally
function applyTheme(theme) {
  // Remove all theme classes
  document.body.className = document.body.className.replace(/\btheme-\S+/g, '');
  // Add new theme class
  document.body.classList.add(`theme-${theme}`);
  // Update background color instantly
  document.body.style.backgroundColor = getComputedStyle(document.body).getPropertyValue('--background');
}

// Apply saved theme on page load
function applySavedTheme() {
  const savedTheme = localStorage.getItem('theme') || 'default';
  applyTheme(savedTheme);
  // Set active state on theme options if present
  document.querySelectorAll('.theme-option').forEach(option => {
    option.classList.toggle('active', option.dataset.theme === savedTheme);
  });
}

// Load profile and update display
function loadProfile() {
  fetch('/api/users/me', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        updateProfileDisplay(data.user);
        // Create avatar upload section if it doesn't exist
        if (!document.querySelector('.avatar-upload')) {
          const profileForm = document.querySelector('.profile-form');
          const avatarUploadSection = document.createElement('div');
          avatarUploadSection.className = 'avatar-upload';
          avatarUploadSection.innerHTML = `
            <h3>Profile Picture</h3>
            <img src="/images/avatars/${data.user.profilePicture || 'default.png'}" class="avatar-preview">
            <button type="button" class="avatar-upload-btn">Change Avatar</button>
          `;
          profileForm.parentNode.insertBefore(avatarUploadSection, profileForm);
          setupAvatarUpload();
        }
      } else {
        window.location.href = '/login';
      }
    })
    .catch(error => {
      // handle error
    });
}

// Update profile display (header, stats, avatar, theme)
function updateProfileDisplay(user) {
  // Profile header
  document.querySelector('.profile-avatar').src = `/images/avatars/${user.profilePicture || 'default.png'}`;
  document.querySelector('.profile-info h2').textContent = user.username;
  document.querySelector('.stat-value.balance').textContent = user.balance;
  document.querySelector('.stat-value.level').textContent = user.level;

  // Progress bar
  const XP_PER_LEVEL = 100;
  const progressFill = document.querySelector('.progress-fill');
  if (progressFill && typeof user.experience === 'number') {
    const percent = Math.min(100, Math.round((user.experience / XP_PER_LEVEL) * 100));
    progressFill.style.width = `${percent}%`;
  }

  // Form fields
  document.querySelector('#email').value = user.email || '';
  document.querySelector('#username').value = user.username;

  // Avatar preview
  const avatarPreview = document.querySelector('.avatar-preview');
  if (avatarPreview) {
    avatarPreview.src = `/images/avatars/${user.profilePicture || 'default.png'}`;
  }

  // Set active theme
  const themeOptions = document.querySelectorAll('.theme-option');
  themeOptions.forEach(option => {
    option.classList.remove('active');
    if (option.dataset.theme === user.theme) {
      option.classList.add('active');
    }
  });

  // Apply theme globally
  if (user.theme) {
    localStorage.setItem('theme', user.theme);
    applyTheme(user.theme);
  }
}

// Profile form logic
function setupProfileForm() {
  const form = document.querySelector('.profile-form');
  form.addEventListener('submit', handleProfileUpdate);
}

function handleProfileUpdate(e) {
  e.preventDefault();
  const form = e.target;
  const formData = {
    email: form.email.value,
    username: form.username.value
  };
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';
  updateProfile(formData)
    .then(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    })
    .catch(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    });
}

// Theme selector logic
function setupThemeSelector() {
  const themeOptions = document.querySelectorAll('.theme-option');
  themeOptions.forEach(option => {
    option.addEventListener('click', () => {
      const theme = option.dataset.theme;
      updateTheme(theme);
    });
  });
}

// Avatar upload logic
function setupAvatarUpload() {
  // Remove any existing input to avoid duplicates
  const oldInput = document.getElementById('avatar-file-input');
  if (oldInput) oldInput.remove();

  const avatarInput = document.createElement('input');
  avatarInput.type = 'file';
  avatarInput.accept = 'image/*';
  avatarInput.id = 'avatar-file-input';
  avatarInput.style.display = 'none';
  document.body.appendChild(avatarInput);

  const avatarPreview = document.querySelector('.avatar-preview');
  const uploadBtn = document.querySelector('.avatar-upload-btn');

  // Remove any existing Save button
  let saveBtn = document.querySelector('.avatar-save-btn');
  if (saveBtn) saveBtn.remove();

  let selectedFile = null;

  if (!uploadBtn) return;

  uploadBtn.addEventListener('click', () => {
    avatarInput.value = '';
    avatarInput.click();
  });

  avatarInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showMessage('Please select an image file', false);
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        showMessage('Image must be less than 2MB', false);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (avatarPreview) {
          avatarPreview.src = event.target.result;
        }
        selectedFile = file;
        showSaveButton();
      };
      reader.readAsDataURL(file);
    }
  });

  function showSaveButton() {
    let oldSaveBtn = document.querySelector('.avatar-save-btn');
    if (oldSaveBtn) oldSaveBtn.remove();

    saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'avatar-save-btn';
    saveBtn.textContent = 'Save Avatar';
    saveBtn.style.marginTop = '10px';

    uploadBtn.parentNode.insertBefore(saveBtn, uploadBtn.nextSibling);

    saveBtn.addEventListener('click', () => {
      if (selectedFile) {
        uploadAvatar(selectedFile);
      }
    });
  }
}

function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);

  const saveBtn = document.querySelector('.avatar-save-btn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
  }

  fetch('/api/users/avatar', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: formData
  })
    .then(response => response.json())
    .then(data => {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Avatar';
      }
      if (data.success) {
        showMessage('Avatar updated successfully!', true);
        // Update profile avatar in header and everywhere
        const profileAvatar = document.querySelector('.profile-avatar');
        if (profileAvatar) {
          profileAvatar.src = `/images/avatars/${data.profilePicture || 'default.png'}?t=${Date.now()}`;
        }
        const headerAvatar = document.querySelector('.user-avatar');
        if (headerAvatar) {
          headerAvatar.src = `/images/avatars/${data.profilePicture || 'default.png'}?t=${Date.now()}`;
        }
        const avatarPreview = document.querySelector('.avatar-preview');
        if (avatarPreview) {
          avatarPreview.src = `/images/avatars/${data.profilePicture || 'default.png'}?t=${Date.now()}`;
        }
        if (saveBtn) saveBtn.remove();
      } else {
        showMessage(data.error || 'Failed to upload avatar', false);
      }
    })
    .catch(error => {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Avatar';
      }
      showMessage('Error uploading avatar', false);
    });
}

function showMessage(message, isSuccess) {
  let msg = document.querySelector('.profile-message');
  if (!msg) {
    msg = document.createElement('div');
    msg.className = 'profile-message';
    document.querySelector('.profile-section').prepend(msg);
  }
  msg.textContent = message;
  msg.style.color = isSuccess ? 'var(--success, #4caf50)' : 'var(--danger, #f44336)';
  setTimeout(() => msg.remove(), 3000);
}

// Update header info (avatar and balance)
function updateHeaderUserInfo() {
  fetch('/api/users/me', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        document.querySelector('.balance-amount').textContent = data.user.balance;
        const avatar = document.querySelector('.user-avatar');
        if (avatar) {
          avatar.src = `/images/avatars/${data.user.profilePicture || 'default.png'}`;
        }
      }
    });
}