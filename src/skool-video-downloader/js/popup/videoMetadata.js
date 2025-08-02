// Video metadata fetching and enrichment

// Fetch metadata for all videos
export async function enrichVideosWithMetadata(videos) {
  return Promise.all(
    videos.map(async (video) => {
      // Fetch Loom metadata
      if (video.type === 'loom' && video.videoId) {
        await fetchLoomMetadata(video);
      }
      
      // Fetch Wistia thumbnail if missing
      if (video.type === 'wistia' && video.videoId && !video.thumbnail) {
        await fetchWistiaThumbnail(video);
      }
      
      return video;
    })
  );
}

// Fetch Loom video metadata
async function fetchLoomMetadata(video) {
  try {
    const metadata = await chrome.runtime.sendMessage({
      action: 'fetchLoomMetadata',
      videoId: video.videoId
    });
    
    if (metadata.title) {
      video.title = metadata.title;
    }
  } catch (error) {
    console.error('Error fetching Loom metadata:', error);
  }
}

// Fetch Wistia thumbnail
async function fetchWistiaThumbnail(video) {
  try {
    const result = await chrome.runtime.sendMessage({
      action: 'fetchWistiaThumbnail',
      videoId: video.videoId
    });
    
    if (result.thumbnail) {
      video.thumbnail = result.thumbnail;
      console.log('📺 Fetched Wistia thumbnail:', result.thumbnail);
    }
  } catch (error) {
    console.error('Error fetching Wistia thumbnail:', error);
  }
}