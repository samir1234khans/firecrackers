import { spawn } from 'node:child_process';

/** Test-only Windows suite observation, with no per-frame process polling. */
export async function performanceIsolation() {
 const events=[];let watcher=null,buffer='',failure='',stderrText='';
 const evidence={method:process.platform==='win32'?'Windows WMI Node creation events at two-second provider resolution and initial active-suite check; commands classified but never executed or recorded. No per-frame process polling. Sub-two-second jobs can escape observation.':'Manual isolation required on this platform',events};
 if(process.platform==='win32'){
  const script=`$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
$testTaskPattern='@playwright[\\/]test[\\/]cli\\.js.*\\btest\\b|(?:^|[\\/\\s])(?:tests?|test-results)[\\/].*\\.(?:mjs|js)|(?:next|vite)(?:\\.js)?\\s+build|npm-cli\\.js.*(?:test|run build)'
function Check-TestTask($testTaskProcess) {
 if ($testTaskProcess -and $testTaskProcess.ProcessId -ne ${process.pid} -and $testTaskProcess.CommandLine -match $testTaskPattern) {
  @{kind='external-test-or-build';processId=$testTaskProcess.ProcessId;at=[DateTime]::UtcNow.ToString('o')} | ConvertTo-Json -Compress
 }
}
try {
 Register-WmiEvent -Query "SELECT * FROM __InstanceCreationEvent WITHIN 2 WHERE TargetInstance ISA 'Win32_Process' AND TargetInstance.Name='node.exe'" -SourceIdentifier 'always-play-isolation' | Out-Null
 Get-CimInstance Win32_Process -Filter "Name='node.exe'" | ForEach-Object { Check-TestTask $_ }
 Write-Output 'READY'
 while (Get-Process -Id ${process.pid} -ErrorAction SilentlyContinue) {
  $traceEvent=Wait-Event -SourceIdentifier 'always-play-isolation' -Timeout 2
  if ($traceEvent) {
   Check-TestTask $traceEvent.SourceEventArgs.NewEvent.TargetInstance
   Remove-Event -EventIdentifier $traceEvent.EventIdentifier
  }
 }
} finally { Unregister-Event -SourceIdentifier 'always-play-isolation' -ErrorAction SilentlyContinue }
`;
  watcher=spawn('powershell.exe',['-NoProfile','-NonInteractive','-OutputFormat','Text','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{windowsHide:true,stdio:['ignore','pipe','pipe']});
  await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Isolation observer did not become ready')),20000);
   watcher.stdout.on('data',data=>{buffer+=data.toString();let split;while((split=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,split).trim();buffer=buffer.slice(split+1);if(line==='READY'){clearTimeout(timeout);resolve();}else if(line.startsWith('{')){try{if(events.length<8)events.push(JSON.parse(line));}catch{failure='Invalid isolation event';}}}if(buffer.length>2048)failure='Isolation observer protocol overflow';});
   watcher.stderr.on('data',data=>{stderrText=(stderrText+data.toString()).slice(0,3000);});
   watcher.on('error',error=>{failure=error.message;clearTimeout(timeout);reject(error);});
   watcher.on('exit',()=>{if(!failure)failure=stderrText||'Isolation observer exited';clearTimeout(timeout);reject(Error(failure));});
  }).catch(error=>{watcher.kill();throw error;});
 }
 return {evidence,check(){if(failure||events.length)throw Error(failure||'External automated test/build overlapped timing; retain and reject this dataset');},close(){watcher?.kill();}};
}
