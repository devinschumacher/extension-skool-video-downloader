// Skool classroom-specific video extraction

// Extract video from Skool classroom data
function extractClassroomVideo(courseId) {
    const nextDataScript = document.getElementById('__NEXT_DATA__');
    if (!nextDataScript) return null;
    
    try {
        const nextData = JSON.parse(nextDataScript.textContent);
        const course = findCourseById(nextData, courseId);
        
        if (!course || !course.metadata || !course.metadata.videoLink) {
            return null;
        }
        
        const metadata = course.metadata;
        let videoUrl = metadata.videoLink;
        const title = metadata.title || 'Untitled Lesson';
        const duration = metadata.videoLenMs ? Math.round(metadata.videoLenMs / 1000) : null;
        
        const platform = detectPlatform(videoUrl);
        const videoId = extractVideoId(videoUrl, platform);
        
        if (videoId) {
            videoUrl = normalizeVideoUrl(videoUrl, platform, videoId);
        }
        
        return {
            url: videoUrl,
            title: title,
            videoId: videoId,
            type: platform,
            duration: duration
        };
        
    } catch (e) {
        console.error('Error extracting classroom video:', e);
        return null;
    }
}

// Recursive search function for course data
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

// Search for videos in page data
function searchPageDataForVideos() {
    const videos = [];
    const nextDataScript = document.getElementById('__NEXT_DATA__');
    
    if (nextDataScript) {
        try {
            const nextDataStr = nextDataScript.textContent;
            
            // Look for video URLs in the JSON data
            const patterns = [
                /loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/g,
                /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/g,
                /vimeo\.com\/([0-9]+)/g,
                /wistia\.com\/medias\/([a-zA-Z0-9]+)/g
            ];
            
            for (const pattern of patterns) {
                let match;
                while ((match = pattern.exec(nextDataStr)) !== null) {
                    const videoId = match[1];
                    const platform = detectPlatform(match[0]);
                    
                    if (videoId && platform !== 'unknown') {
                        const videoUrl = normalizeVideoUrl(match[0], platform, videoId);
                        
                        videos.push({
                            url: videoUrl,
                            title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`,
                            videoId: videoId,
                            type: platform
                        });
                        
                        // Only take first video found
                        return videos;
                    }
                }
            }
        } catch (e) {
            console.error('Error searching page data:', e);
        }
    }
    
    return videos;
}