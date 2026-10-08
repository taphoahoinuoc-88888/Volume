param([ValidateSet('Start','Stop','Worker')][string]$Action='Start')
$ErrorActionPreference='Stop'
if ($Action -ne 'Worker') {
    [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
    $OutputEncoding = [Console]::OutputEncoding
}
function Invoke-Volume([string]$Command, [string]$InputJson='') {
    $info=New-Object System.Diagnostics.ProcessStartInfo
    $info.FileName=$script:Node
    $info.Arguments='"'+$script:Helper+'" '+$Command
    $info.WorkingDirectory=$script:Root
    $info.UseShellExecute=$false
    $info.RedirectStandardInput=$true
    $info.StandardInputEncoding=New-Object System.Text.UTF8Encoding($false)
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
    if ($Action -eq 'Worker') {
        # Suspended creation + Windows Job Object: every descendant belongs to this supervisor.
        # Closing this supervisor kills only its job, including CLI sidecars; no global taskkill.
        Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class VolumeDemoJob {
 [StructLayout(LayoutKind.Sequential)] struct Basic { public long a,b; public uint flags; public UIntPtr min,max; public uint active; public UIntPtr affinity; public uint priority,scheduling; }
 [StructLayout(LayoutKind.Sequential)] struct IO { public ulong a,b,c,d,e,f; }
 [StructLayout(LayoutKind.Sequential)] struct Extended { public Basic basic; public IO io; public UIntPtr processMemory,jobMemory,peakProcess,peakJob; }
 [StructLayout(LayoutKind.Sequential,CharSet=CharSet.Unicode)] struct Startup { public uint cb; public string reserved,desktop,title; public uint x,y,xSize,ySize,xCount,yCount,fill,flags; public short show,reserved2; public IntPtr reservedPointer,input,output,error; }
 [StructLayout(LayoutKind.Sequential)] struct ProcessInfo { public IntPtr process,thread; public uint pid,tid; }
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern IntPtr CreateJobObject(IntPtr attributes,string name);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool SetInformationJobObject(IntPtr job,int kind,ref Extended info,uint size);
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern bool CreateProcess(string app,StringBuilder command,IntPtr pa,IntPtr ta,bool inherit,uint flags,IntPtr env,string cwd,ref Startup startup,out ProcessInfo pi);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool AssignProcessToJobObject(IntPtr job,IntPtr process);
 [DllImport("kernel32.dll")] static extern uint ResumeThread(IntPtr thread);
 [DllImport("kernel32.dll")] static extern uint WaitForSingleObject(IntPtr handle,uint timeout);
 [DllImport("kernel32.dll")] static extern bool GetExitCodeProcess(IntPtr process,out uint code);
 [DllImport("kernel32.dll")] static extern bool FreeConsole();
 [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr handle);
 [DllImport("kernel32.dll")] static extern bool TerminateProcess(IntPtr process,uint code);
 [DllImport("kernel32.dll")] static extern IntPtr GetStdHandle(int handle);
 [DllImport("kernel32.dll")] static extern bool SetHandleInformation(IntPtr handle,uint mask,uint flags);
 public static int Run(string node,string helper,string cwd) {
   IntPtr job=CreateJobObject(IntPtr.Zero,null); ProcessInfo pi=new ProcessInfo();
   if(job==IntPtr.Zero)throw new Exception("Khong tao duoc Job Object VOLUME.");
   try {
     Extended limit=new Extended();limit.basic.flags=0x2000;
     if(!SetInformationJobObject(job,9,ref limit,(uint)Marshal.SizeOf(limit)))throw new Exception("Khong dat duoc gioi han Job Object.");
     Startup si=new Startup();si.cb=(uint)Marshal.SizeOf(si);si.flags=0x100;si.input=GetStdHandle(-10);si.output=GetStdHandle(-11);si.error=GetStdHandle(-12);
     FreeConsole(); // Detach only this supervisor; closing the owner batch window must not stop the demo.
     SetHandleInformation(si.input,1,1);SetHandleInformation(si.output,1,1);SetHandleInformation(si.error,1,1);
     StringBuilder cmd=new StringBuilder("\""+node+"\" \""+helper+"\" worker");
     if(!CreateProcess(node,cmd,IntPtr.Zero,IntPtr.Zero,true,0x08000004,IntPtr.Zero,cwd,ref si,out pi))throw new Exception("Khong tao duoc worker VOLUME.");
     if(!AssignProcessToJobObject(job,pi.process)){TerminateProcess(pi.process,1);throw new Exception("Khong gan duoc worker vao Job Object.");}
     ResumeThread(pi.thread);WaitForSingleObject(pi.process,0xffffffff);uint code;GetExitCodeProcess(pi.process,out code);return (int)code;
   } finally { if(pi.thread!=IntPtr.Zero)CloseHandle(pi.thread);if(pi.process!=IntPtr.Zero)CloseHandle(pi.process);CloseHandle(job); }
 }
}
'@
        $workerExit=[VolumeDemoJob]::Run($script:Node,$script:Helper,$script:Root)
        exit $workerExit
    }
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
            $adminResult=Invoke-Volume 'admin' $payload
        } finally {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($a)
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b)
            $password=$null; $payload=$null; $first.Dispose(); $second.Dispose()
        }
        if ($adminResult.created) {
            Write-Host 'Da tao ADMIN. Dang nhap bang email va mat khau vua chon.'
        } else {
            Write-Host 'ADMIN da duoc tao o lan mo khac. Thong tin vua nhap khong thay doi tai khoan do. Dung thong tin da tao truoc, hoac bam START lai va chon R de khoi phuc.'
        }
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
