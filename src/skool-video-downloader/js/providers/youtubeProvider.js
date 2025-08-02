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
        const videos = [];
        const foundVideoIds = new Set();
        
        // YouTube videos in Skool classroom are typically in the metadata
        const nextDataScript = document.getElementById('__NEXT_DATA__');
        if (nextDataScript) {
            try {
                const content = nextDataScript.textContent;
                console.log('🎬 YouTubeProvider: Checking __NEXT_DATA__ for YouTube references');
                console.log('🎬 YouTubeProvider: __NEXT_DATA__ length:', content.length);
                
                // Debug: Check if videoLinks exists at all
                if (content.includes('videoLinks')) {
                    console.log('🎬 YouTubeProvider: Found "videoLinks" in content');
                    // Try to extract a larger context around videoLinks
                    const videoLinksIndex = content.indexOf('videoLinks');
                    const contextStart = Math.max(0, videoLinksIndex - 50);
                    const contextEnd = Math.min(content.length, videoLinksIndex + 200);
                    console.log('🎬 YouTubeProvider: videoLinks context:', content.substring(contextStart, contextEnd));
                }
                
                // Look for videoLinksData field which contains full video info
                // Handle both single and double quotes
                const videoLinksDataMatch = content.match(/['"]videoLinksData['"]\s*:\s*['"](\[[\s\S]*?\])['"]/);
                if (videoLinksDataMatch && videoLinksDataMatch[1]) {
                    console.log('🎬 YouTubeProvider: Found videoLinksData field');
                    try {
                        // Unescape the JSON string
                        const jsonString = videoLinksDataMatch[1].replace(/\\"/g, '"');
                        const videoDataArray = JSON.parse(jsonString);
                        
                        for (const videoData of videoDataArray) {
                            if (videoData.video_id && !foundVideoIds.has(videoData.video_id)) {
                                console.log('🎬 YouTubeProvider: Found video in videoLinksData:', videoData);
                                foundVideoIds.add(videoData.video_id);
                                
                                videos.push({
                                    videoId: videoData.video_id,
                                    url: videoData.url || this.getNormalizedUrl(videoData.video_id),
                                    thumbnail: videoData.thumbnail || this.getThumbnailUrl(videoData.video_id),
                                    title: videoData.title || `YouTube Video ${videoData.video_id}`,
                                    provider: 'youtube',
                                    type: 'youtube'
                                });
                            }
                        }
                    } catch (e) {
                        console.error('🎬 YouTubeProvider: Error parsing videoLinksData:', e);
                    }
                }
                
                // Also look for simple videoLinks field as fallback
                const videoLinksMatch = content.match(/['"]videoLinks['"]\s*:\s*['"]([^'"]+)['"]/);
                if (videoLinksMatch && videoLinksMatch[1]) {
                    console.log('🎬 YouTubeProvider: Found videoLinks field:', videoLinksMatch[1]);
                    const videoId = this.extractVideoId(videoLinksMatch[1]);
                    if (videoId && !foundVideoIds.has(videoId)) {
                        foundVideoIds.add(videoId);
                        videos.push({
                            videoId: videoId,
                            url: this.getNormalizedUrl(videoId),
                            thumbnail: this.getThumbnailUrl(videoId),
                            provider: 'youtube',
                            type: 'youtube'
                        });
                    }
                }
                
                // Multiple YouTube URL patterns
                const patterns = [
                    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/g,
                    /youtu\.be\/([a-zA-Z0-9_-]+)/g,
                    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/g,
                    /youtube\.com\/v\/([a-zA-Z0-9_-]+)/g,
                    /i\.ytimg\.com\/vi\/([a-zA-Z0-9_-]+)\//g  // Thumbnail URLs
                ];
                
                for (const pattern of patterns) {
                    let match;
                    // Reset regex lastIndex for each pattern
                    pattern.lastIndex = 0;
                    while ((match = pattern.exec(content)) !== null) {
                        if (match[1] && !foundVideoIds.has(match[1])) {
                            console.log('🎬 YouTubeProvider: Found YouTube video ID:', match[1]);
                            foundVideoIds.add(match[1]);
                            
                            // Try to find associated thumbnail in the content
                            let thumbnail = null;
                            const thumbnailRegex = new RegExp(`i\\.ytimg\\.com\\/vi\\/${match[1]}\\/([a-zA-Z0-9_-]+)\\.jpg`, 'g');
                            const thumbnailMatch = thumbnailRegex.exec(content);
                            if (thumbnailMatch) {
                                thumbnail = `https://i.ytimg.com/vi/${match[1]}/${thumbnailMatch[1]}.jpg`;
                                console.log('🎬 YouTubeProvider: Found specific thumbnail:', thumbnail);
                            }
                            
                            videos.push({
                                videoId: match[1],
                                url: this.getNormalizedUrl(match[1]),
                                thumbnail: thumbnail || this.getThumbnailUrl(match[1]),
                                provider: 'youtube',
                                type: 'youtube'
                            });
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
                const patterns = [
                    /youtube\.com\/(?:watch\?v=|embed\/)([a-zA-Z0-9_-]+)/g,
                    /youtu\.be\/([a-zA-Z0-9_-]+)/g,
                    /i\.ytimg\.com\/vi\/([a-zA-Z0-9_-]+)\//g
                ];
                
                for (const pattern of patterns) {
                    let match;
                    pattern.lastIndex = 0;
                    while ((match = pattern.exec(script.textContent)) !== null) {
                        if (match[1] && !foundVideoIds.has(match[1])) {
                            console.log('🎬 YouTubeProvider: Found YouTube video ID in script:', match[1]);
                            foundVideoIds.add(match[1]);
                            videos.push({
                                videoId: match[1],
                                url: this.getNormalizedUrl(match[1]),
                                thumbnail: this.getThumbnailUrl(match[1]),
                                provider: 'youtube',
                                type: 'youtube'
                            });
                        }
                    }
                }
            }
        }
        
        console.log('🎬 YouTubeProvider: Total YouTube videos found in classroom:', videos.length);
        return videos;
    }
    
    detectInCommunityPost(element) {
        console.log('🎬 YouTubeProvider: Detecting in element:', element);
        const videos = [];
        const foundVideoIds = new Set(); // Track found IDs to avoid duplicates
        
        // First check __NEXT_DATA__ for community posts too
        const classroomVideos = this.detectInClassroom(document);
        for (const video of classroomVideos) {
            if (!foundVideoIds.has(video.videoId)) {
                foundVideoIds.add(video.videoId);
                videos.push(video);
            }
        }
        
        // Then check if the page content contains YouTube URLs in text
        const pageText = element.textContent || element.innerText || '';
        const textMatches = pageText.matchAll(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/g);
        for (const match of textMatches) {
            if (match[1] && !foundVideoIds.has(match[1])) {
                console.log('🎬 YouTubeProvider: Found YouTube video ID in page text:', match[1]);
                foundVideoIds.add(match[1]);
                videos.push({
                    videoId: match[1],
                    url: this.getNormalizedUrl(match[1]),
                    element: element,
                    thumbnail: this.getThumbnailUrl(match[1]),
                    provider: 'youtube',
                    type: 'youtube'
                });
            }
        }
        
        // Check for ALL iframes (broader search)
        const allIframes = element.querySelectorAll('iframe');
        console.log('🎬 YouTubeProvider: Found', allIframes.length, 'total iframes');
        
        for (const iframe of allIframes) {
            console.log('🎬 YouTubeProvider: Checking iframe src:', iframe.src);
            if (iframe.src && (iframe.src.includes('youtube') || iframe.src.includes('youtu.be'))) {
                const videoId = this.extractVideoId(iframe.src);
                console.log('🎬 YouTubeProvider: Extracted video ID:', videoId);
                if (videoId && !foundVideoIds.has(videoId)) {
                    foundVideoIds.add(videoId);
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
            if (videoId && !foundVideoIds.has(videoId)) {
                foundVideoIds.add(videoId);
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
        
        // Check for YouTube thumbnails (including i.ytimg.com pattern)
        const thumbnails = element.querySelectorAll('img[src*="ytimg.com"], img[src*="i.ytimg.com"]');
        console.log('🎬 YouTubeProvider: Found', thumbnails.length, 'YouTube thumbnails');
        for (const img of thumbnails) {
            const match = img.src.match(/\/vi\/([a-zA-Z0-9_-]+)\//);
            if (match && match[1] && !foundVideoIds.has(match[1])) {
                foundVideoIds.add(match[1]);
                
                // Extract the specific thumbnail quality from the URL
                let specificThumbnail = img.src;
                if (!specificThumbnail.startsWith('http')) {
                    specificThumbnail = 'https:' + specificThumbnail;
                }
                
                videos.push({
                    videoId: match[1],
                    url: this.getNormalizedUrl(match[1]),
                    element: img,
                    thumbnail: specificThumbnail,  // Use the actual thumbnail URL found
                    provider: 'youtube',
                    type: 'youtube'
                });
            }
        }
        
        // Check for embed containers and lazy-loaded videos
        const embedContainers = element.querySelectorAll('[data-embed-url*="youtube"], [data-embed-url*="youtu.be"], [data-src*="youtube"], [data-lazy*="youtube"], [data-video-id], div[onclick*="youtube"], div[onclick*="youtu.be"]');
        console.log('🎬 YouTubeProvider: Found', embedContainers.length, 'embed containers');
        for (const container of embedContainers) {
            let videoId = null;
            
            // Try various data attributes
            const embedUrl = container.dataset.embedUrl || container.dataset.src || container.dataset.lazy;
            if (embedUrl) {
                videoId = this.extractVideoId(embedUrl);
            }
            
            // Check for video ID in data attributes
            if (!videoId && container.dataset.videoId) {
                videoId = container.dataset.videoId;
            }
            
            // Check onclick attribute for YouTube URLs
            if (!videoId && container.onclick) {
                const onclickStr = container.onclick.toString();
                const match = onclickStr.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
                if (match) {
                    videoId = match[1];
                }
            }
            
            if (videoId && !foundVideoIds.has(videoId)) {
                foundVideoIds.add(videoId);
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
        
        // Check for video placeholder elements that might contain YouTube IDs
        const placeholders = element.querySelectorAll('[class*="video-placeholder"], [class*="video-container"], [class*="video-wrapper"], [id*="video-container"]');
        console.log('🎬 YouTubeProvider: Found', placeholders.length, 'video placeholders');
        for (const placeholder of placeholders) {
            // Check if placeholder contains YouTube URL in any attribute or text
            const htmlContent = placeholder.outerHTML;
            const ytMatch = htmlContent.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
            if (ytMatch && ytMatch[1] && !foundVideoIds.has(ytMatch[1])) {
                foundVideoIds.add(ytMatch[1]);
                videos.push({
                    videoId: ytMatch[1],
                    url: this.getNormalizedUrl(ytMatch[1]),
                    element: placeholder,
                    thumbnail: this.getThumbnailUrl(ytMatch[1]),
                    provider: 'youtube',
                    type: 'youtube'
                });
            }
        }
        
        console.log('🎬 YouTubeProvider: Total videos found:', videos.length);
        return videos.length > 0 ? videos : [];
    }
    
    getSelectors() {
        return {
            iframe: ['iframe[src*="youtube.com"]', 'iframe[src*="youtu.be"]'],
            link: ['a[href*="youtube.com"]', 'a[href*="youtu.be"]'],
            embed: [
                '[data-embed-url*="youtube"]', 
                '[data-embed-url*="youtu.be"]',
                '[data-src*="youtube"]',
                '[data-lazy*="youtube"]',
                '[data-video-id]',
                'div[onclick*="youtube"]',
                '[class*="video-placeholder"]',
                '[class*="video-container"]'
            ],
            thumbnail: ['img[src*="ytimg.com"]']
        };
    }
    
    getThumbnailUrl(videoId) {
        // YouTube provides predictable thumbnail URLs
        // Try maxresdefault first, then fall back to hqdefault
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
}