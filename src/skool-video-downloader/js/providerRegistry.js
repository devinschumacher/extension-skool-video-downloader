// Provider registry - manages all video providers

class ProviderRegistry {
    constructor() {
        this.providers = [];
        this.providerMap = {};
    }
    
    // Register a provider
    register(provider) {
        this.providers.push(provider);
        this.providerMap[provider.name] = provider;
    }
    
    // Get provider that can handle a URL
    getProviderForUrl(url) {
        for (const provider of this.providers) {
            if (provider.canHandle(url)) {
                return provider;
            }
        }
        return null;
    }
    
    // Get provider by name
    getProviderByName(name) {
        return this.providerMap[name] || null;
    }
    
    // Detect video in classroom context
    detectInClassroom(document) {
        const detectedVideos = [];
        
        for (const provider of this.providers) {
            const result = provider.detectInClassroom(document);
            if (result) {
                // Handle both array and single object returns
                const videos = Array.isArray(result) ? result : [result];
                for (const video of videos) {
                    detectedVideos.push({
                        ...video,
                        provider: video.provider || provider.name,
                        type: video.type || provider.name
                    });
                }
            }
        }
        
        return detectedVideos;
    }
    
    // Detect video in community post
    detectInCommunityPost(element) {
        const detectedVideos = [];
        
        for (const provider of this.providers) {
            const result = provider.detectInCommunityPost(element);
            if (result) {
                // Handle both array and single object returns
                const videos = Array.isArray(result) ? result : [result];
                for (const video of videos) {
                    detectedVideos.push({
                        ...video,
                        provider: video.provider || provider.name,
                        type: video.type || provider.name
                    });
                }
            }
        }
        
        return detectedVideos;
    }
    
    // Get all selectors from all providers
    getAllSelectors() {
        const allSelectors = {
            iframe: [],
            link: [],
            embed: [],
            thumbnail: []
        };
        
        for (const provider of this.providers) {
            const selectors = provider.getSelectors();
            allSelectors.iframe.push(...selectors.iframe);
            allSelectors.link.push(...selectors.link);
            allSelectors.embed.push(...selectors.embed);
            allSelectors.thumbnail.push(...selectors.thumbnail);
        }
        
        return allSelectors;
    }
}

// Create and initialize the registry
const videoProviderRegistry = new ProviderRegistry();

// Register all providers
videoProviderRegistry.register(new YouTubeProvider());
videoProviderRegistry.register(new LoomProvider());
videoProviderRegistry.register(new VimeoProvider());
videoProviderRegistry.register(new WistiaProvider());
videoProviderRegistry.register(new SkoolProvider());