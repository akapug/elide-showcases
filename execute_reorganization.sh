#!/bin/bash
set -e

echo "🚀 Starting Reorganization V2..."

# Create new directory structure
echo "📁 Creating new directory structure..."
mkdir -p converted/{utilities,showcases,examples}
mkdir -p original/{utilities,showcases,examples}

# Move all conversions to converted/utilities (we'll move showcases separately)
echo "📦 Moving conversions to converted/utilities..."
for dir in conversions/*/; do
    dirname=$(basename "$dir")
    if [ "$dirname" != "README.md" ]; then
        mv "conversions/$dirname" "converted/utilities/$dirname"
    fi
done

# Move complex conversions to converted/showcases
echo "🎨 Moving complex conversions to converted/showcases..."
for pkg in marked validator decimal diff; do
    if [ -d "converted/utilities/$pkg" ]; then
        mv "converted/utilities/$pkg" "converted/showcases/$pkg"
    fi
done

# Move showcases to original/showcases
echo "🌟 Moving showcases to original/showcases..."
for dir in showcases/*/; do
    dirname=$(basename "$dir")
    mv "showcases/$dirname" "original/showcases/$dirname"
done

# Move examples to original/examples
echo "📚 Moving examples to original/examples..."
for dir in examples/*/; do
    dirname=$(basename "$dir")
    if [ "$dirname" != "README.md" ]; then
        mv "examples/$dirname" "original/examples/$dirname"
    fi
done

# Move applications - check if they're complex or simple
echo "🔧 Moving applications..."
for file in applications/*.ts; do
    filename=$(basename "$file")
    # Simple standalone files go to utilities
    mv "$file" "original/utilities/$filename"
done

# Move categories to original/utilities (with subdirectories)
echo "🗂️  Moving categories to original/utilities..."
for dir in categories/*/; do
    dirname=$(basename "$dir")
    if [ "$dirname" != "README.md" ]; then
        # Algorithms, datastructures, encoding, http, parsers → utilities (keep structure)
        if [[ "$dirname" =~ ^(algorithms|datastructures|encoding|http|parsers)$ ]]; then
            mv "categories/$dirname" "original/utilities/$dirname"
        # Advanced TypeScript → examples
        elif [ "$dirname" = "advanced" ]; then
            mv "categories/$dirname" "original/examples/advanced-typescript"
        # Edge computing → showcases (more complex)
        elif [ "$dirname" = "edge" ]; then
            mv "categories/$dirname" "original/showcases/edge-computing"
        # CLI tools and data-processing - need to split, but for now put in utilities
        # We can reorganize further if needed
        else
            mv "categories/$dirname" "original/utilities/$dirname"
        fi
    fi
done

# Clean up old directories
echo "🧹 Cleaning up old directories..."
rmdir conversions 2>/dev/null || echo "conversions not empty, leaving it"
rmdir showcases 2>/dev/null || echo "showcases not empty, leaving it"
rmdir examples 2>/dev/null || echo "examples not empty, leaving it"
rmdir applications 2>/dev/null || echo "applications not empty, leaving it"
rmdir categories 2>/dev/null || echo "categories not empty, leaving it"

echo "✅ Reorganization complete!"
echo ""
echo "New structure:"
find converted original -maxdepth 2 -type d | head -30
