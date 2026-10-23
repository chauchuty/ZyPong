export const W=800,H=1000,PW=160,PH=18;
export function createGame(){return {player:0,computer:0,px:400,ai:400,ball:{x:400,y:500,vx:180,vy:370},waiting:.7,winner:null};}
export function serve(g,direction=1){g.ball={x:400,y:500,vx:(Math.random()-.5)*320,vy:direction*370};g.waiting=.8;}
export function step(g,dt,target,level='normal'){
 if(g.winner)return null;
 g.px=Math.max(PW/2,Math.min(W-PW/2,target));
 const speed={easy:220,normal:340,hard:490}[level]||340;
 g.ai+=Math.max(-speed*dt,Math.min(speed*dt,g.ball.x-g.ai));g.ai=Math.max(PW/2,Math.min(W-PW/2,g.ai));
 if(g.waiting>0){g.waiting-=dt;return null;}
 const b=g.ball,old=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;let event=null;
 if(b.x<12||b.x>W-12){b.x=Math.max(12,Math.min(W-12,b.x));b.vx*=-1;event='hit';}
 for(const [x,y,dir] of [[g.px,920,-1],[g.ai,80,1]]){
  if(b.vy*dir<0 && (old-y)*dir>=PH/2+12 && (b.y-y)*dir<=PH/2+12 && Math.abs(b.x-x)<PW/2+12){b.y=y+dir*(PH/2+12);const angle=(b.x-x)/(PW/2)*1.05;const velocity=Math.min(850,Math.hypot(b.vx,b.vy)*1.06);b.vx=Math.sin(angle)*velocity;b.vy=dir*Math.cos(angle)*velocity;event='hit';}
 }
 if(b.y<-20||b.y>H+20){const scorer=b.y<0?'player':'computer';g[scorer]++;if(g[scorer]>=7){g.winner=scorer;return 'win';}serve(g,scorer==='player'?1:-1);return 'point';}
 return event;
}
