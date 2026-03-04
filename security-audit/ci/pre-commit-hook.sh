#!/bin/bash

# Pre-commit hook for security audit
#
# Installation:
#   1. Copy this file to .git/hooks/pre-commit
#   2. Make it executable: chmod +x .git/hooks/pre-commit
#
# Or use with husky:
#   npx husky add .husky/pre-commit "./security-audit/ci/pre-commit-hook.sh"

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
AUDIT_SCRIPT="$PROJECT_ROOT/security-audit/security-audit.sh"
TEMP_REPORT="/tmp/security-audit-$$"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${YELLOW}🔒 Running pre-commit security audit...${NC}"
echo ""

# Check if audit script exists
if [ ! -f "$AUDIT_SCRIPT" ]; then
    echo -e "${RED}Error: Security audit script not found at $AUDIT_SCRIPT${NC}"
    echo "Please ensure the security-audit directory is in your project root."
    exit 1
fi

# Make script executable if needed
chmod +x "$AUDIT_SCRIPT"

# Run quick audit (JSON format for parsing)
"$AUDIT_SCRIPT" -p "$PROJECT_ROOT" -f json -o "$TEMP_REPORT" > /dev/null 2>&1 || true

# Check if report was generated
if [ ! -f "$TEMP_REPORT/security-report.json" ]; then
    echo -e "${YELLOW}Warning: Could not generate security report${NC}"
    echo "Continuing with commit..."
    exit 0
fi

# Parse results
CRITICAL=$(cat "$TEMP_REPORT/security-report.json" | grep -o '"critical":[0-9]*' | cut -d: -f2)
HIGH=$(cat "$TEMP_REPORT/security-report.json" | grep -o '"high":[0-9]*' | cut -d: -f2)
MEDIUM=$(cat "$TEMP_REPORT/security-report.json" | grep -o '"medium":[0-9]*' | cut -d: -f2)

# Default to 0 if not found
CRITICAL=${CRITICAL:-0}
HIGH=${HIGH:-0}
MEDIUM=${MEDIUM:-0}

# Display summary
echo "Security Audit Results:"
echo "━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  Critical: ${RED}$CRITICAL${NC}"
echo -e "  High:     ${RED}$HIGH${NC}"
echo -e "  Medium:   ${YELLOW}$MEDIUM${NC}"
echo ""

# Block commit on critical issues
if [ "$CRITICAL" -gt 0 ]; then
    echo -e "${RED}❌ COMMIT BLOCKED: Critical security issues detected!${NC}"
    echo ""
    echo "Critical findings:"
    cat "$TEMP_REPORT/security-report.json" | grep -A 4 '"severity":"CRITICAL"' | head -20
    echo ""
    echo "Please fix critical issues before committing."
    echo "Run './security-audit/security-audit.sh -v' for details."
    rm -rf "$TEMP_REPORT"
    exit 1
fi

# Warn on high severity issues
if [ "$HIGH" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  WARNING: High severity security issues detected${NC}"
    echo ""
    echo "Consider fixing these issues before pushing to production."
    echo "Run './security-audit/security-audit.sh -v' for details."
    echo ""

    # Ask for confirmation
    read -p "Do you want to continue with the commit? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Commit cancelled."
        rm -rf "$TEMP_REPORT"
        exit 1
    fi
fi

# Clean up
rm -rf "$TEMP_REPORT"

echo -e "${GREEN}✅ Security check passed${NC}"
echo ""
exit 0
