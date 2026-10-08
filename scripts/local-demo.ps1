param([ValidateSet('Start','Stop')][string]$Action='Start')
$ErrorActionPreference='Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$OutputEncoding = [Console]::OutputEncoding
function Invoke-Volume([string]$Command, [string]$InputJson='') {
    $info=New-Object System.Diagnostics.ProcessStartInfo
    $info.FileName=$script:Node
    $info.Arguments='"'+$script:Helper+'" '+$Command
    $info.WorkingDirectory=$script:Root
    $info.UseShellExecute=$false
    $info.RedirectStandardInput=$true
    $info.RedirectStandardOutput=$true
    $info.StandardOutputEncoding=New-Object System.Text.UTF8Encoding($false)
    $info.CreateNoWindow=$true
    $proc=New-Object System.Diagnostics.Process
    $proc.StartInfo=$info
    [void]$proc.Start()
    if ($InputJson) { $proc.StandardInput.WriteLine($InputJson) }
    $proc.StandardInput.Close()
    $output=$proc.StandardOutput.ReadToEnd()
    $proc.WaitForExit()
    if ($proc.ExitCode -ne 0) { throw 'Thao tac chua hoan tat. Xem thong bao VOLUME phia tren va thu lai.' }
    return ($output | ConvertFrom-Json)
}
try {
    $script:Root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
    $script:Helper=Join-Path $PSScriptRoot 'local-demo-admin.mjs'
    $command=Get-Command node.exe -ErrorAction SilentlyContinue
    if (-not $command) { throw 'Chua co Node.js. Cai Node.js 22 LTS (22.12 tro len), sau do bam lai START_VOLUME.bat.' }
    $script:Node=$command.Source
    $version=(& $script:Node --version).TrimStart('v').Split('.')
    if (-not (([int]$version[0] -eq 22 -and [int]$version[1] -ge 12) -or [int]$version[0] -eq 24)) { throw 'Can Node.js 22.12+ (dong 22) hoac 24. Hay cai Node.js LTS.' }
    if ($Action -eq 'Stop') {
        Invoke-Volume 'stop' | Out-Null
        Write-Host 'Da tat cac tai nguyen VOLUME do demo quan ly. Du lieu van duoc giu nguyen.'
        exit 0
    }
    Write-Host 'Dang chuan bi VOLUME. Lan dau can tai phu thuoc; khong dong cua so.'
    $result=Invoke-Volume 'start'
    if ($result.needsAdmin) {
        Write-Host 'Tao ADMIN local. Mat khau it nhat 12 ky tu. Khong dung mat khau that o noi khac.'
        $email=Read-Host 'Email ADMIN ban chon'
        $first=Read-Host 'Mat khau' -AsSecureString
        $second=Read-Host 'Nhap lai mat khau' -AsSecureString
        $a=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($first)
        $b=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($second)
        try {
            $password=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($a)
            if ($password -cne [Runtime.InteropServices.Marshal]::PtrToStringBSTR($b)) { throw 'Hai mat khau chua giong nhau. Bam START lai de nhap lai; du lieu khong bi xoa.' }
            $payload=@{email=$email;password=$password} | ConvertTo-Json -Compress
            Invoke-Volume 'admin' $payload | Out-Null
        } finally {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($a)
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b)
            $password=$null; $payload=$null; $first.Dispose(); $second.Dispose()
        }
        Write-Host 'Da tao ADMIN. Dang nhap bang email va mat khau vua chon.'
    } else {
        Write-Host 'ADMIN local da co san. Mat khau va quyen khong bi thay doi.'
        $recover=Read-Host 'Nhan Enter de mo web; go R neu quen mat khau ADMIN'
        if ($recover -eq 'R') {
            $email=Read-Host 'Email ADMIN can khoi phuc'
            Invoke-Volume 'recover' (@{email=$email} | ConvertTo-Json -Compress) | Out-Null
            Start-Process 'http://127.0.0.1:55324'
            Write-Host 'Mo email trong hop thu local vua hien, bam lien ket de dat mat khau moi.'
        }
    }
    Start-Process 'http://127.0.0.1:3000'
    Start-Process 'http://127.0.0.1:3001'
    Write-Host 'VOLUME da mo. Tat bang STOP_VOLUME.bat. Pi Node va du lieu duoc giu nguyen.'
    exit 0
} catch {
    Write-Host ('VOLUME: '+$_.Exception.Message) -ForegroundColor Red
    exit 1
}
