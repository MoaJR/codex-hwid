[CmdletBinding()]
param(
    [switch]$InstallMissing,
    [switch]$SkipNpmInstall,
    [switch]$StartDevServer
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Stop-Setup {
    param([string]$Message)
    Write-Host "`n[ERRO] $Message" -ForegroundColor Red
    exit 1
}

function Test-CommandAvailable {
    param([string]$Name)
    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Refresh-ProcessPath {
    $currentPath = $env:Path
    $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $pathParts = @($machinePath, $userPath, $currentPath) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    $env:Path = $pathParts -join ";"

    $dockerBin = Join-Path $env:ProgramFiles "Docker\Docker\resources\bin"
    if ((Test-Path $dockerBin) -and (($env:Path -split ";") -notcontains $dockerBin)) {
        $env:Path = "$env:Path;$dockerBin"
    }
}

function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)][string]$Command,
        [Parameter()][string[]]$Arguments = @(),
        [Parameter()][string]$FailureMessage = "O comando falhou."
    )

    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        Stop-Setup "$FailureMessage (codigo $LASTEXITCODE)"
    }
}

function Install-WingetPackage {
    param(
        [Parameter(Mandatory = $true)][string]$Id,
        [Parameter(Mandatory = $true)][string]$Label,
        [ValidateSet("install", "upgrade")][string]$Operation = "install"
    )

    if (-not (Test-CommandAvailable "winget.exe")) {
        Stop-Setup "O winget nao esta instalado. Instale o 'Instalador de Aplicativo' pela Microsoft Store (https://aka.ms/getwinget), reabra o PowerShell e execute este script novamente."
    }

    Write-Step "Instalando $Label"
    $arguments = @(
        $Operation,
        "--id", $Id,
        "--exact",
        "--accept-package-agreements",
        "--accept-source-agreements",
        "--silent"
    )
    Invoke-Checked -Command "winget.exe" -Arguments $arguments -FailureMessage "Nao foi possivel instalar $Label pelo winget."
    Refresh-ProcessPath
}

function Assert-OrInstallCommand {
    param(
        [Parameter(Mandatory = $true)][string]$Command,
        [Parameter(Mandatory = $true)][string]$PackageId,
        [Parameter(Mandatory = $true)][string]$Label
    )

    if (Test-CommandAvailable $Command) {
        Write-Ok "$Label encontrado"
        return
    }

    if (-not $InstallMissing) {
        Stop-Setup "$Label nao foi encontrado. Execute novamente com -InstallMissing."
    }

    Install-WingetPackage -Id $PackageId -Label $Label
    if (-not (Test-CommandAvailable $Command)) {
        Stop-Setup "$Label foi instalado, mas ainda nao aparece neste terminal. Feche e reabra o VS Code e execute este script novamente."
    }
    Write-Ok "$Label instalado"
}

function New-LocalSecret {
    $bytes = New-Object byte[] 48
    $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $generator.GetBytes($bytes)
    }
    finally {
        $generator.Dispose()
    }

    return [Convert]::ToBase64String($bytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
}

function Test-WslReady {
    if (-not (Test-CommandAvailable "wsl.exe")) {
        return $false
    }

    & wsl.exe --status *> $null
    if ($LASTEXITCODE -ne 0) {
        return $false
    }

    & wsl.exe --set-default-version 2 *> $null
    return $LASTEXITCODE -eq 0
}

function Assert-OrInstallWsl {
    if (Test-WslReady) {
        Write-Ok "WSL 2 disponivel"
        return
    }

    if (-not $InstallMissing) {
        Stop-Setup "WSL 2 nao esta pronto. Abra o PowerShell como administrador, execute 'wsl --install --no-distribution', reinicie o Windows e rode este script novamente; ou use -InstallMissing para iniciar essa instalacao."
    }

    Write-Step "Solicitando ao Windows a instalacao do WSL 2"
    Write-Host "Uma janela de autorizacao de administrador sera exibida. Aceite-a para continuar."
    try {
        $arguments = @(
            "-NoProfile",
            "-ExecutionPolicy", "Bypass",
            "-Command", "wsl.exe --install --no-distribution"
        )
        $process = Start-Process -FilePath "powershell.exe" -Verb RunAs -ArgumentList $arguments -Wait -PassThru
    }
    catch {
        Stop-Setup "A instalacao elevada do WSL 2 nao foi autorizada. Execute manualmente 'wsl --install --no-distribution' em um PowerShell como administrador."
    }

    if ($process.ExitCode -ne 0) {
        Stop-Setup "O Windows nao concluiu a instalacao do WSL 2 (codigo $($process.ExitCode)). Execute 'wsl --install --no-distribution' em um PowerShell como administrador e verifique a mensagem apresentada."
    }

    if (-not (Test-WslReady)) {
        Write-Host "`n[REINICIO NECESSARIO] O WSL 2 foi solicitado ao Windows." -ForegroundColor Yellow
        Write-Host "Reinicie o computador e depois execute novamente este mesmo comando:"
        Write-Host "powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1 -InstallMissing"
        exit 2
    }

    Write-Ok "WSL 2 instalado"
}

function Initialize-LocalEnvironment {
    param([string]$EnvironmentFile)

    $expectedDatabaseUrl = "postgresql://postgres:postgres@127.0.0.1:5432/douglas_vaz_dev?schema=public"

    if (-not (Test-Path $EnvironmentFile)) {
        $secret = New-LocalSecret
        $content = @"
# Gerado por scripts/setup-windows.ps1 para desenvolvimento local.
DATABASE_URL="$expectedDatabaseUrl"
AUTH_ENABLED=true
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="$secret"
"@
        $utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($EnvironmentFile, $content, $utf8WithoutBom)
        $secret = $null
        Write-Ok ".env.local local criado; a chave nao foi exibida"
        return
    }

    # Valida internamente apenas para impedir que este bootstrap alcance um banco remoto.
    # Nenhum valor do arquivo e impresso.
    $content = [System.IO.File]::ReadAllText($EnvironmentFile)
    $escapedDatabaseUrl = [Regex]::Escape($expectedDatabaseUrl)
    $databasePattern = '(?m)^\s*DATABASE_URL\s*=\s*[''"]?' + $escapedDatabaseUrl + '[''"]?\s*$'
    $databaseIsLocal = $content -match $databasePattern
    $authIsEnabled = $content -match '(?m)^\s*AUTH_ENABLED\s*=\s*[''"]?true[''"]?\s*$'
    $authUrlIsLocal = $content -match '(?m)^\s*BETTER_AUTH_URL\s*=\s*[''"]?http://localhost:3000/?[''"]?\s*$'
    $secretMatch = [Regex]::Match($content, '(?m)^\s*BETTER_AUTH_SECRET\s*=\s*[''"]?([^''"\r\n]+)[''"]?\s*$')
    $secretIsValid = $secretMatch.Success -and $secretMatch.Groups[1].Value.Trim().Length -ge 32
    $content = $null

    if (-not ($databaseIsLocal -and $authIsEnabled -and $authUrlIsLocal -and $secretIsValid)) {
        Stop-Setup ".env.local ja existe, mas nao corresponde ao ambiente local seguro esperado. O arquivo foi preservado. Se ele for descartavel, renomeie-o para .env.local.backup e execute este script novamente."
    }

    Write-Ok ".env.local existente validado sem exibir valores"
}

function Wait-ForDocker {
    param([int]$TimeoutSeconds = 120)

    $dockerDesktop = Join-Path $env:ProgramFiles "Docker\Docker\Docker Desktop.exe"
    & docker info *> $null
    if ($LASTEXITCODE -eq 0) {
        return $true
    }

    if (Test-Path $dockerDesktop) {
        Write-Step "Abrindo o Docker Desktop"
        Start-Process -FilePath $dockerDesktop | Out-Null
    }

    Write-Host "Aguardando o mecanismo do Docker ficar pronto..."
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        Start-Sleep -Seconds 3
        & docker info *> $null
        if ($LASTEXITCODE -eq 0) {
            return $true
        }
    } while ((Get-Date) -lt $deadline)

    return $false
}

if ($env:OS -ne "Windows_NT") {
    Stop-Setup "Este script e exclusivo para Windows. Consulte docs/LOCAL_DEVELOPMENT.md para outros sistemas."
}

$repositoryRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repositoryRoot
$env:VERCEL_ENV = "development"
Refresh-ProcessPath

Write-Step "Verificando os pre-requisitos"
Assert-OrInstallCommand -Command "git.exe" -PackageId "Git.Git" -Label "Git"
Assert-OrInstallCommand -Command "node.exe" -PackageId "OpenJS.NodeJS.LTS" -Label "Node.js LTS"

$nodeVersionText = (& node --version).Trim().TrimStart("v")
try {
    $nodeVersion = [Version]$nodeVersionText
}
catch {
    Stop-Setup "Nao foi possivel interpretar a versao instalada do Node.js."
}

$minimumNodeVersion = [Version]"22.15.0"
if ($nodeVersion -lt $minimumNodeVersion) {
    if (-not $InstallMissing) {
        Stop-Setup "Node.js $nodeVersion detectado; o projeto exige 22.15.0 ou superior. Execute novamente com -InstallMissing."
    }
    Install-WingetPackage -Id "OpenJS.NodeJS.LTS" -Label "Node.js LTS atualizado" -Operation "upgrade"
    if (([Version]((& node --version).Trim().TrimStart("v"))) -lt $minimumNodeVersion) {
        Stop-Setup "A versao nova do Node.js ainda nao esta ativa. Feche e reabra o VS Code e execute este script novamente."
    }
}
Write-Ok "Node.js $(& node --version)"

if (-not (Test-CommandAvailable "npm.cmd")) {
    Stop-Setup "npm nao foi encontrado junto com o Node.js. Reinstale o Node.js LTS e reabra o VS Code."
}
$npmCommand = (Get-Command "npm.cmd").Source

Assert-OrInstallWsl
Assert-OrInstallCommand -Command "docker.exe" -PackageId "Docker.DockerDesktop" -Label "Docker Desktop"
Refresh-ProcessPath

if (-not (Wait-ForDocker)) {
    Stop-Setup "O Docker Desktop foi encontrado, mas nao iniciou em 120 segundos. Abra o aplicativo, aceite os termos exibidos e conclua a configuracao. Se ele solicitar WSL 2, abra o PowerShell como administrador, execute 'wsl --install', reinicie o Windows e rode este script novamente."
}
Write-Ok "Docker ativo"

Invoke-Checked -Command "docker.exe" -Arguments @("compose", "version") -FailureMessage "Docker Compose nao esta disponivel. Atualize o Docker Desktop."

Write-Step "Preparando a configuracao local"
Initialize-LocalEnvironment -EnvironmentFile (Join-Path $repositoryRoot ".env.local")

if (-not $SkipNpmInstall) {
    Write-Step "Instalando as dependencias exatas do projeto"
    Invoke-Checked -Command $npmCommand -Arguments @("ci") -FailureMessage "npm ci falhou."
}

Write-Step "Iniciando o PostgreSQL 17 local"
Invoke-Checked -Command "docker.exe" -Arguments @("compose", "-f", "compose.dev.yml", "up", "-d", "--wait") -FailureMessage "Nao foi possivel iniciar o PostgreSQL local."
Invoke-Checked -Command "docker.exe" -Arguments @("compose", "-f", "compose.dev.yml", "ps") -FailureMessage "Nao foi possivel consultar o PostgreSQL local."

Write-Step "Gerando o cliente e aplicando as migrations"
Invoke-Checked -Command $npmCommand -Arguments @("run", "db:generate") -FailureMessage "A geracao do Prisma falhou."
Invoke-Checked -Command $npmCommand -Arguments @("run", "db:migrate:deploy") -FailureMessage "As migrations locais falharam."
Invoke-Checked -Command $npmCommand -Arguments @("run", "db:inspect:schema") -FailureMessage "A verificacao do schema local falhou."
Invoke-Checked -Command $npmCommand -Arguments @("run", "db:seed:articles") -FailureMessage "O seed editorial local falhou."
Invoke-Checked -Command $npmCommand -Arguments @("run", "auth:check") -FailureMessage "A verificacao da autenticacao local falhou."

Write-Host "`nAmbiente local preparado com sucesso." -ForegroundColor Green
Write-Host "O banco esta em Docker e .env.local usa somente 127.0.0.1."
Write-Host "O proximo passo e criar identidades ficticias pelos comandos de docs/LOCAL_DEVELOPMENT.md."

if ($StartDevServer) {
    Write-Step "Iniciando o site em http://localhost:3000"
    & $npmCommand run dev
    exit $LASTEXITCODE
}

Write-Host "Para abrir o site agora, execute: npm run dev"

