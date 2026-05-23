param (
    [string]$StackName = "couch-rivals"
)

Write-Host "Fetching CloudFormation stack outputs..." -ForegroundColor Cyan
$stackInfo = aws cloudformation describe-stacks --stack-name $StackName | ConvertFrom-Json
$outputs = $stackInfo.Stacks[0].Outputs

$wsUri = ($outputs | Where-Object { $_.OutputKey -eq "WebSocketURI" }).OutputValue

if (-not $wsUri) {
    Write-Host "Failed to retrieve stack outputs. Please check if stack name '$StackName' is correct." -ForegroundColor Red
    exit 1
}

# Update frontend config
Write-Host "Updating frontend config..." -ForegroundColor Cyan
$configContent = @"
window.__CONFIG__ = {
  wsUrl: "$wsUri"
};
"@
$configContent | Out-File -FilePath "frontend/js/config.js" -Encoding utf8

Write-Host "Frontend configuration updated with WebSocket URI: $wsUri" -ForegroundColor Green
