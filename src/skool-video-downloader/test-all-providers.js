// Comprehensive test script for all 5 providers across all 3 locations
// Copy and paste this into the browser console on any Skool page

console.log('🚀 Starting Comprehensive Provider Test');
console.log('Testing: YouTube, Loom, Vimeo, Wistia, Skool across Classroom, Community, About pages');

// Detect current page location
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

const currentLocation = detectPageLocation();
console.log('📍 Current page location:', currentLocation);

// Test individual providers
const providers = [
    { name: 'YouTube', patterns: ['youtube.com', 'youtu.be', 'ytimg.com'] },
    { name: 'Loom', patterns: ['loom.com'] },
    { name: 'Vimeo', patterns: ['vimeo.com', 'player.vimeo.com'] },
    { name: 'Wistia', patterns: ['wistia.com', 'wistia.net'] },
    { name: 'Skool', patterns: ['skool.com', '.mp4'] }
];

// 1. Test page-level detection (for classroom/about)
console.log('\n🔍 === PAGE-LEVEL DETECTION ===');
console.log('Checking __NEXT_DATA__ and script tags...');

const nextDataScript = document.getElementById('__NEXT_DATA__');
if (nextDataScript) {
    console.log('✅ Found __NEXT_DATA__ script');
    const content = nextDataScript.textContent;
    
    providers.forEach(provider => {
        console.log(`\n🎬 Testing ${provider.name}:`);
        const matches = [];
        
        provider.patterns.forEach(pattern => {
            const regex = new RegExp(pattern, 'gi');
            const found = content.match(regex);
            if (found) {
                matches.push(`${pattern}: ${found.length} matches`);
            }
        });
        
        if (matches.length > 0) {
            console.log(`  ✅ ${provider.name} references found:`, matches);
        } else {
            console.log(`  ❌ No ${provider.name} references found`);
        }
    });
} else {
    console.log('❌ No __NEXT_DATA__ script found');
}

// Check other script tags
const allScripts = document.querySelectorAll('script');
console.log(`\n📜 Checking ${allScripts.length} script tags...`);

let scriptMatches = {};
providers.forEach(provider => {
    scriptMatches[provider.name] = 0;
});

allScripts.forEach((script, index) => {
    if (script.textContent) {
        providers.forEach(provider => {
            provider.patterns.forEach(pattern => {
                if (script.textContent.includes(pattern)) {
                    scriptMatches[provider.name]++;
                }
            });
        });
    }
});

console.log('Script tag matches:', scriptMatches);

// 2. Test DOM-level detection (for community posts/about)
console.log('\n🔍 === DOM-LEVEL DETECTION ===');

// Find container elements
const containers = [
    { name: 'Main', element: document.querySelector('main') },
    { name: 'Body', element: document.body },
    { name: 'Article', element: document.querySelector('article') },
    { name: 'Content containers', elements: document.querySelectorAll('.content, .post-content, [class*="content"]') }
];

containers.forEach(container => {
    if (container.element) {
        console.log(`\n📦 Testing container: ${container.name}`);
        testContainerForProviders(container.element);
    } else if (container.elements && container.elements.length > 0) {
        console.log(`\n📦 Testing ${container.elements.length} ${container.name}:`);
        container.elements.forEach((el, i) => {
            console.log(`  Container ${i + 1}:`);
            testContainerForProviders(el);
        });
    }
});

function testContainerForProviders(element) {
    // Test iframes
    const iframes = element.querySelectorAll('iframe');
    console.log(`  🖼️ Found ${iframes.length} iframes`);
    
    iframes.forEach((iframe, i) => {
        console.log(`    Iframe ${i + 1}: ${iframe.src || 'no src'}`);
        
        providers.forEach(provider => {
            const hasMatch = provider.patterns.some(pattern => 
                iframe.src && iframe.src.includes(pattern)
            );
            if (hasMatch) {
                console.log(`      ✅ Matches ${provider.name}`);
            }
        });
    });
    
    // Test links
    const allLinks = element.querySelectorAll('a[href]');
    const videoLinks = [];
    
    allLinks.forEach(link => {
        providers.forEach(provider => {
            const hasMatch = provider.patterns.some(pattern => 
                link.href && link.href.includes(pattern)
            );
            if (hasMatch) {
                videoLinks.push({ link: link.href, provider: provider.name });
            }
        });
    });
    
    console.log(`  🔗 Found ${videoLinks.length} video links out of ${allLinks.length} total links`);
    videoLinks.forEach(vl => {
        console.log(`    ${vl.provider}: ${vl.link}`);
    });
    
    // Test images (thumbnails)
    const images = element.querySelectorAll('img[src]');
    const videoImages = [];
    
    images.forEach(img => {
        providers.forEach(provider => {
            const hasMatch = provider.patterns.some(pattern => 
                img.src && img.src.includes(pattern)
            );
            if (hasMatch) {
                videoImages.push({ src: img.src, provider: provider.name });
            }
        });
    });
    
    console.log(`  🖼️ Found ${videoImages.length} video thumbnails out of ${images.length} total images`);
    videoImages.forEach(vi => {
        console.log(`    ${vi.provider}: ${vi.src}`);
    });
    
    // Test data attributes
    const dataElements = element.querySelectorAll('[data-embed-url], [data-src], [data-video-id], [data-loom-id], [data-vimeo-id], [data-wistia-id]');
    console.log(`  📊 Found ${dataElements.length} elements with data attributes`);
    
    dataElements.forEach((el, i) => {
        const datasets = Object.keys(el.dataset);
        console.log(`    Element ${i + 1} datasets:`, datasets);
        
        Object.entries(el.dataset).forEach(([key, value]) => {
            providers.forEach(provider => {
                const hasMatch = provider.patterns.some(pattern => 
                    value && value.includes(pattern)
                );
                if (hasMatch) {
                    console.log(`      ✅ ${provider.name} in ${key}: ${value}`);
                }
            });
        });
    });
}

// 3. Test specific provider class containers
console.log('\n🔍 === PROVIDER-SPECIFIC CONTAINERS ===');

const providerContainers = [
    { name: 'Wistia', selector: '[class*="wistia"], [id*="wistia"]' },
    { name: 'YouTube', selector: '[class*="youtube"], [id*="youtube"]' },
    { name: 'Loom', selector: '[class*="loom"], [id*="loom"]' },
    { name: 'Vimeo', selector: '[class*="vimeo"], [id*="vimeo"]' }
];

providerContainers.forEach(pc => {
    const elements = document.querySelectorAll(pc.selector);
    console.log(`🎬 ${pc.name} containers: ${elements.length}`);
    
    elements.forEach((el, i) => {
        console.log(`  ${i + 1}. Class: "${el.className}", ID: "${el.id}"`);
    });
});

// 4. Summary
console.log('\n📊 === SUMMARY ===');
console.log(`Page location: ${currentLocation}`);
console.log('This test helps identify which providers should be detected on this page.');
console.log('Check the console output above to see what video content is available.');
console.log('\nTo test the actual extension:');
console.log('1. Open the extension popup');
console.log('2. Check the browser console for provider detection logs');
console.log('3. Look for logs starting with 🎬 [ProviderName]Provider:');

console.log('\n🏁 Comprehensive Provider Test Complete');