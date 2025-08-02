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
                        if (match[1]) {
                            console.log('🎬 LoomProvider: Found Loom video ID:', match[1]);
                            return [{
                                videoId: match[1],
                                url: this.getNormalizedUrl(match[1]),
                                thumbnail: this.getThumbnailUrl(match[1]),
                                provider: 'loom',
                                type: 'loom'
                            }];
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
                if (loomMatch) {
                    console.log('🎬 LoomProvider: Found Loom video ID in script:', loomMatch[1]);
                    return [{
                        videoId: loomMatch[1],
                        url: this.getNormalizedUrl(loomMatch[1]),
                        thumbnail: this.getThumbnailUrl(loomMatch[1]),
                        provider: 'loom',
                        type: 'loom'
                    }];
                }
            }
        }
        
        console.log('🎬 LoomProvider: No Loom videos found in classroom data');
        return [];
    }
    
    detectInCommunityPost(element) {
        console.log('🎬 LoomProvider: Detecting in element:', element);
        const videos = [];
        
        // Check for ALL iframes first
        const allIframes = element.querySelectorAll('iframe');
        console.log('🎬 LoomProvider: Found', allIframes.length, 'total iframes');
        
        for (const iframe of allIframes) {
            console.log('🎬 LoomProvider: Checking iframe src:', iframe.src);
            if (iframe.src && iframe.src.includes('loom.com')) {
                const videoId = this.extractVideoId(iframe.src);
                console.log('🎬 LoomProvider: Extracted video ID:', videoId);
                if (videoId) {
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
            if (videoId) {
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
        const dataElements = element.querySelectorAll('[data-loom-id], [data-embed-url*="loom"], [data-src*="loom"]');
        console.log('🎬 LoomProvider: Found', dataElements.length, 'data elements');
        for (const el of dataElements) {
            const videoId = el.dataset.loomId || this.extractVideoId(el.dataset.embedUrl || el.dataset.src || '');
            if (videoId) {
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
        
        console.log('🎬 LoomProvider: Total videos found:', videos.length);
        return videos.length > 0 ? videos : [];
    }
    
    getSelectors() {
        return {
            iframe: ['iframe[src*="loom.com"]'],
            link: ['a[href*="loom.com"]'],
            embed: ['[data-loom-id]', '[data-embed-url*="loom"]'],
            thumbnail: []
        };
    }
    
    getThumbnailUrl(videoId) {
        // Loom doesn't have a predictable thumbnail URL pattern
        // We'll need to fetch it from the page or use a placeholder
        return null;
    }
}