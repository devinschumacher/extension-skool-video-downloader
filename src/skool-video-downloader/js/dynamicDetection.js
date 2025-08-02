// Dynamic video detection for lazy-loaded content

// Set up a mutation observer to detect dynamically added videos
function setupDynamicVideoDetection(callback) {
    let debounceTimer;
    
    const observer = new MutationObserver((mutations) => {
        // Debounce to avoid too many calls
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            let shouldCheck = false;
            
            for (const mutation of mutations) {
                // Check if any video-related elements were added
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) { // Element node
                        const element = node;
                        if (element.tagName === 'IFRAME' || 
                            element.querySelector?.('iframe') ||
                            element.className?.includes('video') ||
                            element.innerHTML?.includes('vimeo') ||
                            element.innerHTML?.includes('youtube') ||
                            element.innerHTML?.includes('loom') ||
                            element.innerHTML?.includes('wistia')) {
                            shouldCheck = true;
                            break;
                        }
                    }
                }
                if (shouldCheck) break;
            }
            
            if (shouldCheck) {
                console.log('Dynamic content detected, checking for videos...');
                callback();
            }
        }, 500); // Wait 500ms after last mutation
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'data-src', 'data-video-id']
    });
    
    return observer;
}

// Check if an element is likely to contain video
function isVideoElement(element) {
    if (!element || element.nodeType !== 1) return false;
    
    const tag = element.tagName.toLowerCase();
    const className = element.className || '';
    const id = element.id || '';
    
    return (
        tag === 'iframe' ||
        tag === 'video' ||
        className.includes('video') ||
        className.includes('vimeo') ||
        className.includes('youtube') ||
        id.includes('video') ||
        element.hasAttribute('data-video-id') ||
        element.hasAttribute('data-vimeo-id')
    );
}