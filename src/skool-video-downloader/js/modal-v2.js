// Modal UI functionality with provider support

// Handle video selection from multiple videos modal
window.handleVideoSelect = function(encodedData, providerName) {
    try {
        const videoData = JSON.parse(atob(encodedData));
        
        // Get provider if available
        if (providerName && typeof videoProviderRegistry !== 'undefined') {
            videoData.provider = videoProviderRegistry.getProviderByName(providerName);
        }
        
        // Remove the multiple videos modal
        const multiModal = document.getElementById('skool-video-modal');
        if (multiModal) {
            multiModal.remove();
        }
        
        // Show the single video modal
        showModal(videoData);
    } catch (error) {
        console.error('Error handling video selection:', error);
    }
};

// Show modal with video information
function showModal(data) {
    // Remove existing modal if any
    const existingModal = document.getElementById('skool-video-modal');
    if (existingModal) existingModal.remove();
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'skool-video-modal';
    
    if (data.success) {
        const durationStr = data.duration ? 
            `${Math.floor(data.duration/60)}:${(data.duration%60).toString().padStart(2, '0')}` : 
            'Unknown';
        
        // Get download commands from provider if available
        let macCommand, winCommand;
        if (data.provider && data.provider.getDownloadCommand) {
            macCommand = data.provider.getDownloadCommand(data.videoUrl, false);
            winCommand = data.provider.getDownloadCommand(data.videoUrl, true);
        } else {
            // Fallback to legacy command generation
            macCommand = getDownloadCommand(data.videoUrl, data.type || 'unknown', false);
            winCommand = getDownloadCommand(data.videoUrl, data.type || 'unknown', true);
        }
            
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-btn" onclick="this.closest('#skool-video-modal').remove()">×</button>
                
                <p class="video-title">"${data.title}"</p>
                <p class="video-duration">Duration: ${durationStr}</p>
                ${data.location ? `<p class="video-location">Location: ${data.location}</p>` : ''}
                
                <div class="download-section">
                    <h3>Download Instructions</h3>
                    
                    <div class="os-section">
                        <div class="video-url-container">
                            <button onclick="navigator.clipboard.writeText('${macCommand.replace(/'/g, "\\'").replace(/"/g, "&quot;")}'); this.textContent='Copied!'">Copy Mac Command</button>
                        </div>
                        <ol>
                            <li>Click the 'Copy Mac Command' button above</li>
                            <li>Open Terminal application</li>
                            <li>Paste the command & press enter</li>
                        </ol>
                    </div>
                    
                    <div class="os-section">
                        <div class="video-url-container">
                            <button onclick="navigator.clipboard.writeText('${winCommand.replace(/'/g, "\\'").replace(/"/g, "&quot;")}'); this.textContent='Copied!'">Copy Windows Command</button>
                        </div>
                        <ol>
                            <li>Click the 'Copy Windows Command' button above</li>
                            <li>Open Command Prompt (cmd) or PowerShell</li>
                            <li>Paste the command & press enter</li>
                        </ol>
                    </div>
                    
                    <p class="download-note">The video will download to your desktop</p>
                    ${getProviderSpecificNotes(data.type)}
                </div>
                
                <div class="youtube-section">
                    <h3>Need help?</h3>
                    <p>If you're stuck ask for help in the <a href="https://serp.ly/@serp/community/support" target="_blank">Community</a></p>
                </div>
            </div>
        `;
    } else {
        modal.innerHTML = `
            <div class="modal-content error">
                <button class="close-btn" onclick="this.closest('#skool-video-modal').remove()">×</button>
                <h2>❌ Error</h2>
                <p>${data.message}</p>
                
                <div class="cta-section">
                    <p>Need help? Check out the tutorial:</p>
                    <a href="https://youtube.com/@devinschumacher" target="_blank" class="cta-button youtube">
                        Watch Tutorial on YouTube
                    </a>
                </div>
            </div>
        `;
    }
    
    document.body.appendChild(modal);
}

// Get provider-specific notes
function getProviderSpecificNotes(type) {
    switch (type) {
        case 'youtube':
            return '<p class="download-note" style="color: #059669;">✓ Will download in best quality (up to 1080p)</p>';
        case 'vimeo':
            return '<p class="download-note" style="color: #dc2626;">⚠️ If you get an OAuth error, the video may be private. Try using browser developer tools.</p>';
        case 'wistia':
            return '<p class="download-note" style="color: #0ea5e9;">ℹ️ Wistia videos may have multiple quality options available.</p>';
        case 'loom':
            return '<p class="download-note" style="color: #8b5cf6;">✓ Loom videos download in their original quality.</p>';
        case 'skool':
            return '<p class="download-note" style="color: #f59e0b;">✓ Native Skool video detected.</p>';
        default:
            return '';
    }
}

// Show modal for multiple videos
function showMultipleVideosModal(videos) {
    const existingModal = document.getElementById('skool-video-modal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'skool-video-modal';
    
    let videoButtons = videos.map((video, index) => {
        const provider = videoProviderRegistry.getProviderByName(video.provider || video.type);
        const providerName = provider ? provider.getDisplayName() : video.type;
        const location = video.location ? ` (${video.location})` : '';
        
        // Generate thumbnail for button
        let thumbnailHtml = '';
        if (video.thumbnail) {
            thumbnailHtml = `<img src="${video.thumbnail}" alt="${video.title}" style="width: 60px; height: 45px; object-fit: cover; border-radius: 4px; margin-right: 12px; vertical-align: middle;">`;
        } else if (video.type === 'youtube' && video.videoId) {
            thumbnailHtml = `<img src="https://img.youtube.com/vi/${video.videoId}/default.jpg" alt="${video.title}" style="width: 60px; height: 45px; object-fit: cover; border-radius: 4px; margin-right: 12px; vertical-align: middle;">`;
        }
        
        const videoData = {
            success: true,
            videoUrl: video.url,
            title: video.title.replace(/'/g, "\\'"),
            duration: video.duration || null,
            type: video.type || 'unknown',
            location: video.location || ''
        };
        
        return `<button onclick="window.handleVideoSelect('${btoa(JSON.stringify(videoData))}', '${provider ? provider.name : ''}')" class="video-select-btn" style="display: flex; align-items: center; width: 100%; text-align: left; padding: 12px;">
            ${thumbnailHtml}
            <span>${video.title} - ${providerName}${location}</span>
        </button>`;
    }).join('');
    
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-btn" onclick="this.closest('#skool-video-modal').remove()">×</button>
            <h2>Multiple Videos Found</h2>
            <p>Select a video to download:</p>
            <div class="video-list">
                ${videoButtons}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Legacy function for floating button (if needed)
window.downloadVideoUrl = function(url, title) {
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30);
    const content = url;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `video_${safeTitle}.txt`;
    a.click();
    URL.revokeObjectURL(downloadUrl);
}

// Make showModal available globally for inline onclick handlers
window.showModal = showModal;