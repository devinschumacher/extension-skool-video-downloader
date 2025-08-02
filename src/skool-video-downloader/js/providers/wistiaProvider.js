// Wistia video provider

class WistiaProvider extends BaseVideoProvider {
    constructor() {
        super('wistia');
    }
    
    canHandle(url) {
        return url.includes('wistia.com') || url.includes('wistia.net');
    }
    
    extractVideoId(url) {
        const match = url.match(/(?:wistia\.com|wistia\.net)\/(?:medias|embed)\/(?:iframe\/)?([a-zA-Z0-9]+)/);
        return match ? match[1] : null;
    }
    
    getNormalizedUrl(videoId) {
        return `https://fast.wistia.net/embed/iframe/${videoId}`;
    }
    
    detectInClassroom(document) {
        console.log('🎬 WistiaProvider: Detecting in classroom/about page');
        
        // Wistia videos in Skool classroom
        const nextDataScript = document.getElementById('__NEXT_DATA__');
        if (nextDataScript) {
            try {
                const content = nextDataScript.textContent;
                console.log('🎬 WistiaProvider: Checking __NEXT_DATA__ for Wistia references');
                
                const patterns = [
                    /wistia\.(?:com|net)\/medias\/([a-zA-Z0-9]+)/g,
                    /wistia\.(?:com|net)\/embed\/(?:iframe\/)?([a-zA-Z0-9]+)/g,
                    /fast\.wistia\.(?:com|net)\/embed\/iframe\/([a-zA-Z0-9]+)/g
                ];
                
                for (const pattern of patterns) {
                    let match;
                    while ((match = pattern.exec(content)) !== null) {
                        if (match[1]) {
                            console.log('🎬 WistiaProvider: Found Wistia video ID:', match[1]);
                            return [{
                                videoId: match[1],
                                url: this.getNormalizedUrl(match[1]),
                                provider: 'wistia',
                                type: 'wistia'
                            }];
                        }
                    }
                }
            } catch (e) {
                console.error('🎬 WistiaProvider: Error detecting Wistia in page data:', e);
            }
        }
        
        // Also check script tags
        const allScripts = document.querySelectorAll('script');
        for (const script of allScripts) {
            if (script.textContent && script.textContent.includes('wistia')) {
                const wistiaMatch = script.textContent.match(/wistia\.(?:com|net)\/(?:medias|embed)\/(?:iframe\/)?([a-zA-Z0-9]+)/);
                if (wistiaMatch) {
                    console.log('🎬 WistiaProvider: Found Wistia video ID in script:', wistiaMatch[1]);
                    return [{
                        videoId: wistiaMatch[1],
                        url: this.getNormalizedUrl(wistiaMatch[1]),
                        provider: 'wistia',
                        type: 'wistia'
                    }];
                }
            }
        }
        
        console.log('🎬 WistiaProvider: No Wistia videos found in classroom data');
        return [];
    }
    
    detectInCommunityPost(element) {
        console.log('🎬 WistiaProvider: Detecting in element:', element);
        const videos = [];
        
        // Check for ALL iframes first
        const allIframes = element.querySelectorAll('iframe');
        console.log('🎬 WistiaProvider: Found', allIframes.length, 'total iframes');
        
        for (const iframe of allIframes) {
            console.log('🎬 WistiaProvider: Checking iframe src:', iframe.src);
            if (iframe.src && (iframe.src.includes('wistia.com') || iframe.src.includes('wistia.net'))) {
                const videoId = this.extractVideoId(iframe.src);
                console.log('🎬 WistiaProvider: Extracted video ID:', videoId);
                if (videoId) {
                    videos.push({
                        videoId: videoId,
                        url: this.getNormalizedUrl(videoId),
                        element: iframe,
                        provider: 'wistia',
                        type: 'wistia'
                    });
                }
            }
        }
        
        // Check for Wistia container divs
        const wistiaContainers = element.querySelectorAll('[class*="wistia_embed"], [class*="wistia_async"], [id*="wistia"]');
        console.log('🎬 WistiaProvider: Found', wistiaContainers.length, 'Wistia containers');
        for (const container of wistiaContainers) {
            // Extract video ID from class name
            const classMatch = container.className.match(/wistia_async_([a-zA-Z0-9]+)/) || 
                              container.className.match(/wistia_embed.*?([a-zA-Z0-9]{10,})/);
            if (classMatch) {
                videos.push({
                    videoId: classMatch[1],
                    url: this.getNormalizedUrl(classMatch[1]),
                    element: container,
                    provider: 'wistia',
                    type: 'wistia'
                });
            }
        }
        
        // Check for Wistia links
        const links = element.querySelectorAll('a[href*="wistia.com"], a[href*="wistia.net"]');
        console.log('🎬 WistiaProvider: Found', links.length, 'Wistia links');
        for (const link of links) {
            const videoId = this.extractVideoId(link.href);
            if (videoId) {
                videos.push({
                    videoId: videoId,
                    url: this.getNormalizedUrl(videoId),
                    element: link,
                    provider: 'wistia',
                    type: 'wistia'
                });
            }
        }
        
        // Check for data attributes
        const dataElements = element.querySelectorAll('[data-embed-url*="wistia"], [data-src*="wistia"], [data-wistia-id]');
        console.log('🎬 WistiaProvider: Found', dataElements.length, 'data elements');
        for (const el of dataElements) {
            const videoId = el.dataset.wistiaId || this.extractVideoId(el.dataset.embedUrl || el.dataset.src || '');
            if (videoId) {
                videos.push({
                    videoId: videoId,
                    url: this.getNormalizedUrl(videoId),
                    element: el,
                    provider: 'wistia',
                    type: 'wistia'
                });
            }
        }
        
        console.log('🎬 WistiaProvider: Total videos found:', videos.length);
        return videos.length > 0 ? videos : [];
    }
    
    getSelectors() {
        return {
            iframe: ['iframe[src*="wistia.com"]', 'iframe[src*="wistia.net"]'],
            link: ['a[href*="wistia.com"]'],
            embed: ['[class*="wistia_embed"]', '[data-embed-url*="wistia"]'],
            thumbnail: []
        };
    }
}