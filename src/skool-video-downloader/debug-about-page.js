// Debug script for theaspinallway/about page
// Run this in the console on https://www.skool.com/theaspinallway/about

console.log('🔍 Starting About Page Debug');

// 1. Check if extension is loaded
console.log('\n1️⃣ Extension Check:');
const extensionLoaded = {
    contentScript: typeof detectVideosByLocation !== 'undefined',
    registry: typeof videoProviderRegistry !== 'undefined',
    locationDetector: typeof detectPageLocation !== 'undefined'
};
console.log('Extension loaded:', extensionLoaded);

// 2. Check page location detection
if (typeof detectPageLocation !== 'undefined') {
    const location = detectPageLocation();
    console.log('\n2️⃣ Page Location:', location);
    console.log('URL:', window.location.href);
    console.log('Pathname:', window.location.pathname);
} else {
    console.log('\n2️⃣ detectPageLocation not available');
}

// 3. Check for __NEXT_DATA__
console.log('\n3️⃣ Checking __NEXT_DATA__:');
const nextData = document.getElementById('__NEXT_DATA__');
if (nextData) {
    console.log('✅ __NEXT_DATA__ found');
    const content = nextData.textContent;
    
    // Search for video patterns
    const patterns = {
        vimeo: /vimeo/gi,
        youtube: /youtube|youtu\.be/gi,
        loom: /loom/gi,
        wistia: /wistia/gi,
        mp4: /\.mp4/gi
    };
    
    Object.entries(patterns).forEach(([name, pattern]) => {
        const matches = content.match(pattern);
        if (matches) {
            console.log(`   Found ${name}:`, matches.length, 'occurrences');
            
            // Try to extract specific patterns
            if (name === 'vimeo') {
                const vimeoIds = content.match(/vimeo\.com\/(\d+)|player\.vimeo\.com\/video\/(\d+)/g);
                if (vimeoIds) {
                    console.log(`   Vimeo URLs found:`, vimeoIds);
                }
            }
        }
    });
} else {
    console.log('❌ No __NEXT_DATA__ found');
}

// 4. Check DOM containers
console.log('\n4️⃣ Checking DOM Containers:');
const containers = [
    { selector: 'main', element: document.querySelector('main') },
    { selector: 'article', element: document.querySelector('article') },
    { selector: '.about-content', element: document.querySelector('.about-content') },
    { selector: '[class*="about"]', element: document.querySelector('[class*="about"]') },
    { selector: '.content', element: document.querySelector('.content') },
    { selector: '.description', element: document.querySelector('.description') },
    { selector: '[role="main"]', element: document.querySelector('[role="main"]') },
    { selector: 'body', element: document.body }
];

let mainContainer = null;
containers.forEach(({ selector, element }) => {
    if (element) {
        console.log(`✅ Found: ${selector}`);
        if (!mainContainer) mainContainer = element;
    }
});

// 5. Check for iframes
console.log('\n5️⃣ Checking iframes:');
const allIframes = document.querySelectorAll('iframe');
console.log(`Total iframes: ${allIframes.length}`);

allIframes.forEach((iframe, i) => {
    console.log(`\nIframe ${i + 1}:`);
    console.log('  src:', iframe.src || 'no src');
    console.log('  id:', iframe.id || 'no id');
    console.log('  class:', iframe.className || 'no class');
    console.log('  width:', iframe.width);
    console.log('  height:', iframe.height);
    console.log('  parent:', iframe.parentElement?.tagName, iframe.parentElement?.className);
    
    // Check if it's a video iframe
    if (iframe.src) {
        const videoProviders = ['youtube', 'vimeo', 'loom', 'wistia'];
        const matchedProvider = videoProviders.find(p => iframe.src.includes(p));
        if (matchedProvider) {
            console.log(`  ✅ This is a ${matchedProvider} video!`);
        }
    }
});

// 6. Check for video links
console.log('\n6️⃣ Checking video links:');
const allLinks = document.querySelectorAll('a[href]');
const videoLinks = Array.from(allLinks).filter(link => {
    const href = link.href.toLowerCase();
    return href.includes('youtube') || href.includes('vimeo') || 
           href.includes('loom') || href.includes('wistia') || 
           href.includes('.mp4');
});

console.log(`Found ${videoLinks.length} video links out of ${allLinks.length} total links`);
videoLinks.forEach((link, i) => {
    console.log(`${i + 1}. ${link.href}`);
});

// 7. Check for data attributes
console.log('\n7️⃣ Checking data attributes:');
const dataElements = document.querySelectorAll('[data-embed-url], [data-src], [data-video-id], [data-vimeo-id]');
console.log(`Found ${dataElements.length} elements with video data attributes`);

dataElements.forEach((el, i) => {
    console.log(`\nElement ${i + 1}:`);
    console.log('  Tag:', el.tagName);
    console.log('  Data attributes:', Object.keys(el.dataset));
    Object.entries(el.dataset).forEach(([key, value]) => {
        console.log(`    ${key}: ${value}`);
    });
});

// 8. Check for lazy-loaded content
console.log('\n8️⃣ Checking for lazy-loaded/dynamic content:');
const lazyElements = document.querySelectorAll('[data-lazy], [data-load], .lazy, .lazyload');
console.log(`Found ${lazyElements.length} potentially lazy-loaded elements`);

// 9. Check all scripts for video references
console.log('\n9️⃣ Checking script tags:');
const scripts = document.querySelectorAll('script');
let scriptsWithVideo = 0;

scripts.forEach((script, i) => {
    if (script.textContent) {
        const hasVideo = script.textContent.match(/vimeo|youtube|loom|wistia|\.mp4/i);
        if (hasVideo) {
            scriptsWithVideo++;
            console.log(`Script ${i} contains video references`);
            
            // Try to extract Vimeo IDs
            const vimeoMatch = script.textContent.match(/vimeo\.com\/(\d+)|player\.vimeo\.com\/video\/(\d+)/);
            if (vimeoMatch) {
                console.log(`  Found Vimeo ID: ${vimeoMatch[1] || vimeoMatch[2]}`);
            }
        }
    }
});
console.log(`Total scripts with video references: ${scriptsWithVideo}`);

// 10. Manual provider test
console.log('\n🔟 Manual Provider Test:');
if (typeof videoProviderRegistry !== 'undefined') {
    // Test Vimeo provider specifically
    const vimeoProvider = videoProviderRegistry.getProviderByName('vimeo');
    if (vimeoProvider && mainContainer) {
        console.log('Testing Vimeo provider detectInCommunityPost...');
        const vimeoVideos = vimeoProvider.detectInCommunityPost(mainContainer);
        console.log('Vimeo videos found:', vimeoVideos);
        
        // Also test classroom detection
        console.log('Testing Vimeo provider detectInClassroom...');
        const classroomVideos = vimeoProvider.detectInClassroom(document);
        console.log('Classroom videos found:', classroomVideos);
    }
} else {
    console.log('❌ videoProviderRegistry not available');
}

// Summary
console.log('\n📊 SUMMARY:');
console.log(`- Page type: About page`);
console.log(`- Iframes found: ${allIframes.length}`);
console.log(`- Video links: ${videoLinks.length}`);
console.log(`- Data elements: ${dataElements.length}`);
console.log(`- Extension loaded: ${extensionLoaded.contentScript ? 'Yes' : 'No'}`);

console.log('\n💡 Recommendations:');
if (allIframes.length === 0 && videoLinks.length === 0) {
    console.log('⚠️ No obvious video content found. The page might:');
    console.log('  - Load videos dynamically after page load');
    console.log('  - Use a custom video player not yet detected');
    console.log('  - Have videos in a format we don\'t recognize');
}

console.log('\n🏁 Debug Complete');