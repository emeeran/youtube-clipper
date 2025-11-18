# Obsidian Community Plugins Submission Guide

This guide will walk you through submitting **YouTubeClipper** to the Obsidian Community Plugins registry.

## Pre-Submission Checklist ✅

Before submitting, verify all the following are complete:

- [x] Plugin ID is unique (`youtube-clipper`) — checked against [community-plugins](https://github.com/obsidianmd/obsidian-sample-plugin)
- [x] `manifest.json` has all required fields:
  - `id`: "youtube-clipper" (lowercase, no spaces)
  - `name`: "YouTubeClipper"
  - `version`: "1.3.0" (semver format)
  - `minAppVersion`: "0.15.0"
  - `description`: Present and concise
  - `author`: "YouTubeClipper Team"
  - `authorUrl`: GitHub repo URL
  - `isDesktopOnly`: false (mobile-ready)
- [x] `package.json` version matches `manifest.json` version
- [x] All distribution files present:
  - `main.js` (bundled plugin, 126K)
  - `manifest.json` (metadata)
  - `README.md` (comprehensive docs)
  - `LICENSE` (MIT license)
  - `CHANGELOG.md` (release notes)
  - `icon.svg` (128×128 plugin icon)
- [x] Build succeeds: `npm run build` runs without errors
- [x] Code quality passes: Codacy analysis shows zero issues
- [x] Git repository initialized with meaningful commits
- [x] Git tag created: `v1.3.0`

## Step-by-Step Submission Process

### Option A: Submit via Obsidian Community Plugins Registry (Recommended)

**Latest Process (2025):**

The Obsidian team has simplified the submission process. Follow these steps:

#### 1. Fork the Community Plugins Repository

Go to: https://github.com/obsidianmd/obsidian-releases

Click **"Fork"** to create your own copy.

#### 2. Update the Plugin Registry

In your forked repository, edit `community-plugins.json`:

```bash
# Clone your fork
git clone https://github.com/<YOUR-USERNAME>/obsidian-releases.git
cd obsidian-releases
```

Add your plugin entry to `community-plugins.json`:

```json
{
  "id": "youtube-clipper",
  "name": "YouTubeClipper",
  "author": "YouTubeClipper Team",
  "description": "AI-powered YouTube clipper that extracts key insights and generates structured, actionable notes with conflict-free operation",
  "repo": "https://github.com/youtube-clipper/obsidian-plugin"
}
```

**Important:** Keep the array sorted alphabetically by ID.

#### 3. Commit and Create Pull Request

```bash
git checkout -b add-youtube-clipper-plugin
git add community-plugins.json
git commit -m "Add YouTubeClipper plugin to community registry"
git push origin add-youtube-clipper-plugin
```

Then create a Pull Request on GitHub:
- **Title**: "Add YouTubeClipper plugin"
- **Description**: 
  ```
  This PR adds the YouTubeClipper plugin to the community registry.
  
  Plugin Details:
  - **ID**: youtube-clipper
  - **Repository**: https://github.com/youtube-clipper/obsidian-plugin
  - **Latest Version**: 1.3.0
  - **Description**: AI-powered YouTube clipper for generating structured notes
  
  Compliance:
  - ✅ Manifest.json properly formatted
  - ✅ All required files present (main.js, manifest.json, README.md, LICENSE)
  - ✅ Plugin builds without errors
  - ✅ Code passes quality analysis
  - ✅ Accessibility audit completed (WCAG 2.1 AA)
  ```

#### 4. Wait for Review

The Obsidian team typically reviews PRs within 3-7 business days. They will:
- Verify `manifest.json` is valid
- Check that `main.js` is properly bundled
- Ensure `LICENSE` is present and valid
- Test basic plugin functionality
- Review code for security issues

**Note**: If your PR is rejected, the team will provide feedback. Common rejection reasons:
- Plugin ID already taken (you can check `community-plugins.json` for existing IDs)
- Missing or invalid `manifest.json`
- Missing `LICENSE` file
- Security concerns
- Plugin doesn't provide sufficient value

### Option B: Direct Submission (Alternative)

If you prefer not to use git/GitHub, you can submit via:

1. **Obsidian Plugin Submit Form** (if available at time of submission)
   - Visit: https://obsidian.md/community-plugin-submission
   - Fill in plugin details and upload files
   - Wait for review

2. **Contact Obsidian Team**
   - Email: plugins@obsidian.md
   - Include plugin details and GitHub repo link

## After Submission

### During Review

Once your PR is accepted and merged:

1. **Update Your Plugin Repository**
   - The Obsidian team will release your plugin automatically
   - Your plugin will appear in Obsidian's "Community Plugins" browser after ~24 hours
   - Users can search for "YouTubeClipper" and install directly from Obsidian

2. **Announce Release**
   - Share your plugin on:
     - [Obsidian Discourse Forum](https://forum.obsidian.md/)
     - [Obsidian Discord Community](https://discord.gg/obsidianmd)
     - Reddit: r/ObsidianMD
     - Twitter/X with #ObsidianMD hashtag

### Releasing Updates

For future releases:

1. **Increment version** in `manifest.json` and `package.json`:
   ```bash
   npm run version  # Uses version-bump.mjs
   ```

2. **Update CHANGELOG.md** with release notes

3. **Commit and tag**:
   ```bash
   git commit -m "release: prepare vX.Y.Z"
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   git push origin main
   git push origin --tags
   ```

4. **Create GitHub Release**:
   - Go to your repo: https://github.com/youtube-clipper/obsidian-plugin/releases
   - Click "Create a new release"
   - Select your git tag (vX.Y.Z)
   - Add release notes from `CHANGELOG.md`
   - Publish

Obsidian will automatically detect your new release tag and make it available in the community plugin browser within ~24 hours.

## Important Notes

### Repository Requirements

Your GitHub repository **must have**:
- Public repository
- Valid `manifest.json` in root directory
- Valid `main.js` bundle in root directory
- `LICENSE` file (MIT recommended)
- `README.md` with documentation
- Git tags for releases (v0.0.1, v0.0.2, etc.)

### manifest.json Validation

You can validate your `manifest.json` using:

```bash
# Using jq (install if needed: brew install jq)
jq . manifest.json

# Or online: https://jsonlint.com
```

### Plugin Naming

- Plugin ID must be **lowercase, hyphenated** (e.g., `youtube-clipper`)
- Plugin name can have **spaces and capitals** (e.g., `YouTubeClipper`)
- Both should be unique in the Obsidian ecosystem

### Icon Requirements

- **Format**: SVG (scalable)
- **Size**: 128×128px (viewBox)
- **Colors**: Should be visible on both light and dark Obsidian themes
- **Style**: Should reflect plugin purpose and be recognizable at small sizes

## Troubleshooting

### "Plugin ID already exists"
- Choose a unique ID different from existing community plugins
- Check: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json

### "manifest.json is invalid"
- Verify syntax with `jq . manifest.json`
- Ensure all required fields are present
- Check for proper JSON formatting (no trailing commas)

### "main.js is not a valid bundle"
- Rebuild: `npm run build`
- Verify bundle size (should be >10KB typically)
- Check that `main.js` has Obsidian API imports

### "Plugin not appearing after acceptance"
- Wait 24-48 hours for cache invalidation
- Clear Obsidian's community plugin cache:
  1. Restart Obsidian
  2. Go to Settings → Community Plugins → Manage Plugins
  3. Search for your plugin name
- If still not found, contact Obsidian support

## Release Checklist for Future Updates

When releasing new versions:

- [ ] Update version in `manifest.json`
- [ ] Update version in `package.json`
- [ ] Update `versions.json` with new entry
- [ ] Add entry to top of `CHANGELOG.md`
- [ ] Run `npm run build` and verify no errors
- [ ] Run Codacy analysis or local linter
- [ ] Commit: `git commit -m "release: vX.Y.Z"`
- [ ] Tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
- [ ] Push: `git push origin main && git push origin --tags`
- [ ] Create GitHub Release with `CHANGELOG.md` content
- [ ] Announce on community channels

## Resources

- **Obsidian Plugin Development**: https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin
- **Community Plugins Registry**: https://github.com/obsidianmd/obsidian-releases
- **Obsidian Sample Plugin**: https://github.com/obsidianmd/obsidian-sample-plugin
- **Plugin Guidelines**: https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin
- **Obsidian API**: https://docs.obsidian.md/Reference/TypeScript+API
- **Community Discord**: https://discord.gg/obsidianmd

## Contact & Support

If you encounter issues:

1. **Check Obsidian Plugin Documentation**: https://docs.obsidian.md/Plugins
2. **Search Obsidian Forums**: https://forum.obsidian.md/
3. **Join Obsidian Discord**: https://discord.gg/obsidianmd
4. **Check Your Plugin's GitHub Issues**: Your repository issue tracker

---

**Version**: 1.3.0  
**Last Updated**: November 16, 2025  
**Status**: ✅ Ready for Obsidian Community Plugins submission
