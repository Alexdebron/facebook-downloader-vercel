# Facebook Downloader API
**Creator:** Chamod Nimsara

A simple serverless Facebook video downloader API using fdownloader.net scraping.

## Example Usage

```
https://your-vercel-app.vercel.app/api/fb?url=https://www.facebook.com/share/v/1FJeGXq7z5/
```

### Response Example
```json
{
  "status": true,
  "creator": "Chamod Nimsara",
  "metadata": {
    "title": "Funny Cat Video",
    "duration": "00:35",
    "thumbnail": "https://cdn.fdownloader.net/thumb.jpg"
  },
  "download": {
    "media": "https://cdn.fdownloader.net/video.mp4",
    "music": "https://cdn.fdownloader.net/audio.mp3",
    "videos": [
      { "quality": "HD", "url": "https://..." },
      { "quality": "SD", "url": "https://..." }
    ]
  }
}
```

## Deployment
1. Push to GitHub.
2. Import into Vercel.
3. Open your app at `/api/fb?url=<facebook_link>`.

Enjoy your own Facebook downloader API!
