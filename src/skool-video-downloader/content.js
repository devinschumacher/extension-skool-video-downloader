// Content script - runs on Skool classroom pages

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractVideo') {
        extractVideoForPopup(sendResponse);
        return true; // Indicates async response
    }
});

// Extract video and show modal
function extractVideo() {
    console.log('🎥 Extract video clicked');
    
    // First check for Loom iframes on the page
    const loomIframes = document.querySelectorAll('iframe[src*="loom.com"]');
    if (loomIframes.length > 0) {
        extractLoomVideosFromIframes(loomIframes);
        return;
    }
    
    // If no iframes, check if we're on a classroom page with lesson data
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('md');
    
    if (courseId) {
        extractClassroomVideo(courseId);
        return;
    }
    
    // No videos found
    showModal({
        success: false,
        message: 'No videos found on this page. Make sure you are on a page with a Loom video.'
    });
}

// Extract Loom videos from iframes
function extractLoomVideosFromIframes(iframes) {
    console.log('🔍 Found Loom iframes:', iframes.length);
    
    const videos = [];
    iframes.forEach((iframe, index) => {
        const src = iframe.src;
        if (src) {
            // Extract Loom video ID from the URL
            const loomMatch = src.match(/loom\.com\/embed\/([a-zA-Z0-9]+)/);
            if (loomMatch) {
                const videoId = loomMatch[1];
                const videoUrl = `https://www.loom.com/share/${videoId}`;
                videos.push({
                    url: videoUrl,
                    title: `Loom Video ${index + 1}`
                });
            }
        }
    });
    
    if (videos.length === 0) {
        showModal({
            success: false,
            message: 'Could not extract Loom video URLs. The video format may not be supported.'
        });
        return;
    }
    
    // If there's only one video, show it directly
    if (videos.length === 1) {
        showModal({
            success: true,
            videoUrl: videos[0].url,
            title: videos[0].title,
            duration: null
        });
    } else {
        // If multiple videos, let user choose
        showMultipleVideosModal(videos);
    }
}

// Extract video from classroom lesson
function extractClassroomVideo(courseId) {
    console.log('📚 Course ID from URL:', courseId);
    
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
                    <h3>Download Instructions</h3>
                    
                    <div class="os-section">
                        <div class="video-url-container">
                            <button onclick="navigator.clipboard.writeText('yt-dlp -P ~/Desktop \\'${data.videoUrl}\\''); this.textContent='Copied!'">Copy Mac Command</button>
                        </div>
                        <ol>
                            <li>Click the 'Copy Mac Command' button above</li>
                            <li>Open Terminal application</li>
                            <li>Paste the command & press enter</li>
                        </ol>
                    </div>
                    
                    <div class="os-section">
                        <div class="video-url-container">
                            <button onclick="navigator.clipboard.writeText('yt-dlp -P %USERPROFILE%\\\\Desktop \\"${data.videoUrl}\\"'); this.textContent='Copied!'">Copy Windows Command</button>
                        </div>
                        <ol>
                            <li>Click the 'Copy Windows Command' button above</li>
                            <li>Open Command Prompt (cmd) or PowerShell</li>
                            <li>Paste the command & press enter</li>
                        </ol>
                    </div>
                    
                    <p class="download-note">The video will download to your desktop</p>
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

// Show modal for multiple videos
function showMultipleVideosModal(videos) {
    const existingModal = document.getElementById('skool-video-modal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'skool-video-modal';
    
    let videoButtons = videos.map((video, index) => 
        `<button onclick="showModal({success: true, videoUrl: '${video.url}', title: '${video.title}', duration: null}); this.closest('#skool-video-modal').remove()" class="video-select-btn">
            ${video.title}
        </button>`
    ).join('');
    
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-btn" onclick="this.closest('#skool-video-modal').remove()">×</button>
            <h2>Multiple Loom Videos Found</h2>
            <p>Select a video to download:</p>
            <div class="video-list">
                ${videoButtons}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Extract video for popup response
async function extractVideoForPopup(sendResponse) {
    const videos = [];
    
    // First check for Loom iframes on the page
    const loomIframes = document.querySelectorAll('iframe[src*="loom.com"]');
    if (loomIframes.length > 0) {
        for (let index = 0; index < loomIframes.length; index++) {
            const iframe = loomIframes[index];
            const src = iframe.src;
            if (src) {
                const loomMatch = src.match(/loom\.com\/embed\/([a-zA-Z0-9]+)/);
                if (loomMatch) {
                    const videoId = loomMatch[1];
                    const videoUrl = `https://www.loom.com/share/${videoId}`;
                    
                    // Try to get video title from iframe attributes or nearby text
                    let title = `Loom Video ${index + 1}`;
                    
                    // Check if iframe has a title attribute
                    if (iframe.title) {
                        title = iframe.title;
                    } else {
                        // Look for nearby heading or text that might be the title
                        const parent = iframe.closest('div, article, section');
                        if (parent) {
                            const heading = parent.querySelector('h1, h2, h3, h4, h5, h6');
                            if (heading && heading.textContent.trim()) {
                                title = heading.textContent.trim();
                            }
                        }
                    }
                    
                    videos.push({
                        url: videoUrl,
                        title: title,
                        videoId: videoId,
                        type: 'loom'
                    });
                }
            }
        }
    }
    
    // Check if we're on a classroom page with lesson data
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('md');
    
    if (courseId) {
        const nextDataScript = document.getElementById('__NEXT_DATA__');
        if (nextDataScript) {
            try {
                const nextData = JSON.parse(nextDataScript.textContent);
                const course = findCourseById(nextData, courseId);
                
                if (course && course.metadata && course.metadata.videoLink) {
                    const metadata = course.metadata;
                    let videoUrl = metadata.videoLink;
                    const title = metadata.title || 'Untitled Lesson';
                    
                    // Clean YouTube URL
                    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
                        if (videoUrl.includes('youtube.com/watch')) {
                            const urlObj = new URL(videoUrl);
                            videoUrl = `https://www.youtube.com/watch?v=${urlObj.searchParams.get('v')}`;
                        } else if (videoUrl.includes('youtu.be/')) {
                            const videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
                            videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
                        }
                    } else if (videoUrl.includes('loom.com')) {
                        // Clean Loom URL
                        videoUrl = videoUrl.split('?')[0];
                    }
                    
                    videos.push({
                        url: videoUrl,
                        title: title,
                        type: videoUrl.includes('youtube') ? 'youtube' : 'loom'
                    });
                }
            } catch (e) {
                console.error('Error extracting classroom video:', e);
            }
        }
    }
    
    sendResponse({ videos: videos });
}