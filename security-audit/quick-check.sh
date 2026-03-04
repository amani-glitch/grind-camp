#!/bin/bash

# ============================================================================
# QUICK SECURITY CHECK
# ============================================================================
# A faster version focusing on critical issues only
# Use for pre-commit hooks and quick validations
#
# Usage: ./quick-check.sh [path]
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_PATH="${1:-.}"
ISSUES_FOUND=0

echo ""
echo "🔍 Quick Security Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for common secrets
echo -n "Checking for hardcoded secrets... "
SECRETS=$(grep -rnE "(api[_-]?key|password|secret|token)\s*[:=]\s*['\"][^'\"]{16,}['\"]" "$PROJECT_PATH" \
    --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    2>/dev/null | grep -v node_modules | grep -v dist | grep -v ".example" | head -5)

if [ -n "$SECRETS" ]; then
    echo -e "${RED}FOUND${NC}"
    echo "$SECRETS"
    ((ISSUES_FOUND++))
else
    echo -e "${GREEN}OK${NC}"
fi

# Check for eval
echo -n "Checking for eval() usage... "
EVAL=$(grep -rnE "eval\s*\(" "$PROJECT_PATH" \
    --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    2>/dev/null | grep -v node_modules | grep -v dist)

if [ -n "$EVAL" ]; then
    echo -e "${RED}FOUND${NC}"
    echo "$EVAL"
    ((ISSUES_FOUND++))
else
    echo -e "${GREEN}OK${NC}"
fi

# Check for .env committed
echo -n "Checking for .env in git... "
if [ -d "$PROJECT_PATH/.git" ]; then
    ENV_FILES=$(git -C "$PROJECT_PATH" ls-files | grep -E "^\.env$" 2>/dev/null)
    if [ -n "$ENV_FILES" ]; then
        echo -e "${RED}FOUND${NC}"
        echo ".env file is tracked in git!"
        ((ISSUES_FOUND++))
    else
        echo -e "${GREEN}OK${NC}"
    fi
else
    echo -e "${YELLOW}SKIP${NC} (not a git repo)"
fi

# Check for private keys
echo -n "Checking for private keys... "
KEYS=$(grep -rnl "PRIVATE KEY" "$PROJECT_PATH" \
    2>/dev/null | grep -v node_modules | grep -v ".example")

if [ -n "$KEYS" ]; then
    echo -e "${RED}FOUND${NC}"
    echo "$KEYS"
    ((ISSUES_FOUND++))
else
    echo -e "${GREEN}OK${NC}"
fi

# Check for AWS keys
echo -n "Checking for AWS credentials... "
AWS=$(grep -rnE "AKIA[0-9A-Z]{16}" "$PROJECT_PATH" \
    --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.env*" \
    2>/dev/null | grep -v node_modules | grep -v ".example")

if [ -n "$AWS" ]; then
    echo -e "${RED}FOUND${NC}"
    echo "$AWS"
    ((ISSUES_FOUND++))
else
    echo -e "${GREEN}OK${NC}"
fi

# Check for dangerous innerHTML
echo -n "Checking for innerHTML usage... "
INNER=$(grep -rnE "innerHTML\s*=" "$PROJECT_PATH" \
    --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    2>/dev/null | grep -v node_modules | grep -v dist | wc -l)

if [ "$INNER" -gt 0 ]; then
    echo -e "${YELLOW}$INNER occurrences${NC}"
else
    echo -e "${GREEN}OK${NC}"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ISSUES_FOUND -gt 0 ]; then
    echo -e "${RED}❌ $ISSUES_FOUND critical issues found${NC}"
    echo "Run full audit: ./security-audit.sh -v"
    exit 1
else
    echo -e "${GREEN}✅ Quick check passed${NC}"
    exit 0
fi
