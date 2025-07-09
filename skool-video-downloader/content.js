// Content script - runs on Skool classroom pages

// Check license before initializing
async function checkLicenseAndInit() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'checkLicense' });
        if (response && response.isValid) {
            // License is valid, create the download button
            createDownloadButton();
        } else {
            console.log('SERP Skool Video Downloader: Extension not activated');
        }
    } catch (error) {
        console.error('SERP Skool Video Downloader: License check failed', error);
    }
}

// Create floating download button
function createDownloadButton() {
    const button = document.createElement('button');
    button.id = 'skool-video-downloader-btn';
    button.innerHTML = `
        <img src="https://github.com/devinschumacher.png" style="width: 30px; height: 30px; margin-right: 8px;">
        <span>Download Video</span>
    `;
    button.addEventListener('click', extractVideo);
    document.body.appendChild(button);
}

// Extract video and show modal
function extractVideo() {
    console.log('🎥 Extract video clicked');
    
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('md');
    
    console.log('📚 Course ID from URL:', courseId);
    
    if (!courseId) {
        showModal({
            success: false,
            message: 'This page does not have a lesson video. Navigate to a specific lesson with ?md= in the URL.'
        });
        return;
    }
    
    // Find course data
    const nextDataScript = document.getElementById('__NEXT_DATA__');
    if (!nextDataScript) {
        showModal({
            success: false,
            message: 'Could not find page data.'
        });
        return;
    }
    
    try {
        const nextData = JSON.parse(nextDataScript.textContent);
        console.log('🔍 Searching for course with ID:', courseId);
        
        const course = findCourseById(nextData, courseId);
        
        if (!course) {
            console.log('❌ Could not find course in data');
            showModal({
                success: false,
                message: 'Could not find video on this page. Make sure you are on a lesson page.'
            });
            return;
        }
        
        // Extract video info
        const metadata = course.metadata;
        let videoUrl = metadata.videoLink;
        const title = metadata.title || 'Untitled Lesson';
        const duration = metadata.videoLenMs ? Math.round(metadata.videoLenMs / 1000) : null;
        
        // Check if it's YouTube or Loom
        let videoType = 'unknown';
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
            videoType = 'youtube';
            // Clean YouTube URL - keep only video ID
            if (videoUrl.includes('youtube.com/watch')) {
                const urlObj = new URL(videoUrl);
                videoUrl = `https://www.youtube.com/watch?v=${urlObj.searchParams.get('v')}`;
            } else if (videoUrl.includes('youtu.be/')) {
                const videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
                videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            }
        } else if (videoUrl.includes('loom.com')) {
            videoType = 'loom';
            // Clean Loom URL
            videoUrl = videoUrl.split('?')[0];
        }
        
        console.log('✅ Found video:', title, videoUrl, `(${videoType})`);
        
        // Show success modal with CTAs
        showModal({
            success: true,
            videoUrl: videoUrl,
            title: title,
            duration: duration
        });
        
    } catch (e) {
        showModal({
            success: false,
            message: 'Error extracting video. See console for details.'
        });
        console.error('❌ Error:', e);
    }
}

// Recursive search function
function findCourseById(obj, targetId) {
    if (!obj || typeof obj !== 'object') return null;
    
    if (obj.id === targetId && obj.metadata && obj.metadata.videoLink) {
        return obj;
    }
    
    if (obj.course && obj.course.id === targetId && obj.course.metadata && obj.course.metadata.videoLink) {
        return obj.course;
    }
    
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            const result = findCourseById(obj[key], targetId);
            if (result) return result;
        }
    }
    
    return null;
}

// Show modal with CTAs
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
            
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-btn" onclick="this.closest('#skool-video-modal').remove()">×</button>
                
                <p class="video-title">"${data.title}"</p>
                <p class="video-duration">Duration: ${durationStr}</p>
                
                <div class="download-section">
                    <div class="video-url-container">
                        <input type="text" value="yt-dlp &quot;${data.videoUrl}&quot;" readonly>
                        <button onclick="navigator.clipboard.writeText('yt-dlp \\'${data.videoUrl}\\''); this.textContent='Copied!'">Copy Command</button>
                    </div>
                    <p class="download-hint">Paste this command in your terminal to download</p>
                </div>
                
                <div class="youtube-section">
                    <h3>How to use</h3>
                    <div class="youtube-embed">
                        <iframe width="100%" height="200" 
                            src="https://www.youtube.com/embed/WRSzeFI_Q7g?si=DIaq34kWZBAVaTHG" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen>
                        </iframe>
                    </div>
                    <a href="https://serp.ly/@devinschumacher/youtube" target="_blank" class="cta-button youtube">
                        Subscribe on YouTube
                    </a>
                </div>
                
                <div class="email-signup">
                    <h3>Subscribe for Extras</h3>
                    <a href="https://serp.ly/@devin/email" target="_blank" class="email-button">
                        Join Newsletter →
                    </a>
                </div>
                
                <div class="social-links">
                    <a href="https://twitter.com/dvnschmchr" target="_blank">Twitter</a>
                    <a href="https://github.com/devinschumacher" target="_blank">GitHub</a>
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

// Download video URL as file
window.downloadVideoUrl = function(url, title) {
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30);
    const content = url;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `loom_${safeTitle}.txt`;
    a.click();
    URL.revokeObjectURL(downloadUrl);
}

// Email signup handler
window.signupEmail = function() {
    const email = document.getElementById('email-input').value;
    if (email) {
        // Replace with your actual email signup endpoint
        alert(`Thanks for signing up with: ${email}\n\nReplace this with your actual email service integration!`);
        // window.open(`https://your-email-service.com/signup?email=${encodeURIComponent(email)}`, '_blank');
    }
}

// Initialize on page load
if (window.location.pathname.includes('/classroom/')) {
    checkLicenseAndInit();
}