// Vimeo video provider

class VimeoProvider extends BaseVideoProvider {
    constructor() {
        super('vimeo');
    }
    
    canHandle(url) {
        return url.includes('vimeo.com');
    }
    
    extractVideoId(url) {
        // Handle various Vimeo URL formats
        const patterns = [
            /vimeo\.com\/(?:video\/)?([0-9]+)/,  // Standard format
            /player\.vimeo\.com\/video\/([0-9]+)/,  // Player embed format
            /vimeo\.com\/channels\/[^\/]+\/([0-9]+)/,  // Channel format
            /vimeo\.com\/groups\/[^\/]+\/videos\/([0-9]+)/  // Groups format
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    }
    
    getNormalizedUrl(videoId) {
        return `https://vimeo.com/${videoId}`;
    }
    
    getDownloadCommand(videoUrl, isWindows = false) {
        // Add referer header for Vimeo to avoid OAuth errors
        const headers = '--add-header "Referer: https://vimeo.com"';
        const basePath = isWindows ? '-P %USERPROFILE%\\\\Desktop' : '-P ~/Desktop';
        const quote = isWindows ? '"' : "'";
        return `yt-dlp ${headers} ${basePath} ${quote}${videoUrl}${quote}`;
    }
    
    detectInClassroom(document) {
        console.log('🎬 VimeoProvider: Detecting in classroom/about page');
        
        // Vimeo videos in Skool classroom or about pages
        const nextDataScript = document.getElementById('__NEXT_DATA__');
        if (nextDataScript) {
            try {
                const content = nextDataScript.textContent;
                console.log('🎬 VimeoProvider: Checking __NEXT_DATA__ for Vimeo references');
                
                // Try multiple Vimeo patterns
                const patterns = [
                    /vimeo\.com\/([0-9]+)/g,
                    /player\.vimeo\.com\/video\/([0-9]+)/g,
                    /"videoId":\s*"([0-9]+)".*vimeo/gi,
                    /vimeo.*?"([0-9]+)"/g,
                    /"([0-9]{8,})".*vimeo/gi, // Long numeric IDs near vimeo mentions
                    /embed.*?vimeo.*?([0-9]+)/gi
                ];
                
                for (const pattern of patterns) {
                    let match;
                    while ((match = pattern.exec(content)) !== null) {
                        if (match[1]) {
                            console.log('🎬 VimeoProvider: Found Vimeo video in page data:', match[1]);
                            return [{
                                videoId: match[1],
                                url: this.getNormalizedUrl(match[1]),
                                thumbnail: this.getThumbnailUrl(match[1]),
                                provider: 'vimeo',
                                type: 'vimeo'
                            }];
                        }
                    }
                }
            } catch (e) {
                console.error('🎬 VimeoProvider: Error detecting Vimeo in page data:', e);
            }
        }
        
        // Also check script tags and meta tags for Vimeo references
        const allScripts = document.querySelectorAll('script');
        for (const script of allScripts) {
            if (script.textContent && script.textContent.includes('vimeo')) {
                console.log('🎬 VimeoProvider: Found script with Vimeo reference');
                const vimeoMatch = script.textContent.match(/vimeo\.com\/([0-9]+)|player\.vimeo\.com\/video\/([0-9]+)/);
                if (vimeoMatch) {
                    const videoId = vimeoMatch[1] || vimeoMatch[2];
                    if (videoId) {
                        console.log('🎬 VimeoProvider: Extracted video ID from script:', videoId);
                        return [{
                            videoId: videoId,
                            url: this.getNormalizedUrl(videoId),
                            thumbnail: this.getThumbnailUrl(videoId),
                            provider: 'vimeo',
                            type: 'vimeo'
                        }];
                    }
                }
            }
        }
        
        console.log('🎬 VimeoProvider: No Vimeo videos found in classroom data');
        return [];
    }
    
    detectInCommunityPost(element) {
        console.log('🎬 VimeoProvider: Detecting in element:', element);
        const videos = [];
        
        // Check for ALL iframes first (broader search)
        const allIframes = element.querySelectorAll('iframe');
        console.log('🎬 VimeoProvider: Found', allIframes.length, 'total iframes');
        
        for (const iframe of allIframes) {
            console.log('🎬 VimeoProvider: Checking iframe src:', iframe.src);
            if (iframe.src && (iframe.src.includes('vimeo.com') || iframe.src.includes('player.vimeo.com'))) {
                const videoId = this.extractVideoId(iframe.src);
                console.log('🎬 VimeoProvider: Extracted video ID:', videoId);
                if (videoId) {
                    videos.push({
                        videoId: videoId,
                        url: this.getNormalizedUrl(videoId),
                        element: iframe,
                        thumbnail: this.getThumbnailUrl(videoId),
                        provider: 'vimeo',
                        type: 'vimeo'
                    });
                }
            }
        }
        
        // Check for Vimeo links
        const links = element.querySelectorAll('a[href*="vimeo.com"]');
        console.log('🎬 VimeoProvider: Found', links.length, 'Vimeo links');
        for (const link of links) {
            const videoId = this.extractVideoId(link.href);
            if (videoId) {
                videos.push({
                    videoId: videoId,
                    url: this.getNormalizedUrl(videoId),
                    element: link,
                    thumbnail: this.getThumbnailUrl(videoId),
                    provider: 'vimeo',
                    type: 'vimeo'
                });
            }
        }
        
        // Check for Vimeo divs with data attributes
        const vimeoDivs = element.querySelectorAll('div[data-vimeo-id], div[data-video-id*="vimeo"], [class*="vimeo"], [id*="vimeo"]');
        console.log('🎬 VimeoProvider: Found', vimeoDivs.length, 'potential Vimeo divs');
        for (const div of vimeoDivs) {
            const videoId = div.dataset.vimeoId || div.dataset.videoId;
            if (videoId && /^[0-9]+$/.test(videoId)) {
                videos.push({
                    videoId: videoId,
                    url: this.getNormalizedUrl(videoId),
                    element: div,
                    thumbnail: this.getThumbnailUrl(videoId),
                    provider: 'vimeo',
                    type: 'vimeo'
                });
            }
        }
        
        // Also check for lazy-loaded or dynamically inserted content
        const embedContainers = element.querySelectorAll('[data-embed-url*="vimeo"], [data-src*="vimeo"]');
        console.log('🎬 VimeoProvider: Found', embedContainers.length, 'embed containers');
        for (const container of embedContainers) {
            const embedUrl = container.dataset.embedUrl || container.dataset.src;
            if (embedUrl) {
                const videoId = this.extractVideoId(embedUrl);
                if (videoId) {
                    videos.push({
                        videoId: videoId,
                        url: this.getNormalizedUrl(videoId),
                        element: container,
                        thumbnail: this.getThumbnailUrl(videoId),
                        provider: 'vimeo',
                        type: 'vimeo'
                    });
                }
            }
        }
        
        console.log('🎬 VimeoProvider: Total videos found:', videos.length);
        return videos.length > 0 ? videos : [];
    }
    
    getSelectors() {
        return {
            iframe: ['iframe[src*="vimeo.com"]', 'iframe[src*="player.vimeo.com"]'],
            link: ['a[href*="vimeo.com"]'],
            embed: ['[data-embed-url*="vimeo"]', '[data-vimeo-id]', '[data-video-id*="vimeo"]'],
            thumbnail: []
        };
    }
    
    getThumbnailUrl(videoId) {
        // Vimeo thumbnail URL - using vumbnail service which provides Vimeo thumbnails
        return `https://vumbnail.com/${videoId}.jpg`;
    }
}