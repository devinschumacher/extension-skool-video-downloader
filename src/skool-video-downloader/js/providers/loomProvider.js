// Loom video provider

class LoomProvider extends BaseVideoProvider {
    constructor() {
        super('loom');
    }
    
    canHandle(url) {
        return url.includes('loom.com');
    }
    
    extractVideoId(url) {
        const match = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
        return match ? match[1] : null;
    }
    
    getNormalizedUrl(videoId) {
        return `https://www.loom.com/share/${videoId}`;
    }
    
    detectInClassroom(document) {
        console.log('🎬 LoomProvider: Detecting in classroom/about page');
        const videos = [];
        const foundVideoIds = new Set();
        
        // First check for video elements with Loom indicators (native player)
        const videoResults = this.detectInCommunityPost(document.body);
        for (const video of videoResults) {
            if (!foundVideoIds.has(video.videoId)) {
                foundVideoIds.add(video.videoId);
                videos.push(video);
            }
        }
        
        // Loom videos in Skool classroom
        const nextDataScript = document.getElementById('__NEXT_DATA__');
        if (nextDataScript) {
            try {
                const content = nextDataScript.textContent;
                console.log('🎬 LoomProvider: Checking __NEXT_DATA__ for Loom references');
                
                const patterns = [
                    /loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/g,
                    /loom\.com\/(?:record|s)\/([a-zA-Z0-9]+)/g
                ];
                
                for (const pattern of patterns) {
                    let match;
                    while ((match = pattern.exec(content)) !== null) {
                        if (match[1] && !foundVideoIds.has(match[1])) {
                            console.log('🎬 LoomProvider: Found Loom video ID:', match[1]);
                            foundVideoIds.add(match[1]);
                            
                            // Try to find associated thumbnail in the content
                            let thumbnail = null;
                            const thumbnailRegex = new RegExp(`cdn\\.loom\\.com\\/sessions\\/thumbnails\\/${match[1]}-[a-zA-Z0-9]+\\.(?:gif|jpg|png)`, 'g');
                            const thumbnailMatch = thumbnailRegex.exec(content);
                            if (thumbnailMatch) {
                                thumbnail = thumbnailMatch[0];
                                if (!thumbnail.startsWith('http')) {
                                    thumbnail = 'https://' + thumbnail;
                                }
                                console.log('🎬 LoomProvider: Found associated thumbnail:', thumbnail);
                            }
                            
                            videos.push({
                                videoId: match[1],
                                url: this.getNormalizedUrl(match[1]),
                                thumbnail: thumbnail || this.getThumbnailUrl(match[1]),
                                provider: 'loom',
                                type: 'loom'
                            });
                        }
                    }
                }
            } catch (e) {
                console.error('🎬 LoomProvider: Error detecting Loom in page data:', e);
            }
        }
        
        // Also check script tags
        const allScripts = document.querySelectorAll('script');
        for (const script of allScripts) {
            if (script.textContent && script.textContent.includes('loom')) {
                const loomMatch = script.textContent.match(/loom\.com\/(?:share|embed|record|s)\/([a-zA-Z0-9]+)/);
                if (loomMatch && !foundVideoIds.has(loomMatch[1])) {
                    console.log('🎬 LoomProvider: Found Loom video ID in script:', loomMatch[1]);
                    foundVideoIds.add(loomMatch[1]);
                    
                    // Try to extract thumbnail from the same script
                    let thumbnail = null;
                    const thumbnailMatch = script.textContent.match(/cdn\.loom\.com\/sessions\/thumbnails\/([a-zA-Z0-9]+)-[a-zA-Z0-9]+\.(?:gif|jpg|png)/);
                    if (thumbnailMatch) {
                        thumbnail = thumbnailMatch[0];
                        if (!thumbnail.startsWith('http')) {
                            thumbnail = 'https://' + thumbnail;
                        }
                        console.log('🎬 LoomProvider: Found Loom thumbnail in script:', thumbnail);
                    }
                    
                    videos.push({
                        videoId: loomMatch[1],
                        url: this.getNormalizedUrl(loomMatch[1]),
                        thumbnail: thumbnail || this.getThumbnailUrl(loomMatch[1]),
                        provider: 'loom',
                        type: 'loom'
                    });
                }
            }
        }
        
        console.log('🎬 LoomProvider: Total Loom videos found in classroom:', videos.length);
        return videos;
    }
    
    detectInCommunityPost(element) {
        console.log('🎬 LoomProvider: Detecting in element:', element);
        const videos = [];
        const foundVideoIds = new Set(); // Track found IDs to avoid duplicates
        
        // Check for ALL iframes first
        const allIframes = element.querySelectorAll('iframe');
        console.log('🎬 LoomProvider: Found', allIframes.length, 'total iframes');
        
        for (const iframe of allIframes) {
            console.log('🎬 LoomProvider: Checking iframe src:', iframe.src);
            if (iframe.src && iframe.src.includes('loom.com')) {
                const videoId = this.extractVideoId(iframe.src);
                console.log('🎬 LoomProvider: Extracted video ID:', videoId);
                if (videoId && !foundVideoIds.has(videoId)) {
                    foundVideoIds.add(videoId);
                    videos.push({
                        videoId: videoId,
                        url: this.getNormalizedUrl(videoId),
                        element: iframe,
                        thumbnail: this.extractThumbnailFromElement(iframe.parentElement) || this.getThumbnailUrl(videoId),
                        provider: 'loom',
                        type: 'loom'
                    });
                }
            }
        }
        
        // Check for Loom links
        const links = element.querySelectorAll('a[href*="loom.com"]');
        console.log('🎬 LoomProvider: Found', links.length, 'Loom links');
        for (const link of links) {
            const videoId = this.extractVideoId(link.href);
            if (videoId && !foundVideoIds.has(videoId)) {
                foundVideoIds.add(videoId);
                videos.push({
                    videoId: videoId,
                    url: this.getNormalizedUrl(videoId),
                    element: link,
                    thumbnail: this.extractThumbnailFromElement(link.parentElement) || this.getThumbnailUrl(videoId),
                    provider: 'loom',
                    type: 'loom'
                });
            }
        }
        
        // Check for data attributes
        const dataElements = element.querySelectorAll('[data-loom-id], [data-loom-video-id], [data-embed-url*="loom"], [data-src*="loom"]');
        console.log('🎬 LoomProvider: Found', dataElements.length, 'data elements');
        for (const el of dataElements) {
            const videoId = el.dataset.loomId || el.dataset.loomVideoId || this.extractVideoId(el.dataset.embedUrl || el.dataset.src || '');
            if (videoId && !foundVideoIds.has(videoId)) {
                foundVideoIds.add(videoId);
                videos.push({
                    videoId: videoId,
                    url: this.getNormalizedUrl(videoId),
                    element: el,
                    thumbnail: this.extractThumbnailFromElement(el) || this.getThumbnailUrl(videoId),
                    provider: 'loom',
                    type: 'loom'
                });
            }
        }
        
        // Check for native video elements with Loom indicators
        const videoElements = element.querySelectorAll('video[id*="Loom"], video[data-loom-video-id], video track[src*="loom.com"]');
        console.log('🎬 LoomProvider: Found', videoElements.length, 'video elements with Loom indicators');
        
        for (const video of videoElements) {
            let videoId = null;
            
            // Check data-loom-video-id attribute
            if (video.getAttribute('data-loom-video-id')) {
                videoId = video.getAttribute('data-loom-video-id');
                console.log('🎬 LoomProvider: Found video ID from data-loom-video-id:', videoId);
            }
            
            // Check track elements for Loom captions
            if (!videoId) {
                const tracks = video.querySelectorAll('track[src*="loom.com"]');
                for (const track of tracks) {
                    // Extract ID from caption URL pattern: /captions/424ec901359b42ffbaec08b7bab8aabb-19.vtt
                    const match = track.src.match(/\/captions\/([a-zA-Z0-9]+)(?:-\d+)?\.vtt/);
                    if (match) {
                        videoId = match[1];
                        console.log('🎬 LoomProvider: Found video ID from caption URL:', videoId);
                        break;
                    }
                }
            }
            
            if (videoId && !foundVideoIds.has(videoId)) {
                foundVideoIds.add(videoId);
                videos.push({
                    videoId: videoId,
                    url: this.getNormalizedUrl(videoId),
                    element: video,
                    thumbnail: this.extractThumbnailFromElement(video) || this.getThumbnailUrl(videoId),
                    provider: 'loom',
                    type: 'loom'
                });
            }
        }
        
        console.log('🎬 LoomProvider: Total videos found:', videos.length);
        return videos.length > 0 ? videos : [];
    }
    
    getSelectors() {
        return {
            iframe: ['iframe[src*="loom.com"]'],
            link: ['a[href*="loom.com"]'],
            embed: [
                '[data-loom-id]', 
                '[data-loom-video-id]',
                '[data-embed-url*="loom"]',
                'video[id*="Loom"]',
                'video[data-loom-video-id]',
                'video:has(track[src*="loom.com"])'
            ],
            thumbnail: []
        };
    }
    
    getThumbnailUrl(videoId) {
        // Loom thumbnail URL pattern
        // Format: https://cdn.loom.com/sessions/thumbnails/{videoId}-00001.jpg
        if (videoId && videoId.length > 10) { // Valid Loom IDs are typically 32 chars
            return `https://cdn.loom.com/sessions/thumbnails/${videoId}-00001.jpg`;
        }
        return null;
    }
    
    extractThumbnailFromElement(element) {
        if (!element) return null;
        
        // Check nearby script tags for thumbnail data
        const scripts = element.querySelectorAll('script');
        for (const script of scripts) {
            if (script.textContent) {
                const thumbnailMatch = script.textContent.match(/cdn\.loom\.com\/sessions\/thumbnails\/[a-zA-Z0-9]+-[a-zA-Z0-9]+\.(?:gif|jpg|png)/);
                if (thumbnailMatch) {
                    let thumbnail = thumbnailMatch[0];
                    if (!thumbnail.startsWith('http')) {
                        thumbnail = 'https://' + thumbnail;
                    }
                    console.log('🎬 LoomProvider: Found thumbnail in element script:', thumbnail);
                    return thumbnail;
                }
            }
        }
        
        // Check parent element for scripts
        if (element.parentElement) {
            const parentScripts = element.parentElement.querySelectorAll('script');
            for (const script of parentScripts) {
                if (script.textContent) {
                    const thumbnailMatch = script.textContent.match(/cdn\.loom\.com\/sessions\/thumbnails\/[a-zA-Z0-9]+-[a-zA-Z0-9]+\.(?:gif|jpg|png)/);
                    if (thumbnailMatch) {
                        let thumbnail = thumbnailMatch[0];
                        if (!thumbnail.startsWith('http')) {
                            thumbnail = 'https://' + thumbnail;
                        }
                        console.log('🎬 LoomProvider: Found thumbnail in parent script:', thumbnail);
                        return thumbnail;
                    }
                }
            }
        }
        
        return null;
    }
}