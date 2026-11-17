
import {existsSync,readFileSync,writeFileSync,mkdirSync,cpSync,renameSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {arch} from 'node:os';
import {randomUUID} from 'node:crypto';

const repository=fileURLToPath(new URL('.',import.meta.url));
const version=JSON.parse(readFileSync(new URL('./package.json',import.meta.url),'utf8')).version;
const output=join(repository,'.local','desktop'),release=join(output,version);
const dllNames=['Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll','WebView2Loader.dll'];

function run(executable,args,env=process.env){
  const result=spawnSync(executable,args,{stdio:'inherit',env,windowsHide:true});
  if(result.error)throw result.error;
  if(result.status!==0)throw new Error(executable+' exited with code '+result.status);
}

async function sdkLibraries(localBin){
  if(localBin)return dllNames.map(name=>join(resolve(localBin),name));
  const sdkVersion='1.0.3351.48';
  const sdk=join(output,'webview2-'+sdkVersion);
  const managed=join(sdk,'lib','net462');
  const native=join(sdk,'runtimes','win-x64','native');
  if(!existsSync(sdk)){
    const url=`https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/${sdkVersion}/microsoft.web.webview2.${sdkVersion}.nupkg`;
    const response=await fetch(url,{signal:AbortSignal.timeout(60000)});
    if(!response.ok)throw new Error('The WebView2 SDK download returned HTTP '+response.status+'.');
    const zip=join(output,'webview2-'+sdkVersion+'.zip');
    writeFileSync(zip,Buffer.from(await response.arrayBuffer()));
    const staging=join(output,'sdk-'+randomUUID());
    mkdirSync(staging);
    run('tar.exe',['-xf',zip,'-C',staging]);
    renameSync(staging,sdk);
  }
  for(const name of ['LICENSE.txt','ThirdPartyNotices.txt']){
    const notice=join(sdk,name);
    if(existsSync(notice))cpSync(notice,join(release,name));
  }
  return [join(managed,dllNames[0]),join(managed,dllNames[1]),join(native,dllNames[2])];
}

async function build(){
  if(process.platform!=='win32'||arch()!=='x64')throw new Error('Build the desktop package on 64-bit Windows.');
  if(!/^[0-9]+[.][0-9]+[.][0-9]+$/.test(version))throw new Error('Expected a release version in package.json.');
  const [flag,localBin,...extra]=process.argv.slice(2);
  if(flag&&(flag!=='--sdk-bin'||!localBin||extra.length))throw new Error('Usage: npm run desktop:build -- --sdk-bin "path to SDK DLLs"');
  const compiler=join(process.env.WINDIR||'C:/Windows','Microsoft.NET','Framework64','v4.0.30319','csc.exe');
  if(!existsSync(compiler))throw new Error('The Windows .NET Framework compiler is required.');
  if(!existsSync(join(repository,'dist','reading-bookends.js')))throw new Error('The Garden files are incomplete. Include dist/reading-bookends.js.');
  mkdirSync(release,{recursive:true});
  const [core,forms,loader]=await sdkLibraries(localBin);
  for(const file of [core,forms,loader])if(!existsSync(file))throw new Error('Missing WebView2 dependency '+file);
  const bytes=readFileSync(loader);
  if(bytes.readUInt16LE(bytes.readUInt32LE(60)+4)!==0x8664)throw new Error('The WebView2 loader must be x64.');
  [core,forms,loader].forEach((file,index)=>cpSync(file,join(release,dllNames[index])));

  const assembly=join(output,'DesktopVersion-'+version+'.cs');
  writeFileSync(assembly,`[assembly: System.Reflection.AssemblyTitle("Yin and Yang")]
[assembly: System.Reflection.AssemblyProduct("Yin and Yang")]
[assembly: System.Reflection.AssemblyVersion("${version}")]
[assembly: System.Reflection.AssemblyFileVersion("${version}")]
`);
  const sources=join(repository,'windows');
  const options=['/nologo','/target:winexe','/platform:x64','/reference:System.Windows.Forms.dll',
    '/reference:System.Drawing.dll','/reference:System.Web.Extensions.dll'];
  const exe=join(release,'Yin and Yang.exe');
  const iconMaker=join(output,'IconMaker.exe'), appIcon=join(output,'garden.ico');
  run(compiler,['/nologo','/target:exe','/reference:System.Drawing.dll','/out:'+iconMaker,join(sources,'IconMaker.cs')]);
  run(iconMaker,[appIcon]);
  cpSync(join(sources,'Desktop.config'),exe+'.config');
  run(compiler,[...options,'/win32icon:'+appIcon,'/win32manifest:'+join(sources,'Desktop.manifest'),'/reference:'+core,'/reference:'+forms,'/out:'+exe,join(sources,'Desktop.cs'),assembly]);
  cpSync(join(sources,'Desktop.config'),join(release,'QuickNote.exe.config'));
  run(compiler,[...options,'/win32icon:'+appIcon,'/win32manifest:'+join(sources,'Desktop.manifest'),'/out:'+join(release,'QuickNote.exe'),join(sources,'QuickNote.cs')]);
  cpSync(join(repository,'dist'),join(release,'dist'),{recursive:true});

  const zip=join(output,`Yin-and-Yang-${version}-Windows-x64.zip`);
  run('tar.exe',['-a','-cf',zip,'-C',output,version]);
  console.log('App: '+exe);
  console.log('Portable package: '+zip);
}

try { await build(); }
catch(error){console.error(error.message);process.exitCode=1;}
