# Security Best Practices

This document outlines security best practices for using and developing the YouTubeClipper plugin.

## API Key Security

### User-Facing Security

#### Storing API Keys Securely

**✅ Best Practices:**

1. **Never commit API keys to git**
   ```bash
   # ✓ Good: Use .gitignore
   echo "data.json" >> .gitignore
   ```

2. **Use environment variables for development**
   ```bash
   export YOUTUBE_PROCESSOR_GEMINI_API_KEY=your-key
   export YOUTUBE_PROCESSOR_GROQ_API_KEY=your-key
   ```

3. **Enable "Use Environment Variables" in settings**
   - Settings → YouTubeClipper → Use Environment Variables ✓
   - Set prefix (default: `YTC`)
   - Plugin loads keys from env, not settings file

4. **Secure Settings Display**
   - API keys shown as `•••••••••` (password fields)
   - Click "Show" to temporarily reveal
   - Keys encrypted in Obsidian's plugin data

#### Getting API Keys Safely

1. **Google Gemini API**
   ```
   1. Go to https://makersuite.google.com/app/apikey
   2. Create a new API key
   3. Copy immediately (can't be viewed again)
   4. Never share the key
   5. Rotate regularly if compromised
   ```

2. **Groq API**
   ```
   1. Go to https://console.groq.com/keys
   2. Create API key
   3. Copy and store safely
   4. Don't commit to version control
   ```

#### Protecting Your Keys

**⚠️ Danger Zone:**

- ❌ Never paste API key in forums/chat
- ❌ Never commit to GitHub (even private repos)
- ❌ Never screenshot with key visible
- ❌ Never email API key in plaintext
- ❌ Never put in browser console
- ❌ Never share public URLs with key embedded

**✅ What to Do If Compromised:**

1. Immediately revoke key in API dashboard
2. Generate new key
3. Update plugin settings
4. Check API usage logs for abuse
5. Report suspicious activity to provider

### Developer Security

#### Handling API Keys in Code

**✓ Correct Pattern:**
```typescript
// Load from secure settings
const key = this.settings.geminiApiKey;

// Use in API call with Authorization header
const response = await fetch(endpoint, {
  headers: {
    'x-goog-api-key': key,  // Provider-specific
    'Authorization': `Bearer ${key}`
  }
});
```

**✗ Anti-patterns:**
```typescript
// ❌ Hardcoding keys
const key = 'sk-abc123...'; 

// ❌ Logging keys
console.log('Key:', key);

// ❌ Including in error messages
throw new Error(`Auth failed with key: ${key}`);

// ❌ Passing in URLs
const url = `https://api.example.com?key=${key}`;
```

#### Never Log Sensitive Data

```typescript
// ✓ Good: Log only necessary info
console.log('[YouTubeClipper] API request to:', endpoint);

// ✗ Bad: Logging keys or responses with keys
console.log('[YouTubeClipper] Full response:', response);
console.log('[YouTubeClipper] Using key:', apiKey);
```

#### API Key Validation

```typescript
// ✓ Validate before use
if (!apiKey || apiKey.length < 10) {
  throw new Error('API key appears invalid');
}

// Ensure API key format
if (!apiKey.startsWith('sk-') && !apiKey.startsWith('gsk_')) {
  throw new Error('Invalid API key format');
}
```

## Data Security

### User Data Protection

#### Video Metadata
- Titles and descriptions fetched from YouTube public API
- No private data accessed
- Cached only during session
- Cleared on plugin unload

#### Generated Notes
- Stored in user's local Obsidian vault only
- Never uploaded anywhere
- User has complete control
- Can be encrypted vault-wide using Obsidian

#### Processing History
- Optional: Stored locally in plugin settings
- Includes: URL, format, timestamp
- No API responses cached
- Can be cleared manually

### What Data We DON'T Collect

✅ We do NOT:
- Send notes to external servers
- Track user behavior
- Collect vault contents
- Store API keys externally
- Log personal data
- Share with third parties

## Network Security

### API Communication

#### HTTPS Only
```typescript
// ✓ All API calls use HTTPS
https://generativelanguage.googleapis.com/v1beta/...
https://api.groq.com/openai/v1/...

// ❌ Never use HTTP
http://api.example.com/...
```

#### Response Validation

```typescript
// Validate before processing
if (!response.ok) {
  throw ErrorHandler.handleAPIError(
    response,
    'Gemini',
    'API returned error'
  );
}

// Validate JSON structure
const data = await response.json();
if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
  throw new Error('Invalid response structure');
}
```

#### YouTube oEmbed

The YouTube oEmbed endpoint is used to fetch:
- Video title
- Video description
- Thumbnail URL
- Author information

**Security:**
- Public API, no authentication needed
- Returns metadata only (no private data)
- Optional CORS proxy for privacy
- No cookies or tracking

## Code Security

### Input Validation

```typescript
// ✓ Always validate user input
function validateURL(url: string): boolean {
  // Check format
  if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
    return false;
  }
  
  // Extract and validate ID
  const id = extractVideoId(url);
  if (!id || id.length !== 11) {
    return false;
  }
  
  return true;
}
```

### Error Handling

```typescript
// ✓ Handle errors without exposing sensitive data
try {
  const result = await processVideo(url);
} catch (error) {
  // ✓ Good: User-friendly message
  new Notice('Failed to process video. Please check your API key.');
  
  // ❌ Bad: Exposing error details
  new Notice(`Error: ${error.message} with key ${apiKey}`);
}
```

### Dependency Security

#### Keep Dependencies Updated
```bash
# Check for security updates
npm audit

# Fix vulnerabilities
npm audit fix

# View detailed report
npm audit --detailed
```

#### Lock File
- Always commit `package-lock.json`
- Ensures reproducible installs
- Prevents dependency hijacking

## User Guidance

### Settings Security Best Practices

1. **In Obsidian Settings**
   - ✓ API keys shown as password fields
   - ✓ Use Show/Hide button to verify
   - ✓ Test connectivity before saving
   - ✓ Never screenshot with keys visible

2. **Environment Variables (Recommended)**
   ```bash
   # On macOS/Linux (add to ~/.zshrc or ~/.bashrc)
   export YTC_GEMINI_API_KEY=your-gemini-key
   export YTC_GROQ_API_KEY=your-groq-key
   ```

   ```batch
   # On Windows (set environment variable)
   set YTC_GEMINI_API_KEY=your-gemini-key
   set YTC_GROQ_API_KEY=your-groq-key
   ```

3. **Enable in Plugin**
   - Settings → YouTubeClipper
   - Check "Use Environment Variables"
   - Set prefix if needed
   - Leave key fields empty

### Vault Encryption

Obsidian supports E2EE for vaults:

1. **Enable for existing vault**
   - Settings → About → Encryption
   - Enable encryption
   - Obsidian encrypts all data locally

2. **Create encrypted vault**
   - New vault → Choose encryption method
   - All notes encrypted from creation

3. **Why use it**
   - Protects all vault contents
   - Generated notes encrypted
   - API keys encrypted in plugin data
   - Zero-knowledge encryption (only you have password)

## Incident Response

### If You Suspect a Security Issue

1. **Report responsibly**
   - Email: security@example.com (hypothetical)
   - Don't post in public issues
   - Include details but no sensitive data

2. **Immediate actions**
   - Revoke compromised API key
   - Generate new key
   - Check API usage for abuse
   - Update plugin settings

3. **Prevention**
   - Rotate keys periodically
   - Use environment variables
   - Enable vault encryption
   - Keep plugin updated

### Reporting Security Bugs

**Do NOT:**
- Open public GitHub issue
- Post in forums
- Send unencrypted details

**Do:**
- Email security details securely
- Include affected plugin version
- Provide reproduction steps
- Suggest fix if possible

## Development Security Checklist

When contributing code:

- [ ] No hardcoded API keys or secrets
- [ ] No logging of sensitive data
- [ ] Input validation for user data
- [ ] Error handling without exposing details
- [ ] Use HTTPS for all API calls
- [ ] Validate API responses
- [ ] No eval() or dynamic code execution
- [ ] Sanitize HTML/Markdown output
- [ ] Dependencies audited (`npm audit`)
- [ ] Tests pass without warnings

## Third-Party Services

### External APIs Used

| Service | Purpose | Data Shared |
|---------|---------|------------|
| **Google Gemini** | AI analysis | Prompt, video metadata |
| **Groq** | AI analysis (fallback) | Prompt, video metadata |
| **YouTube oEmbed** | Video metadata | Video ID only |

### Privacy by Service

1. **Google Gemini API**
   - Processes video content
   - May be logged for improvement (check Google privacy)
   - HTTPS encrypted
   - Use private API keys

2. **Groq API**
   - Processes prompts only
   - Check Groq privacy policy
   - HTTPS encrypted
   - Optional fallback provider

3. **YouTube oEmbed**
   - Returns only public metadata
   - No authentication
   - Public information
   - No user data sent

## Compliance & Standards

### Security Standards

- ✅ **HTTPS**: All network communication encrypted
- ✅ **Input Validation**: All user input validated
- ✅ **Error Handling**: Errors handled gracefully
- ✅ **Logging**: No sensitive data logged
- ✅ **Dependencies**: Audited and maintained
- ✅ **Code Review**: PR review process
- ✅ **Documentation**: Security practices documented

### License & Privacy

- Open source under MIT License
- Source code publicly available
- No data collection
- No tracking
- No telemetry
- User data stays local

## Resources

### Learning More

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)
- [Google Security Best Practices](https://developers.google.com/apps-script/guides/security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

### Reporting Issues

- **Security Bugs**: [Email security contact]
- **General Issues**: GitHub Issues
- **Questions**: GitHub Discussions
- **Community**: Obsidian Discord

## Summary

| Area | Recommendation |
|------|-----------------|
| **API Keys** | Use environment variables |
| **Vault Data** | Enable E2EE encryption |
| **Updates** | Keep plugin & dependencies updated |
| **Logging** | Never log keys or responses |
| **Sharing** | Don't share vault or API keys |
| **Verification** | Test connectivity before use |

---

**Security is a shared responsibility.** If you find a vulnerability, please report it responsibly.

For more information, see [CONTRIBUTING.md](CONTRIBUTING.md) and [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

