# Traced runner for Broken Source-style installers (brokensrc / iex).
# Logs NDJSON to repo-root debug-905ed2.log (session 905ed2).
# Hypotheses: H1=cwd/env inheritance; H2=uv picks too-new Python (no wheels -> moderngl sdist + MSVC); H3=download/parse; H4=installer blocks; H5=completion

param(
  # brokensrc.dev/get.ps1 often 404s; upstream script lives in the monorepo website folder.
  [string]$InstallerUrl = "https://raw.githubusercontent.com/BrokenSource/BrokenSource/main/website/get.ps1"
)

$ErrorActionPreference = "Continue"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$logPath = Join-Path $repoRoot "debug-905ed2.log"

function Write-InstallTrace {
  param(
    [string]$HypothesisId,
    [string]$Location,
    [string]$Message,
    [hashtable]$Data = @{}
  )
  $payload = [ordered]@{
    sessionId    = "905ed2"
    timestamp    = [int64]([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())
    location     = $Location
    message      = $Message
    data         = $Data
    hypothesisId = $HypothesisId
    runId        = "broken-source-trace"
  }
  $line = ($payload | ConvertTo-Json -Compress -Depth 8)
  Add-Content -LiteralPath $logPath -Value $line -Encoding utf8
}

#region agent log
Write-InstallTrace -HypothesisId "H1" -Location "broken-source-install-trace.ps1:start" -Message "trace_start" -Data @{
  pid        = $PID
  pwd        = (Get-Location).Path
  psVersion  = $PSVersionTable.PSVersion.ToString()
  hasGit     = [bool](Get-Command git -ErrorAction SilentlyContinue)
  hasUv      = [bool](Get-Command uv -ErrorAction SilentlyContinue)
}
#endregion

#region agent log
Write-InstallTrace -HypothesisId "H2" -Location "broken-source-install-trace.ps1:before_iwr" -Message "download_start" -Data @{ url = $InstallerUrl }
#endregion

try {
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $resp = Invoke-WebRequest -Uri $InstallerUrl -UseBasicParsing -TimeoutSec 120
  $sw.Stop()
  #region agent log
  Write-InstallTrace -HypothesisId "H2" -Location "broken-source-install-trace.ps1:after_iwr" -Message "download_ok" -Data @{
    ms          = $sw.ElapsedMilliseconds
    status      = [int]$resp.StatusCode
    contentLen  = $resp.Content.Length
  }
  #endregion
} catch {
  #region agent log
  Write-InstallTrace -HypothesisId "H2" -Location "broken-source-install-trace.ps1:iwr_error" -Message "download_failed" -Data @{
    err = $_.Exception.Message
  }
  #endregion
  Write-Host "Download failed: $($_.Exception.Message)"
  exit 1
}

#region agent log
Write-InstallTrace -HypothesisId "H3" -Location "broken-source-install-trace.ps1:before_invoke" -Message "about_to_execute_remote_script" -Data @{}
#endregion

try {
  $sb = [scriptblock]::Create($resp.Content)
  #region agent log
  Write-InstallTrace -HypothesisId "H3" -Location "broken-source-install-trace.ps1:after_parse" -Message "scriptblock_parsed" -Data @{}
  #endregion
} catch {
  #region agent log
  Write-InstallTrace -HypothesisId "H3" -Location "broken-source-install-trace.ps1:parse_error" -Message "scriptblock_parse_failed" -Data @{ err = $_.Exception.Message }
  #endregion
  Write-Host "Parse failed: $($_.Exception.Message)"
  exit 1
}
try {
  #region agent log
  $uvVer = ""
  if (Get-Command uv -ErrorAction SilentlyContinue) { $uvVer = (& uv --version 2>&1 | Out-String).Trim() }
  Write-InstallTrace -HypothesisId "H2" -Location "broken-source-install-trace.ps1:before_uv_pin" -Message "uv_and_python_env_before_pin" -Data @{
    uvVersion     = $uvVer
    UV_PYTHON_old = [string]$env:UV_PYTHON
  }
  # Avoid CPython 3.14+ on Windows: moderngl (via shaderflow) often has no wheel -> sdist needs MSVC Build Tools.
  $env:UV_PYTHON = "3.12"
  Write-InstallTrace -HypothesisId "H2" -Location "broken-source-install-trace.ps1:after_uv_pin" -Message "set_UV_PYTHON_for_installer" -Data @{ UV_PYTHON = $env:UV_PYTHON }
  #endregion
  #region agent log
  Write-InstallTrace -HypothesisId "H4" -Location "broken-source-install-trace.ps1:invoke_start" -Message "scriptblock_invoke" -Data @{}
  #endregion
  . $sb
  #region agent log
  Write-InstallTrace -HypothesisId "H4" -Location "broken-source-install-trace.ps1:invoke_done" -Message "scriptblock_returned" -Data @{}
  #endregion
} catch {
  #region agent log
  Write-InstallTrace -HypothesisId "H4" -Location "broken-source-install-trace.ps1:invoke_error" -Message "scriptblock_threw" -Data @{ err = $_.Exception.Message }
  #endregion
  throw
}

#region agent log
Write-InstallTrace -HypothesisId "H5" -Location "broken-source-install-trace.ps1:end" -Message "trace_end_ok" -Data @{}
#endregion
