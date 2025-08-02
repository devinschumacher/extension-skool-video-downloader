// Refactored popup script - cleaner and more modular (bundled version)

// === Download Commands Module ===
const DownloadCommands = {
  providers: {
    youtube: {
      getCommand: (url, isWindows) => {
        const format = '-f "bestvideo[height<=1080]+bestaudio/best[height<=1080]" --merge-output-format mp4';
        const basePath = isWindows ? '-P %USERPROFILE%\\\\Desktop' : '-P ~/Desktop';
        const quote = isWindows ? '"' : "'";
        return `yt-dlp ${format} ${basePath} ${quote}${url}${quote}`;
      }
    },
    vimeo: {
      getCommand: (url, isWindows) => {
        const headers = '--add-header "Referer: https://vimeo.com"';
        const basePath = isWindows ? '-P %USERPROFILE%\\\\Desktop' : '-P ~/Desktop';
        const quote = isWindows ? '"' : "'";
        return `yt-dlp ${headers} ${basePath} ${quote}${url}${quote}`;
      }
    },
    loom: {
      getCommand: (url, isWindows) => {
        const basePath = isWindows ? '-P %USERPROFILE%\\\\Desktop' : '-P ~/Desktop';
        const quote = isWindows ? '"' : "'";
        return `yt-dlp ${basePath} ${quote}${url}${quote}`;
      }
    },
    wistia: {
      getCommand: (url, isWindows) => {
        const basePath = isWindows ? '-P %USERPROFILE%\\\\Desktop' : '-P ~/Desktop';
        const quote = isWindows ? '"' : "'";
        return `yt-dlp ${basePath} ${quote}${url}${quote}`;
      }
    },
    skool: {
      getCommand: (url, isWindows) => {
        const basePath = isWindows ? '-P %USERPROFILE%\\\\Desktop' : '-P ~/Desktop';
        const quote = isWindows ? '"' : "'";
        return `yt-dlp ${basePath} ${quote}${url}${quote}`;
      }
    }
  },
  
  generate: function(video, isWindows = false) {
    const providerName = video.providerName || video.type;
    if (providerName && this.providers[providerName]) {
      return this.providers[providerName].getCommand(video.url, isWindows);
    }
    
    // Fallback
    const basePath = isWindows ? '-P %USERPROFILE%\\\\Desktop' : '-P ~/Desktop';
    const quote = isWindows ? '"' : "'";
    return `yt-dlp ${basePath} ${quote}${video.url}${quote}`;
  },
  
  escapeForHtml: function(command) {
    return command.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
};

// === Video Metadata Module ===
const VideoMetadata = {
  enrichVideos: async function(videos) {
    return Promise.all(videos.map(video => this.enrichVideo(video)));
  },
  
  enrichVideo: async function(video) {
    if (video.type === 'loom' && video.videoId) {
      await this.fetchLoomMetadata(video);
    }
    
    if (video.type === 'wistia' && video.videoId && !video.thumbnail) {
      await this.fetchWistiaThumbnail(video);
    }
    
    return video;
  },
  
  fetchLoomMetadata: async function(video) {
    try {
      const metadata = await chrome.runtime.sendMessage({
        action: 'fetchLoomMetadata',
        videoId: video.videoId
      });
      
      if (metadata.title) {
        video.title = metadata.title;
      }
    } catch (error) {
      console.error('Error fetching Loom metadata:', error);
    }
  },
  
  fetchWistiaThumbnail: async function(video) {
    try {
      const result = await chrome.runtime.sendMessage({
        action: 'fetchWistiaThumbnail',
        videoId: video.videoId
      });
      
      if (result.thumbnail) {
        video.thumbnail = result.thumbnail;
        console.log('📺 Fetched Wistia thumbnail:', result.thumbnail);
      }
    } catch (error) {
      console.error('Error fetching Wistia thumbnail:', error);
    }
  }
};

// === Video Renderer Module ===
const VideoRenderer = {
  VIDEO_ICONS: {
    youtube: '📺',
    vimeo: '🎬',
    loom: '🎥',
    wistia: '🎞️',
    skool: '🎓'
  },
  
  generateThumbnail: function(video) {
    if (video.thumbnail) {
      console.log('📺 Creating thumbnail HTML for URL:', video.thumbnail);
      return `
        <div style="margin-bottom: 12px; text-align: center;">
          <img src="${video.thumbnail}" 
               alt="${video.title}" 
               style="max-width: 100%; height: auto; max-height: 180px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
               onerror="console.error('Failed to load thumbnail'); this.style.display='none';">
        </div>
      `;
    }
    
    const icon = this.VIDEO_ICONS[video.type] || '📹';
    const platformName = video.type ? video.type.charAt(0).toUpperCase() + video.type.slice(1) : 'Video';
    
    return `
      <div style="margin-bottom: 12px; text-align: center;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    padding: 40px; 
                    border-radius: 8px; 
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="font-size: 48px; margin-bottom: 8px;">${icon}</div>
          <div style="color: white; font-size: 14px; font-weight: 500;">
            ${platformName} Ready
          </div>
        </div>
      </div>
    `;
  },
  
  generatePlatformNotes: function(video) {
    if (video.type === 'vimeo') {
      return `
        <p style="font-size: 11px; color: #dc2626; margin-top: 8px; text-align: center;">
          ⚠️ Vimeo videos may require additional authentication. If you get an OAuth error, the video may be private.
        </p>
      `;
    }
    
    if (video.type === 'youtube') {
      return `
        <p style="font-size: 11px; color: #059669; margin-top: 8px; text-align: center;">
          ✓ Will download in best quality (up to 1080p)
        </p>
      `;
    }
    
    return '';
  },
  
  generateVideoCard: function(video) {
    const macCmd = DownloadCommands.generate(video, false);
    const winCmd = DownloadCommands.generate(video, true);
    const macCmdEscaped = DownloadCommands.escapeForHtml(macCmd);
    const winCmdEscaped = DownloadCommands.escapeForHtml(winCmd);
    
    return `
      <div style="margin-bottom: 16px; padding: 16px; background: #f9fafb; border-radius: 8px;">
        ${this.generateThumbnail(video)}
        <p style="font-weight: 600; margin-bottom: 8px;">${video.title}</p>
        <p style="font-size: 12px; color: #6b7280; margin-bottom: 12px;">Platform: ${video.type || 'unknown'}</p>
        
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button class="button copy-btn" data-command="${macCmdEscaped}" style="padding: 8px 20px;">
            Copy for Mac
          </button>
          <button class="button copy-btn" data-command="${winCmdEscaped}" style="padding: 8px 20px;">
            Copy for Windows
          </button>
        </div>
        
        ${this.generatePlatformNotes(video)}
      </div>
    `;
  },
  
  generateInstructions: function() {
    return `
      <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin-top: 16px;">
        <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 12px 0; color: #111827;">How to download:</h3>
        <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #4b5563;">
          <li style="margin-bottom: 6px;">Click the 'Copy' button for your operating system</li>
          <li style="margin-bottom: 6px;">Open Terminal (Mac) or Command Prompt/PowerShell (Windows)</li>
          <li style="margin-bottom: 6px;">Paste the command & press Enter</li>
          <li>The video will download to your desktop</li>
        </ol>
      </div>
    `;
  },
  
  generateVideosHtml: function(videos) {
    const videoCards = videos.map(video => this.generateVideoCard(video)).join('');
    
    return `
      <div>
        ${videoCards}
        ${this.generateInstructions()}
        <p style="font-size: 12px; color: #6b7280; margin-top: 12px; text-align: center;">
          Need help? Visit 
          <a href="https://serp.ly/@serp/community/support" target="_blank" style="color: #3b82f6;">support</a>
        </p>
      </div>
    `;
  }
};

// === Copy Manager Module ===
const CopyManager = {
  setup: function() {
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleCopy(e));
    });
  },
  
  handleCopy: function(event) {
    const button = event.currentTarget;
    const command = button.getAttribute('data-command');
    const decodedCommand = this.decodeHtml(command);
    
    console.log('Copying command:', decodedCommand);
    this.copyToClipboard(decodedCommand, button);
  },
  
  decodeHtml: function(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  },
  
  copyToClipboard: async function(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      
      const originalText = button.textContent;
      button.textContent = 'Failed!';
      button.style.background = '#ef4444';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
      }, 2000);
    }
  }
};

// === License Manager Module ===
const LicenseManager = {
  elements: null,
  onActivatedCallback: null,
  
  init: function(elements, onActivated) {
    this.elements = elements;
    this.onActivatedCallback = onActivated;
    this.setupEventListeners();
  },
  
  setupEventListeners: function() {
    this.elements.activateBtn.addEventListener('click', () => this.handleActivation());
    this.elements.deactivateBtn.addEventListener('click', () => this.handleDeactivation());
    this.elements.licenseInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleActivation();
    });
  },
  
  checkLicense: async function() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'checkLicense' });
      return response && response.isValid;
    } catch (error) {
      console.error('Error checking license:', error);
      return false;
    }
  },
  
  handleActivation: async function() {
    const licenseKey = this.elements.licenseInput.value.trim();
    
    if (!licenseKey) {
      this.showError('Please enter a license key');
      return;
    }
    
    this.showError('');
    this.elements.activateBtn.disabled = true;
    this.elements.activateBtn.textContent = 'Verifying...';
    
    try {
      const result = await chrome.runtime.sendMessage({
        action: 'verifyLicense',
        licenseKey: licenseKey
      });
      
      if (result.success) {
        this.elements.licenseContent.style.display = 'none';
        this.elements.activatedContent.style.display = 'block';
        chrome.action.setBadgeText({ text: '' });
        
        if (this.onActivatedCallback) {
          this.onActivatedCallback();
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
  },
  
  handleDeactivation: async function() {
    if (!confirm('Are you sure you want to deactivate your license?')) {
      return;
    }
    
    try {
      await chrome.runtime.sendMessage({ action: 'clearLicense' });
      
      this.elements.activatedContent.style.display = 'none';
      this.elements.licenseContent.style.display = 'block';
      this.elements.licenseInput.value = '';
      this.showError('');
      
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
    } catch (error) {
      console.error('Deactivation error:', error);
    }
  },
  
  showError: function(message) {
    this.elements.errorMessage.textContent = message;
  }
};

// === Main Application ===
const PopupApp = {
  elements: {},
  
  init: async function() {
    console.log('Popup script loaded');
    
    this.initElements();
    
    LicenseManager.init(this.elements, () => this.extractVideos());
    
    this.showLoading(true);
    
    const isLicensed = await LicenseManager.checkLicense();
    this.showLoading(false);
    
    if (isLicensed) {
      this.showActivatedState();
      await this.extractVideos();
    } else {
      this.showLicenseInput();
    }
  },
  
  initElements: function() {
    this.elements = {
      loadingDiv: document.getElementById('loading'),
      licenseContent: document.getElementById('license-content'),
      activatedContent: document.getElementById('activated-content'),
      activateBtn: document.getElementById('activate-btn'),
      deactivateBtn: document.getElementById('deactivate-btn'),
      licenseInput: document.getElementById('license-input'),
      errorMessage: document.getElementById('error-message'),
      videoResult: document.getElementById('video-result')
    };
  },
  
  showLoading: function(show) {
    this.elements.loadingDiv.style.display = show ? 'block' : 'none';
  },
  
  showActivatedState: function() {
    this.elements.activatedContent.style.display = 'block';
    this.elements.licenseContent.style.display = 'none';
  },
  
  showLicenseInput: function() {
    this.elements.licenseContent.style.display = 'block';
    this.elements.activatedContent.style.display = 'none';
  },
  
  extractVideos: async function() {
    this.showVideoStatus('Checking for videos...');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('skool.com')) {
      this.showVideoError('This extension only works on Skool.com pages');
      return;
    }
    
    chrome.storage.local.get(['detectedVideos'], async (result) => {
      const videos = result.detectedVideos || [];
      
      if (videos.length > 0) {
        await this.displayVideos(videos);
      } else {
        this.showVideoWarning('No videos found on this page. Make sure you\'re on a Skool page with a video.');
      }
    });
  },
  
  displayVideos: async function(videos) {
    console.log(`Found ${videos.length} video(s)`);
    
    const enrichedVideos = await VideoMetadata.enrichVideos(videos);
    
    enrichedVideos.forEach((video, index) => {
      console.log('📺 Processing video:', video);
      console.log('📺 Video thumbnail:', video.thumbnail);
    });
    
    const videosHtml = VideoRenderer.generateVideosHtml(enrichedVideos);
    this.elements.videoResult.innerHTML = videosHtml;
    
    CopyManager.setup();
  },
  
  showVideoStatus: function(message) {
    this.elements.videoResult.innerHTML = `
      <div style="text-align: center; color: #6b7280; padding: 20px;">
        ${message}
      </div>
    `;
  },
  
  showVideoError: function(message) {
    this.elements.videoResult.innerHTML = `
      <div style="padding: 12px; background: #fee2e2; color: #991b1b; border-radius: 8px;">
        ${message}
      </div>
    `;
  },
  
  showVideoWarning: function(message) {
    this.elements.videoResult.innerHTML = `
      <div style="padding: 12px; background: #fef3c7; color: #92400e; border-radius: 8px;">
        ${message}
      </div>
    `;
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => PopupApp.init());