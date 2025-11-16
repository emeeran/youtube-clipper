# Troubleshooting & FAQ

## Quick Troubleshooting

### Plugin Not Appearing After Installation

**Problem**: Plugin doesn't show up in Obsidian after installing

**Solutions**:
1. **Verify file location**:
   - Files must be at: `.obsidian/plugins/youtube-clipper/`
   - Required files: `main.js`, `manifest.json`
   - Check that path is correct (not in `youtube-clipper/`)

2. **Reload plugin**:
   - Settings → Community Plugins → Manage
   - Find YouTubeClipper
   - Toggle off, then toggle on
   - Or restart Obsidian completely

3. **Check manifest.json**:
   ```json
   {
     "id": "youtube-clipper",
     "name": "YouTubeClipper",
     "version": "1.3.0"
   }
   ```

4. **Check console for errors**:
   - `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Opt+I` (macOS)
   - Go to Console tab
   - Look for error messages
   - Report detailed errors with screenshot

---

### "API Key Invalid" Error

**Problem**: Getting "API Key Invalid" when trying to process

**Causes & Solutions**:

#### Wrong API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key (or copy existing)
3. Paste into Settings → YouTubeClipper → Gemini API Key
4. Save settings
5. Retry processing

#### API Key Permissions Missing
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Enable API → Search "Generative Language API"
4. Click Enable
5. Go back to AI Studio and regenerate key

#### Account Issues
1. Check that you have **Gemini 2.0** access (free tier has limits)
2. Verify billing is set up (if hitting quota)
3. Try creating a new API key
4. Clear plugin cache: Settings → YouTubeClipper → (if available) Clear Cache

#### Rate Limited
1. **Issue**: Too many requests too quickly
2. **Solution**: Wait a few minutes before retrying
3. **Prevention**: Don't process many videos simultaneously

---

### Video Processing Fails / Hangs

**Problem**: Processing times out or returns error

**Troubleshooting Steps**:

1. **Check if URL is valid**:
   - Paste URL in browser directly
   - Verify video is publicly accessible
   - Ensure URL is not blocked/private

2. **Try a shorter video** (test):
   - Short videos (< 2 minutes) process faster
   - Long videos (> 1 hour) may timeout
   - If short video works, try medium length

3. **Check network connection**:
   - Try processing different video (rules out URL issue)
   - Restart your internet connection
   - Try from different network if possible

4. **Increase timeout** (if supported):
   - Currently hardcoded to ~60 seconds
   - Create issue if consistently timing out

5. **Check API status**:
   - Visit [Google API Status](https://status.cloud.google.com/)
   - Look for Generative Language API incidents

6. **Check console for errors**:
   - `Ctrl+Shift+I` → Console
   - Look for `[YouTubeClipper]` errors
   - Share error details when reporting

---

### "Model Not Available" Error

**Problem**: Getting "Model not available" or 400 error

**Solutions**:

1. **Refresh model list**:
   - Settings → YouTubeClipper → Model Refresh → Click button
   - Wait for models to reload
   - Retry processing

2. **Use Auto (fallback)**:
   - In modal, select "Auto (fallback)" for provider
   - This uses your default configured API key
   - Should work with any valid key

3. **Check which models are available**:
   - When you click Model Refresh, check console logs
   - Look for `[YouTubeClipper] Available models:`
   - Ensure selected model is in the list

4. **Try different provider**:
   - If Gemini model not available, try Groq
   - If Groq key not configured, set one up

5. **Early access models**:
   - Some models require early access
   - Check [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Verify you have access to selected model

---

### Files Not Saving / Wrong Location

**Problem**: Generated notes not appearing in vault

**Check Output Path**:

1. Go to Settings → YouTubeClipper
2. Find "Output Path" setting
3. Verify path is correct format: `📥 Inbox/Clippings/YouTube`
4. Path should be relative to vault root
5. Folder must exist in vault (plugin won't create parent folders)

**Create Output Folder**:
1. In Obsidian, create folder structure:
   - New folder → "📥 Inbox"
   - Inside that → New folder → "Clippings"
   - Inside that → New folder → "YouTube"
2. Or create path that exists in your vault

**Check File Permissions**:
1. Ensure Obsidian has write permissions to vault
2. Try saving a new note manually (test write access)
3. Restart Obsidian if permissions changed

**File Conflict Handling**:
- If file already exists, plugin will:
  1. Ask you to rename/overwrite
  2. Or auto-append timestamp to filename
  3. Choose action in confirmation modal

---

### Processing Takes Too Long

**Problem**: Taking > 2 minutes to process

**Causes**:

| Cause | Solution |
|-------|----------|
| **Long video** (>30 min) | Process shorter clips, not full videos |
| **Slow internet** | Check connection, try from better network |
| **API overloaded** | Wait and retry, especially during peak hours |
| **Custom prompt** | Long custom prompts may increase processing time |
| **Provider busy** | Try switching to different provider (Groq) |

**Optimization Tips**:
1. Use "Brief" format (faster than detailed-guide)
2. Process shorter videos first
3. Avoid peak hours (typically 9-5 UTC)
4. Ensure good internet connection
5. Don't process multiple videos simultaneously

---

### Custom Prompt Not Saving

**Problem**: Custom prompt disappears after processing

**This is Expected!** 
- Custom prompts are **session-only** by design
- They're not persisted to settings
- Cleared after successful processing
- To save a custom format, add it to settings as new format

**To Create Persistent Custom Format**:
1. Settings → YouTubeClipper → Custom Output Formats
2. Add your custom prompt format
3. Give it a name and description
4. Save settings
5. Format will now be available in dropdown

---

### Obsidian Crashes / Becomes Unresponsive

**Problem**: Obsidian freezes or crashes when using plugin

**Potential Causes**:

1. **Memory issue**:
   - Restart Obsidian
   - Disable other plugins temporarily
   - Try with smaller vault

2. **Plugin conflict**:
   - Disable other plugins
   - Test if crash still occurs
   - Re-enable plugins one by one to identify

3. **Large file**:
   - Generated note is very large
   - Try processing shorter video
   - Check if note is causing slowness

**Report Crash**:
1. Get crash dump:
   - Check Obsidian logs (Help → View logs)
   - Copy relevant error entries
2. Report on GitHub with:
   - System info (OS, Obsidian version)
   - Exact steps to reproduce
   - Error logs
   - Screenshot if helpful

---

## Common Issues FAQ

### Q: Can I process YouTube Shorts?
**A**: Yes! YouTube Shorts work like regular videos. Just paste the short's URL (youtube.com/shorts/...).

### Q: Does it work with live streams?
**A**: No, currently only works with completed videos. Live streams are not supported.

### Q: Can I choose the output folder per video?
**A**: Currently, all videos go to the configured output path. Create a feature request if you'd like per-video folder selection.

### Q: Does it support multiple languages?
**A**: Plugin UI is in English. Videos can be in any language (Gemini handles multilingual content).

### Q: Can I use environment variables for API keys?
**A**: Yes! Enable in settings:
  1. Settings → YouTubeClipper → Use Environment Variables
  2. Set env var: `YOUTUBE_PROCESSOR_GEMINI_API_KEY=your-key`
  3. Restart Obsidian

### Q: How much does it cost?
**A**: 
- Plugin is **free and open source**
- Google Gemini API has **free tier** (limited requests)
- After free tier, you pay per 1000 tokens (~$0.075-0.15)
- Groq API also has free tier

### Q: Can I use local AI models?
**A**: Not currently, but you can open an issue to request support for Ollama or similar.

### Q: Does it require internet?
**A**: Yes, requires internet for:
  - YouTube metadata fetching
  - API calls to Gemini/Groq
  - Model list refresh

### Q: Can I disable auto-open for generated notes?
**A**: Yes, uncheck "Auto-Open Notes" in Settings → YouTubeClipper

### Q: How long are notes kept?
**A**: Notes are stored in your vault permanently (unless you delete them).

### Q: Can I batch process videos?
**A**: Not yet, but it's in the roadmap. Currently one video at a time.

---

## Advanced Troubleshooting

### Enable Debug Logging

1. Open DevTools: `Ctrl+Shift+I` (or `Cmd+Opt+I` macOS)
2. Go to **Console** tab
3. Add filter: `[YouTubeClipper]`
4. Process video
5. Copy all logs with `[YouTubeClipper]` prefix
6. Include in bug reports

### Check Network Requests

1. Open DevTools: `Ctrl+Shift+I`
2. Go to **Network** tab
3. Process video
4. Look for requests to:
   - `generativelanguage.googleapis.com` (Gemini)
   - `api.groq.com` (Groq)
   - `youtube.com/oembed` (YouTube metadata)
5. Check response status and content

### Inspect Plugin State

1. Open DevTools Console
2. Run:
   ```javascript
   const plugin = window.app.plugins.plugins['youtube-clipper'];
   console.log(plugin.settings);
   console.log(plugin.serviceContainer);
   ```
3. Inspect objects to debug state

### Clear Plugin Cache

```javascript
// In DevTools Console
localStorage.clear();
sessionStorage.clear();
// Reload Obsidian
```

### Reset Settings

1. Backup your API keys
2. Delete `.obsidian/plugins/youtube-clipper/data.json`
3. Restart Obsidian
4. Reconfigure plugin from scratch

---

## Reporting Issues

### Before Reporting

- [ ] Searched existing issues
- [ ] Tested with short video
- [ ] Tried different API key
- [ ] Checked internet connection
- [ ] Restarted Obsidian
- [ ] Checked browser console for errors

### When Reporting

Include:
- [ ] Clear issue title
- [ ] Steps to reproduce
- [ ] Expected vs actual behavior
- [ ] Obsidian version
- [ ] Plugin version
- [ ] OS (Windows/Mac/Linux)
- [ ] Error logs from console
- [ ] Screenshots if helpful

### Where to Report

- **Bugs**: [GitHub Issues](https://github.com/youtube-clipper/obsidian-plugin/issues)
- **Questions**: [GitHub Discussions](https://github.com/youtube-clipper/obsidian-plugin/discussions)
- **Security Issues**: [Email security contact](mailto:security@example.com)

---

## Getting Help

1. **Check [README.md](../README.md)** - User guide
2. **Check [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)** - Dev setup
3. **Check [ARCHITECTURE.md](ARCHITECTURE.md)** - System design
4. **Check [API.md](API.md)** - API reference
5. **Check [CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute
6. **Search GitHub Issues** - Your question may be answered
7. **Open GitHub Discussion** - Ask the community
8. **Join Obsidian Discord** - Community support

---

## Reporting Performance Issues

### Benchmark Your System

```javascript
// In DevTools Console
console.time('video-processing');
// Process video
console.timeEnd('video-processing');
```

### Provide Metrics

When reporting slow processing:
- Video length
- Processing time
- AI model used
- Your internet speed (speedtest.net)
- System specs (RAM, CPU)

### Check for Bottlenecks

Common slow points:
1. **Network** - Slow internet connection
2. **API** - Provider overloaded or rate limited
3. **Device** - Insufficient RAM or CPU
4. **Video** - Very long videos take longer

---

## Success! Now What?

After successfully generating a note:

1. **Review content** - AI may make mistakes, verify facts
2. **Add to bibliography** - Link to original video
3. **Cross-reference** - Link related notes
4. **Tag appropriately** - Add tags for later search
5. **Refine format** - Edit note if needed
6. **Archive** - Move to permanent location if done

---

## Still Having Issues?

1. **Double-check this guide** - Your issue may be covered
2. **Search GitHub** - May be known issue
3. **Open issue** - Provide detailed information
4. **Join community** - Get help from others

We're here to help! 🎉

