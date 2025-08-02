// Validation Script for All Provider-Location Combinations
// Run this after loading the extension to verify all fixes are working

console.log('🔧 Extension Validation Started');

// Test data structure
const expectedSupport = {
    'YouTube': {
        classroom: true,
        community: true,
        about: true
    },
    'Loom': {
        classroom: true,
        community: true,
        about: true
    },
    'Vimeo': {
        classroom: true,
        community: true,
        about: true
    },
    'Wistia': {
        classroom: true,
        community: true,
        about: true
    },
    'Skool': {
        classroom: true,
        community: true,
        about: true
    }
};

// Check if extension is loaded
function checkExtensionLoaded() {
    const checks = {
        registry: typeof videoProviderRegistry !== 'undefined',
        detectFunction: typeof detectVideosByLocation !== 'undefined',
        locationDetector: typeof detectPageLocation !== 'undefined',
        providers: []
    };
    
    if (checks.registry && videoProviderRegistry) {
        checks.providers = videoProviderRegistry.providers.map(p => p.name);
    }
    
    return checks;
}

// Validate provider implementations
function validateProviders() {
    if (typeof videoProviderRegistry === 'undefined') {
        console.error('❌ Extension not loaded - videoProviderRegistry not found');
        return false;
    }
    
    const results = {
        providers: {},
        allValid: true
    };
    
    // Check each provider
    ['youtube', 'loom', 'vimeo', 'wistia', 'skool'].forEach(providerName => {
        const provider = videoProviderRegistry.getProviderByName(providerName);
        
        if (!provider) {
            console.error(`❌ Provider '${providerName}' not found in registry`);
            results.allValid = false;
            results.providers[providerName] = { exists: false };
            return;
        }
        
        // Validate required methods
        const providerChecks = {
            exists: true,
            hasDetectInClassroom: typeof provider.detectInClassroom === 'function',
            hasDetectInCommunityPost: typeof provider.detectInCommunityPost === 'function',
            hasCanHandle: typeof provider.canHandle === 'function',
            hasExtractVideoId: typeof provider.extractVideoId === 'function'
        };
        
        // Check if all methods exist
        const allMethodsExist = Object.values(providerChecks).every(check => check === true);
        providerChecks.valid = allMethodsExist;
        
        if (!allMethodsExist) {
            results.allValid = false;
            console.error(`❌ Provider '${providerName}' missing required methods:`, providerChecks);
        } else {
            console.log(`✅ Provider '${providerName}' has all required methods`);
        }
        
        results.providers[providerName] = providerChecks;
    });
    
    return results;
}

// Test current page detection
function testCurrentPage() {
    const currentUrl = window.location.href;
    const detectedLocation = typeof detectPageLocation !== 'undefined' ? detectPageLocation() : 'unknown';
    
    console.log('\n📍 Current Page Test:');
    console.log(`  URL: ${currentUrl}`);
    console.log(`  Detected Location: ${detectedLocation}`);
    
    // Try to detect videos
    if (typeof detectVideosByLocation !== 'undefined' && typeof videoProviderRegistry !== 'undefined') {
        try {
            const videos = detectVideosByLocation(videoProviderRegistry);
            console.log(`  Videos Found: ${videos.length}`);
            
            if (videos.length > 0) {
                console.log('  Detected Videos:');
                videos.forEach((video, i) => {
                    console.log(`    ${i + 1}. ${video.provider || video.type}: ${video.url}`);
                    console.log(`       Title: ${video.title || 'No title'}`);
                    console.log(`       Location: ${video.location || 'unknown'}`);
                });
            }
            
            return { location: detectedLocation, videos: videos, success: true };
        } catch (error) {
            console.error('  ❌ Error during detection:', error);
            return { location: detectedLocation, videos: [], success: false, error: error.message };
        }
    } else {
        console.log('  ❌ Detection functions not available');
        return { location: detectedLocation, videos: [], success: false, error: 'Functions not loaded' };
    }
}

// Generate validation report
function generateReport() {
    console.log('\n📊 === VALIDATION REPORT ===\n');
    
    // Check extension loaded
    const extensionCheck = checkExtensionLoaded();
    console.log('🔌 Extension Status:');
    console.log(`  Registry Loaded: ${extensionCheck.registry ? '✅' : '❌'}`);
    console.log(`  Detection Function: ${extensionCheck.detectFunction ? '✅' : '❌'}`);
    console.log(`  Location Detector: ${extensionCheck.locationDetector ? '✅' : '❌'}`);
    console.log(`  Providers Loaded: ${extensionCheck.providers.length} (${extensionCheck.providers.join(', ')})`);
    
    if (!extensionCheck.registry) {
        console.error('\n❌ Extension not properly loaded. Cannot continue validation.');
        return;
    }
    
    // Validate providers
    console.log('\n🎬 Provider Validation:');
    const providerResults = validateProviders();
    console.log(`  All Providers Valid: ${providerResults.allValid ? '✅' : '❌'}`);
    
    // Test current page
    const pageTest = testCurrentPage();
    
    // Summary
    console.log('\n📋 Summary:');
    console.log(`  Extension Loaded: ${extensionCheck.registry ? '✅' : '❌'}`);
    console.log(`  All Providers Valid: ${providerResults.allValid ? '✅' : '❌'}`);
    console.log(`  Current Page Detection: ${pageTest.success ? '✅' : '❌'}`);
    console.log(`  Ready for Testing: ${extensionCheck.registry && providerResults.allValid ? '✅' : '❌'}`);
    
    // Next steps
    console.log('\n💡 Next Steps:');
    if (extensionCheck.registry && providerResults.allValid) {
        console.log('  ✅ Extension is ready! Visit each test URL and check console logs.');
        console.log('  ✅ Look for logs starting with 🎬 to see provider detection attempts.');
        console.log('  ✅ The extension should now detect videos on all page types.');
    } else {
        console.log('  ❌ Fix the issues above before testing.');
        console.log('  ❌ Make sure the extension is properly loaded.');
        console.log('  ❌ Rebuild if necessary using ./build.sh');
    }
    
    return {
        extensionCheck,
        providerResults,
        pageTest
    };
}

// Run validation
const validationResults = generateReport();

// Export for further use
window.validationResults = validationResults;

console.log('\n🏁 Validation Complete');
console.log('Results stored in: window.validationResults');