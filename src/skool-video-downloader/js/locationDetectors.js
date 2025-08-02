// Location-specific detection logic

// Detect current page location type
function detectPageLocation() {
    const url = window.location.href;
    const pathname = window.location.pathname;
    
    // Classroom pages typically have 'classroom' in URL or specific query params
    if (url.includes('/classroom/') || url.includes('?md=')) {
        return 'classroom';
    }
    
    // Community pages
    if (url.includes('/community/') || pathname.includes('/posts/')) {
        return 'community';
    }
    
    // About pages (treat as community-like content)
    if (pathname.includes('/about')) {
        return 'about';
    }
    
    // Community posts with direct URLs (e.g., /group-name/post-title)
    // This matches patterns like /the-blueprint-training/50-off-traffic-projection-tool
    const pathParts = pathname.split('/').filter(part => part.length > 0);
    if (pathParts.length === 2 && !pathname.includes('/classroom/')) {
        console.log('🔍 Detected as community post by URL pattern');
        return 'community';
    }
    
    // Check for other indicators
    const hasVideoPlayer = document.querySelector('.video-player, .lesson-video, [class*="classroom"]');
    if (hasVideoPlayer) {
        return 'classroom';
    }
    
    const hasPosts = document.querySelector('.post-content, .community-post, [class*="post"]');
    if (hasPosts) {
        return 'community';
    }
    
    return 'unknown';
}

// Find all community posts on the page
function findCommunityPosts() {
    const posts = [];
    
    // Common selectors for community posts
    const postSelectors = [
        '.post-content',
        '.community-post',
        '[class*="post-body"]',
        '[class*="feed-item"]',
        'article',
        '.content-body'
    ];
    
    for (const selector of postSelectors) {
        const elements = document.querySelectorAll(selector);
        posts.push(...elements);
    }
    
    // Remove duplicates
    return [...new Set(posts)];
}

// Find classroom video container
function findClassroomContainer() {
    // Common selectors for classroom video areas
    const classroomSelectors = [
        '.video-container',
        '.lesson-video',
        '.classroom-content',
        '[class*="video-player"]',
        '.lesson-content',
        'main'
    ];
    
    for (const selector of classroomSelectors) {
        const element = document.querySelector(selector);
        if (element) {
            return element;
        }
    }
    
    // Fallback to body
    return document.body;
}

// Detect videos based on page location
function detectVideosByLocation(registry) {
    const location = detectPageLocation();
    const videos = [];
    
    if (location === 'classroom') {
        // First try classroom-specific detection
        const classroomVideos = registry.detectInClassroom(document);
        videos.push(...classroomVideos);
        
        // If no videos found, try generic detection in classroom container
        if (videos.length === 0) {
            const container = findClassroomContainer();
            const communityVideos = detectVideosInElement(container, registry);
            videos.push(...communityVideos);
        }
    } else if (location === 'community') {
        // Find all posts and detect videos in each
        const posts = findCommunityPosts();
        
        for (const post of posts) {
            const postVideos = detectVideosInElement(post, registry);
            videos.push(...postVideos);
        }
    } else if (location === 'about') {
        // About pages - scan main content area with broader selectors
        console.log('🔍 Detecting videos on about page');
        
        // Try multiple container selectors for about pages
        const containerSelectors = [
            'main',
            '.about-content', 
            '[class*="about"]',
            '.content',
            'article',
            '.page-content',
            '.description',
            '[role="main"]',
            '.main-content'
        ];
        
        let aboutContainer = null;
        for (const selector of containerSelectors) {
            aboutContainer = document.querySelector(selector);
            if (aboutContainer) {
                console.log('🔍 Using container:', selector);
                break;
            }
        }
        
        // Fallback to body
        if (!aboutContainer) {
            console.log('🔍 Using fallback: document.body');
            aboutContainer = document.body;
        }
        
        const aboutVideos = detectVideosInElement(aboutContainer, registry);
        console.log('🔍 Found videos in about page:', aboutVideos.length);
        videos.push(...aboutVideos);
    } else {
        // Unknown location - scan entire page
        const allVideos = detectVideosInElement(document.body, registry);
        videos.push(...allVideos);
    }
    
    // Add location info to videos
    return videos.map(video => ({
        ...video,
        location: location
    }));
}

// Detect videos in a specific element using all providers
function detectVideosInElement(element, registry) {
    const videos = [];
    
    // Try community post detection for each provider
    const detectedVideos = registry.detectInCommunityPost(element);
    videos.push(...detectedVideos);
    
    return videos;
}