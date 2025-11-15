# API Setup Guide for YouTubeClipper

This guide covers secure API key management for the YouTubeClipper Obsidian plugin.

## 🔐 Security First

**IMPORTANT**: Never commit API keys to git repositories. This plugin supports environment variables for secure key management.

## Quick Start

### 1. Choose Your Security Method

**Option A: Environment Variables (Recommended)**
- Most secure
- Keys stored outside the repository
- Separate development/production keys

**Option B: Plugin Storage (Local Only)**
- Keys stored in Obsidian's plugin data
- Ensure `data.json` is in `.gitignore`
- Less secure than environment variables

### 2. Set Up Environment Variables (Recommended)

#### Using the Setup Script
```bash
# For development
./.github/scripts/env-setup.sh --dev

# For production
./.github/scripts/env-setup.sh --prod

# Check current configuration
./.github/scripts/env-setup.sh --check
```

#### Manual Setup

Create environment variables with the prefix `YOUTUBECLIPPER_`:

```bash
export YOUTUBECLIPPER_GEMINI_API_KEY="your_gemini_key_here"
export YOUTUBECLIPPER_GROQ_API_KEY="your_groq_key_here"
export YOUTUBECLIPPER_OPENAI_API_KEY="your_openai_key_here"
```

#### Platform-Specific Instructions

**Linux/macOS:**
Add to `~/.bashrc`, `~/.zshrc`, or `~/.profile`:
```bash
export YOUTUBECLIPPER_GEMINI_API_KEY="your_key"
export YOUTUBECLIPPER_GROQ_API_KEY="your_key"
export YOUTUBECLIPPER_OPENAI_API_KEY="your_key"
```

**Windows:**
```cmd
setx YOUTUBECLIPPER_GEMINI_API_KEY "your_key"
setx YOUTUBECLIPPER_GROQ_API_KEY "your_key"
setx YOUTUBECLIPPER_OPENAI_API_KEY "your_key"
```

### 3. Configure the Plugin

1. Open Obsidian
2. Go to Settings → Community Plugins → YouTubeClipper
3. Enable "Use Environment Variables"
4. Set "Environment Prefix" to `YOUTUBECLIPPER`
5. The plugin will automatically detect your API keys

## Getting API Keys

### Google Gemini
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIzaSy`)

**Free Tier**: 60 requests per minute

### Groq
1. Visit [Groq Console](https://console.groq.com/keys)
2. Sign up or log in
3. Create a new API key
4. Copy the key (starts with `gsk_`)

**Free Tier**: 30 requests per minute

### OpenAI
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Create a new API key
4. Copy the key (starts with `sk-proj-`)

**Note**: OpenAI requires payment information even for free tier usage.

## Development vs Production

### Separate Keys for Security

**Development Environment:**
- Use separate API keys for development
- Store in `.env.development` file (never commit)
- Lower rate limits acceptable

**Production Environment:**
- Use different API keys from development
- Store in system environment variables
- Monitor usage and set up alerts

### Environment File Example

Create `.env.development` (add to `.gitignore`):
```bash
# Development API Keys
YOUTUBECLIPPER_GEMINI_API_KEY=AIzaSy...development_key
YOUTUBECLIPPER_GROQ_API_KEY=gsk_...development_key
YOUTUBECLIPPER_OPENAI_API_KEY=sk-proj-...development_key
```

Load before starting Obsidian:
```bash
source .env.development
obsidian
```

## Security Best Practices

### 1. Key Management
- ✅ Use environment variables
- ✅ Separate development and production keys
- ✅ Add `data.json` to `.gitignore`
- ✅ Rotate keys regularly
- ❌ Never commit keys to git
- ❌ Don't share keys in chat or email

### 2. Monitoring
- Monitor API usage in provider dashboards
- Set up usage alerts
- Review access logs regularly
- Rotate keys if suspicious activity detected

### 3. Git Security
Install git-secrets to prevent accidental commits:
```bash
# Already configured in this repository
git secrets --scan
```

### 4. Regular Audits
Run the security audit script:
```bash
./.github/scripts/security-audit.sh
```

## Custom Environment Prefix

You can use a custom prefix instead of `YOUTUBECLIPPER`:

1. Set environment variables with your prefix:
   ```bash
   export MYAPP_GEMINI_API_KEY="your_key"
   export MYAPP_GROQ_API_KEY="your_key"
   export MYAPP_OPENAI_API_KEY="your_key"
   ```

2. Configure the plugin to use your custom prefix in settings

3. Or use the setup script:
   ```bash
   ./.github/scripts/env-setup.sh --dev --prefix MYAPP
   ```

## Troubleshooting

### Plugin Can't Find API Keys

1. **Check environment variables are set:**
   ```bash
   echo $YOUTUBECLIPPER_GEMINI_API_KEY
   ```

2. **Verify plugin configuration:**
   - "Use Environment Variables" is enabled
   - "Environment Prefix" matches your variables

3. **Restart Obsidian:**
   - Environment variables are loaded at startup

### API Calls Failing

1. **Verify API keys are valid:**
   - Test with provider's documentation
   - Check for typos or extra spaces

2. **Check rate limits:**
   - All providers have free tier limits
   - Wait and retry if hitting limits

3. **Network connectivity:**
   - Ensure internet connection is stable
   - Check if corporate firewall blocks API calls

### Environment Variables Not Loading

1. **Check shell configuration:**
   ```bash
   # Add to ~/.bashrc or ~/.zshrc
   source ~/.env
   ```

2. **Verify file permissions:**
   ```bash
   chmod 600 .env.development
   ```

3. **Use absolute paths:**
   ```bash
   source /full/path/to/.env.development
   ```

## Migration from Direct Storage

If you previously stored API keys directly in the plugin:

1. **Enable environment variables in plugin settings**
2. **Set up environment variables as described above**
3. **Clear old keys from plugin settings** (optional but recommended)
4. **Restart Obsidian to ensure new configuration is loaded**

The plugin will automatically prefer environment variables over stored keys when available.

## API Usage Guidelines

### Rate Limits (Free Tiers)
- **Gemini**: 60 requests/minute
- **Groq**: 30 requests/minute  
- **OpenAI**: Varies by model

### Cost Optimization
- Start with free tiers
- Monitor usage carefully
- Consider paid plans for heavy usage
- Use appropriate models for your needs

### Provider Comparison

| Provider | Free Tier | Paid Plans | Models Available |
|----------|-----------|------------|------------------|
| Gemini | 60 req/min | Pay-per-use | Gemini Pro, Flash |
| Groq | 30 req/min | Pay-per-use | Llama, Mixtral |
| OpenAI | Limited | Subscription | GPT-3.5, GPT-4 |

## Support

If you encounter issues:

1. **Check the troubleshooting section above**
2. **Run the security audit script for configuration issues**
3. **Check Obsidian's console for error messages**
4. **Review provider documentation for API-specific issues**

## Security Contact

If you discover security vulnerabilities:

1. **Do not create public issues**
2. **Run the security audit script first**
3. **Follow responsible disclosure practices**
4. **Contact maintainers privately**