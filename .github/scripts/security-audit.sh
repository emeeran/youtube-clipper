#!/bin/bash

# Repository Security Audit Script
# Scans for exposed credentials and sensitive data patterns

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_ISSUES=0
HIGH_SEVERITY=0
MEDIUM_SEVERITY=0
LOW_SEVERITY=0

echo -e "${BLUE}🔍 Starting Repository Security Audit${NC}"
echo "Repository: $REPO_ROOT"
echo "Date: $(date)"
echo "----------------------------------------"

# Function to log issues
log_issue() {
    local severity=$1
    local message=$2
    local file=$3
    local line=$4
    
    case $severity in
        "HIGH")
            echo -e "${RED}🚨 HIGH: $message${NC}"
            ((HIGH_SEVERITY++))
            ;;
        "MEDIUM")
            echo -e "${YELLOW}⚠️  MEDIUM: $message${NC}"
            ((MEDIUM_SEVERITY++))
            ;;
        "LOW")
            echo -e "${YELLOW}ℹ️  LOW: $message${NC}"
            ((LOW_SEVERITY++))
            ;;
    esac
    
    if [[ -n "$file" ]]; then
        echo "   File: $file"
    fi
    if [[ -n "$line" ]]; then
        echo "   Line: $line"
    fi
    echo
    
    ((TOTAL_ISSUES++))
}

# Function to check for API keys
check_api_keys() {
    echo -e "${BLUE}🔑 Checking for exposed API keys...${NC}"
    
    cd "$REPO_ROOT"
    
    # Exclude this script from all searches
    local exclude_args="--exclude-dir=.git --exclude-dir=node_modules --exclude=security-audit.sh"
    
    # Google Gemini API Keys
    if grep -r $exclude_args "AIzaSy[A-Za-z0-9_-]{33}" . 2>/dev/null; then
        log_issue "HIGH" "Google Gemini API key detected"
    fi
    
    # Groq API Keys  
    if grep -r $exclude_args "gsk_[a-zA-Z0-9]{52}" . 2>/dev/null; then
        log_issue "HIGH" "Groq API key detected"
    fi
    
    # OpenAI API Keys
    if grep -r $exclude_args "sk-proj-[a-zA-Z0-9_-]{10,}" . 2>/dev/null; then
        log_issue "HIGH" "OpenAI API key detected"
    fi
    
    # Generic API key patterns
    if grep -r $exclude_args '"apiKey":\s*"[^"]{10,}"' . 2>/dev/null; then
        log_issue "HIGH" "Generic API key pattern detected in JSON"
    fi
    
    # AWS Keys
    if grep -r $exclude_args "AKIA[0-9A-Z]{16}" . 2>/dev/null; then
        log_issue "HIGH" "AWS Access Key detected"
    fi
}

# Function to check for other sensitive data
check_sensitive_data() {
    echo -e "${BLUE}🔐 Checking for other sensitive data...${NC}"
    
    cd "$REPO_ROOT"
    
    # Exclude this script from all searches
    local exclude_args="--exclude-dir=.git --exclude-dir=node_modules --exclude=security-audit.sh"
    
    # Passwords
    if grep -ri $exclude_args "password\s*[:=]\s*['\"][^'\"]{6,}" . 2>/dev/null; then
        log_issue "HIGH" "Hardcoded password detected"
    fi
    
    # Private keys
    if grep -r $exclude_args "BEGIN.*PRIVATE KEY" . 2>/dev/null; then
        log_issue "HIGH" "Private key detected"
    fi
    
    # Database URLs
    if grep -ri $exclude_args "mongodb://.*:.*@\|postgres://.*:.*@\|mysql://.*:.*@" . 2>/dev/null; then
        log_issue "MEDIUM" "Database connection string with credentials detected"
    fi
    
    # Tokens
    if grep -ri $exclude_args "token\s*[:=]\s*['\"][^'\"]{20,}" . 2>/dev/null; then
        log_issue "MEDIUM" "Token with suspicious length detected"
    fi
}

# Function to check file permissions
check_file_permissions() {
    echo -e "${BLUE}📁 Checking file permissions...${NC}"
    
    cd "$REPO_ROOT"
    
    # Check for overly permissive files
    find . -type f -perm 777 ! -path "./.git/*" ! -path "./node_modules/*" 2>/dev/null | while read -r file; do
        log_issue "MEDIUM" "File with 777 permissions detected" "$file"
    done
    
    # Check for files that should not be executable
    find . -name "*.json" -executable ! -path "./.git/*" ! -path "./node_modules/*" 2>/dev/null | while read -r file; do
        log_issue "LOW" "JSON file with executable permissions" "$file"
    done
}

# Function to check git configuration
check_git_config() {
    echo -e "${BLUE}⚙️  Checking git configuration...${NC}"
    
    cd "$REPO_ROOT"
    
    # Check if git-secrets is installed
    if ! git secrets --list >/dev/null 2>&1; then
        log_issue "MEDIUM" "git-secrets not configured in this repository"
    else
        echo -e "${GREEN}✓ git-secrets is configured${NC}"
    fi
    
    # Check .gitignore for sensitive patterns
    if [[ -f ".gitignore" ]]; then
        if ! grep -q "data.json" .gitignore; then
            log_issue "MEDIUM" "data.json not in .gitignore - may expose API keys"
        fi
        if ! grep -q "*.env" .gitignore; then
            log_issue "LOW" "Environment files not in .gitignore"
        fi
        if ! grep -q "*.key" .gitignore; then
            log_issue "LOW" "Key files not in .gitignore"
        fi
    else
        log_issue "MEDIUM" ".gitignore file not found"
    fi
}

# Function to check for secrets in git history
check_git_history() {
    echo -e "${BLUE}📜 Checking git history for secrets...${NC}"
    
    cd "$REPO_ROOT"
    
    # Check last 50 commits for API key patterns
    git log --oneline -50 --all | while read -r commit; do
        commit_hash=$(echo "$commit" | cut -d' ' -f1)
        if git show "$commit_hash" | grep -q "AIzaSy\|gsk_\|sk-proj-"; then
            log_issue "HIGH" "Potential API key found in git history" "commit: $commit_hash"
        fi
    done
}

# Function to check plugin data files
check_plugin_data() {
    echo -e "${BLUE}🔌 Checking plugin data files...${NC}"
    
    cd "$REPO_ROOT"
    
    # Check if data.json files exist and contain keys
    find .obsidian/plugins -name "data.json" 2>/dev/null | while read -r file; do
        if [[ -f "$file" ]]; then
            if grep -q '".*apiKey":\s*"[^"]\{10,\}"' "$file" 2>/dev/null; then
                log_issue "HIGH" "API keys found in plugin data file" "$file"
            fi
        fi
    done
    
    # Check for backup files that might contain secrets
    find . -name "*.backup" -o -name "*.bak" -o -name "*~" | grep -v ".git" | while read -r file; do
        if [[ -f "$file" ]] && grep -q "apiKey\|password\|token" "$file" 2>/dev/null; then
            log_issue "MEDIUM" "Backup file contains potential secrets" "$file"
        fi
    done
}

# Function to generate recommendations
generate_recommendations() {
    echo -e "${BLUE}💡 Security Recommendations${NC}"
    echo "----------------------------------------"
    
    if [[ $HIGH_SEVERITY -gt 0 ]]; then
        echo -e "${RED}🚨 URGENT ACTIONS REQUIRED:${NC}"
        echo "1. Revoke all exposed API keys immediately"
        echo "2. Generate new API keys from service providers"
        echo "3. Remove secrets from git history using git filter-branch or BFG"
        echo "4. Update .gitignore to prevent future exposure"
        echo
    fi
    
    if [[ $MEDIUM_SEVERITY -gt 0 ]]; then
        echo -e "${YELLOW}⚠️  RECOMMENDED ACTIONS:${NC}"
        echo "1. Configure git-secrets to prevent future commits with secrets"
        echo "2. Use environment variables for sensitive configuration"
        echo "3. Implement proper secret management practices"
        echo "4. Regular security audits with this script"
        echo
    fi
    
    echo -e "${GREEN}✓ GENERAL BEST PRACTICES:${NC}"
    echo "1. Use separate API keys for development and production"
    echo "2. Rotate API keys regularly"
    echo "3. Monitor API key usage for unauthorized access"
    echo "4. Use encrypted storage for sensitive data"
    echo "5. Keep this audit script updated with new patterns"
}

# Main execution
main() {
    check_api_keys
    check_sensitive_data
    check_file_permissions
    check_git_config
    check_git_history
    check_plugin_data
    
    echo "----------------------------------------"
    echo -e "${BLUE}📊 AUDIT SUMMARY${NC}"
    echo "Total Issues Found: $TOTAL_ISSUES"
    echo -e "High Severity: ${RED}$HIGH_SEVERITY${NC}"
    echo -e "Medium Severity: ${YELLOW}$MEDIUM_SEVERITY${NC}"
    echo -e "Low Severity: ${YELLOW}$LOW_SEVERITY${NC}"
    echo
    
    generate_recommendations
    
    # Exit with error if high severity issues found
    if [[ $HIGH_SEVERITY -gt 0 ]]; then
        echo -e "${RED}🚨 SECURITY AUDIT FAILED: High severity issues detected${NC}"
        exit 1
    elif [[ $TOTAL_ISSUES -gt 0 ]]; then
        echo -e "${YELLOW}⚠️  SECURITY AUDIT WARNING: Issues detected${NC}"
        exit 2
    else
        echo -e "${GREEN}✅ SECURITY AUDIT PASSED: No issues detected${NC}"
        exit 0
    fi
}

# Run main function
main "$@"