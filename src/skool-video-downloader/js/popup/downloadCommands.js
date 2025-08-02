// Download command generation for different video providers

const providerCommands = {
  youtube: {
    getCommand: (url, isWindows) => {
      const format = '-f "bestvideo[height<=1080]+bestaudio/best[height<=1080]" --merge-output-format mp4';
      const basePath = isWindows ? '-P %USERPROFILE%\\\\Desktop' : '-P ~/Desktop';
      const quote = isWindows ? '"' : "'";
      return `yt-dlp ${format} ${basePath} ${quote}${url}${quote}`;
    }
  },
  vimeo: {
    getCommand: (url, isWindows) => {
      const headers = '--add-header "Referer: https://vimeo.com"';
      const basePath = isWindows ? '-P %USERPROFILE%\\\\Desktop' : '-P ~/Desktop';
      const quote = isWindows ? '"' : "'";
      return `yt-dlp ${headers} ${basePath} ${quote}${url}${quote}`;
    }
  },
  loom: {
    getCommand: (url, isWindows) => {
      const basePath = isWindows ? '-P %USERPROFILE%\\\\Desktop' : '-P ~/Desktop';
      const quote = isWindows ? '"' : "'";
      return `yt-dlp ${basePath} ${quote}${url}${quote}`;
    }
  },
  wistia: {
    getCommand: (url, isWindows) => {
      const basePath = isWindows ? '-P %USERPROFILE%\\\\Desktop' : '-P ~/Desktop';
      const quote = isWindows ? '"' : "'";
      return `yt-dlp ${basePath} ${quote}${url}${quote}`;
    }
  },
  skool: {
    getCommand: (url, isWindows) => {
      const basePath = isWindows ? '-P %USERPROFILE%\\\\Desktop' : '-P ~/Desktop';
      const quote = isWindows ? '"' : "'";
      return `yt-dlp ${basePath} ${quote}${url}${quote}`;
    }
  }
};

// Generate platform-specific download commands
export function generateDownloadCommand(video, isWindows = false) {
  const providerName = video.providerName || video.type;
  if (providerName && providerCommands[providerName]) {
    return providerCommands[providerName].getCommand(video.url, isWindows);
  }
  
  // Fallback to basic command
  const basePath = isWindows ? '-P %USERPROFILE%\\\\Desktop' : '-P ~/Desktop';
  const quote = isWindows ? '"' : "'";
  return `yt-dlp ${basePath} ${quote}${video.url}${quote}`;
}

// Escape command for HTML attributes
export function escapeCommandForHtml(command) {
  return command.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}