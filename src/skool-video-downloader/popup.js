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
              }
              return video;
            })
          );
          
          let videosHtml = '';
          
          videosWithMetadata.forEach((video, index) => {
            videosHtml += `
              <div style="margin-bottom: 16px; padding: 16px; background: #f9fafb; border-radius: 8px;">
                <p style="font-weight: 600; margin-bottom: 8px;">${video.title}</p>
                
                <div style="display: flex; gap: 12px; justify-content: center;">
                  <button class="button copy-btn" data-command="yt-dlp -P ~/Desktop '${video.url}'" style="padding: 8px 20px;">
                    Copy for Mac
                  </button>
                  <button class="button copy-btn" data-command='yt-dlp -P %USERPROFILE%\\Desktop "${video.url}"' style="padding: 8px 20px;">
                    Copy for Windows
                  </button>
                </div>
              </div>
            `;
          });
          
          videoResult.innerHTML = `
            <div>
              ${videosHtml}
              
              <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin-top: 16px;">
                <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 12px 0; color: #111827;">How to download:</h3>
                <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #4b5563;">
                  <li style="margin-bottom: 6px;">Click the 'Copy' button for your operating system</li>
                  <li style="margin-bottom: 6px;">Open Terminal (Mac) or Command Prompt/PowerShell (Windows)</li>
                  <li style="margin-bottom: 6px;">Paste the command & press Enter</li>
                  <li>The video will download to your desktop</li>
                </ol>
              </div>
              
              <p style="font-size: 12px; color: #6b7280; margin-top: 12px; text-align: center;">
                Need help? Visit 
                <a href="https://serp.ly/@serp/community/support" target="_blank" style="color: #3b82f6;">support</a>
              </p>
            </div>
          `;
          
          // Add event listeners to copy buttons
          document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', function() {
              const command = this.getAttribute('data-command');
              navigator.clipboard.writeText(command).then(() => {
                const originalText = this.textContent;
                this.textContent = 'Copied!';
                setTimeout(() => {
                  this.textContent = originalText;
                }, 2000);
              }).catch(err => {
                console.error('Failed to copy:', err);
              });
            });
          });
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