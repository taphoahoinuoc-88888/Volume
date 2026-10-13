$ErrorActionPreference='Stop'
try {
 $root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
 Write-Host 'VOLUME Telegram: dung bot cu truoc; khong chay hai poller cung token.'
 $choice=Read-Host 'Enter: chay cau hinh da luu; S: nhap token lan dau / cau hinh lai'
 if ($choice -eq 'S') {
  $secure=Read-Host 'Token bot hien co (an ky tu)' -AsSecureString
  $bstr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
   $token=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
   $payload=@{token=$token}|ConvertTo-Json -Compress
   $info=New-Object Diagnostics.ProcessStartInfo
   $info.FileName='node.exe';$info.Arguments='"'+(Join-Path $root 'scripts/telegram-setup.mjs')+'" setup'
   $info.UseShellExecute=$false;$info.RedirectStandardInput=$true
   $p=New-Object Diagnostics.Process;$p.StartInfo=$info;[void]$p.Start()
   $bytes=[Text.Encoding]::UTF8.GetBytes($payload)
   $p.StandardInput.BaseStream.Write($bytes,0,$bytes.Length);$p.StandardInput.Close();$p.WaitForExit()
   if($p.ExitCode -ne 0){throw 'Setup chua thanh cong. Kiem tra thong bao; khong tao bot moi.'}
  } finally {[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr);$token=$null;$payload=$null;$secure.Dispose()}
 }
 & node (Join-Path $root 'scripts/telegram-setup.mjs') run
 if($LASTEXITCODE -ne 0){throw 'Bot chua chay. Kiem tra token/cau hinh/ket noi va poller cu.'}
} catch {Write-Host ('VOLUME: '+$_.Exception.Message) -ForegroundColor Red;exit 1}
