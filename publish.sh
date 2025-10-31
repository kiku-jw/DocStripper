#!/bin/bash
# Script for publishing DocStripper to GitHub

echo "🚀 DocStripper - Publishing Script"
echo "=================================="
echo ""

# Check Git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Git repository not initialized"
    exit 1
fi

echo "✅ Git repository found"
echo ""

# Check for remote
if git remote get-url origin > /dev/null 2>&1; then
    REMOTE_URL=$(git remote get-url origin)
    echo "📦 Remote repository already configured: $REMOTE_URL"
    echo ""
    read -p "Do you want to add a new remote? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping remote setup..."
    else
        git remote remove origin
    fi
fi

# Get user input
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "Enter GitHub connection details:"
    read -p "GitHub username: " GITHUB_USERNAME
    read -p "Repository name [DocStripper]: " REPO_NAME
    REPO_NAME=${REPO_NAME:-DocStripper}
    
    echo ""
    echo "Select connection method:"
    echo "1) HTTPS (recommended)"
    echo "2) SSH"
    read -p "Choice [1]: " METHOD
    METHOD=${METHOD:-1}
    
    if [ "$METHOD" = "1" ]; then
        REMOTE_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    else
        REMOTE_URL="git@github.com:$GITHUB_USERNAME/$REPO_NAME.git"
    fi
    
    echo ""
    echo "Adding remote: $REMOTE_URL"
    git remote add origin "$REMOTE_URL"
fi

# Rename branch to main if needed
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "Renaming branch $CURRENT_BRANCH to main..."
    git branch -M main
fi

# Check status
echo ""
echo "📊 Current status:"
git status --short

echo ""
echo "Ready to publish? The following commands will be executed:"
echo "  git push -u origin main"
echo ""
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Pushing code to GitHub..."
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Successfully published!"
        echo ""
        REMOTE_URL=$(git remote get-url origin)
        REPO_URL=$(echo "$REMOTE_URL" | sed 's/\.git$//')
        echo "🔗 Open repository: $REPO_URL"
        echo ""
        echo "Next step: create v1.0.0 release on GitHub"
        echo "  Go to: $REPO_URL/releases/new"
    else
        echo ""
        echo "❌ Error during publishing. Check settings and try again."
        exit 1
    fi
else
    echo "Cancelled."
fi
