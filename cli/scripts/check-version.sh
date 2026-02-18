#!/bin/bash

# Script to check published versions and dist-tags

PACKAGE_NAME="@nussknacker/cli"

echo "📦 Package versions for $PACKAGE_NAME"
echo ""

echo "🏷️  Dist Tags:"
npm view $PACKAGE_NAME dist-tags 2>/dev/null || echo "Package not found on npm"
echo ""

echo "📋 All Versions:"
npm view $PACKAGE_NAME versions --json 2>/dev/null || echo "No versions published yet"
echo ""

echo "ℹ️  Latest Stable:"
npm view $PACKAGE_NAME version 2>/dev/null || echo "No stable version"
echo ""

echo "🧪 Latest Beta:"
npm view $PACKAGE_NAME@beta version 2>/dev/null || echo "No beta version"
echo ""

echo "💡 Install commands:"
echo "   Stable: npm install $PACKAGE_NAME"
echo "   Beta:   npm install $PACKAGE_NAME@beta"
