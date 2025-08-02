// YouTube video provider

class YouTubeProvider extends BaseVideoProvider {
    constructor() {
        super('youtube');
    }
    
    canHandle(url) {
        return url.includes('youtube.com') || url.includes('youtu.be');
    }
    
    extractVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
            /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
            /youtube\.com\/v\/([a-zA-Z0-9_-]+)/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    }
    
    getNormalizedUrl(videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`;
    }
    
    getDownloadCommand(videoUrl, isWindows = false) {
        // Best quality up to 1080p with merged audio
        const format = '-f "bestvideo[height<=1080]+bestaudio/best[height<=1080]" --merge-output-format mp4';
        const basePath = isWindows ? '-P %USERPROFILE%\\\\Desktop' : '-P ~/Desktop';
        const quote = isWindows ? '"' : "'";
        return `yt-dlp ${format} ${basePath} ${quote}${videoUrl}${quote}`;
    }
    
    detectInClassroom(document) {
        console.log('🎬 YouTubeProvider: Detecting in classroom/about page');
        
        // YouTube videos in Skool classroom are typically in the metadata
        const nextDataScript = document.getElementById('__NEXT_DATA__');
        if (nextDataScript) {
            try {
                const content = nextDataScript.textContent;
                console.log('🎬 YouTubeProvider: Checking __NEXT_DATA__ for YouTube references');
                
                // Multiple YouTube URL patterns
                const patterns = [
                    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/g,
                    /youtu\.be\/([a-zA-Z0-9_-]+)/g,
                    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/g,
                    /youtube\.com\/v\/([a-zA-Z0-9_-]+)/g
                ];
                
                for (const pattern of patterns) {
                    let match;
                    while ((match = pattern.exec(content)) !== null) {
                        if (match[1]) {
                            console.log('🎬 YouTubeProvider: Found YouTube video ID:', match[1]);
                            return [{
                                videoId: match[1],
                                url: this.getNormalizedUrl(match[1]),
                                thumbnail: this.getThumbnailUrl(match[1]),
                                provider: 'youtube',
                                type: 'youtube'
                            }];
                        }
                    }
                }
            } catch (e) {
                console.error('🎬 YouTubeProvider: Error detecting YouTube in page data:', e);
            }
        }
        
        // Also check script tags for embedded YouTube players
        const allScripts = document.querySelectorAll('script');
        for (const script of allScripts) {
            if (script.textContent && script.textContent.includes('youtube')) {
                const ytMatch = script.textContent.match(/youtube\.com\/(?:watch\?v=|embed\/)([a-zA-Z0-9_-]+)|youtu\.be\/([a-zA-Z0-9_-]+)/);
                if (ytMatch) {
                    const videoId = ytMatch[1] || ytMatch[2];
                    if (videoId) {
                        console.log('🎬 YouTubeProvider: Found YouTube video ID in script:', videoId);
                        return [{
                            videoId: videoId,
                            url: this.getNormalizedUrl(videoId),
                            thumbnail: this.getThumbnailUrl(videoId),
                            provider: 'youtube',
                            type: 'youtube'
                        }];
                    }
                }
            }
        }
        
        console.log('🎬 YouTubeProvider: No YouTube videos found in classroom data');
        return [];
    }
    
    detectInCommunityPost(element) {
        console.log('🎬 YouTubeProvider: Detecting in element:', element);
        const videos = [];
        
        // Check for ALL iframes first (broader search)
        const allIframes = element.querySelectorAll('iframe');
        console.log('🎬 YouTubeProvider: Found', allIframes.length, 'total iframes');
        
        for (const iframe of allIframes) {
            console.log('🎬 YouTubeProvider: Checking iframe src:', iframe.src);
            if (iframe.src && (iframe.src.includes('youtube') || iframe.src.includes('youtu.be'))) {
                const videoId = this.extractVideoId(iframe.src);
                console.log('🎬 YouTubeProvider: Extracted video ID:', videoId);
                if (videoId) {
                    videos.push({
                        videoId: videoId,
                        url: this.getNormalizedUrl(videoId),
                        element: iframe,
                        thumbnail: this.getThumbnailUrl(videoId),
                        provider: 'youtube',
                        type: 'youtube'
                    });
                }
            }
        }
        
        // Check for YouTube links
        const links = element.querySelectorAll('a[href*="youtube"], a[href*="youtu.be"]');
        console.log('🎬 YouTubeProvider: Found', links.length, 'YouTube links');
        for (const link of links) {
            const videoId = this.extractVideoId(link.href);
            if (videoId) {
                videos.push({
                    videoId: videoId,
                    url: this.getNormalizedUrl(videoId),
                    element: link,
                    thumbnail: this.getThumbnailUrl(videoId),
                    provider: 'youtube',
                    type: 'youtube'
                });
            }
        }
        
        // Check for YouTube thumbnails
        const thumbnails = element.querySelectorAll('img[src*="ytimg.com"]');
        console.log('🎬 YouTubeProvider: Found', thumbnails.length, 'YouTube thumbnails');
        for (const img of thumbnails) {
            const match = img.src.match(/\/vi\/([a-zA-Z0-9_-]+)\//);
            if (match) {
                videos.push({
                    videoId: match[1],
                    url: this.getNormalizedUrl(match[1]),
                    element: img,
                    thumbnail: this.getThumbnailUrl(match[1]),
                    provider: 'youtube',
                    type: 'youtube'
                });
            }
        }
        
        // Check for embed containers
        const embedContainers = element.querySelectorAll('[data-embed-url*="youtube"], [data-embed-url*="youtu.be"], [data-src*="youtube"]');
        console.log('🎬 YouTubeProvider: Found', embedContainers.length, 'embed containers');
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
                        provider: 'youtube',
                        type: 'youtube'
                    });
                }
            }
        }
        
        console.log('🎬 YouTubeProvider: Total videos found:', videos.length);
        return videos.length > 0 ? videos : [];
    }
    
    getSelectors() {
        return {
            iframe: ['iframe[src*="youtube.com"]', 'iframe[src*="youtu.be"]'],
            link: ['a[href*="youtube.com"]', 'a[href*="youtu.be"]'],
            embed: ['[data-embed-url*="youtube"]', '[data-embed-url*="youtu.be"]'],
            thumbnail: ['img[src*="ytimg.com"]']
        };
    }
    
    getThumbnailUrl(videoId) {
        // YouTube provides predictable thumbnail URLs
        // Try maxresdefault first, then fall back to hqdefault
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
}