// Debug script for Wistia detection
// Run this on https://www.skool.com/the-blueprint-training/50-off-traffic-projection-tool

console.log('🔍 Starting Wistia Debug');

// 1. Check page type
const url = window.location.href;
const pathname = window.location.pathname;
let pageType = 'unknown';

if (url.includes('/classroom/') || url.includes('?md=')) {
    pageType = 'classroom';
} else if (url.includes('/community/') || pathname.includes('/posts/')) {
    pageType = 'community';
} else if (pathname.includes('/about')) {
    pageType = 'about';
} else if (pathname.match(/\/[^\/]+$/)) {
    // Matches pattern like /the-blueprint-training/some-post
    pageType = 'community-post';
}

console.log('📍 Page type:', pageType);
console.log('URL:', url);

// 2. Check for Wistia in __NEXT_DATA__
console.log('\n2️⃣ Checking __NEXT_DATA__ for Wistia:');
const nextData = document.getElementById('__NEXT_DATA__');
if (nextData) {
    const content = nextData.textContent;
    const wistiaMatches = content.match(/wistia/gi);
    console.log('Wistia mentions:', wistiaMatches ? wistiaMatches.length : 0);
    
    // Look for specific Wistia patterns
    const patterns = [
        /wistia\.com\/medias\/([a-zA-Z0-9]+)/g,
        /wistia\.net\/medias\/([a-zA-Z0-9]+)/g,
        /fast\.wistia\.(?:com|net)\/embed\/iframe\/([a-zA-Z0-9]+)/g,
        /wistia_async_([a-zA-Z0-9]+)/g
    ];
    
    patterns.forEach((pattern, i) => {
        const matches = [...content.matchAll(pattern)];
        if (matches.length > 0) {
            console.log(`Pattern ${i + 1} matches:`, matches.map(m => m[0]));
        }
    });
}

// 3. Check for Wistia iframes
console.log('\n3️⃣ Checking for Wistia iframes:');
const allIframes = document.querySelectorAll('iframe');
console.log('Total iframes:', allIframes.length);

const wistiaIframes = Array.from(allIframes).filter(iframe => 
    iframe.src && (iframe.src.includes('wistia.com') || iframe.src.includes('wistia.net'))
);
console.log('Wistia iframes found:', wistiaIframes.length);

wistiaIframes.forEach((iframe, i) => {
    console.log(`Wistia iframe ${i + 1}:`, {
        src: iframe.src,
        id: iframe.id,
        class: iframe.className,
        parent: iframe.parentElement?.className
    });
});

// 4. Check for Wistia embed containers
console.log('\n4️⃣ Checking for Wistia embed containers:');
const wistiaSelectors = [
    '[class*="wistia_embed"]',
    '[class*="wistia_async"]',
    '[id*="wistia"]',
    '.wistia_responsive_padding',
    '.wistia_responsive_wrapper'
];

wistiaSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
        console.log(`Found ${elements.length} elements matching "${selector}":`);
        elements.forEach((el, i) => {
            console.log(`  ${i + 1}. Tag: ${el.tagName}, Class: "${el.className}", ID: "${el.id}"`);
            
            // Check for video ID in class
            const classMatch = el.className.match(/wistia_async_([a-zA-Z0-9]+)/);
            if (classMatch) {
                console.log(`    ✅ Video ID found in class: ${classMatch[1]}`);
            }
        });
    }
});

// 5. Check for Wistia scripts
console.log('\n5️⃣ Checking for Wistia scripts:');
const scripts = document.querySelectorAll('script[src*="wistia"]');
console.log('Wistia script tags:', scripts.length);

scripts.forEach((script, i) => {
    console.log(`Script ${i + 1}: ${script.src}`);
});

// 6. Check for inline Wistia JavaScript
const allScripts = document.querySelectorAll('script');
let inlineWistiaScripts = 0;

allScripts.forEach(script => {
    if (script.textContent && script.textContent.includes('wistia')) {
        inlineWistiaScripts++;
    }
});

console.log('Scripts with inline Wistia code:', inlineWistiaScripts);

// 7. Check main content containers
console.log('\n7️⃣ Checking main content containers:');
const containers = [
    document.querySelector('main'),
    document.querySelector('article'),
    document.querySelector('.post-content'),
    document.querySelector('[class*="post"]'),
    document.querySelector('.content')
].filter(Boolean);

console.log('Found containers:', containers.length);

containers.forEach((container, i) => {
    console.log(`\nContainer ${i + 1}: ${container.tagName}.${container.className}`);
    
    // Check for Wistia content inside
    const wistiaElements = container.querySelectorAll('[class*="wistia"], [id*="wistia"], iframe[src*="wistia"]');
    console.log(`  Wistia elements inside: ${wistiaElements.length}`);
});

// 8. Manual test with extension loaded
console.log('\n8️⃣ Extension Detection Test:');
if (typeof videoProviderRegistry !== 'undefined') {
    const wistiaProvider = videoProviderRegistry.getProviderByName('wistia');
    if (wistiaProvider) {
        console.log('Testing Wistia provider...');
        
        // Test on main container
        const mainContainer = containers[0] || document.body;
        const communityVideos = wistiaProvider.detectInCommunityPost(mainContainer);
        console.log('Community detection result:', communityVideos);
        
        // Test classroom detection
        const classroomVideos = wistiaProvider.detectInClassroom(document);
        console.log('Classroom detection result:', classroomVideos);
    }
} else {
    console.log('❌ Extension not loaded');
}

// 9. Look for any video-like elements
console.log('\n9️⃣ Looking for video elements:');
const videoElements = document.querySelectorAll('video, [class*="video"], [id*="video"]');
console.log('Video-related elements:', videoElements.length);

videoElements.forEach((el, i) => {
    if (el.tagName === 'VIDEO') {
        console.log(`Video ${i + 1}: src="${el.src || 'no src'}", poster="${el.poster || 'no poster'}"`);
    }
});

// Summary
console.log('\n📊 SUMMARY:');
console.log('- Page type:', pageType);
console.log('- Wistia iframes:', wistiaIframes.length);
console.log('- Wistia containers:', document.querySelectorAll('[class*="wistia"]').length);
console.log('- Total iframes:', allIframes.length);

console.log('\n🏁 Wistia Debug Complete');