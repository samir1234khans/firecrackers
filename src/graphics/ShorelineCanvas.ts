import { shorelineBand, TOWN_HEIGHT, TOWN_WIDTH, roadLife } from './ShorelineModel.js';
import { makeShorelineArt, shorelineProjection, SHORELINE_ART_WORLD_HEIGHT } from './ShorelineArt.js';
/** One cached perspective shore; water remains entirely in the existing renderer. */
export class ShorelineCanvas{
  private readonly art=makeShorelineArt();
  private sceneTime=0;
  draw(c:CanvasRenderingContext2D,width:number,height:number,horizon:number,time:number,motion:boolean){
    if(motion)this.sceneTime=time;
    const span=shorelineBand(horizon,width,height).span*height,crop=width/height<.72?.48:1,center=crop<1?.375:.5,sx=this.art.width*(center-crop/2),sw=this.art.width*crop;
    c.save();c.globalAlpha=1;
    c.drawImage(this.art,sx,0,sw,this.art.height,0,horizon*height-span,width,span*SHORELINE_ART_WORLD_HEIGHT/TOWN_HEIGHT);
    for(const [i,road] of roadLife(this.sceneTime).entries()){
      const p=shorelineProjection(road.x,road.y+.85,road.z+.1),x=(p.x/TOWN_WIDTH-(center-crop/2))/crop*width,y=horizon*height-span+p.y/TOWN_HEIGHT*span;
      c.fillStyle=i?'#d0b38b':'#e2caa2';c.globalAlpha=.82;c.fillRect(x,y,.9,.6);c.fillRect(x+1.05,y,.9,.6);
    }
    c.restore();
  }
  dispose(){this.art.width=this.art.height=1;}
}
