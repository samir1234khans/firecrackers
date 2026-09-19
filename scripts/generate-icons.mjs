/** Original install icon. Tiny dependency-free PNG encoder; no remote art. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc(buffer){let n=0xffffffff;for(const value of buffer)n=crcTable[(n^value)&255]^(n>>>8);return (n^0xffffffff)>>>0;}
function chunk(type,data){const name=Buffer.from(type),length=Buffer.alloc(4),sum=Buffer.alloc(4);length.writeUInt32BE(data.length);sum.writeUInt32BE(crc(Buffer.concat([name,data])));return Buffer.concat([length,name,data,sum]);}
mkdirSync('public/icons',{recursive:true});
for(const size of [192,512]){
  const bytes=Buffer.alloc((size*4+1)*size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const px=(x-size/2)/size,py=(y-size/2)/size,r=Math.hypot(px,py),angle=Math.atan2(py,px);
    const ray=Math.abs(Math.sin(angle*4))*r<0.013 && r>0.14 && r<0.29;
    const speck=Math.abs(Math.sin((angle-0.35)*4))*r<0.010&&r>0.27&&r<0.285;
    const gold=ray||speck||r<0.022;const i=y*(size*4+1)+1+x*4;
    bytes[i]=gold?234:3;bytes[i+1]=gold?193:5;bytes[i+2]=gold?122:11;bytes[i+3]=255;
  }
  const header=Buffer.alloc(13);header.writeUInt32BE(size);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
  writeFileSync(`public/icons/icon-${size}.png`,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(bytes)),chunk('IEND',Buffer.alloc(0))]));
}
