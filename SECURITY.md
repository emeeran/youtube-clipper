# 🔒 Security Guide

## API Key Management

### ⚠️ IMPORTANT: NEVER Commit API Keys

This repository is configured to prevent API keys from being committed:

- `.gitignore` blocks `data.json` and all sensitive files
- API keys should be stored locally in `data.json` (not tracked)
- Use `data.json.template` as a reference for configuration structure

### 🔧 Secure Setup

1. **Copy the template:**
   ```bash
   cp data.json.template data.json
   ```

2. **Add your API keys to `data.json`:**
   ```json
   {
     "geminiApiKey": "your-gemini-key-here",
     "groqApiKey": "your-groq-key-here",
     ...
   }
   ```

3. **Verify it's ignored:**
   ```bash
   git status  # data.json should NOT appear
   ```

### 🔍 Security Features

- ✅ **Git Protection**: `.gitignore` prevents accidental commits
- ✅ **Template Only**: `data.json.template` contains no real keys
- ✅ **Local Storage**: Actual keys stay in your local environment
- ✅ **Validation**: Code validates key formats but doesn't expose them

### 🚨 If You Accidentally Commit Keys

If API keys are accidentally committed:
1. **Immediately revoke** the compromised keys
2. **Remove them from the commit history**
3. **Generate new API keys**
4. **Add them to local `data.json` only**

### 🛡️ Best Practices

- **Never share** your `data.json` file
- **Use environment variables** in production
- **Rotate keys regularly**
- **Monitor API usage** for unusual activity
- **Keep this repository** public-safe

### 📞 Key Security Contacts

- **Google Gemini API**: Revoke keys at Google Cloud Console
- **Groq API**: Revoke keys at Groq Console
- **GitHub Security**: Contact GitHub support for committed keys

---

*Remember: API keys are like passwords - protect them!*