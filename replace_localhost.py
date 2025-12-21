#!/usr/bin/env python3
"""
Script to replace localhost URLs with production URLs
Usage: python replace_localhost.py
"""

import os
import re

# 🔗 Production URLs
FLASK_PROD = "https://gprs-platform.onrender.com"
FASTAPI_PROD = "https://gprs-fastapi.onrender.com"

# 📁 Directories to search
BACKEND_DIR = "Backend"
EXCLUDE_DIRS = {"node_modules", ".git", "dist", "build", "__pycache__", ".venv"}
EXCLUDE_FILES = {".env", ".env.local", ".env.production", "replace_localhost.py"}

def should_process_file(filepath):
    """Check if file should be processed"""
    # Skip excluded directories
    if any(excluded in filepath for excluded in EXCLUDE_DIRS):
        return False
    
    # Skip excluded files
    if os.path.basename(filepath) in EXCLUDE_FILES:
        return False
    
    # Only process Python files
    return filepath.endswith('.py')

def replace_in_file(filepath):
    """Replace localhost URLs in a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Replace patterns
        replacements = [
            (r'http://localhost:8001', FASTAPI_PROD),
            (r'http://127\.0\.0\.1:8001', FASTAPI_PROD),
            (r'http://localhost:5000', FLASK_PROD),
            (r'http://127\.0\.0\.1:5000', FLASK_PROD),
            (r'localhost:8001', FASTAPI_PROD.replace('https://', '')),
            (r'localhost:5000', FLASK_PROD.replace('https://', '')),
        ]
        
        changes_made = False
        for pattern, replacement in replacements:
            if re.search(pattern, content):
                content = re.sub(pattern, replacement, content)
                changes_made = True
        
        if changes_made and content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        
        return False
    
    except Exception as e:
        print(f"❌ Error processing {filepath}: {str(e)}")
        return False

def main():
    """Main function"""
    print("🔍 Searching for localhost URLs in Backend files...\n")
    
    files_processed = 0
    files_changed = 0
    
    for root, dirs, files in os.walk(BACKEND_DIR):
        # Remove excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file in files:
            filepath = os.path.join(root, file)
            
            if should_process_file(filepath):
                files_processed += 1
                if replace_in_file(filepath):
                    files_changed += 1
                    print(f"✅ Updated: {filepath}")
    
    print(f"\n{'='*60}")
    print(f"📊 Summary:")
    print(f"   Files processed: {files_processed}")
    print(f"   Files changed: {files_changed}")
    print(f"{'='*60}\n")
    
    if files_changed > 0:
        print("✅ Replacement completed successfully!")
        print("\n⚠️  Next steps:")
        print("   1. Review changes: git diff")
        print("   2. Test locally")
        print("   3. Commit: git add . && git commit -m 'Replace localhost with production URLs'")
        print("   4. Push: git push origin main")
    else:
        print("ℹ️  No localhost URLs found to replace")

if __name__ == "__main__":
    main()