/** Resolution-only pressure response. This never changes simulation counts, show pace or saved quality. */
export class RenderBudget {
  scale=1;
  private bad=0;
  private good=0;
  evaluate(p95:number,enabled:boolean):number {
    if(!enabled){this.scale=1;this.bad=this.good=0;return this.scale;}
    if(!Number.isFinite(p95)||p95<=0)return this.scale;
    this.bad=p95>48?this.bad+1:0;
    this.good=p95<28?this.good+1:0;
    if(this.bad>=3){this.scale=Math.max(.65,Math.round((this.scale-.10)*100)/100);this.bad=0;this.good=0;}
    if(this.good>=12){this.scale=Math.min(1,Math.round((this.scale+.05)*100)/100);this.good=0;}
    return this.scale;
  }
  reset(){this.scale=1;this.bad=this.good=0;}
}
