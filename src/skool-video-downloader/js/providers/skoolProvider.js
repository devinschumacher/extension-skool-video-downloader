// Skool.com native video provider (for videos hosted directly on Skool)

class SkoolProvider extends BaseVideoProvider {
    constructor() {
        super('skool');
    }
    
    canHandle(url) {
        // Skool native videos are typically hosted on CDN URLs
        return url.includes('skool.com') && 
               (url.includes('/video/') || url.includes('.mp4') || url.includes('cdn'));
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
        
        // Look for Skool native videos in classroom data
        const nextDataScript = document.getElementById('__NEXT_DATA__');
        if (nextDataScript) {
            try {
                const content = nextDataScript.textContent;
                console.log('🎬 SkoolProvider: Checking __NEXT_DATA__ for Skool videos');
                
                // Look for CDN video URLs
                const patterns = [
                    /(https:\/\/[^"]*\.skool\.com[^"]*\.mp4)/g,
                    /(https:\/\/[^"]*skool[^"]*\.mp4)/g,
                    /["']videoUrl["']\s*:\s*["']([^"']+\.mp4)["']/g
                ];
                
                for (const pattern of patterns) {
                    let match;
                    while ((match = pattern.exec(content)) !== null) {
                        if (match[1] && this.canHandle(match[1])) {
                            console.log('🎬 SkoolProvider: Found Skool video URL:', match[1]);
                            return [{
                                videoId: match[1],
                                url: match[1],
                                provider: 'skool',
                                type: 'skool'
                            }];
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
            if (script.textContent && script.textContent.includes('.mp4')) {
                const mp4Match = script.textContent.match(/(https:\/\/[^"'\s]*\.mp4)/);
                if (mp4Match && this.canHandle(mp4Match[1])) {
                    console.log('🎬 SkoolProvider: Found Skool video in script:', mp4Match[1]);
                    return [{
                        videoId: mp4Match[1],
                        url: mp4Match[1],
                        provider: 'skool',
                        type: 'skool'
                    }];
                }
            }
        }
        
        console.log('🎬 SkoolProvider: No Skool videos found');
        return [];
    }
    
    detectInCommunityPost(element) {
        console.log('🎬 SkoolProvider: Detecting in element:', element);
        const videos = [];
        
        // Check for video elements
        const videoElements = element.querySelectorAll('video');
        console.log('🎬 SkoolProvider: Found', videoElements.length, 'video elements');
        for (const video of videoElements) {
            const src = video.src || video.querySelector('source')?.src;
            console.log('🎬 SkoolProvider: Checking video src:', src);
            if (src && this.canHandle(src)) {
                videos.push({
                    videoId: src,
                    url: src,
                    element: video,
                    provider: 'skool',
                    type: 'skool'
                });
            }
        }
        
        // Check for video links
        const links = element.querySelectorAll('a[href*=".mp4"], a[href*="skool.com"]');
        console.log('🎬 SkoolProvider: Found', links.length, 'potential video links');
        for (const link of links) {
            console.log('🎬 SkoolProvider: Checking link href:', link.href);
            if (this.canHandle(link.href)) {
                videos.push({
                    videoId: link.href,
                    url: link.href,
                    element: link,
                    provider: 'skool',
                    type: 'skool'
                });
            }
        }
        
        // Check for data attributes with video URLs
        const dataElements = element.querySelectorAll('[data-video-url], [data-src*=".mp4"]');
        console.log('🎬 SkoolProvider: Found', dataElements.length, 'data elements');
        for (const el of dataElements) {
            const videoUrl = el.dataset.videoUrl || el.dataset.src;
            if (videoUrl && this.canHandle(videoUrl)) {
                videos.push({
                    videoId: videoUrl,
                    url: videoUrl,
                    element: el,
                    provider: 'skool',
                    type: 'skool'
                });
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
}