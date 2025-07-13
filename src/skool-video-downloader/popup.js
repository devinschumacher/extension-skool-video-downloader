// Popup script - handles license activation

document.addEventListener('DOMContentLoaded', async () => {
  const loadingDiv = document.getElementById('loading');
  const licenseContent = document.getElementById('license-content');
  const activatedContent = document.getElementById('activated-content');
  const activateBtn = document.getElementById('activate-btn');
  const deactivateBtn = document.getElementById('deactivate-btn');
  const licenseInput = document.getElementById('license-input');
  const errorMessage = document.getElementById('error-message');

  // Show loading state
  loadingDiv.style.display = 'block';

  // Check if license exists
  const response = await chrome.runtime.sendMessage({ action: 'checkLicense' });
  
  loadingDiv.style.display = 'none';
  
  if (response.isValid) {
    // Show activated state
    activatedContent.style.display = 'block';
  } else {
    // Show license input
    licenseContent.style.display = 'block';
  }

  // Handle activation
  activateBtn.addEventListener('click', async () => {
    const licenseKey = licenseInput.value.trim();
    
    if (!licenseKey) {
      errorMessage.textContent = 'Please enter a license key';
      return;
    }

    // Clear error and disable button
    errorMessage.textContent = '';
    activateBtn.disabled = true;
    activateBtn.textContent = 'Verifying...';

    // Verify license
    const result = await chrome.runtime.sendMessage({
      action: 'verifyLicense',
      licenseKey: licenseKey
    });

    if (result.success) {
      // Show success state
      licenseContent.style.display = 'none';
      activatedContent.style.display = 'block';
      
      // Clear the badge
      chrome.action.setBadgeText({ text: '' });
    } else {
      // Show error
      errorMessage.textContent = result.error || 'Invalid license key';
      activateBtn.disabled = false;
      activateBtn.textContent = 'Activate Extension';
    }
  });

  // Handle deactivation
  deactivateBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to deactivate your license?')) {
      await chrome.runtime.sendMessage({ action: 'clearLicense' });
      
      // Reset UI
      activatedContent.style.display = 'none';
      licenseContent.style.display = 'block';
      licenseInput.value = '';
      errorMessage.textContent = '';
      
      // Set warning badge
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
    }
  });

  // Handle Enter key in license input
  licenseInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      activateBtn.click();
    }
  });
});