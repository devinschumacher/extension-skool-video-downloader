// Debug script for Loom video detection and thumbnails
// Test URL: https://www.skool.com/paid-ad-secrets/classroom/77c8adf4?md=69a3c91b5d5b45cf873abbfe1bdb02e5

console.log('🔍 Starting Loom video thumbnail debug...');

// Find the Loom video element
const loomVideo = document.querySelector('video[id*="Loom"], video[data-loom-video-id]');
if (loomVideo) {
    console.log('✅ Found Loom video element');
    console.log('📸 Video poster attribute:', loomVideo.poster);
    console.log('📸 Video style:', loomVideo.style.cssText);
    
    // Check parent elements for thumbnail images
    let parent = loomVideo.parentElement;
    let depth = 0;
    while (parent && depth < 5) {
        console.log(`\n🔍 Checking parent level ${depth}:`, parent.tagName, parent.className);
        
        // Check for img elements
        const imgs = parent.querySelectorAll('img');
        if (imgs.length > 0) {
            console.log(`📸 Found ${imgs.length} images:`);
            imgs.forEach((img, i) => {
                console.log(`  - Image ${i}: ${img.src}`);
                console.log(`    Alt: ${img.alt}, Class: ${img.className}`);
            });
        }
        
        // Check for background images
        const elementsWithBg = parent.querySelectorAll('[style*="background"]');
        if (elementsWithBg.length > 0) {
            console.log(`📸 Found ${elementsWithBg.length} elements with backgrounds:`);
            elementsWithBg.forEach((el, i) => {
                const bgImage = el.style.backgroundImage;
                if (bgImage && bgImage !== 'none') {
                    console.log(`  - Element ${i}: ${bgImage}`);
                }
            });
        }
        
        parent = parent.parentElement;
        depth++;
    }
}

// Check for Loom thumbnail patterns in page data
console.log('\n🔍 Checking page data for Loom thumbnails...');

// Check __NEXT_DATA__
const nextData = document.getElementById('__NEXT_DATA__');
if (nextData) {
    const content = nextData.textContent;
    
    // Look for common CDN patterns for Loom
    const cdnPatterns = [
        /cdn\.loom\.com[^"'\s]+(thumbnail|poster|preview)[^"'\s]+/gi,
        /cloudfront[^"'\s]+loom[^"'\s]+(jpg|png|webp)/gi,
        /loom[^"'\s]+(thumbnail|poster|preview)[^"'\s]+/gi
    ];
    
    cdnPatterns.forEach((pattern, i) => {
        const matches = content.match(pattern);
        if (matches) {
            console.log(`📸 Pattern ${i} matches:`, matches.slice(0, 3)); // Show first 3 matches
        }
    });
}

// Check for Open Graph meta tags
const ogImage = document.querySelector('meta[property="og:image"]');
if (ogImage) {
    console.log('\n📸 Open Graph image:', ogImage.content);
}

// Check if Loom API can provide thumbnail
const videoId = loomVideo?.getAttribute('data-loom-video-id');
if (videoId) {
    console.log('\n🔍 Video ID for thumbnail lookup:', videoId);
    
    // Check if this is the actual Loom video ID from the caption
    const track = loomVideo.querySelector('track[src*="loom.com"]');
    if (track) {
        const match = track.src.match(/\/captions\/([a-zA-Z0-9]+)(?:-\d+)?\.vtt/);
        if (match) {
            console.log('📸 Actual Loom video ID from caption:', match[1]);
            console.log('📸 Potential thumbnail URL:', `https://cdn.loom.com/sessions/thumbnails/${match[1]}-00001.jpg`);
        }
    }
}

console.log('\n✅ Thumbnail debug complete!');