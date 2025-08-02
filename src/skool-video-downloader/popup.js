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
    
    // Clear any previous results first
    videoResult.innerHTML = `
      <div style="text-align: center; color: #6b7280; padding: 20px;">
        Checking for videos...
      </div>
    `;
    
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
    
    // Get videos from storage instead of messaging content script
    chrome.storage.local.get(['detectedVideos'], async (result) => {
        const videos = result.detectedVideos || [];
        
        if (videos.length > 0) {
          // Fetch metadata for videos
          const videosWithMetadata = await Promise.all(
            videos.map(async (video) => {
              // Fetch Loom metadata
              if (video.type === 'loom' && video.videoId) {
                const metadata = await chrome.runtime.sendMessage({
                  action: 'fetchLoomMetadata',
                  videoId: video.videoId
                });
                if (metadata.title) {
                  video.title = metadata.title;
                }
              }
              
              // Fetch Wistia thumbnail if missing
              if (video.type === 'wistia' && video.videoId && !video.thumbnail) {
                const result = await chrome.runtime.sendMessage({
                  action: 'fetchWistiaThumbnail',
                  videoId: video.videoId
                });
                if (result.thumbnail) {
                  video.thumbnail = result.thumbnail;
                  console.log('📺 Fetched Wistia thumbnail:', result.thumbnail);
                }
              }
              
              return video;
            })
          );
          
          let videosHtml = '';
          
          videosWithMetadata.forEach((video, index) => {
            console.log('📺 Processing video:', video);
            console.log('📺 Video thumbnail:', video.thumbnail);
            
            // Generate platform-specific download commands
            const macCmd = generateDownloadCommand(video, false);
            const winCmd = generateDownloadCommand(video, true);
            
            // Escape commands for HTML attributes
            const macCmdEscaped = macCmd.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            const winCmdEscaped = winCmd.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            
            // Generate thumbnail HTML
            let thumbnailHtml = '';
            
            if (video.thumbnail) {
              console.log('📺 Creating thumbnail HTML for URL:', video.thumbnail);
              thumbnailHtml = `
                <div style="margin-bottom: 12px; text-align: center;">
                  <img src="${video.thumbnail}" 
                       alt="${video.title}" 
                       style="max-width: 100%; height: auto; max-height: 180px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                       onerror="console.error('Failed to load thumbnail'); this.style.display='none';">
                </div>
              `;
            } else {
              // Show a nice placeholder with video icon
              const videoIcons = {
                youtube: '📺',
                vimeo: '🎬',
                loom: '🎥',
                wistia: '🎞️',
                skool: '🎓'
              };
              const icon = videoIcons[video.type] || '📹';
              
              thumbnailHtml = `
                <div style="margin-bottom: 12px; text-align: center;">
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                              padding: 40px; 
                              border-radius: 8px; 
                              box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="font-size: 48px; margin-bottom: 8px;">${icon}</div>
                    <div style="color: white; font-size: 14px; font-weight: 500;">
                      ${video.type ? video.type.charAt(0).toUpperCase() + video.type.slice(1) : 'Video'} Ready
                    </div>
                  </div>
                </div>
              `;
            }
            
            videosHtml += `
              <div style="margin-bottom: 16px; padding: 16px; background: #f9fafb; border-radius: 8px;">
                ${thumbnailHtml}
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
                
                ${video.type === 'vimeo' ? `
                  <p style="font-size: 11px; color: #dc2626; margin-top: 8px; text-align: center;">
                    ⚠️ Vimeo videos may require additional authentication. If you get an OAuth error, the video may be private.
                  </p>
                ` : ''}
                
                ${video.type === 'youtube' ? `
                  <p style="font-size: 11px; color: #059669; margin-top: 8px; text-align: center;">
                    ✓ Will download in best quality (up to 1080p)
                  </p>
                ` : ''}
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
              // Decode HTML entities
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = command;
              const decodedCommand = tempDiv.textContent || tempDiv.innerText || '';
              
              console.log('Copying command:', decodedCommand); // Debug log
              
              navigator.clipboard.writeText(decodedCommand).then(() => {
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
  
  // Provider-specific download commands
  const providerCommands = {
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
  };

  // Generate platform-specific download commands with quality settings
  function generateDownloadCommand(video, isWindows = false) {
    // Use provider-specific command if available
    const providerName = video.providerName || video.type;
    if (providerName && providerCommands[providerName]) {
      return providerCommands[providerName].getCommand(video.url, isWindows);
    }
    
    // Fallback to basic command
    const basePath = isWindows ? '-P %USERPROFILE%\\\\Desktop' : '-P ~/Desktop';
    const quote = isWindows ? '"' : "'";
    return `yt-dlp ${basePath} ${quote}${video.url}${quote}`;
  }
});