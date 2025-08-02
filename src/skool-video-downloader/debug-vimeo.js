// Debug script for Vimeo detection
// Copy and paste this into the browser console on https://www.skool.com/theaspinallway/about

console.log('🚀 Starting Vimeo Debug');

// 1. Check what page location is detected
function detectPageLocation() {
    const url = window.location.href;
    const pathname = window.location.pathname;
    
    if (url.includes('/classroom/') || url.includes('?md=')) {
        return 'classroom';
    }
    if (url.includes('/community/') || pathname.includes('/posts/')) {
        return 'community';
    }
    if (pathname.includes('/about')) {
        return 'about';
    }
    return 'unknown';
}

const location = detectPageLocation();
console.log('🔍 Detected page location:', location);

// 2. Check for iframes
const allIframes = document.querySelectorAll('iframe');
console.log('🎬 Total iframes found:', allIframes.length);

allIframes.forEach((iframe, index) => {
    console.log(`🎬 Iframe ${index + 1}:`, {
        src: iframe.src,
        width: iframe.width,
        height: iframe.height,
        id: iframe.id,
        className: iframe.className,
        isVimeo: iframe.src && (iframe.src.includes('vimeo.com') || iframe.src.includes('player.vimeo.com'))
    });
});

// 3. Check for Vimeo links
const vimeoLinks = document.querySelectorAll('a[href*="vimeo.com"]');
console.log('🔗 Vimeo links found:', vimeoLinks.length);

vimeoLinks.forEach((link, index) => {
    console.log(`🔗 Vimeo link ${index + 1}:`, link.href);
});

// 4. Check for data attributes
const dataElements = document.querySelectorAll('[data-vimeo-id], [data-video-id*="vimeo"], [class*="vimeo"], [id*="vimeo"]');
console.log('📊 Elements with Vimeo data attributes:', dataElements.length);

dataElements.forEach((el, index) => {
    console.log(`📊 Data element ${index + 1}:`, {
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        datasets: el.dataset
    });
});

// 5. Check __NEXT_DATA__ script
const nextDataScript = document.getElementById('__NEXT_DATA__');
if (nextDataScript) {
    console.log('📜 Found __NEXT_DATA__ script');
    const content = nextDataScript.textContent;
    
    // Search for Vimeo patterns
    const vimeoMatches = content.match(/vimeo/gi);
    console.log('📜 Vimeo mentions in __NEXT_DATA__:', vimeoMatches ? vimeoMatches.length : 0);
    
    if (vimeoMatches) {
        // Extract potential video IDs
        const patterns = [
            /vimeo\.com\/([0-9]+)/g,
            /player\.vimeo\.com\/video\/([0-9]+)/g,
            /"videoId":\s*"([0-9]+)".*vimeo/gi,
            /vimeo.*?"([0-9]+)"/g
        ];
        
        patterns.forEach((pattern, index) => {
            const matches = [...content.matchAll(pattern)];
            if (matches.length > 0) {
                console.log(`📜 Pattern ${index + 1} matches:`, matches.map(m => m[1]));
            }
        });
    }
} else {
    console.log('📜 No __NEXT_DATA__ script found');
}

// 6. Check all script tags for Vimeo references
const allScripts = document.querySelectorAll('script');
let scriptsWithVimeo = 0;

allScripts.forEach((script, index) => {
    if (script.textContent && script.textContent.includes('vimeo')) {
        scriptsWithVimeo++;
        console.log(`📜 Script ${index + 1} contains Vimeo references`);
        
        // Try to extract video IDs
        const vimeoMatch = script.textContent.match(/vimeo\.com\/([0-9]+)|player\.vimeo\.com\/video\/([0-9]+)/);
        if (vimeoMatch) {
            const videoId = vimeoMatch[1] || vimeoMatch[2];
            console.log(`📜 Found potential video ID in script: ${videoId}`);
        }
    }
});

console.log(`📜 Total scripts with Vimeo references: ${scriptsWithVimeo}`);

// 7. Generic content search
const bodyHTML = document.body.innerHTML;
const vimeoReferences = bodyHTML.match(/vimeo/gi);
console.log('🔍 Total Vimeo mentions in page:', vimeoReferences ? vimeoReferences.length : 0);

console.log('🏁 Vimeo Debug Complete');