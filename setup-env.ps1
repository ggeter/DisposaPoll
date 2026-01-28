# PowerShell Environment Setup Script for DisposaPoll
# Run this script to set up environment variables for Cloudflare wrangler

Write-Host "Setting up Cloudflare environment variables..." -ForegroundColor Green

# Set environment variables for current session
$env:CLOUDFLARE_API_TOKEN = "6ZGHk1QX7eQbOxsdJ3gk36dZrhfApgxVIWwWgvdx"
$env:CLOUDFLARE_ACCOUNT_ID = "557d2f82301f6e3103be663322ef1059"

Write-Host "✓ Environment variables set for current PowerShell session" -ForegroundColor Green

# Test wrangler authentication
Write-Host "`nTesting wrangler authentication..." -ForegroundColor Cyan
wrangler whoami

Write-Host "`nEnvironment is ready! You can now run:" -ForegroundColor Yellow
Write-Host "  wrangler d1 list" -ForegroundColor White
Write-Host "  wrangler kv namespace list" -ForegroundColor White
Write-Host "  npm run deploy" -ForegroundColor White
