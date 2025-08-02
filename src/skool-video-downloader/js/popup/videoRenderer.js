// Video rendering and HTML generation

import { generateDownloadCommand, escapeCommandForHtml } from './downloadCommands.js';

// Video icons for different platforms
const VIDEO_ICONS = {
  youtube: '📺',
  vimeo: '🎬',
  loom: '🎥',
  wistia: '🎞️',
  skool: '🎓'
};

// Generate thumbnail HTML
export function generateThumbnailHtml(video) {
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
  
  // Show a nice placeholder with video icon
  const icon = VIDEO_ICONS[video.type] || '📹';
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
}

// Generate platform-specific notes
export function generatePlatformNotes(video) {
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
}

// Generate video card HTML
export function generateVideoCard(video) {
  const macCmd = generateDownloadCommand(video, false);
  const winCmd = generateDownloadCommand(video, true);
  const macCmdEscaped = escapeCommandForHtml(macCmd);
  const winCmdEscaped = escapeCommandForHtml(winCmd);
  
  const thumbnailHtml = generateThumbnailHtml(video);
  const platformNotes = generatePlatformNotes(video);
  
  return `
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
      
      ${platformNotes}
    </div>
  `;
}

// Generate instructions HTML
export function generateInstructionsHtml() {
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
}

// Generate support link HTML
export function generateSupportLink() {
  return `
    <p style="font-size: 12px; color: #6b7280; margin-top: 12px; text-align: center;">
      Need help? Visit 
      <a href="https://serp.ly/@serp/community/support" target="_blank" style="color: #3b82f6;">support</a>
    </p>
  `;
}

// Generate complete videos list HTML
export function generateVideosHtml(videos) {
  const videoCards = videos.map(generateVideoCard).join('');
  const instructions = generateInstructionsHtml();
  const supportLink = generateSupportLink();
  
  return `
    <div>
      ${videoCards}
      ${instructions}
      ${supportLink}
    </div>
  `;
}