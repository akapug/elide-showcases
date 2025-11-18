#!/bin/bash
# Convert showcases from elide/http/server shim to native beta11-rc1 HTTP

SHOWCASES=(
  "whisper-transcription"
  "websocket-scaling"
  "vector-search-service"
  "rag-service"
  "prompt-engineering-toolkit"
  "oauth2-provider"
  "multi-tenant-saas"
  "graphql-federation"
  "grpc-service-mesh"
)

for showcase in "${SHOWCASES[@]}"; do
  FILE="original/showcases/$showcase/server.ts"

  if [ ! -f "$FILE" ]; then
    echo "⚠️  Skipping $showcase - server.ts not found"
    continue
  fi

  echo "🔄 Converting $showcase..."

  # Check if it uses the shim
  if ! grep -q 'from "elide/http/server"' "$FILE"; then
    echo "  ⏭️  Skipping - doesn't use elide/http/server shim"
    continue
  fi

  # Backup
  cp "$FILE" "$FILE.backup"

  # Convert import
  sed -i 's/import { serve } from "elide\/http\/server";/\/\/ Native Elide beta11-rc1 HTTP - No imports needed for fetch handler/g' "$FILE"

  # Find and replace serve({ ... }) pattern
  # This is complex, so we'll do it manually for each file

  echo "  ✅ Import converted - manual review needed for serve() → fetch() conversion"
done

echo ""
echo "✅ Batch conversion complete!"
echo "⚠️  Manual steps remaining:"
echo "   1. Convert serve({ fetch: ... }) to export default async function fetch()"
echo "   2. Test each showcase"
echo "   3. Update README files"
