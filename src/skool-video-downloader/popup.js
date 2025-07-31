// Popup script - handles license activation

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup script loaded');
  
  const loadingDiv = document.getElementById('loading');
  const licenseContent = document.getElementById('license-content');
  const activatedContent = document.getElementById('activated-content');
  const activateBtn = document.getElementById('activate-btn');
  const deactivateBtn = document.getElementById('deactivate-btn');
  const licenseInput = document.getElementById('license-input');
  const errorMessage = document.getElementById('error-message');

  // Show loading state
  loadingDiv.style.display = 'block';

  try {
    // Check if license exists
    const response = await chrome.runtime.sendMessage({ action: 'checkLicense' });
    
    loadingDiv.style.display = 'none';
    
    if (response && response.isValid) {
      // Show activated state
      activatedContent.style.display = 'block';
      // Automatically extract videos
      await extractVideos();
    } else {
      // Show license input
      licenseContent.style.display = 'block';
    }
  } catch (error) {
    console.error('Error checking license:', error);
    loadingDiv.style.display = 'none';
    // Default to showing license input on error
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

  // Extract videos function
  async function extractVideos() {
    const videoResult = document.getElementById('video-result');
    
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('skool.com')) {
      videoResult.innerHTML = `
        <div style="padding: 12px; background: #fee2e2; color: #991b1b; border-radius: 8px;">
          This extension only works on Skool.com pages
        </div>
      `;
      return;
    }
    
    // Send message to content script
    chrome.tabs.sendMessage(tab.id, { action: 'extractVideo' }, async (response) => {
        if (chrome.runtime.lastError) {
          videoResult.innerHTML = `
            <div style="padding: 12px; background: #fee2e2; color: #991b1b; border-radius: 8px;">
              Please refresh the page and try again
            </div>
          `;
          return;
        }
        
        if (response && response.videos && response.videos.length > 0) {
          // Fetch metadata for Loom videos
          const videosWithMetadata = await Promise.all(
            response.videos.map(async (video) => {
              if (video.type === 'loom' && video.videoId) {
                const metadata = await chrome.runtime.sendMessage({
                  action: 'fetchLoomMetadata',
                  videoId: video.videoId
                });
                if (metadata.title) {
                  video.title = metadata.title;
                }
                if (metadata.thumbnail) {
                  video.thumbnail = metadata.thumbnail;
                }
              }
              return video;
            })
          );
          
          let videosHtml = '';
          
          videosWithMetadata.forEach((video, index) => {
            const thumbnailHtml = video.thumbnail ? 
              `<img src="${video.thumbnail}" style="width: 100%; height: auto; margin-bottom: 12px; border-radius: 4px;">` : '';
            
            videosHtml += `
              <div style="margin-bottom: 16px; padding: 16px; background: #f9fafb; border-radius: 8px;">
                ${thumbnailHtml}
                <p style="font-weight: 600; margin-bottom: 8px;">${video.title}</p>
                
                <div style="margin-bottom: 12px;">
                  <p style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Mac:</p>
                  <div style="display: flex; gap: 8px;">
                    <input type="text" value="yt-dlp -P ~/Desktop '${video.url}'" readonly style="flex: 1; padding: 6px 8px; border: 1px solid #e5e7eb; border-radius: 4px; font-family: monospace; font-size: 11px;">
                    <button onclick="navigator.clipboard.writeText(this.previousElementSibling.value); this.textContent='Copied!'; setTimeout(() => this.textContent='Copy', 2000)" class="button" style="padding: 6px 12px; font-size: 12px;">Copy</button>
                  </div>
                </div>
                
                <div>
                  <p style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Windows:</p>
                  <div style="display: flex; gap: 8px;">
                    <input type="text" value='yt-dlp -P %USERPROFILE%\\Desktop "${video.url}"' readonly style="flex: 1; padding: 6px 8px; border: 1px solid #e5e7eb; border-radius: 4px; font-family: monospace; font-size: 11px;">
                    <button onclick="navigator.clipboard.writeText(this.previousElementSibling.value); this.textContent='Copied!'; setTimeout(() => this.textContent='Copy', 2000)" class="button" style="padding: 6px 12px; font-size: 12px;">Copy</button>
                  </div>
                </div>
              </div>
            `;
          });
          
          videoResult.innerHTML = `
            <div>
              ${videosHtml}
              <p style="font-size: 12px; color: #6b7280; margin-top: 12px; text-align: center;">
                Videos will download to your desktop. Need help? Visit 
                <a href="https://serp.ly/@serp/community/support" target="_blank" style="color: #3b82f6;">support</a>
              </p>
            </div>
          `;
        } else {
          videoResult.innerHTML = `
            <div style="padding: 12px; background: #fef3c7; color: #92400e; border-radius: 8px;">
              No videos found on this page. Make sure you're on a Skool page with a video.
            </div>
          `;
        }
        
      });
  }
});