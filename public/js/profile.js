document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.profile-form')) {
    loadProfile();
    setupProfileForm();
    setupThemeSelector();
    setupAvatarUpload();
  }
});

// Fetch user profile
async function fetchProfile() {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/users/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return; // handle error
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

// Update theme
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
    // Update active theme indicator
    document.querySelectorAll('.theme-option').forEach(option => {
      option.classList.remove('active');
    });
    document.querySelector(`.theme-option[data-theme="${theme}"]`).classList.add('active');
    
    // Apply theme to the page
    applyTheme(theme);
  }
}

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
          setupAvatarUpload(); // <-- Add this line to re-attach event listeners
        }
      } else {
        window.location.href = '/login';
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

function updateProfileDisplay(user) {
  // Update profile header
  document.querySelector('.profile-avatar').src = `/images/avatars/${user.profilePicture || 'default.png'}`;
  document.querySelector('.profile-info h2').textContent = user.username;
  document.querySelector('.stat-value.balance').textContent = user.balance;
  document.querySelector('.stat-value.level').textContent = user.level;
  
  // Update progress bar
  const progressFill = document.querySelector('.progress-fill');
  progressFill.style.width = `${user.experience}%`;
  
  // Update form fields
  document.querySelector('#email').value = user.email || '';
  document.querySelector('#username').value = user.username;
  
  // Update avatar preview if exists
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
}

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

function setupThemeSelector() {
  const themeOptions = document.querySelectorAll('.theme-option');
  themeOptions.forEach(option => {
    option.addEventListener('click', () => {
      const theme = option.dataset.theme;
      updateTheme(theme);
    });
  });
}

function applyTheme(theme) {
  // Remove all theme classes
  document.body.className = document.body.className.replace(/\btheme-\S+/g, '');
  
  // Add new theme class
  document.body.classList.add(`theme-${theme}`);
}

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
    avatarInput.value = ''; // Reset input
    avatarInput.click();
  });

  avatarInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
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
    // Remove old save button if any
    let oldSaveBtn = document.querySelector('.avatar-save-btn');
    if (oldSaveBtn) oldSaveBtn.remove();

    saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'avatar-save-btn';
    saveBtn.textContent = 'Save Avatar';
    saveBtn.style.marginTop = '10px';

    // Insert after the upload button
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

  // Disable save button while uploading
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
        // Update profile avatar in header if exists
        const profileAvatar = document.querySelector('.profile-avatar');
        if (profileAvatar) {
          profileAvatar.src = `/images/avatars/${data.profilePicture || 'default.png'}?t=${Date.now()}`;
        }
        // Also update preview
        const avatarPreview = document.querySelector('.avatar-preview');
        if (avatarPreview) {
          avatarPreview.src = `/images/avatars/${data.profilePicture || 'default.png'}?t=${Date.now()}`;
        }
        // Remove save button after successful upload
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
      console.error('Error:', error);
      showMessage('Error uploading avatar', false);
    });
}

function showMessage(message, isSuccess) {
  const messageElement = document.createElement('div');
  messageElement.className = 'profile-message';
  messageElement.textContent = message;
  messageElement.style.color = isSuccess ? '#4caf50' : '#f44336';
  messageElement.style.marginTop = '10px';
  messageElement.style.textAlign = 'center';
  messageElement.style.padding = '10px';
  messageElement.style.borderRadius = '5px';
  messageElement.style.backgroundColor = isSuccess ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)';
  
  const existingMessage = document.querySelector('.profile-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  const form = document.querySelector('.profile-form');
  if (form) {
    form.appendChild(messageElement);
  } else {
    // Fallback to body if form not found
    document.body.appendChild(messageElement);
  }
  
  setTimeout(() => {
    messageElement.style.opacity = '1';
  }, 10);
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    messageElement.style.opacity = '0';
    setTimeout(() => {
      messageElement.remove();
    }, 300);
  }, 3000);
}

// Initial profile load
fetchProfile();