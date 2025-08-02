// License management functionality

export class LicenseManager {
  constructor(elements) {
    this.elements = elements;
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Handle activation
    this.elements.activateBtn.addEventListener('click', () => this.handleActivation());
    
    // Handle deactivation
    this.elements.deactivateBtn.addEventListener('click', () => this.handleDeactivation());
    
    // Handle Enter key in license input
    this.elements.licenseInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleActivation();
      }
    });
  }
  
  async checkLicense() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'checkLicense' });
      return response && response.isValid;
    } catch (error) {
      console.error('Error checking license:', error);
      return false;
    }
  }
  
  async handleActivation() {
    const licenseKey = this.elements.licenseInput.value.trim();
    
    if (!licenseKey) {
      this.showError('Please enter a license key');
      return;
    }
    
    // Clear error and disable button
    this.showError('');
    this.elements.activateBtn.disabled = true;
    this.elements.activateBtn.textContent = 'Verifying...';
    
    try {
      const result = await chrome.runtime.sendMessage({
        action: 'verifyLicense',
        licenseKey: licenseKey
      });
      
      if (result.success) {
        // Show success state
        this.elements.licenseContent.style.display = 'none';
        this.elements.activatedContent.style.display = 'block';
        
        // Clear the badge
        chrome.action.setBadgeText({ text: '' });
        
        // Trigger video extraction
        if (this.onActivated) {
          this.onActivated();
        }
      } else {
        this.showError(result.error || 'Invalid license key');
        this.elements.activateBtn.disabled = false;
        this.elements.activateBtn.textContent = 'Activate Extension';
      }
    } catch (error) {
      console.error('Activation error:', error);
      this.showError('Failed to verify license. Please try again.');
      this.elements.activateBtn.disabled = false;
      this.elements.activateBtn.textContent = 'Activate Extension';
    }
  }
  
  async handleDeactivation() {
    if (!confirm('Are you sure you want to deactivate your license?')) {
      return;
    }
    
    try {
      await chrome.runtime.sendMessage({ action: 'clearLicense' });
      
      // Reset UI
      this.elements.activatedContent.style.display = 'none';
      this.elements.licenseContent.style.display = 'block';
      this.elements.licenseInput.value = '';
      this.showError('');
      
      // Set warning badge
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
    } catch (error) {
      console.error('Deactivation error:', error);
    }
  }
  
  showError(message) {
    this.elements.errorMessage.textContent = message;
  }
  
  // Set callback for when license is activated
  setOnActivated(callback) {
    this.onActivated = callback;
  }
}