#!/bin/bash

# Development/Production Environment Setup Script
# Helps manage separate API keys for different environments

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default environment prefix
DEFAULT_PREFIX="YOUTUBECLIPPER"

echo -e "${BLUE}🔧 YouTubeClipper Environment Setup${NC}"
echo "=========================================="

show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --dev          Set up development environment"
    echo "  --prod         Set up production environment"
    echo "  --prefix NAME  Set custom environment variable prefix (default: YOUTUBECLIPPER)"
    echo "  --check        Check current environment configuration"
    echo "  --help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --dev                           # Set up development environment"
    echo "  $0 --prod --prefix MYAPP          # Set up production with custom prefix"
    echo "  $0 --check                        # Check current configuration"
}

check_environment() {
    local prefix=${1:-$DEFAULT_PREFIX}
    
    echo -e "${BLUE}🔍 Checking environment configuration...${NC}"
    echo "Prefix: $prefix"
    echo ""
    
    # Check for environment variables
    local found_vars=0
    
    for service in GEMINI GROQ OPENAI; do
        local var_name="${prefix}_${service}_API_KEY"
        if [[ -n "${!var_name}" ]]; then
            echo -e "${GREEN}✓ $var_name is set${NC}"
            ((found_vars++))
        else
            echo -e "${YELLOW}⚠ $var_name is not set${NC}"
        fi
    done
    
    echo ""
    
    if [[ $found_vars -eq 0 ]]; then
        echo -e "${YELLOW}No environment variables found with prefix '$prefix'${NC}"
        echo "Consider running this script with --dev or --prod to set up your environment."
    else
        echo -e "${GREEN}Found $found_vars API key environment variables${NC}"
    fi
    
    # Check plugin configuration
    local plugin_dir="$REPO_ROOT/.obsidian/plugins/youtube-clipper"
    if [[ -f "$plugin_dir/data.json" ]]; then
        echo ""
        echo -e "${BLUE}📁 Plugin configuration status:${NC}"
        if grep -q '"useEnvironmentVariables": *true' "$plugin_dir/data.json" 2>/dev/null; then
            echo -e "${GREEN}✓ Plugin configured to use environment variables${NC}"
        else
            echo -e "${YELLOW}⚠ Plugin not configured to use environment variables${NC}"
            echo "  Enable this in the plugin settings for security."
        fi
        
        if grep -q '"environmentPrefix"' "$plugin_dir/data.json" 2>/dev/null; then
            local current_prefix=$(grep '"environmentPrefix"' "$plugin_dir/data.json" | sed 's/.*"environmentPrefix": *"\([^"]*\)".*/\1/')
            echo -e "${GREEN}✓ Plugin environment prefix: $current_prefix${NC}"
        fi
    fi
}

setup_development() {
    local prefix=${1:-$DEFAULT_PREFIX}
    
    echo -e "${BLUE}🛠️  Setting up development environment...${NC}"
    echo "Prefix: $prefix"
    echo ""
    
    echo "This will help you set up API keys for development."
    echo "Development keys should be separate from production keys for security."
    echo ""
    
    # Create .env file for development
    local env_file="$REPO_ROOT/.env.development"
    
    echo -e "${YELLOW}Creating development environment file...${NC}"
    cat > "$env_file" << EOF
# YouTubeClipper Development Environment Variables
# DO NOT commit this file to git - it's in .gitignore

# Environment prefix used by the plugin
ENVIRONMENT_PREFIX=$prefix

# API Keys for Development
# Get these from your AI service providers
${prefix}_GEMINI_API_KEY=your_development_gemini_key_here
${prefix}_GROQ_API_KEY=your_development_groq_key_here
${prefix}_OPENAI_API_KEY=your_development_openai_key_here

# Usage Instructions:
# 1. Replace the placeholder values above with your actual development API keys
# 2. Source this file before starting Obsidian: source .env.development
# 3. Or load it in your shell profile for automatic loading
# 4. Enable "Use Environment Variables" in the plugin settings
# 5. Set the environment prefix to: $prefix
EOF

    echo -e "${GREEN}✓ Created development environment file: $env_file${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Edit $env_file and add your development API keys"
    echo "2. Load the environment: source $env_file"
    echo "3. Start Obsidian"
    echo "4. Enable 'Use Environment Variables' in plugin settings"
    echo "5. Set environment prefix to: $prefix"
    echo ""
    echo -e "${YELLOW}⚠️  Remember: Never commit .env files to git!${NC}"
}

setup_production() {
    local prefix=${1:-$DEFAULT_PREFIX}
    
    echo -e "${BLUE}🚀 Setting up production environment...${NC}"
    echo "Prefix: $prefix"
    echo ""
    
    echo "Production environment setup instructions:"
    echo ""
    echo -e "${BLUE}For system-wide installation:${NC}"
    echo "Add these to /etc/environment or ~/.profile:"
    echo ""
    echo "export ${prefix}_GEMINI_API_KEY=\"your_production_gemini_key\""
    echo "export ${prefix}_GROQ_API_KEY=\"your_production_groq_key\""
    echo "export ${prefix}_OPENAI_API_KEY=\"your_production_openai_key\""
    echo ""
    echo -e "${BLUE}For Docker deployments:${NC}"
    echo "Add these environment variables to your docker-compose.yml:"
    echo ""
    echo "environment:"
    echo "  - ${prefix}_GEMINI_API_KEY=\${GEMINI_KEY}"
    echo "  - ${prefix}_GROQ_API_KEY=\${GROQ_KEY}"
    echo "  - ${prefix}_OPENAI_API_KEY=\${OPENAI_KEY}"
    echo ""
    echo -e "${BLUE}For CI/CD pipelines:${NC}"
    echo "Set these as encrypted secrets in your pipeline:"
    echo "- ${prefix}_GEMINI_API_KEY"
    echo "- ${prefix}_GROQ_API_KEY"
    echo "- ${prefix}_OPENAI_API_KEY"
    echo ""
    echo -e "${YELLOW}🔐 Security Best Practices:${NC}"
    echo "• Use separate API keys for production (different from development)"
    echo "• Rotate keys regularly"
    echo "• Monitor API usage for unauthorized access"
    echo "• Use key management services (AWS Secrets Manager, etc.) when available"
    echo "• Limit key permissions to minimum required scope"
}

create_env_template() {
    local prefix=${1:-$DEFAULT_PREFIX}
    local template_file="$REPO_ROOT/.env.template"
    
    echo -e "${BLUE}📄 Creating environment template...${NC}"
    
    cat > "$template_file" << EOF
# YouTubeClipper Environment Variables Template
# Copy this file to .env.development or .env.production and fill in your values
# DO NOT commit files containing actual API keys to git

# Environment prefix used by the plugin
ENVIRONMENT_PREFIX=$prefix

# API Keys - Replace with your actual keys
${prefix}_GEMINI_API_KEY=your_gemini_api_key_here
${prefix}_GROQ_API_KEY=your_groq_api_key_here
${prefix}_OPENAI_API_KEY=your_openai_api_key_here

# Instructions:
# 1. Get API keys from:
#    - Google Gemini: https://makersuite.google.com/app/apikey
#    - Groq: https://console.groq.com/keys
#    - OpenAI: https://platform.openai.com/api-keys
# 2. Replace the placeholder values above
# 3. Source this file before starting your application
# 4. Enable "Use Environment Variables" in plugin settings
EOF

    echo -e "${GREEN}✓ Created environment template: $template_file${NC}"
}

# Parse command line arguments
ENVIRONMENT=""
PREFIX=""
CHECK_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dev)
            ENVIRONMENT="development"
            shift
            ;;
        --prod)
            ENVIRONMENT="production"
            shift
            ;;
        --prefix)
            PREFIX="$2"
            shift 2
            ;;
        --check)
            CHECK_ONLY=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Set default prefix if not provided
if [[ -z "$PREFIX" ]]; then
    PREFIX="$DEFAULT_PREFIX"
fi

# Main execution
if [[ "$CHECK_ONLY" == true ]]; then
    check_environment "$PREFIX"
elif [[ "$ENVIRONMENT" == "development" ]]; then
    setup_development "$PREFIX"
    create_env_template "$PREFIX"
elif [[ "$ENVIRONMENT" == "production" ]]; then
    setup_production "$PREFIX"
    create_env_template "$PREFIX"
else
    echo -e "${YELLOW}No environment specified. Use --dev, --prod, or --check${NC}"
    echo ""
    show_help
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Environment setup complete!${NC}"