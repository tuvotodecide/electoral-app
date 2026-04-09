param(
  [Parameter(Mandatory = $true)]
  [string]$Path
)

if (-not (Test-Path -LiteralPath $Path)) {
  Write-Error "Env file not found: $Path"
  exit 1
}

function Remove-InlineEnvComment {
  param(
    [string]$Value
  )

  $inSingle = $false
  $inDouble = $false

  for ($i = 0; $i -lt $Value.Length; $i++) {
    $ch = $Value[$i]

    if ($ch -eq "'" -and -not $inDouble) {
      $inSingle = -not $inSingle
      continue
    }

    if ($ch -eq '"' -and -not $inSingle) {
      $inDouble = -not $inDouble
      continue
    }

    if ($ch -eq '#' -and -not $inSingle -and -not $inDouble) {
      # Treat as comment only at start or when preceded by whitespace.
      if ($i -eq 0 -or [char]::IsWhiteSpace($Value[$i - 1])) {
        return $Value.Substring(0, $i).TrimEnd()
      }
    }
  }

  return $Value
}

$lines = Get-Content -LiteralPath $Path

foreach ($line in $lines) {
  $trimmed = $line.Trim()

  # Skip blanks and full-line comments.
  if ([string]::IsNullOrWhiteSpace($trimmed) -or $trimmed.StartsWith('#')) {
    continue
  }

  # Support optional "export KEY=value" style.
  if ($trimmed -like 'export *') {
    $trimmed = $trimmed.Substring(7).Trim()
  }

  # Split only on the first '=' so values can contain '='.
  $parts = $trimmed -split '=', 2
  if ($parts.Count -ne 2) {
    Write-Warning "Skipping invalid line: $line"
    continue
  }

  $key = $parts[0].Trim()
  $val = (Remove-InlineEnvComment -Value $parts[1]).Trim()

  if ([string]::IsNullOrWhiteSpace($key)) {
    Write-Warning "Skipping line with empty key: $line"
    continue
  }

  # Remove wrapping single/double quotes only when both ends match.
  if ($val.Length -ge 2) {
    if (($val.StartsWith('"') -and $val.EndsWith('"')) -or ($val.StartsWith("'") -and $val.EndsWith("'"))) {
      $val = $val.Substring(1, $val.Length - 2)
    }
  }

  [Environment]::SetEnvironmentVariable($key, $val, 'Process')
  Write-Host "Set environment variable: $key"
}
