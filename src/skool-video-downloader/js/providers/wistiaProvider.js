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
        const videos = [];
        const foundVideoIds = new Set();
        
        // First check for Wistia elements in the DOM
        const domVideos = this.detectInCommunityPost(document.body);
        for (const video of domVideos) {
            if (!foundVideoIds.has(video.videoId)) {
                foundVideoIds.add(video.videoId);
                videos.push(video);
            }
        }
        
        // Wistia videos in Skool classroom
        const nextDataScript = document.getElementById('__NEXT_DATA__');
        if (nextDataScript) {
            try {
                const content = nextDataScript.textContent;
                console.log('🎬 WistiaProvider: Checking __NEXT_DATA__ for Wistia references');
                
                const patterns = [
                    /wistia\.(?:com|net)\/medias\/([a-zA-Z0-9]+)/g,
                    /wistia\.(?:com|net)\/embed\/(?:iframe\/)?([a-zA-Z0-9]+)/g,
                    /fast\.wistia\.(?:com|net)\/embed\/iframe\/([a-zA-Z0-9]+)/g,
                    /wvideo=([a-zA-Z0-9]+)/g
                ];
                
                for (const pattern of patterns) {
                    let match;
                    while ((match = pattern.exec(content)) !== null) {
                        if (match[1] && !foundVideoIds.has(match[1])) {
                            console.log('🎬 WistiaProvider: Found Wistia video ID:', match[1]);
                            foundVideoIds.add(match[1]);
                            videos.push({
                                videoId: match[1],
                                url: this.getNormalizedUrl(match[1]),
                                provider: 'wistia',
                                type: 'wistia'
                            });
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
            // Check script src for wvideo parameter
            if (script.src && script.src.includes('wvideo=')) {
                const wvideoMatch = script.src.match(/wvideo=([a-zA-Z0-9]+)/);
                if (wvideoMatch && !foundVideoIds.has(wvideoMatch[1])) {
                    console.log('🎬 WistiaProvider: Found Wistia video ID in script src:', wvideoMatch[1]);
                    foundVideoIds.add(wvideoMatch[1]);
                    videos.push({
                        videoId: wvideoMatch[1],
                        url: this.getNormalizedUrl(wvideoMatch[1]),
                        provider: 'wistia',
                        type: 'wistia'
                    });
                }
            }
            
            // Check script content
            if (script.textContent && script.textContent.includes('wistia')) {
                const wistiaMatch = script.textContent.match(/wistia\.(?:com|net)\/(?:medias|embed)\/(?:iframe\/)?([a-zA-Z0-9]+)/);
                if (wistiaMatch && !foundVideoIds.has(wistiaMatch[1])) {
                    console.log('🎬 WistiaProvider: Found Wistia video ID in script:', wistiaMatch[1]);
                    foundVideoIds.add(wistiaMatch[1]);
                    videos.push({
                        videoId: wistiaMatch[1],
                        url: this.getNormalizedUrl(wistiaMatch[1]),
                        provider: 'wistia',
                        type: 'wistia'
                    });
                }
            }
            
            // Check for JSON-LD scripts with Wistia video data
            if (script.type === 'application/ld+json' && script.textContent) {
                try {
                    const jsonData = JSON.parse(script.textContent);
                    if (jsonData && jsonData['@type'] === 'VideoObject' && jsonData.embedUrl) {
                        const embedUrl = jsonData.embedUrl;
                        if (embedUrl.includes('wistia.net') || embedUrl.includes('wistia.com')) {
                            const videoId = this.extractVideoId(embedUrl);
                            if (videoId && !foundVideoIds.has(videoId)) {
                                console.log('🎬 WistiaProvider: Found Wistia video ID in JSON-LD:', videoId);
                                foundVideoIds.add(videoId);
                                
                                const videoData = {
                                    videoId: videoId,
                                    url: this.getNormalizedUrl(videoId),
                                    provider: 'wistia',
                                    type: 'wistia'
                                };
                                
                                // Extract title if available
                                if (jsonData.name) {
                                    videoData.title = jsonData.name;
                                    console.log('🎬 WistiaProvider: Found title:', jsonData.name);
                                }
                                
                                // Extract thumbnail if available
                                if (jsonData.thumbnailUrl) {
                                    videoData.thumbnail = jsonData.thumbnailUrl;
                                    console.log('🎬 WistiaProvider: Found thumbnail:', jsonData.thumbnailUrl);
                                }
                                
                                // Extract description if available
                                if (jsonData.description) {
                                    videoData.description = jsonData.description;
                                    console.log('🎬 WistiaProvider: Found description:', jsonData.description);
                                }
                                
                                videos.push(videoData);
                            }
                        }
                    }
                } catch (e) {
                    // Not valid JSON, skip
                }
            }
        }
        
        console.log('🎬 WistiaProvider: Total Wistia videos found:', videos.length);
        return videos;
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
        
        // Check for Wistia container divs and script embeds
        const wistiaContainers = element.querySelectorAll('[class*="wistia_embed"], [class*="wistia_async"], [id*="wistia"], script[src*="wvideo="], script[src*="fast.wistia.com"], script[src*="embed/medias"], script[type="application/ld+json"]');
        console.log('🎬 WistiaProvider: Found', wistiaContainers.length, 'Wistia containers');
        for (const container of wistiaContainers) {
            let videoId = null;
            
            // Extract video ID from class name
            if (container.className) {
                const classMatch = container.className.match(/wistia_async_([a-zA-Z0-9]+)/) || 
                                  container.className.match(/wistia_embed.*?([a-zA-Z0-9]{10,})/);
                if (classMatch) {
                    videoId = classMatch[1];
                }
            }
            
            // Extract from script src with wvideo parameter
            if (!videoId && container.tagName === 'SCRIPT' && container.src) {
                // Check for wvideo parameter
                const wvideoMatch = container.src.match(/wvideo=([a-zA-Z0-9]+)/);
                if (wvideoMatch) {
                    videoId = wvideoMatch[1];
                } else {
                    // Check for /embed/medias/{id}.jsonp pattern
                    const mediaMatch = container.src.match(/\/embed\/medias\/([a-zA-Z0-9]+)\.jsonp/);
                    if (mediaMatch) {
                        videoId = mediaMatch[1];
                    } else {
                        // Check for any ID-like pattern in fast.wistia.com URLs
                        const fastMatch = container.src.match(/fast\.wistia\.com\/.*?([a-zA-Z0-9]{10,})/);
                        if (fastMatch) {
                            videoId = fastMatch[1];
                        }
                    }
                }
            }
            
            // Check for JSON-LD scripts
            let jsonData = null;
            if (!videoId && container.tagName === 'SCRIPT' && container.type === 'application/ld+json') {
                try {
                    jsonData = JSON.parse(container.textContent);
                    if (jsonData && jsonData['@type'] === 'VideoObject' && jsonData.embedUrl) {
                        const embedUrl = jsonData.embedUrl;
                        if (embedUrl.includes('wistia.net') || embedUrl.includes('wistia.com')) {
                            videoId = this.extractVideoId(embedUrl);
                        }
                    }
                } catch (e) {
                    // Not valid JSON, skip
                }
            }
            
            if (videoId) {
                const videoData = {
                    videoId: videoId,
                    url: this.getNormalizedUrl(videoId),
                    element: container,
                    provider: 'wistia',
                    type: 'wistia'
                };
                
                // If we have JSON-LD data, extract additional info
                if (jsonData) {
                    if (jsonData.name) {
                        videoData.title = jsonData.name;
                    }
                    if (jsonData.thumbnailUrl) {
                        videoData.thumbnail = jsonData.thumbnailUrl;
                    }
                    if (jsonData.description) {
                        videoData.description = jsonData.description;
                    }
                }
                
                videos.push(videoData);
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
            embed: ['[class*="wistia_embed"]', '[data-embed-url*="wistia"]', 'script[src*="wvideo="]'],
            thumbnail: []
        };
    }
    
    getThumbnailUrl(videoId) {
        // Note: Wistia thumbnails use a different ID than the video ID
        // The actual format is: https://embed-ssl.wistia.com/deliveries/{deliveryId}.jpg
        // This method returns null as we extract the actual thumbnail URL from JSON-LD or API
        // The thumbnail URL cannot be reliably constructed from just the video ID
        return null;
    }
}