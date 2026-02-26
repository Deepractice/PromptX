# Download MinGit (minimal embeddable Git for Windows) and extract to resources/win/git-bash/
# MinGit is the official minimal Git distribution from git-for-windows, designed for embedding.
# https://github.com/git-for-windows/git/releases

param(
  [string]$Version = "2.47.1",
  [string]$WindowsVersion = "1"
)

$ErrorActionPreference = "Stop"

$targetDir = Join-Path $PSScriptRoot "..\resources\win\git-bash"
$targetDir = [System.IO.Path]::GetFullPath($targetDir)

# Check if git.exe already exists — skip download if so
$gitExe = Join-Path $targetDir "mingw64\bin\git.exe"
if (Test-Path $gitExe) {
  Write-Host "git.exe already present at $gitExe — skipping download."
  exit 0
}

$zipName = "MinGit-$Version-64-bit.zip"
$url = "https://github.com/git-for-windows/git/releases/download/v$Version.windows.$WindowsVersion/$zipName"
$zipPath = Join-Path $env:TEMP $zipName
$extractPath = Join-Path $env:TEMP "mingit-extracted"

Write-Host "Downloading MinGit $Version from $url ..."
Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing

Write-Host "Extracting to $extractPath ..."
if (Test-Path $extractPath) { Remove-Item $extractPath -Recurse -Force }
Expand-Archive -Path $zipPath -DestinationPath $extractPath

# Copy mingw64/ into resources/win/git-bash/mingw64/
$srcMingw = Join-Path $extractPath "mingw64"
$dstMingw = Join-Path $targetDir "mingw64"

if (Test-Path $srcMingw) {
  Write-Host "Copying mingw64/ to $dstMingw ..."
  if (Test-Path $dstMingw) { Remove-Item $dstMingw -Recurse -Force }
  Copy-Item $srcMingw $dstMingw -Recurse
} else {
  # Some MinGit zips place files at root level
  Write-Host "mingw64/ not found in zip root, copying all contents to $dstMingw ..."
  New-Item -ItemType Directory -Force -Path $dstMingw | Out-Null
  Copy-Item (Join-Path $extractPath "*") $dstMingw -Recurse
}

# Verify
if (Test-Path $gitExe) {
  Write-Host "Done. git.exe is at $gitExe"
} else {
  Write-Error "git.exe not found after extraction. Check the MinGit zip structure."
  exit 1
}
