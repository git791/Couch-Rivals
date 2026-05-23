param (
    [string]$StackName = "couch-rivals"
)

# Move to backend and build
Write-Host "Building backend..." -ForegroundColor Cyan
Push-Location backend
sam build
if ($LASTEXITCODE -ne 0) {
    Write-Host "SAM Build failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Deploy
Write-Host "Deploying backend to AWS..." -ForegroundColor Cyan
sam deploy --guided
if ($LASTEXITCODE -ne 0) {
    Write-Host "SAM Deploy failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

# Get outputs
Write-Host "Fetching CloudFormation stack outputs..." -ForegroundColor Cyan
$stackInfo = aws cloudformation describe-stacks --stack-name $StackName | ConvertFrom-Json
$outputs = $stackInfo.Stacks[0].Outputs

$wsUri = ($outputs | Where-Object { $_.OutputKey -eq "WebSocketURI" }).OutputValue

if (-not $wsUri) {
    Write-Host "Failed to retrieve stack outputs. Please check if stack name '$StackName' is correct." -ForegroundColor Red
    exit 1
}

Write-Host "WebSocket URI: $wsUri" -ForegroundColor Green

# Update frontend config
Write-Host "Updating frontend config..." -ForegroundColor Cyan
$configContent = @"
window.__CONFIG__ = {
  wsUrl: "$wsUri"
};
"@
$configContent | Out-File -FilePath "frontend/js/config.js" -Encoding utf8

Write-Host "Backend deployment completed successfully!" -ForegroundColor Green
Write-Host "You can now run the Couch Rivals frontend locally! To run it:" -ForegroundColor Cyan
Write-Host "  1. (Recommended) Run a local server: npx http-server frontend" -ForegroundColor Yellow
Write-Host "  2. Or, simply open 'frontend/index.html' in your browser!" -ForegroundColor Yellow
