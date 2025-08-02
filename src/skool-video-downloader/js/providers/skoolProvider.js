// Skool.com native video provider (for videos hosted directly on Skool)

class SkoolProvider extends BaseVideoProvider {
    constructor() {
        super('skool');
    }
    
    canHandle(url) {
        // Skool native videos are typically hosted on CDN URLs or blob URLs
        return (url.includes('skool.com') && 
               (url.includes('/video/') || url.includes('.mp4') || url.includes('cdn'))) ||
               url.includes('video.skool.com') ||
               url.startsWith('blob:https://www.skool.com/');
    }
    
    extractVideoId(url) {
        // Skool videos might not have traditional IDs, use URL hash
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        return pathParts[pathParts.length - 1] || null;
    }
    
    getNormalizedUrl(videoId) {
        // For Skool native videos, the ID might be the full URL
        if (videoId.startsWith('http')) {
            return videoId;
        }
        // Otherwise construct a URL
        return `https://www.skool.com/video/${videoId}`;
    }
    
    detectInClassroom(document) {
        console.log('🎬 SkoolProvider: Detecting in classroom/about page');
        const videos = [];
        const foundVideoIds = new Set();
        
        // First check for video elements (including blob videos)
        const videoResults = this.detectInCommunityPost(document.body);
        for (const video of videoResults) {
            if (!foundVideoIds.has(video.videoId)) {
                foundVideoIds.add(video.videoId);
                videos.push(video);
            }
        }
        
        // Look for Skool native videos in classroom data
        const nextDataScript = document.getElementById('__NEXT_DATA__');
        if (nextDataScript) {
            try {
                const content = nextDataScript.textContent;
                console.log('🎬 SkoolProvider: Checking __NEXT_DATA__ for Skool videos');
                
                // Look for CDN video URLs and video IDs
                const patterns = [
                    /(https:\/\/[^"]*\.skool\.com[^"]*\.mp4)/g,
                    /(https:\/\/[^"]*skool[^"]*\.mp4)/g,
                    /["']videoUrl["']\s*:\s*["']([^"']+\.mp4)["']/g,
                    /video\.skool\.com\/([a-zA-Z0-9_-]+)/g,
                    /["']videoId["']\s*:\s*["']([a-zA-Z0-9_-]+)["']/g
                ];
                
                for (const pattern of patterns) {
                    let match;
                    while ((match = pattern.exec(content)) !== null) {
                        if (match[1]) {
                            let videoId, url;
                            
                            // Check if it's a video ID or full URL
                            if (match[1].startsWith('http')) {
                                if (this.canHandle(match[1])) {
                                    videoId = this.extractVideoId(match[1]);
                                    url = match[1];
                                }
                            } else {
                                // It's just a video ID
                                videoId = match[1];
                                url = `https://video.skool.com/${videoId}`;
                            }
                            
                            if (videoId && !foundVideoIds.has(videoId)) {
                                console.log('🎬 SkoolProvider: Found Skool video:', videoId);
                                foundVideoIds.add(videoId);
                                videos.push({
                                    videoId: videoId,
                                    url: url,
                                    thumbnail: this.getThumbnailUrl(videoId),
                                    provider: 'skool',
                                    type: 'skool'
                                });
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('🎬 SkoolProvider: Error detecting Skool video in page data:', e);
            }
        }
        
        // Also check script tags
        const allScripts = document.querySelectorAll('script');
        for (const script of allScripts) {
            if (script.textContent && (script.textContent.includes('.mp4') || script.textContent.includes('video.skool.com'))) {
                // Look for MP4 URLs
                const mp4Match = script.textContent.match(/(https:\/\/[^"'\s]*\.mp4)/);
                if (mp4Match && this.canHandle(mp4Match[1])) {
                    const videoId = this.extractVideoId(mp4Match[1]);
                    if (!foundVideoIds.has(videoId)) {
                        console.log('🎬 SkoolProvider: Found Skool video in script:', mp4Match[1]);
                        foundVideoIds.add(videoId);
                        videos.push({
                            videoId: videoId,
                            url: mp4Match[1],
                            thumbnail: this.getThumbnailUrl(videoId),
                            provider: 'skool',
                            type: 'skool'
                        });
                    }
                }
                
                // Look for video.skool.com references
                const videoMatch = script.textContent.match(/video\.skool\.com\/([a-zA-Z0-9_-]+)/);
                if (videoMatch) {
                    const videoId = videoMatch[1];
                    if (!foundVideoIds.has(videoId)) {
                        console.log('🎬 SkoolProvider: Found Skool video ID in script:', videoId);
                        foundVideoIds.add(videoId);
                        videos.push({
                            videoId: videoId,
                            url: `https://video.skool.com/${videoId}`,
                            thumbnail: this.getThumbnailUrl(videoId),
                            provider: 'skool',
                            type: 'skool'
                        });
                    }
                }
            }
        }
        
        console.log('🎬 SkoolProvider: Total Skool videos found:', videos.length);
        return videos;
    }
    
    detectInCommunityPost(element) {
        console.log('🎬 SkoolProvider: Detecting in element:', element);
        const videos = [];
        const foundVideoIds = new Set(); // Track found IDs to avoid duplicates
        
        // Check for video elements
        const videoElements = element.querySelectorAll('video');
        console.log('🎬 SkoolProvider: Found', videoElements.length, 'video elements');
        for (const video of videoElements) {
            const src = video.src || video.querySelector('source')?.src;
            console.log('🎬 SkoolProvider: Checking video src:', src);
            
            // For blob videos, try to extract ID from track elements
            if (src && src.startsWith('blob:')) {
                // Look for storyboard track which contains the video ID
                const storyboardTrack = video.querySelector('track[src*="storyboard.vtt"]');
                if (storyboardTrack) {
                    const match = storyboardTrack.src.match(/\/([a-zA-Z0-9_-]+)\/storyboard\.vtt/);
                    if (match) {
                        const videoId = match[1];
                        console.log('🎬 SkoolProvider: Found video ID from storyboard:', videoId);
                        if (!foundVideoIds.has(videoId)) {
                            foundVideoIds.add(videoId);
                            videos.push({
                                videoId: videoId,
                                url: `https://video.skool.com/${videoId}`,
                                element: video,
                                thumbnail: this.extractThumbnailFromVideo(video, videoId),
                                provider: 'skool',
                                type: 'skool'
                            });
                        }
                    }
                }
                
                // Also check for any track with video.skool.com URL
                const tracks = video.querySelectorAll('track');
                for (const track of tracks) {
                    if (track.src && track.src.includes('video.skool.com')) {
                        const match = track.src.match(/video\.skool\.com\/([a-zA-Z0-9_-]+)\//);
                        if (match) {
                            const videoId = match[1];
                            if (!foundVideoIds.has(videoId)) {
                                foundVideoIds.add(videoId);
                                videos.push({
                                    videoId: videoId,
                                    url: `https://video.skool.com/${videoId}`,
                                    element: video,
                                    thumbnail: this.extractThumbnailFromVideo(video, videoId),
                                    provider: 'skool',
                                    type: 'skool'
                                });
                            }
                        }
                    }
                }
            } else if (src && this.canHandle(src)) {
                const videoId = this.extractVideoId(src);
                if (!foundVideoIds.has(videoId)) {
                    foundVideoIds.add(videoId);
                    videos.push({
                        videoId: videoId,
                        url: src,
                        element: video,
                        thumbnail: this.extractThumbnailFromVideo(video, videoId),
                        provider: 'skool',
                        type: 'skool'
                    });
                }
            }
        }
        
        // Check for video links
        const links = element.querySelectorAll('a[href*=".mp4"], a[href*="skool.com"]');
        console.log('🎬 SkoolProvider: Found', links.length, 'potential video links');
        for (const link of links) {
            console.log('🎬 SkoolProvider: Checking link href:', link.href);
            if (this.canHandle(link.href)) {
                const videoId = this.extractVideoId(link.href);
                if (!foundVideoIds.has(videoId)) {
                    foundVideoIds.add(videoId);
                    videos.push({
                        videoId: videoId,
                        url: link.href,
                        element: link,
                        provider: 'skool',
                        type: 'skool'
                    });
                }
            }
        }
        
        // Check for data attributes with video URLs
        const dataElements = element.querySelectorAll('[data-video-url], [data-src*=".mp4"]');
        console.log('🎬 SkoolProvider: Found', dataElements.length, 'data elements');
        for (const el of dataElements) {
            const videoUrl = el.dataset.videoUrl || el.dataset.src;
            if (videoUrl && this.canHandle(videoUrl)) {
                const videoId = this.extractVideoId(videoUrl);
                if (!foundVideoIds.has(videoId)) {
                    foundVideoIds.add(videoId);
                    videos.push({
                        videoId: videoId,
                        url: videoUrl,
                        element: el,
                        provider: 'skool',
                        type: 'skool'
                    });
                }
            }
        }
        
        console.log('🎬 SkoolProvider: Total videos found:', videos.length);
        return videos.length > 0 ? videos : [];
    }
    
    getSelectors() {
        return {
            iframe: [],
            link: ['a[href*=".mp4"]'],
            embed: ['video', '[data-video-url]'],
            thumbnail: []
        };
    }
    
    // Extract thumbnail from video element or generate from video ID
    extractThumbnailFromVideo(video, videoId) {
        // First try the base extractThumbnailFromElement method
        const baseThumbnail = this.extractThumbnailFromElement(video);
        if (baseThumbnail) {
            return baseThumbnail;
        }
        
        // For Skool videos, generate thumbnail URL from video ID
        if (videoId && !videoId.startsWith('http')) {
            return this.getThumbnailUrl(videoId);
        }
        
        return null;
    }
    
    getThumbnailUrl(videoId) {
        // Skool video thumbnail pattern
        // Format: https://image.video.skool.com/{videoId}/thumbnail.jpg
        if (videoId && !videoId.startsWith('http')) {
            return `https://image.video.skool.com/${videoId}/thumbnail.jpg`;
        }
        return null;
    }
}