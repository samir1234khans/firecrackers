import { familyIndex } from '../engine/catalog.js';
import type { Simulation } from '../engine/Simulation.js';
import { parseRecipe, planRecipe } from './ShowRecipe.js';
import type { ShowRecipe, RecipePlan } from './ShowRecipe.js';
import type { LaunchProfile } from '../engine/LaunchProfile.js';
/** No second timer: Simulation invokes this on its own fixed step. */
export class RecipePlayer {
  private recipe:ShowRecipe|null=null;
  private plan:RecipePlan={cues:[],seconds:0,conflicts:[]};
  private index=0;
  private began=0;
  private ended:number|null=null;
  status:'idle'|'playing'|'falling'|'complete'|'stopped'|'blocked'='idle';
  reason='';
  constructor(private readonly sim:Simulation){}
  start(input:ShowRecipe,profiles?:readonly(LaunchProfile|undefined)[]):void {
    const recipe=parseRecipe(input),plan=planRecipe(recipe,profiles);
    if(plan.conflicts.length)throw new Error(plan.conflicts[0]);
    const {selected,placement,placementMode}=this.sim;
    this.sim.reset(recipe.seed);
    this.sim.selected=selected;this.sim.placement=placement;this.sim.placementMode=placementMode;
    // Start preset before assigning the personal run, so the normal mode-change cancellation is safe.
    if(recipe.kind==='finale')this.sim.startShow('finale');
    this.recipe=recipe;this.plan=plan;this.index=0;this.began=this.sim.time;this.ended=null;this.reason='';this.status='playing';
  }
  tick():void {
    const recipe=this.recipe;if(!recipe||!['playing','falling'].includes(this.status))return;
    if(recipe.kind==='finale'){
      if(!this.sim.show)this.status='falling';
    }else if(this.status==='playing'){
      const cue=this.plan.cues[this.index];
      if(cue&&this.sim.time-this.began+1e-6>=cue.at){
        if(!this.sim.ignite('auto',familyIndex(cue.family),cue.position)){
          this.status='blocked';this.ended=this.sim.time;this.reason=`Cue ${this.index+1} could not launch within the current budget. No cue was silently skipped. Add spacing or replay after the sky clears.`;this.sim.message=this.reason;return;
        }
        this.index++;
        if(this.index>=this.plan.cues.length)this.status='falling';
      }
    }
    if(this.status==='falling'&&!this.sim.rockets.length&&!this.sim.heads.count&&!this.sim.trails.count&&!this.sim.embers.count&&!this.sim.cues.length&&!this.sim.smoke.count&&!this.sim.lights.length){this.status='complete';this.ended=this.sim.time;this.sim.message='Your night is complete.';}
  }
  cancel():void {if(this.status!=='idle'&&this.status!=='stopped'){this.status='stopped';this.ended=this.sim.time;this.reason='Stopped. Current sparks are allowed to finish.';}}
  clear():void {this.recipe=null;this.plan={cues:[],seconds:0,conflicts:[]};this.index=0;this.began=0;this.ended=null;this.status='idle';this.reason='';}
  get current():ShowRecipe|null{return this.recipe?parseRecipe(this.recipe):null;}
  snapshot(){return {status:this.status,name:this.recipe?.name??'',kind:this.recipe?.kind??null,elapsed:Math.max(0,Math.floor((this.ended??this.sim.time)-this.began)),estimate:this.plan.seconds,cue:this.index,total:this.plan.cues.length,phase:this.plan.cues[Math.max(0,this.index-1)]?.phase??'Opening',reason:this.reason};}
}
