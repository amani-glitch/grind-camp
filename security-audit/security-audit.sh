#!/bin/bash

# ============================================================================
# SECURITY AUDIT TOOL - Pre-Production Vulnerability Scanner
# ============================================================================
# Description: Comprehensive security audit for web applications before
#              production deployment. Checks for common vulnerabilities,
#              exposed secrets, misconfigurations, and security best practices.
#
# Usage: ./security-audit.sh [options]
#   -p, --path      Path to project (default: current directory)
#   -o, --output    Output directory for reports (default: ./security-report)
#   -f, --format    Report format: html, md, json, all (default: all)
#   -v, --verbose   Verbose output
#   -h, --help      Show help
#
# Version: 1.0.0
# ============================================================================

# Colors for output
RED='\033[0;31m'
ORANGE='\033[0;33m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Default values
PROJECT_PATH="."
OUTPUT_DIR="./security-report"
REPORT_FORMAT="all"
VERBOSE=false

# Counters
CRITICAL_COUNT=0
HIGH_COUNT=0
MEDIUM_COUNT=0
LOW_COUNT=0
INFO_COUNT=0

# Results storage
declare -a FINDINGS=()

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

print_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                                                                  ║"
    echo "║   ███████╗███████╗ ██████╗██╗   ██╗██████╗ ██╗████████╗██╗   ██╗ ║"
    echo "║   ██╔════╝██╔════╝██╔════╝██║   ██║██╔══██╗██║╚══██╔══╝╚██╗ ██╔╝ ║"
    echo "║   ███████╗█████╗  ██║     ██║   ██║██████╔╝██║   ██║    ╚████╔╝  ║"
    echo "║   ╚════██║██╔══╝  ██║     ██║   ██║██╔══██╗██║   ██║     ╚██╔╝   ║"
    echo "║   ███████║███████╗╚██████╗╚██████╔╝██║  ██║██║   ██║      ██║    ║"
    echo "║   ╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝   ╚═╝      ╚═╝    ║"
    echo "║                                                                  ║"
    echo "║              PRE-PRODUCTION SECURITY AUDIT TOOL                  ║"
    echo "║                        Version 1.0.0                             ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -p, --path      Path to project (default: current directory)"
    echo "  -o, --output    Output directory for reports (default: ./security-report)"
    echo "  -f, --format    Report format: html, md, json, all (default: all)"
    echo "  -v, --verbose   Verbose output"
    echo "  -h, --help      Show this help message"
}

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[⚠]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }
log_critical() { echo -e "${RED}${BOLD}[CRITICAL]${NC} $1"; }

log_section() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}${BOLD}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

add_finding() {
    local severity="$1"
    local category="$2"
    local title="$3"
    local description="$4"
    local file="$5"
    local line="$6"
    local recommendation="$7"

    # Escape special characters for JSON
    description=$(echo "$description" | sed 's/"/\\"/g' | tr -d '\n')
    title=$(echo "$title" | sed 's/"/\\"/g')
    recommendation=$(echo "$recommendation" | sed 's/"/\\"/g')

    local finding="{\"severity\":\"$severity\",\"category\":\"$category\",\"title\":\"$title\",\"description\":\"$description\",\"file\":\"$file\",\"line\":\"$line\",\"recommendation\":\"$recommendation\"}"
    FINDINGS+=("$finding")

    case $severity in
        "CRITICAL") ((CRITICAL_COUNT++)) ;;
        "HIGH") ((HIGH_COUNT++)) ;;
        "MEDIUM") ((MEDIUM_COUNT++)) ;;
        "LOW") ((LOW_COUNT++)) ;;
        "INFO") ((INFO_COUNT++)) ;;
    esac
}

# ============================================================================
# SECURITY CHECKS
# ============================================================================

check_secrets_and_credentials() {
    log_section "SECRETS & CREDENTIALS CHECK"
    log_info "Scanning for hardcoded secrets and credentials..."

    local found_secrets=0

    # Check for AWS keys
    local aws_keys=$(grep -rnE "AKIA[0-9A-Z]{16}" "$PROJECT_PATH" 2>/dev/null | grep -v node_modules | grep -v dist | grep -v ".git/" | grep -v ".example" | grep -v "security-audit" | head -5)
    if [[ -n "$aws_keys" ]]; then
        log_critical "AWS Access Key found!"
        add_finding "CRITICAL" "SECRETS" "AWS Access Key exposed" "AWS credentials found in source code" "Various" "N/A" "Remove AWS keys and use IAM roles or environment variables"
        ((found_secrets++))
    fi

    # Check for Stripe live keys
    local stripe_keys=$(grep -rnE "sk_live_[a-zA-Z0-9]{24,}" "$PROJECT_PATH" 2>/dev/null | grep -v node_modules | grep -v ".example" | head -5)
    if [[ -n "$stripe_keys" ]]; then
        log_critical "Stripe live key found!"
        add_finding "CRITICAL" "SECRETS" "Stripe live key exposed" "Stripe secret key found in source code" "Various" "N/A" "Remove Stripe keys and use environment variables"
        ((found_secrets++))
    fi

    # Check for GitHub tokens
    local gh_tokens=$(grep -rnE "ghp_[a-zA-Z0-9]{36}" "$PROJECT_PATH" 2>/dev/null | grep -v node_modules | grep -v ".example" | head -5)
    if [[ -n "$gh_tokens" ]]; then
        log_critical "GitHub token found!"
        add_finding "CRITICAL" "SECRETS" "GitHub token exposed" "GitHub personal access token found" "Various" "N/A" "Remove GitHub tokens and use GitHub Actions secrets"
        ((found_secrets++))
    fi

    # Check for private keys
    local priv_keys=$(grep -rnl "PRIVATE KEY" "$PROJECT_PATH" 2>/dev/null | grep -v node_modules | grep -v ".example" | grep -v "security-audit" | head -5)
    if [[ -n "$priv_keys" ]]; then
        log_critical "Private key file found!"
        add_finding "CRITICAL" "SECRETS" "Private key in repository" "Private key file found in repository" "$priv_keys" "N/A" "Remove private keys and use secure key management"
        ((found_secrets++))
    fi

    # Check for Google API keys
    local google_keys=$(grep -rnE "AIza[0-9A-Za-z_-]{35}" "$PROJECT_PATH" 2>/dev/null | grep -v node_modules | grep -v ".example" | grep -v "security-audit" | head -5)
    if [[ -n "$google_keys" ]]; then
        log_warning "Google API key found (check if it's restricted)"
        add_finding "MEDIUM" "SECRETS" "Google API key found" "Google API key found - ensure it has proper restrictions" "Various" "N/A" "Restrict API key in Google Cloud Console"
        ((found_secrets++))
    fi

    if [[ $found_secrets -eq 0 ]]; then
        log_success "No critical secrets detected"
    else
        log_error "Found $found_secrets potential secrets"
    fi

    # Check for .env files committed
    log_info "Checking for committed .env files..."
    if [[ -d "$PROJECT_PATH/.git" ]]; then
        local env_files=$(git -C "$PROJECT_PATH" ls-files 2>/dev/null | grep -E "^\.env$" || true)
        if [[ -n "$env_files" ]]; then
            log_critical ".env file is tracked in git!"
            add_finding "CRITICAL" "SECRETS" ".env file committed" "Environment file tracked in git" ".env" "N/A" "Add .env to .gitignore and remove from history"
        else
            log_success "No .env files tracked in git"
        fi
    fi
}

check_dependencies() {
    log_section "DEPENDENCY VULNERABILITY CHECK"

    if [[ -f "$PROJECT_PATH/package.json" ]]; then
        log_info "Running npm audit..."

        local npm_audit_output
        npm_audit_output=$(cd "$PROJECT_PATH" && npm audit --json 2>/dev/null || echo '{}')

        local critical=$(echo "$npm_audit_output" | grep -o '"critical":[0-9]*' | head -1 | cut -d: -f2 || echo "0")
        local high=$(echo "$npm_audit_output" | grep -o '"high":[0-9]*' | head -1 | cut -d: -f2 || echo "0")

        critical=${critical:-0}
        high=${high:-0}

        if [[ "$critical" -gt 0 ]]; then
            log_critical "$critical critical vulnerabilities in npm dependencies"
            add_finding "CRITICAL" "DEPENDENCIES" "Critical npm vulnerabilities" "$critical critical vulnerabilities found" "package.json" "N/A" "Run npm audit fix"
        fi

        if [[ "$high" -gt 0 ]]; then
            log_error "$high high severity vulnerabilities"
            add_finding "HIGH" "DEPENDENCIES" "High severity npm vulnerabilities" "$high high vulnerabilities found" "package.json" "N/A" "Run npm audit fix"
        fi

        if [[ "$critical" -eq 0 ]] && [[ "$high" -eq 0 ]]; then
            log_success "No critical npm vulnerabilities found"
        fi

        # Check outdated
        log_info "Checking for outdated packages..."
        local outdated_count=$(cd "$PROJECT_PATH" && npm outdated 2>/dev/null | wc -l || echo "0")
        if [[ "$outdated_count" -gt 5 ]]; then
            log_warning "$outdated_count packages are outdated"
            add_finding "LOW" "DEPENDENCIES" "Outdated packages" "$outdated_count packages need updates" "package.json" "N/A" "Run npm update"
        else
            log_info "$outdated_count packages have updates available"
        fi
    fi
}

check_dangerous_code_patterns() {
    log_section "DANGEROUS CODE PATTERNS CHECK"
    log_info "Scanning for dangerous code patterns..."

    # Check for innerHTML
    log_info "Checking for XSS vulnerabilities..."
    local innerHTML_count=$(grep -rnE "innerHTML\s*=" "$PROJECT_PATH" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | grep -v node_modules | grep -v dist | wc -l || echo "0")
    if [[ "$innerHTML_count" -gt 0 ]]; then
        log_warning "$innerHTML_count innerHTML assignments found"
        add_finding "HIGH" "XSS" "Potential XSS via innerHTML" "$innerHTML_count uses of innerHTML found" "Various" "N/A" "Use textContent or sanitize HTML"
    fi

    # Check for eval
    log_info "Checking for code injection vulnerabilities..."
    local eval_count=$(grep -rnE "eval\s*\(" "$PROJECT_PATH" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | grep -v node_modules | grep -v dist | wc -l || echo "0")
    if [[ "$eval_count" -gt 0 ]]; then
        log_critical "$eval_count eval() usages found"
        add_finding "CRITICAL" "CODE_INJECTION" "Use of eval() detected" "eval() can execute arbitrary code" "Various" "N/A" "Replace eval with safer alternatives"
    fi

    # Check console statements
    log_info "Checking for debug statements..."
    local console_count=$(grep -rnE "console\.(log|debug)\s*\(" "$PROJECT_PATH" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | grep -v node_modules | grep -v dist | wc -l || echo "0")
    if [[ "$console_count" -gt 0 ]]; then
        log_warning "$console_count console statements found (remove for production)"
        add_finding "LOW" "DEBUG" "Console statements in code" "$console_count console.log/debug statements" "Various" "N/A" "Remove console statements for production"
    fi

    log_success "Code pattern check completed"
}

check_authentication_security() {
    log_section "AUTHENTICATION & SESSION SECURITY"
    log_info "Checking authentication patterns..."

    # Check for MD5
    local md5_count=$(grep -rnE "(md5|MD5)\s*\(" "$PROJECT_PATH" --include="*.ts" --include="*.js" 2>/dev/null | grep -v node_modules | wc -l || echo "0")
    if [[ "$md5_count" -gt 0 ]]; then
        log_critical "MD5 hashing detected (insecure for passwords)"
        add_finding "CRITICAL" "AUTH" "Weak password hashing (MD5)" "MD5 is cryptographically broken" "Various" "N/A" "Use bcrypt or Argon2"
    fi

    # Check token storage
    local token_storage=$(grep -rnE "localStorage.*token|sessionStorage.*token" "$PROJECT_PATH" --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | grep -v node_modules | wc -l || echo "0")
    if [[ "$token_storage" -gt 0 ]]; then
        log_warning "Tokens stored in browser storage (XSS vulnerable)"
        add_finding "MEDIUM" "AUTH" "Insecure token storage" "Tokens in localStorage/sessionStorage are vulnerable to XSS" "Various" "N/A" "Consider httpOnly cookies"
    fi

    log_success "Authentication check completed"
}

check_configuration_security() {
    log_section "CONFIGURATION SECURITY"
    log_info "Checking security configurations..."

    # Check CORS
    local cors_wildcard=$(grep -rnE "origin:\s*['\"]?\*['\"]?" "$PROJECT_PATH" --include="*.ts" --include="*.js" 2>/dev/null | grep -v node_modules | wc -l || echo "0")
    if [[ "$cors_wildcard" -gt 0 ]]; then
        log_warning "Wildcard CORS origin detected"
        add_finding "MEDIUM" "CONFIG" "Permissive CORS" "Wildcard CORS allows any origin" "Various" "N/A" "Restrict CORS to trusted origins"
    fi

    # Check .gitignore
    log_info "Checking .gitignore configuration..."
    if [[ -f "$PROJECT_PATH/.gitignore" ]]; then
        local has_env=$(grep -c "^\.env" "$PROJECT_PATH/.gitignore" 2>/dev/null || echo "0")
        if [[ "$has_env" -eq 0 ]]; then
            log_warning ".env not in .gitignore"
            add_finding "HIGH" "CONFIG" ".env not in .gitignore" "Environment files may be committed" ".gitignore" "N/A" "Add .env* to .gitignore"
        else
            log_success ".gitignore includes .env patterns"
        fi
    else
        log_error "No .gitignore file found!"
        add_finding "HIGH" "CONFIG" "Missing .gitignore" "No .gitignore file found" "N/A" "N/A" "Create .gitignore with appropriate patterns"
    fi

    log_success "Configuration check completed"
}

check_sensitive_files() {
    log_section "SENSITIVE FILES CHECK"
    log_info "Scanning for sensitive files..."

    local sensitive_found=0

    # Check for common sensitive files
    for pattern in "*.pem" "*.key" "id_rsa" "credentials.json"; do
        local found=$(find "$PROJECT_PATH" -name "$pattern" -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | head -3)
        if [[ -n "$found" ]]; then
            log_critical "Sensitive file found: $pattern"
            add_finding "CRITICAL" "FILES" "Sensitive file in repository" "File pattern $pattern found" "$found" "N/A" "Remove sensitive files"
            ((sensitive_found++))
        fi
    done

    if [[ $sensitive_found -eq 0 ]]; then
        log_success "No sensitive files detected"
    fi
}

check_security_headers() {
    log_section "SECURITY HEADERS CHECK"
    log_info "Checking for security header configurations..."

    local headers_found=0

    for header in "Content-Security-Policy" "X-Frame-Options" "Strict-Transport-Security"; do
        if grep -rqi "$header" "$PROJECT_PATH" --include="*.ts" --include="*.js" --include="*.json" 2>/dev/null | grep -v node_modules > /dev/null; then
            ((headers_found++))
        fi
    done

    if [[ $headers_found -lt 2 ]]; then
        log_warning "Few security headers configured ($headers_found/3)"
        add_finding "MEDIUM" "HEADERS" "Missing security headers" "Security headers not fully configured" "Various" "N/A" "Configure CSP, HSTS, X-Frame-Options"
    else
        log_success "Security headers appear configured"
    fi

    # Check for helmet
    if grep -q "helmet" "$PROJECT_PATH/package.json" 2>/dev/null; then
        log_success "helmet.js is installed"
    else
        log_info "Consider using helmet.js for security headers"
        add_finding "INFO" "HEADERS" "helmet.js not installed" "Consider using helmet for Express apps" "package.json" "N/A" "npm install helmet"
    fi
}

check_input_validation() {
    log_section "INPUT VALIDATION CHECK"
    log_info "Checking input validation patterns..."

    # Check for validation libraries
    local has_validation=false
    for lib in "zod" "yup" "joi" "validator"; do
        if grep -q "\"$lib\"" "$PROJECT_PATH/package.json" 2>/dev/null; then
            log_success "Validation library found: $lib"
            has_validation=true
            break
        fi
    done

    if [[ "$has_validation" == false ]]; then
        log_warning "No validation library detected"
        add_finding "MEDIUM" "VALIDATION" "No validation library" "Consider using zod, yup, or joi" "package.json" "N/A" "Install a validation library"
    fi
}

check_rate_limiting() {
    log_section "RATE LIMITING CHECK"
    log_info "Checking for rate limiting implementation..."

    local has_rate_limit=$(grep -rnE "rate-limit|rateLimit|rateLimiter" "$PROJECT_PATH" --include="*.ts" --include="*.js" 2>/dev/null | grep -v node_modules | wc -l || echo "0")

    if [[ "$has_rate_limit" -gt 0 ]]; then
        log_success "Rate limiting implementation detected"
    else
        log_warning "No rate limiting detected"
        add_finding "MEDIUM" "RATE_LIMIT" "Missing rate limiting" "API endpoints may be vulnerable to abuse" "Various" "N/A" "Implement rate limiting"
    fi
}

# ============================================================================
# REPORT GENERATION
# ============================================================================

generate_summary() {
    log_section "SECURITY AUDIT SUMMARY"

    local total=$((CRITICAL_COUNT + HIGH_COUNT + MEDIUM_COUNT + LOW_COUNT + INFO_COUNT))

    echo ""
    echo -e "${BOLD}Total findings: $total${NC}"
    echo ""

    [[ $CRITICAL_COUNT -gt 0 ]] && echo -e "  ${RED}${BOLD}CRITICAL:${NC} $CRITICAL_COUNT"
    [[ $HIGH_COUNT -gt 0 ]] && echo -e "  ${RED}HIGH:${NC}     $HIGH_COUNT"
    [[ $MEDIUM_COUNT -gt 0 ]] && echo -e "  ${ORANGE}MEDIUM:${NC}   $MEDIUM_COUNT"
    [[ $LOW_COUNT -gt 0 ]] && echo -e "  ${YELLOW}LOW:${NC}      $LOW_COUNT"
    [[ $INFO_COUNT -gt 0 ]] && echo -e "  ${BLUE}INFO:${NC}     $INFO_COUNT"

    echo ""

    if [[ $CRITICAL_COUNT -gt 0 ]]; then
        echo -e "${RED}${BOLD}[!] CRITICAL ISSUES FOUND - DO NOT DEPLOY TO PRODUCTION${NC}"
    elif [[ $HIGH_COUNT -gt 0 ]]; then
        echo -e "${ORANGE}${BOLD}[!] HIGH SEVERITY ISSUES FOUND - Fix before deployment${NC}"
    elif [[ $MEDIUM_COUNT -gt 0 ]]; then
        echo -e "${YELLOW}${BOLD}[~] MEDIUM ISSUES FOUND - Review recommended${NC}"
    else
        echo -e "${GREEN}${BOLD}[✓] NO CRITICAL OR HIGH SEVERITY ISSUES${NC}"
    fi
}

generate_json_report() {
    local output_file="$OUTPUT_DIR/security-report.json"
    log_info "Generating JSON report: $output_file"

    local json_findings="["
    local first=true
    for finding in "${FINDINGS[@]}"; do
        if [[ "$first" == true ]]; then
            json_findings+="$finding"
            first=false
        else
            json_findings+=",$finding"
        fi
    done
    json_findings+="]"

    cat > "$output_file" << EOF
{
    "report_info": {
        "tool": "Security Audit Tool",
        "version": "1.0.0",
        "generated_at": "$(date -Iseconds)",
        "project_path": "$PROJECT_PATH"
    },
    "summary": {
        "total_findings": $((CRITICAL_COUNT + HIGH_COUNT + MEDIUM_COUNT + LOW_COUNT + INFO_COUNT)),
        "critical": $CRITICAL_COUNT,
        "high": $HIGH_COUNT,
        "medium": $MEDIUM_COUNT,
        "low": $LOW_COUNT,
        "info": $INFO_COUNT
    },
    "production_ready": $([ $CRITICAL_COUNT -eq 0 ] && [ $HIGH_COUNT -eq 0 ] && echo "true" || echo "false"),
    "findings": $json_findings
}
EOF

    log_success "JSON report generated"
}

generate_markdown_report() {
    local output_file="$OUTPUT_DIR/security-report.md"
    log_info "Generating Markdown report: $output_file"

    cat > "$output_file" << EOF
# Security Audit Report

**Generated:** $(date)
**Project:** $PROJECT_PATH
**Tool Version:** 1.0.0

---

## Executive Summary

| Severity | Count |
|----------|-------|
| Critical | $CRITICAL_COUNT |
| High | $HIGH_COUNT |
| Medium | $MEDIUM_COUNT |
| Low | $LOW_COUNT |
| Info | $INFO_COUNT |

**Total Findings:** $((CRITICAL_COUNT + HIGH_COUNT + MEDIUM_COUNT + LOW_COUNT + INFO_COUNT))

EOF

    if [[ $CRITICAL_COUNT -gt 0 ]]; then
        echo "**Status:** :x: NOT READY FOR PRODUCTION" >> "$output_file"
    elif [[ $HIGH_COUNT -gt 0 ]]; then
        echo "**Status:** :warning: HIGH RISK" >> "$output_file"
    else
        echo "**Status:** :white_check_mark: Ready for review" >> "$output_file"
    fi

    echo "" >> "$output_file"
    echo "---" >> "$output_file"
    echo "" >> "$output_file"
    echo "## Findings" >> "$output_file"
    echo "" >> "$output_file"

    for finding in "${FINDINGS[@]}"; do
        local title=$(echo "$finding" | grep -oP '"title":"[^"]*"' | cut -d'"' -f4)
        local severity=$(echo "$finding" | grep -oP '"severity":"[^"]*"' | cut -d'"' -f4)
        local desc=$(echo "$finding" | grep -oP '"description":"[^"]*"' | cut -d'"' -f4)
        local rec=$(echo "$finding" | grep -oP '"recommendation":"[^"]*"' | cut -d'"' -f4)

        echo "### $title" >> "$output_file"
        echo "**Severity:** $severity" >> "$output_file"
        echo "" >> "$output_file"
        echo "$desc" >> "$output_file"
        echo "" >> "$output_file"
        echo "**Recommendation:** $rec" >> "$output_file"
        echo "" >> "$output_file"
    done

    cat >> "$output_file" << 'EOF'

---

## Pre-Production Checklist

- [ ] All CRITICAL issues resolved
- [ ] All HIGH severity issues resolved
- [ ] Environment variables configured
- [ ] NODE_ENV=production
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Dependencies updated

---

*Generated by Security Audit Tool v1.0.0*
EOF

    log_success "Markdown report generated"
}

generate_html_report() {
    local output_file="$OUTPUT_DIR/security-report.html"
    log_info "Generating HTML report: $output_file"

    # Determine status
    local status_class="success"
    local status_text="Ready for Production Review"
    local status_icon="✅"

    if [[ $CRITICAL_COUNT -gt 0 ]]; then
        status_class="critical"
        status_text="NOT READY - Critical Issues Found"
        status_icon="⛔"
    elif [[ $HIGH_COUNT -gt 0 ]]; then
        status_class="warning"
        status_text="HIGH RISK - Fix Before Deployment"
        status_icon="⚠️"
    fi

    cat > "$output_file" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Audit Report</title>
    <style>
        :root { --critical: #dc3545; --high: #fd7e14; --medium: #ffc107; --low: #6c757d; --info: #17a2b8; --success: #28a745; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 40px 20px; text-align: center; }
        header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin: -50px 20px 30px; position: relative; z-index: 10; }
        .card { background: white; border-radius: 10px; padding: 20px; text-align: center; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .card.critical { border-top: 4px solid var(--critical); }
        .card.high { border-top: 4px solid var(--high); }
        .card.medium { border-top: 4px solid var(--medium); }
        .card.low { border-top: 4px solid var(--low); }
        .card.info { border-top: 4px solid var(--info); }
        .card h3 { font-size: 2.5rem; margin-bottom: 5px; }
        .card.critical h3 { color: var(--critical); }
        .card.high h3 { color: var(--high); }
        .card.medium h3 { color: var(--medium); }
        .card.low h3 { color: var(--low); }
        .card.info h3 { color: var(--info); }
        .status-banner { padding: 20px; border-radius: 10px; margin: 20px; text-align: center; font-weight: bold; }
        .status-banner.critical { background: #f8d7da; color: var(--critical); border: 2px solid var(--critical); }
        .status-banner.warning { background: #fff3cd; color: #856404; border: 2px solid var(--medium); }
        .status-banner.success { background: #d4edda; color: var(--success); border: 2px solid var(--success); }
        .findings { background: white; border-radius: 10px; margin: 20px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .finding { border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 15px; }
        .finding.critical { border-left: 4px solid var(--critical); }
        .finding.high { border-left: 4px solid var(--high); }
        .finding.medium { border-left: 4px solid var(--medium); }
        .finding.low { border-left: 4px solid var(--low); }
        .finding.info { border-left: 4px solid var(--info); }
        .severity-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; color: white; }
        .severity-badge.critical { background: var(--critical); }
        .severity-badge.high { background: var(--high); }
        .severity-badge.medium { background: var(--medium); color: #333; }
        .severity-badge.low { background: var(--low); }
        .severity-badge.info { background: var(--info); }
        .recommendation { background: #e7f3ff; padding: 10px 15px; border-radius: 5px; margin-top: 10px; }
        footer { text-align: center; padding: 20px; color: #666; }
    </style>
</head>
<body>
    <header>
        <h1>Security Audit Report</h1>
        <p>Generated: $(date)</p>
        <p>Project: $PROJECT_PATH</p>
    </header>
    <div class="container">
        <div class="summary-cards">
            <div class="card critical"><h3>$CRITICAL_COUNT</h3><p>Critical</p></div>
            <div class="card high"><h3>$HIGH_COUNT</h3><p>High</p></div>
            <div class="card medium"><h3>$MEDIUM_COUNT</h3><p>Medium</p></div>
            <div class="card low"><h3>$LOW_COUNT</h3><p>Low</p></div>
            <div class="card info"><h3>$INFO_COUNT</h3><p>Info</p></div>
        </div>
        <div class="status-banner $status_class">$status_icon $status_text</div>
        <div class="findings">
            <h2>Detailed Findings</h2>
EOF

    # Add findings
    for finding in "${FINDINGS[@]}"; do
        local severity=$(echo "$finding" | grep -oP '"severity":"[^"]*"' | cut -d'"' -f4 | tr '[:upper:]' '[:lower:]')
        local title=$(echo "$finding" | grep -oP '"title":"[^"]*"' | cut -d'"' -f4)
        local desc=$(echo "$finding" | grep -oP '"description":"[^"]*"' | cut -d'"' -f4)
        local rec=$(echo "$finding" | grep -oP '"recommendation":"[^"]*"' | cut -d'"' -f4)
        local category=$(echo "$finding" | grep -oP '"category":"[^"]*"' | cut -d'"' -f4)

        cat >> "$output_file" << EOF
            <div class="finding $severity">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <strong>$title</strong>
                    <span class="severity-badge $severity">$severity</span>
                </div>
                <p><strong>Category:</strong> $category</p>
                <p>$desc</p>
                <div class="recommendation"><strong>Recommendation:</strong> $rec</div>
            </div>
EOF
    done

    cat >> "$output_file" << 'EOF'
        </div>
    </div>
    <footer>
        <p>Generated by Security Audit Tool v1.0.0</p>
    </footer>
</body>
</html>
EOF

    log_success "HTML report generated"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -p|--path) PROJECT_PATH="$2"; shift 2 ;;
            -o|--output) OUTPUT_DIR="$2"; shift 2 ;;
            -f|--format) REPORT_FORMAT="$2"; shift 2 ;;
            -v|--verbose) VERBOSE=true; shift ;;
            -h|--help) print_help; exit 0 ;;
            *) echo "Unknown option: $1"; print_help; exit 1 ;;
        esac
    done

    # Validate and setup
    [[ ! -d "$PROJECT_PATH" ]] && { echo "Error: Project path does not exist: $PROJECT_PATH"; exit 1; }
    PROJECT_PATH=$(cd "$PROJECT_PATH" && pwd)
    mkdir -p "$OUTPUT_DIR"

    print_banner
    echo -e "${BLUE}Project:${NC} $PROJECT_PATH"
    echo -e "${BLUE}Output:${NC}  $OUTPUT_DIR"
    echo -e "${BLUE}Format:${NC}  $REPORT_FORMAT"

    # Run checks
    check_secrets_and_credentials
    check_dependencies
    check_dangerous_code_patterns
    check_authentication_security
    check_configuration_security
    check_sensitive_files
    check_security_headers
    check_input_validation
    check_rate_limiting

    # Generate summary and reports
    generate_summary

    log_section "GENERATING REPORTS"

    case $REPORT_FORMAT in
        json) generate_json_report ;;
        md|markdown) generate_markdown_report ;;
        html) generate_html_report ;;
        all) generate_json_report; generate_markdown_report; generate_html_report ;;
    esac

    echo ""
    echo -e "${GREEN}${BOLD}Reports saved to: $OUTPUT_DIR${NC}"
    echo ""

    # Exit code
    [[ $CRITICAL_COUNT -gt 0 ]] && exit 2
    [[ $HIGH_COUNT -gt 0 ]] && exit 1
    exit 0
}

main "$@"
