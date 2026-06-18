import { useState, useMemo, createContext, useContext, useCallback } from "react";

const COACH_USERNAMES = new Set(["jcartier", "admin"]);
const ROLES = { COACH: "coach", CLIENT: "client" };
function getRole(username) {
  return COACH_USERNAMES.has(username?.toLowerCase()) ? ROLES.COACH : ROLES.CLIENT;
}

const USERS = [
  { id: "jcartier",   username: "jcartier",   name: "J. Cartier",     role: ROLES.COACH },
  { id: "cbest",  username: "cbest",  name: "C. Best",     role: ROLES.CLIENT },
  { id: "mike_t", username: "mike_t", name: "Mike Torres", role: ROLES.CLIENT },
];

const CREDENTIALS = {
  "jcartier": "M@rines007",
  "cbest":    "NDGP2026",
  "mike_t":   "Mike1234!",
};

const C = {
  red:"#ef4444", redLight:"#fef2f2", dark:"#0a0a0a",
  gray:"#6b7280", lightGray:"#f3f4f6", border:"#e5e7eb",
  white:"#fff", green:"#22c55e", blue:"#3b82f6",
  yellow:"#f59e0b", orange:"#f97316"
};

const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

const fmt   = d  => new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
const fmtTs = ts => new Date(ts).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
const rpeCol = d => d<=3?C.green:d<=6?C.yellow:d<=8?C.orange:C.red;
const rpeLbl = d => d<=3?"Easy":d<=5?"Moderate":d<=7?"Hard":d<=9?"Very Hard":"MAX";
const emptySet = () => ({ reps:"", weight:"", type:"working", difficulty:7 });
const emptyEx  = () => ({ name:"", sets:[emptySet()] });
const NOW = () => new Date().toISOString();

const initDB = {
  clients: {
    cbest: {
      userId:"cbest", name:"C. Best", email:"cbest@email.com", program:"General Fitness - Week 1",
      goals:{ startWeight:170, goalWeight:160, currentWeight:170, targetDate:"2025-06-01",
              bench:{current:115,goal:155}, squat:{current:155,goal:205}, deadlift:{current:185,goal:245} },
      nutrition:{ calories:{goal:2000,consumed:0}, protein:{goal:160,consumed:0}, carbs:{goal:200,consumed:0}, fat:{goal:60,consumed:0} },
      weightLog:[{date:"2024-03-01",weight:170}],
      workouts:[],
      weekWorkouts:{completed:0,total:5},
      habits:[{id:1,name:"Hit protein goal",icon:"🥩",done:false},{id:2,name:"Workout completed",icon:"💪",done:false},{id:3,name:"Sleep 8 hours",icon:"😴",done:false}],
      coachNote:{text:"Welcome! Let's get started. Log your first workout and check in with your weight this week.",updatedAt:NOW()},
    },
    mike_t: {
      userId:"mike_t", name:"Mike Torres", email:"mike@email.com", program:"Powerbuilding - Week 1",
      goals:{ startWeight:165, goalWeight:185, currentWeight:172, targetDate:"2024-12-01",
              bench:{current:225,goal:275}, squat:{current:315,goal:365}, deadlift:{current:405,goal:455} },
      nutrition:{ calories:{goal:3000,consumed:2800}, protein:{goal:200,consumed:175}, carbs:{goal:350,consumed:310}, fat:{goal:90,consumed:82} },
      weightLog:[{date:"2024-01-01",weight:165},{date:"2024-02-01",weight:168},{date:"2024-03-01",weight:172}],
      workouts:[
        {id:"w6",userId:"mike_t",date:"2024-03-04",name:"Push Day",exercises:[{name:"Bench Press",sets:[{reps:5,weight:185,type:"warm",difficulty:4},{reps:5,weight:225,type:"working",difficulty:8}]}]},
        {id:"w7",userId:"mike_t",date:"2024-03-01",name:"Pull Day",exercises:[{name:"Deadlift",sets:[{reps:3,weight:315,type:"warm",difficulty:5},{reps:3,weight:405,type:"working",difficulty:9}]}]},
      ],
      weekWorkouts:{completed:2,total:5},
      habits:[{id:1,name:"Hit protein goal",icon:"🥩",done:false},{id:2,name:"Workout completed",icon:"💪",done:true}],
      coachNote:{text:"Need to increase workout frequency - only 2 sessions this week. Let's get back to 4-5 days.",updatedAt:NOW()},
    },
  }
};

function PBar({value,max,color=C.red,height=8}){
  const pct=Math.min(100,Math.round((value/max)*100));
  return <div style={{background:C.lightGray,borderRadius:99,height,overflow:"hidden"}}><div style={{width:`${pct}%`,background:color,height:"100%",borderRadius:99,transition:"width .3s"}}/></div>;
}
function Card({children,style={},onClick}){
  return <div onClick={onClick} style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:16,padding:"14px",marginBottom:10,...style}}>{children}</div>;
}
function Stat({label,value,sub,color=C.dark}){
  return(
    <div style={{background:C.lightGray,borderRadius:12,padding:"10px",textAlign:"center"}}>
      <p style={{margin:0,fontSize:10,color:C.gray,fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>{label}</p>
      <p style={{margin:"3px 0 0",fontSize:19,fontWeight:800,color}}>{value}</p>
      {sub&&<p style={{margin:"1px 0 0",fontSize:10,color:C.gray}}>{sub}</p>}
    </div>
  );
}
function MBar({label,consumed,goal,color}){
  return(
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
        <span style={{fontSize:13,fontWeight:600}}>{label}</span>
        <span style={{fontSize:12,color:C.gray}}>{consumed}/{goal}</span>
      </div>
      <PBar value={consumed} max={goal} color={color}/>
    </div>
  );
}
function MiniChart({data,color=C.red,vKey="weight"}){
  if(!data||data.length<2) return <p style={{color:C.gray,fontSize:13,textAlign:"center",padding:"16px 0"}}>Not enough data yet.</p>;
  const vals=data.map(d=>d[vKey]);
  const mn=Math.min(...vals)-2,mx=Math.max(...vals)+2;
  const W=300,H=90;
  const pts=data.map((d,i)=>{
    const x=(i/(data.length-1))*(W-24)+12;
    const y=H-((d[vKey]-mn)/(mx-mn))*(H-20)-10;
    return `${x},${y}`;
  });
  return(
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:H}}>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      {data.map((d,i)=>{
        const x=(i/(data.length-1))*(W-24)+12;
        const y=H-((d[vKey]-mn)/(mx-mn))*(H-20)-10;
        return <circle key={i} cx={x} cy={y} r="3" fill={color}/>;
      })}
      <text x="12" y={H-1} fontSize="10" fill={C.gray}>{data[0].date?.slice(5)}</text>
      <text x={W-12} y={H-1} fontSize="10" fill={C.gray} textAnchor="end">{data[data.length-1].date?.slice(5)}</text>
    </svg>
  );
}

function CoachNote({note,canEdit,onSave}){
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState(note?.text||"");
  const save=()=>{onSave(draft);setEditing(false);};
  return(
    <Card style={{borderLeft:`4px solid ${C.orange}`,background:"#fffbf5"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <div>
          <p style={{margin:0,fontSize:11,fontWeight:800,color:C.orange,textTransform:"uppercase",letterSpacing:.8}}>Coach Note</p>
          {note?.updatedAt&&<p style={{margin:"2px 0 0",fontSize:10,color:C.gray}}>Updated {fmtTs(note.updatedAt)}</p>}
        </div>
        {canEdit&&!editing&&<button onClick={()=>{setDraft(note?.text||"");setEditing(true);}} style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${C.orange}`,background:"transparent",color:C.orange,fontSize:12,fontWeight:700,cursor:"pointer"}}>Edit</button>}
      </div>
      {editing?(
        <>
          <textarea value={draft} onChange={e=>setDraft(e.target.value)} rows={5} style={{width:"100%",padding:"10px",borderRadius:10,border:`1.5px solid ${C.orange}`,fontSize:14,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit",marginBottom:8}}/>
          <div style={{display:"flex",gap:8}}>
            <button onClick={save} style={{flex:1,padding:"10px",background:C.orange,color:C.white,border:"none",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer"}}>Save</button>
            <button onClick={()=>setEditing(false)} style={{padding:"10px 16px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:10,color:C.gray,fontSize:14,cursor:"pointer"}}>Cancel</button>
          </div>
        </>
      ):(
        <p style={{margin:0,fontSize:14,color:C.dark,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{note?.text||"No note yet."}</p>
      )}
    </Card>
  );
}

function SetRow({s,si,onUpdate,onRemove,showRemove}){
  return(
    <div style={{background:s.type==="warm"?"#fffbf5":C.white,border:`1px solid ${s.type==="warm"?"#fed7aa":C.border}`,borderRadius:12,padding:"12px",marginBottom:8}}>
      <div style={{display:"grid",gridTemplateColumns:"28px 1fr 1fr",gap:8,alignItems:"end",marginBottom:10}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:10,color:C.gray,fontWeight:700,marginBottom:4}}>SET</div>
          <div style={{fontSize:15,fontWeight:800,color:C.dark}}>{si+1}</div>
        </div>
        <div>
          <div style={{fontSize:11,color:C.gray,fontWeight:700,marginBottom:4}}>WEIGHT (LBS)</div>
          <input type="number" value={s.weight} onChange={e=>onUpdate("weight",e.target.value)} placeholder="0" style={{width:"100%",padding:"10px 8px",borderRadius:9,border:`1.5px solid ${C.border}`,fontSize:16,fontWeight:600,textAlign:"center",boxSizing:"border-box",background:C.white}}/>
        </div>
        <div>
          <div style={{fontSize:11,color:C.gray,fontWeight:700,marginBottom:4}}>REPS</div>
          <input type="number" value={s.reps} onChange={e=>onUpdate("reps",e.target.value)} placeholder="0" style={{width:"100%",padding:"10px 8px",borderRadius:9,border:`1.5px solid ${C.border}`,fontSize:16,fontWeight:600,textAlign:"center",boxSizing:"border-box",background:C.white}}/>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <div style={{fontSize:11,fontWeight:800,color:C.gray,minWidth:32}}>RPE</div>
        <input type="range" min="1" max="10" step="1" value={s.difficulty} onChange={e=>onUpdate("difficulty",parseInt(e.target.value))} style={{flex:1,accentColor:rpeCol(s.difficulty)}}/>
        <div style={{minWidth:52,textAlign:"right"}}>
          <span style={{fontSize:15,fontWeight:800,color:rpeCol(s.difficulty)}}>{s.difficulty}</span>
          <span style={{fontSize:10,color:C.gray,display:"block",lineHeight:1}}>{rpeLbl(s.difficulty)}</span>
        </div>
        {showRemove&&<button onClick={onRemove} style={{background:"none",border:"none",color:"#d1d5db",fontSize:18,cursor:"pointer",padding:"0 2px"}}>x</button>}
      </div>
      <div style={{display:"flex",borderRadius:10,overflow:"hidden",border:`1.5px solid ${C.border}`}}>
        {[["warm","Warm-Up Set"],["working","Working Set"]].map(([t,lbl])=>(
          <button key={t} onClick={()=>onUpdate("type",t)} style={{flex:1,padding:"10px 6px",border:"none",background:s.type===t?(t==="warm"?C.orange:C.red):C.white,color:s.type===t?C.white:C.gray,fontSize:13,fontWeight:700,cursor:"pointer"}}>{lbl}</button>
        ))}
      </div>
    </div>
  );
}

function ExBlock({ex,exIdx,prevWo,onChange,onRemove}){
  const upd=(si,f,v)=>onChange({...ex,sets:ex.sets.map((s,i)=>i===si?{...s,[f]:v}:s)});
  const prevEx=prevWo?.exercises?.find(e=>e.name?.toLowerCase()===ex.name?.toLowerCase());
  return(
    <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:16,marginBottom:14,overflow:"hidden"}}>
      <div style={{background:C.dark,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
        <input value={ex.name} onChange={e=>onChange({...ex,name:e.target.value})} placeholder="Exercise name (e.g. Bench Press)" style={{flex:1,background:"transparent",border:"none",color:C.white,fontSize:15,fontWeight:700,outline:"none"}}/>
        {exIdx>0&&<button onClick={onRemove} style={{background:"rgba(255,255,255,.15)",border:"none",color:C.white,borderRadius:8,padding:"4px 10px",fontSize:13,cursor:"pointer"}}>Remove</button>}
      </div>
      {prevEx&&(
        <div style={{background:"#f0fdf4",padding:"6px 14px",borderBottom:"1px solid #bbf7d0"}}>
          <span style={{fontSize:11,color:"#16a34a",fontWeight:700}}>LAST SESSION: </span>
          {prevEx.sets.filter(s=>s.type!=="warm").slice(0,3).map((s,i)=>(
            <span key={i} style={{fontSize:11,color:"#16a34a"}}>{s.weight}x{s.reps}{i<2?", ":""}</span>
          ))}
        </div>
      )}
      <div style={{padding:"12px 12px 0"}}>
        {ex.sets.map((s,si)=>(
          <SetRow key={si} s={s} si={si} onUpdate={(f,v)=>upd(si,f,v)} onRemove={()=>onChange({...ex,sets:ex.sets.filter((_,i)=>i!==si)})} showRemove={ex.sets.length>1}/>
        ))}
        <button onClick={()=>onChange({...ex,sets:[...ex.sets,emptySet()]})} style={{width:"100%",padding:"11px",borderRadius:10,border:`1.5px dashed ${C.border}`,background:"transparent",color:C.gray,fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:12}}>+ Add Set</button>
      </div>
    </div>
  );
}

function WoCard({wo}){
  const [open,setOpen]=useState(false);
  return(
    <Card onClick={()=>setOpen(o=>!o)} style={{cursor:"pointer"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <h4 style={{margin:0,fontSize:15,fontWeight:700}}>{wo.name}</h4>
          <p style={{margin:"2px 0 0",fontSize:12,color:C.gray}}>{fmt(wo.date)} - {wo.exercises.length} exercise{wo.exercises.length!==1?"s":""}</p>
        </div>
        <span style={{fontSize:16,color:C.gray}}>{open?"^":"v"}</span>
      </div>
      {open&&(
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12,marginTop:10}}>
          {wo.exercises.map((ex,i)=>(
            <div key={i} style={{marginBottom:12}}>
              <p style={{margin:"0 0 6px",fontSize:13,fontWeight:700,color:C.red}}>{ex.name}</p>
              <div style={{display:"grid",gridTemplateColumns:"20px 44px 1fr 1fr 52px",gap:4,marginBottom:4}}>
                {["#","TYPE","WEIGHT","REPS","RPE"].map(h=><span key={h} style={{fontSize:10,fontWeight:700,color:C.gray}}>{h}</span>)}
              </div>
              {(ex.sets||[]).map((s,j)=>(
                <div key={j} style={{display:"grid",gridTemplateColumns:"20px 44px 1fr 1fr 52px",gap:4,alignItems:"center",padding:"5px 0",borderTop:`1px solid ${C.border}`}}>
                  <span style={{fontSize:12,color:C.gray}}>{j+1}</span>
                  <span style={{fontSize:10,fontWeight:800,padding:"2px 4px",borderRadius:5,background:s.type==="warm"?"#fff7ed":C.redLight,color:s.type==="warm"?C.orange:C.red,textAlign:"center"}}>{s.type==="warm"?"WU":"WS"}</span>
                  <span style={{fontSize:13,fontWeight:600}}>{s.weight} lbs</span>
                  <span style={{fontSize:13}}>{s.reps} reps</span>
                  <span style={{fontSize:11,fontWeight:700,color:rpeCol(s.difficulty)}}>RPE {s.difficulty}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ClientDashboard({client,dispatch}){
  const {goals,nutrition,weekWorkouts,habits}=client;
  const loss=goals.startWeight-goals.currentWeight;
  const needed=goals.startWeight-goals.goalWeight;
  const pct=Math.max(0,Math.min(100,needed>0?Math.round((loss/needed)*100):0));
  return(
    <div>
      <CoachNote note={client.coachNote} canEdit={false} onSave={()=>{}}/>
      <div style={{background:"linear-gradient(135deg,#0a0a0a 0%,#1f1f1f 100%)",borderRadius:20,padding:"18px 16px",marginBottom:12,color:C.white}}>
        <p style={{margin:0,fontSize:13,opacity:.6}}>Good morning,</p>
        <h2 style={{margin:"2px 0 4px",fontSize:22,fontWeight:700}}>{client.name}</h2>
        <p style={{margin:"0 0 14px",fontSize:12,color:C.orange}}>{client.program}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <div style={{background:"rgba(255,255,255,.08)",borderRadius:12,padding:"10px 12px"}}>
            <p style={{margin:0,fontSize:11,opacity:.6}}>CURRENT WEIGHT</p>
            <p style={{margin:"2px 0 0",fontSize:20,fontWeight:700}}>{goals.currentWeight} <span style={{fontSize:12}}>lbs</span></p>
          </div>
          <div style={{background:"rgba(255,255,255,.08)",borderRadius:12,padding:"10px 12px"}}>
            <p style={{margin:0,fontSize:11,opacity:.6}}>GOAL WEIGHT</p>
            <p style={{margin:"2px 0 0",fontSize:20,fontWeight:700}}>{goals.goalWeight} <span style={{fontSize:12}}>lbs</span></p>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:12,opacity:.7}}>Goal Progress</span>
          <span style={{fontSize:12,fontWeight:700,color:C.red}}>{pct}%</span>
        </div>
        <div style={{background:"rgba(255,255,255,.15)",borderRadius:99,height:8}}>
          <div style={{width:`${pct}%`,background:C.red,height:"100%",borderRadius:99}}/>
        </div>
        <p style={{margin:"6px 0 0",fontSize:12,opacity:.5}}>Down {loss} lbs - {Math.max(0,goals.currentWeight-goals.goalWeight)} lbs to go</p>
      </div>
      <Card>
        <h3 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>Today's Nutrition</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          <Stat label="Calories" value={nutrition.calories.consumed.toLocaleString()} sub={"/ "+nutrition.calories.goal.toLocaleString()+" kcal"} color={C.red}/>
          <Stat label="Protein" value={nutrition.protein.consumed+"g"} sub={"/ "+nutrition.protein.goal+"g"} color={C.blue}/>
        </div>
        <MBar label="Calories" consumed={nutrition.calories.consumed} goal={nutrition.calories.goal} color={C.red}/>
        <MBar label="Protein" consumed={nutrition.protein.consumed} goal={nutrition.protein.goal} color={C.blue}/>
        <MBar label="Carbs" consumed={nutrition.carbs.consumed} goal={nutrition.carbs.goal} color={C.yellow}/>
        <MBar label="Fat" consumed={nutrition.fat.consumed} goal={nutrition.fat.goal} color={C.green}/>
      </Card>
      <Card>
        <h3 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>Weekly Workouts</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          <Stat label="Completed" value={weekWorkouts.completed+"/"+weekWorkouts.total} color={C.green}/>
          <Stat label="Adherence" value={Math.round((weekWorkouts.completed/weekWorkouts.total)*100)+"%" } color={C.dark}/>
        </div>
        <PBar value={weekWorkouts.completed} max={weekWorkouts.total} color={C.green} height={10}/>
      </Card>
      <Card>
        <h3 style={{margin:"0 0 10px",fontSize:15,fontWeight:700}}>Today's Habits</h3>
        {habits.map(h=>(
          <div key={h.id} onClick={()=>dispatch({type:"TOGGLE_HABIT",userId:client.userId,habitId:h.id})} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer"}}>
            <span style={{fontSize:20}}>{h.icon}</span>
            <span style={{flex:1,fontSize:14,color:h.done?C.gray:C.dark,textDecoration:h.done?"line-through":"none"}}>{h.name}</span>
            <span style={{fontSize:18,color:h.done?C.green:C.border}}>{h.done?"✓":"○"}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function ClientWorkouts({client,dispatch}){
  const [view,setView]=useState("log");
  const [date,setDate]=useState(new Date().toISOString().split("T")[0]);
  const [name,setName]=useState("");
  const [exs,setExs]=useState([emptyEx()]);
  const prevWo=client.workouts[0]||null;
  const upEx=(i,ex)=>setExs(e=>e.map((v,idx)=>idx===i?ex:v));
  const save=()=>{
    if(!name||exs.every(e=>!e.name))return;
    const wo={id:"w"+Date.now(),userId:client.userId,date,name,exercises:exs.filter(e=>e.name).map(e=>({name:e.name,sets:e.sets.map(s=>({reps:parseInt(s.reps)||0,weight:parseFloat(s.weight)||0,type:s.type,difficulty:s.difficulty}))}))};
    dispatch({type:"ADD_WORKOUT",userId:client.userId,workout:wo});
    setName("");setExs([emptyEx()]);setView("history");
  };
  const getPR=ex=>{let pr=0;client.workouts.forEach(w=>w.exercises.filter(e=>e.name===ex).forEach(e=>(e.sets||[]).filter(s=>s.type!=="warm").forEach(s=>{if(s.weight>pr)pr=s.weight;})));return pr;};
  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {[["log","Log"],["history","History"],["prs","PRs"]].map(([v,l])=>(
          <button key={v} onClick={()=>setView(v)} style={{flex:1,padding:"11px",borderRadius:10,border:`1.5px solid ${view===v?C.red:C.border}`,background:view===v?C.red:C.white,color:view===v?C.white:C.gray,fontWeight:700,fontSize:14,cursor:"pointer"}}>{l}</button>
        ))}
      </div>
      {view==="log"&&(
        <div>
          <Card>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${C.border}`,fontSize:14,marginBottom:10,boxSizing:"border-box"}}/>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Workout name (e.g. Push Day)" style={{width:"100%",padding:"13px 14px",borderRadius:10,border:`1.5px solid ${C.border}`,fontSize:15,fontWeight:600,boxSizing:"border-box"}}/>
          </Card>
          {exs.map((ex,i)=><ExBlock key={i} ex={ex} exIdx={i} prevWo={prevWo} onChange={ex=>upEx(i,ex)} onRemove={()=>setExs(e=>e.filter((_,idx)=>idx!==i))}/>)}
          <button onClick={()=>setExs(e=>[...e,emptyEx()])} style={{width:"100%",padding:"13px",borderRadius:12,border:`1.5px dashed ${C.red}`,background:C.redLight,color:C.red,fontSize:15,fontWeight:700,cursor:"pointer",marginBottom:12}}>+ Add Exercise</button>
          <button onClick={save} style={{width:"100%",padding:"15px",background:C.red,color:C.white,border:"none",borderRadius:12,fontSize:16,fontWeight:800,cursor:"pointer"}}>Save Workout</button>
        </div>
      )}
      {view==="history"&&(client.workouts.length===0?<Card style={{textAlign:"center",padding:40}}><p style={{color:C.gray}}>No workouts logged yet.</p></Card>:client.workouts.map(wo=><WoCard key={wo.id} wo={wo}/>))}
      {view==="prs"&&(
        <Card>
          <h3 style={{margin:"0 0 4px",fontSize:15,fontWeight:700}}>Personal Records</h3>
          <p style={{margin:"0 0 12px",fontSize:12,color:C.gray}}>Working sets only.</p>
          {["Bench Press","Deadlift","Squat","Shoulder Press","Barbell Row"].map(ex=>{
            const pr=getPR(ex);
            return pr>0?(
              <div key={ex} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:14}}>{ex}</span>
                <span style={{fontSize:15,fontWeight:800,color:C.red}}>{pr} lbs</span>
              </div>
            ):null;
          })}
        </Card>
      )}
    </div>
  );
}

function ClientGoals({client,canEdit,dispatch}){
  const {goals}=client;
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState({...goals});
  const needed=goals.startWeight-goals.goalWeight;
  const pct=needed>0?Math.min(100,Math.round(((goals.startWeight-goals.currentWeight)/needed)*100)):0;
  const save=()=>{dispatch({type:"UPDATE_GOALS",userId:client.userId,goals:draft});setEditing(false);};
  const numInp=(k,sub)=>({
    type:"number",
    value:sub?draft[k][sub]:draft[k],
    onChange:e=>{const v=parseFloat(e.target.value)||0;setDraft(d=>sub?{...d,[k]:{...d[k],[sub]:v}}:{...d,[k]:v});}
  });
  return(
    <div>
      <Card style={{borderTop:`4px solid ${C.red}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <h3 style={{margin:0,fontSize:16,fontWeight:700}}>Weight Goal</h3>
          {canEdit&&<button onClick={()=>{setDraft({...goals});setEditing(o=>!o);}} style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${C.red}`,background:"transparent",color:C.red,fontSize:12,fontWeight:700,cursor:"pointer"}}>{editing?"Cancel":"Edit"}</button>}
        </div>
        {editing?(
          <div>
            {[["startWeight","Start Weight (lbs)"],["currentWeight","Current Weight (lbs)"],["goalWeight","Goal Weight (lbs)"]].map(([k,lbl])=>(
              <div key={k} style={{marginBottom:10}}>
                <label style={{fontSize:13,color:C.gray,display:"block",marginBottom:4}}>{lbl}</label>
                <input {...numInp(k,null)} style={{width:"100%",padding:"10px",borderRadius:10,border:`1px solid ${C.border}`,fontSize:14,boxSizing:"border-box"}}/>
              </div>
            ))}
            <button onClick={save} style={{width:"100%",padding:"12px",background:C.red,color:C.white,border:"none",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer"}}>Save Goals</button>
          </div>
        ):(
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
              <Stat label="Start" value={goals.startWeight} sub="lbs"/>
              <Stat label="Current" value={goals.currentWeight} sub="lbs" color={C.red}/>
              <Stat label="Goal" value={goals.goalWeight} sub="lbs" color={C.green}/>
            </div>
            <PBar value={pct} max={100} color={C.red} height={12}/>
            <p style={{margin:"6px 0 0",fontSize:13,color:C.gray}}>{goals.startWeight-goals.currentWeight} lbs lost - {Math.max(0,goals.currentWeight-goals.goalWeight)} lbs to go</p>
          </>
        )}
      </Card>
      {[{name:"Bench Press",key:"bench"},{name:"Squat",key:"squat"},{name:"Deadlift",key:"deadlift"}].map(sg=>{
        const g=goals[sg.key]||{current:0,goal:1};
        const p=Math.min(100,Math.round((g.current/g.goal)*100));
        return(
          <Card key={sg.key}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <h4 style={{margin:0,fontSize:15,fontWeight:700}}>{sg.name}</h4>
              <span style={{fontSize:13,fontWeight:700,color:C.red}}>{p}%</span>
            </div>
            {editing?(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                {[["current","Current Max (lbs)"],["goal","Goal (lbs)"]].map(([sub,lbl])=>(
                  <div key={sub}>
                    <label style={{fontSize:11,color:C.gray,display:"block",marginBottom:3}}>{lbl}</label>
                    <input {...numInp(sg.key,sub)} style={{width:"100%",padding:"9px",borderRadius:9,border:`1px solid ${C.border}`,fontSize:14,boxSizing:"border-box"}}/>
                  </div>
                ))}
              </div>
            ):(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                <Stat label="Current Max" value={g.current+" lbs"}/>
                <Stat label="Goal" value={g.goal+" lbs"} color={C.green}/>
              </div>
            )}
            <PBar value={g.current} max={g.goal} color={C.red}/>
          </Card>
        );
      })}
    </div>
  );
}

function ClientWeight({client,dispatch}){
  const [weight,setWeight]=useState("");
  const [date,setDate]=useState(new Date().toISOString().split("T")[0]);
  const log=[...client.weightLog].sort((a,b)=>a.date.localeCompare(b.date));
  const weekly=log.length?(log.slice(-7).reduce((s,l)=>s+l.weight,0)/Math.min(7,log.length)).toFixed(1):"-";
  const change=log.length>1?(log[log.length-1].weight-log[0].weight).toFixed(1):0;
  const add=()=>{
    if(!weight||isNaN(weight))return;
    dispatch({type:"LOG_WEIGHT",userId:client.userId,entry:{date,weight:parseFloat(weight)}});
    setWeight("");
  };
  return(
    <div>
      <Card>
        <h3 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>Log Weight</h3>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{width:"100%",padding:"10px",borderRadius:10,border:`1px solid ${C.border}`,fontSize:14,marginBottom:10,boxSizing:"border-box"}}/>
        <div style={{display:"flex",gap:8}}>
          <input type="number" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="Weight in lbs" step=".1" style={{flex:1,padding:"12px",borderRadius:10,border:`1px solid ${C.border}`,fontSize:16}}/>
          <button onClick={add} style={{padding:"12px 20px",background:C.red,color:C.white,border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer"}}>Log</button>
        </div>
      </Card>
      <Card>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          <Stat label="7-Day Avg" value={weekly} sub="lbs"/>
          <Stat label="Total Change" value={change>0?"+"+change:change} sub="lbs" color={change<0?C.green:C.red}/>
        </div>
      </Card>
      <Card>
        <h3 style={{margin:"0 0 8px",fontSize:14,fontWeight:700}}>Trend</h3>
        <MiniChart data={log} color={C.red} vKey="weight"/>
      </Card>
      <Card>
        <h3 style={{margin:"0 0 10px",fontSize:14,fontWeight:700}}>History</h3>
        {[...log].reverse().slice(0,12).map((l,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
            <span style={{fontSize:14,color:C.gray}}>{l.date}</span>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:14,fontWeight:700}}>{l.weight} lbs</span>
              <button
                onClick={()=>{if(window.confirm("Delete entry for "+l.date+"?"))dispatch({type:"DELETE_WEIGHT",userId:client.userId,date:l.date});}}
                style={{background:"none",border:"none",color:"#d1d5db",fontSize:16,cursor:"pointer",padding:"0 2px",lineHeight:1}}
                title="Delete entry"
              >x</button>
            </div>
          </div>
        ))}
        {log.length===0&&<p style={{color:C.gray,fontSize:13,textAlign:"center",padding:"12px 0"}}>No entries yet.</p>}
      </Card>
    </div>
  );
}

function ClientNutrition({client,dispatch}){
  const {nutrition}=client;
  const [form,setForm]=useState({calories:"",protein:"",carbs:"",fat:""});
  const macros=[{label:"Calories",key:"calories",color:C.red,unit:"kcal"},{label:"Protein",key:"protein",color:C.blue,unit:"g"},{label:"Carbs",key:"carbs",color:C.yellow,unit:"g"},{label:"Fat",key:"fat",color:C.green,unit:"g"}];
  const logMeal=()=>{dispatch({type:"LOG_NUTRITION",userId:client.userId,form});setForm({calories:"",protein:"",carbs:"",fat:""});};
  return(
    <div>
      <Card>
        <h3 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>Today's Progress</h3>
        {macros.map(m=>{const n=nutrition[m.key];const pct=Math.round((n.consumed/n.goal)*100);return(
          <div key={m.key} style={{marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:14,fontWeight:600}}>{m.label}</span>
              <span style={{fontSize:13,color:C.gray}}>{n.consumed}/{n.goal} {m.unit} <span style={{fontWeight:700,color:pct>=100?C.green:m.color}}>({pct}%)</span></span>
            </div>
            <PBar value={n.consumed} max={n.goal} color={m.color} height={10}/>
          </div>
        );})}
      </Card>
      <Card>
        <h3 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>Log a Meal</h3>
        {macros.map(m=>(
          <div key={m.key} style={{marginBottom:10}}>
            <label style={{fontSize:13,color:C.gray,display:"block",marginBottom:4}}>{m.label} ({m.unit})</label>
            <input type="number" value={form[m.key]} onChange={e=>setForm(f=>({...f,[m.key]:e.target.value}))} placeholder={"Enter "+m.label.toLowerCase()} style={{width:"100%",padding:"12px",borderRadius:10,border:`1px solid ${C.border}`,fontSize:14,boxSizing:"border-box"}}/>
          </div>
        ))}
        <button onClick={logMeal} style={{width:"100%",padding:"14px",background:C.red,color:C.white,border:"none",borderRadius:10,fontSize:16,fontWeight:700,cursor:"pointer",marginTop:4}}>Log Meal</button>
      </Card>
    </div>
  );
}

function ClientProfile({client,dispatch,onBack}){
  const [tab,setTab]=useState("overview");
  const getPR=ex=>{let pr=0;client.workouts.forEach(w=>w.exercises.filter(e=>e.name===ex).forEach(e=>(e.sets||[]).filter(s=>s.type!=="warm").forEach(s=>{if(s.weight>pr)pr=s.weight;})));return pr;};
  const totalVol=client.workouts.reduce((sum,wo)=>sum+wo.exercises.reduce((es,ex)=>es+(ex.sets||[]).filter(s=>s.type!=="warm").reduce((ss,s)=>ss+(s.weight*s.reps),0),0),0);
  const adh=Math.round((client.weekWorkouts.completed/client.weekWorkouts.total)*100);
  const saveNote=text=>dispatch({type:"UPDATE_NOTE",userId:client.userId,text});
  const tabs=[["overview","Overview"],["workouts","Workouts"],["progress","Progress"],["goals","Goals"],["note","Note"]];
  return(
    <div>
      <div style={{background:C.dark,borderRadius:16,padding:"16px",marginBottom:12,color:C.white}}>
        <button onClick={onBack} style={{background:"rgba(255,255,255,.1)",border:"none",color:C.white,borderRadius:8,padding:"5px 12px",fontSize:13,cursor:"pointer",marginBottom:12}}>Back to Clients</button>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:46,height:46,borderRadius:99,background:C.red,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:C.white}}>{client.name.split(" ").map(n=>n[0]).join("")}</div>
          <div>
            <h2 style={{margin:0,fontSize:19,fontWeight:800}}>{client.name}</h2>
            <p style={{margin:"2px 0 0",fontSize:12,color:"rgba(255,255,255,.5)"}}>{client.program} - {client.email}</p>
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
        {tabs.map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{flexShrink:0,padding:"9px 14px",borderRadius:10,border:`1.5px solid ${tab===t?C.red:C.border}`,background:tab===t?C.red:C.white,color:tab===t?C.white:C.gray,fontWeight:700,fontSize:13,cursor:"pointer"}}>{l}</button>
        ))}
      </div>
      {tab==="overview"&&(
        <div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            <Stat label="Workouts/Week" value={client.weekWorkouts.completed+"/"+client.weekWorkouts.total} color={adh>=80?C.green:C.yellow}/>
            <Stat label="Adherence" value={adh+"%"} color={adh>=80?C.green:C.yellow}/>
            <Stat label="Current Weight" value={client.goals.currentWeight+" lbs"}/>
            <Stat label="Goal Weight" value={client.goals.goalWeight+" lbs"} color={C.green}/>
          </div>
          <Card>
            <h3 style={{margin:"0 0 10px",fontSize:14,fontWeight:700}}>Nutrition</h3>
            <MBar label="Calories" consumed={client.nutrition.calories.consumed} goal={client.nutrition.calories.goal} color={C.red}/>
            <MBar label="Protein" consumed={client.nutrition.protein.consumed} goal={client.nutrition.protein.goal} color={C.blue}/>
          </Card>
          <Card>
            <h3 style={{margin:"0 0 10px",fontSize:14,fontWeight:700}}>Habits</h3>
            {client.habits.map(h=>(
              <div key={h.id} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
                <span>{h.icon}</span>
                <span style={{flex:1,fontSize:13,color:h.done?C.gray:C.dark,textDecoration:h.done?"line-through":"none"}}>{h.name}</span>
                <span style={{fontSize:14,color:h.done?C.green:C.border}}>{h.done?"✓":"○"}</span>
              </div>
            ))}
          </Card>
          <Card>
            <h3 style={{margin:"0 0 10px",fontSize:14,fontWeight:700}}>Recent Activity</h3>
            {client.workouts.length===0?<p style={{color:C.gray,fontSize:13}}>No workouts logged yet.</p>:client.workouts.slice(0,3).map(wo=>(
              <div key={wo.id} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
                <div><p style={{margin:0,fontSize:13,fontWeight:700}}>{wo.name}</p><p style={{margin:0,fontSize:11,color:C.gray}}>{wo.exercises.length} exercise{wo.exercises.length!==1?"s":""}</p></div>
                <span style={{fontSize:12,color:C.gray}}>{fmt(wo.date)}</span>
              </div>
            ))}
          </Card>
        </div>
      )}
      {tab==="workouts"&&(
        <div>
          <p style={{margin:"0 0 10px",fontSize:13,color:C.gray}}>{client.workouts.length} sessions logged</p>
          {client.workouts.length===0?<Card style={{textAlign:"center",padding:40}}><p style={{color:C.gray}}>No workouts yet.</p></Card>:client.workouts.map(wo=><WoCard key={wo.id} wo={wo}/>)}
        </div>
      )}
      {tab==="progress"&&(
        <div>
          <Card>
            <h3 style={{margin:"0 0 8px",fontSize:14,fontWeight:700}}>Body Weight Trend</h3>
            <MiniChart data={[...client.weightLog].sort((a,b)=>a.date.localeCompare(b.date))} color={C.red} vKey="weight"/>
          </Card>
          <Card>
            <h3 style={{margin:"0 0 10px",fontSize:14,fontWeight:700}}>Personal Records</h3>
            {client.workouts.length===0?<p style={{color:C.gray,fontSize:13}}>No workouts logged yet.</p>:["Bench Press","Squat","Deadlift","Shoulder Press"].map(ex=>{const pr=getPR(ex);return pr>0?(<div key={ex} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:13}}>{ex}</span><span style={{fontSize:14,fontWeight:800,color:C.red}}>{pr} lbs</span></div>):null;})}
          </Card>
          <Card>
            <h3 style={{margin:"0 0 10px",fontSize:14,fontWeight:700}}>Training Volume</h3>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <Stat label="Total Volume" value={Math.round(totalVol/1000)+"k"} sub="lbs lifted" color={C.blue}/>
              <Stat label="Sessions" value={client.workouts.length} sub="logged" color={C.dark}/>
            </div>
          </Card>
          <Card>
            <h3 style={{margin:"0 0 10px",fontSize:14,fontWeight:700}}>Strength Goals</h3>
            {[{name:"Bench Press",key:"bench"},{name:"Squat",key:"squat"},{name:"Deadlift",key:"deadlift"}].map(sg=>{
              const g=client.goals[sg.key]||{current:0,goal:1};const p=Math.min(100,Math.round((g.current/g.goal)*100));
              return(<div key={sg.key} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:13,fontWeight:600}}>{sg.name}</span>
                  <span style={{fontSize:12,color:C.gray}}>{g.current}/{g.goal} lbs - <span style={{fontWeight:700,color:C.red}}>{p}%</span></span>
                </div>
                <PBar value={g.current} max={g.goal} color={C.red}/>
              </div>);
            })}
          </Card>
        </div>
      )}
      {tab==="goals"&&<ClientGoals client={client} canEdit={true} dispatch={dispatch}/>}
      {tab==="note"&&<CoachNote note={client.coachNote} canEdit={true} onSave={saveNote}/>}
    </div>
  );
}

function CoachHome({db,dispatch}){
  const {user}=useAuth();
  const [search,setSearch]=useState("");
  const [selectedId,setSelectedId]=useState(null);
  const [coachTab,setCoachTab]=useState("clients");
  const clients=useMemo(()=>Object.values(db.clients),[db.clients]);
  const filtered=useMemo(()=>clients.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())),[clients,search]);
  if(selectedId){
    const client=db.clients[selectedId];
    if(client) return <ClientProfile client={client} dispatch={dispatch} onBack={()=>setSelectedId(null)}/>;
  }
  const avgAdh=Math.round(clients.reduce((s,c)=>s+(c.weekWorkouts.completed/c.weekWorkouts.total),0)/clients.length*100);
  const totalSessions=clients.reduce((s,c)=>s+c.workouts.length,0);
  return(
    <div>
      <div style={{background:C.dark,borderRadius:16,padding:"16px",marginBottom:14,color:C.white}}>
        <p style={{margin:"0 0 2px",fontSize:11,opacity:.5,fontWeight:600,textTransform:"uppercase"}}>Coach View</p>
        <h2 style={{margin:"0 0 14px",fontSize:20,fontWeight:800}}>{user.name}</h2>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {[[clients.length,"CLIENTS"],[avgAdh+"%","AVG ADHERENCE"],[totalSessions,"SESSIONS"]].map(([v,l],i)=>(
            <div key={i} style={{background:"rgba(255,255,255,.08)",borderRadius:10,padding:"10px",textAlign:"center"}}>
              <p style={{margin:0,fontSize:10,opacity:.5}}>{l}</p>
              <p style={{margin:"2px 0 0",fontSize:20,fontWeight:800,color:i===1?C.green:C.white}}>{v}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {[["clients","Clients"],["habits","Habits"]].map(([t,l])=>(
          <button key={t} onClick={()=>setCoachTab(t)} style={{flex:1,padding:"10px",borderRadius:10,border:`1.5px solid ${coachTab===t?C.red:C.border}`,background:coachTab===t?C.red:C.white,color:coachTab===t?C.white:C.gray,fontWeight:700,fontSize:13,cursor:"pointer"}}>{l}</button>
        ))}
      </div>
      {coachTab==="clients"&&(
        <div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search clients..." style={{width:"100%",padding:"12px 14px",borderRadius:12,border:`1.5px solid ${C.border}`,fontSize:14,marginBottom:12,boxSizing:"border-box"}}/>
          {filtered.map(c=>{
            const adh=Math.round((c.weekWorkouts.completed/c.weekWorkouts.total)*100);
            return(
              <Card key={c.userId} onClick={()=>setSelectedId(c.userId)} style={{cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:44,height:44,borderRadius:99,background:C.red,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:C.white,flexShrink:0}}>{c.name.split(" ").map(n=>n[0]).join("")}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <p style={{margin:0,fontSize:15,fontWeight:700}}>{c.name}</p>
                      <span style={{fontSize:12,fontWeight:700,color:adh>=80?C.green:adh>=60?C.yellow:C.red}}>{adh}%</span>
                    </div>
                    <p style={{margin:"2px 0 4px",fontSize:12,color:C.gray}}>{c.program}</p>
                    <PBar value={c.weekWorkouts.completed} max={c.weekWorkouts.total} color={adh>=80?C.green:C.yellow} height={5}/>
                  </div>
                  <span style={{fontSize:18,color:C.border}}>{">"}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {coachTab==="habits"&&clients.map(c=>(
        <Card key={c.userId}>
          <h4 style={{margin:"0 0 10px",fontSize:14,fontWeight:700}}>{c.name}</h4>
          {c.habits.map(h=>(
            <div key={h.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
              <span>{h.icon}</span>
              <span style={{flex:1,fontSize:13}}>{h.name}</span>
              <span style={{fontSize:12,color:h.done?C.green:C.gray,fontWeight:600}}>{h.done?"Done":"Pending"}</span>
              <button onClick={()=>dispatch({type:"REMOVE_HABIT",userId:c.userId,habitId:h.id})} style={{background:"none",border:"none",color:"#d1d5db",fontSize:16,cursor:"pointer"}}>x</button>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}

function dbReducer(db,action){
  const upClient=(uid,fn)=>({...db,clients:{...db.clients,[uid]:fn(db.clients[uid])}});
  switch(action.type){
    case"ADD_WORKOUT":return upClient(action.userId,c=>({...c,workouts:[action.workout,...c.workouts],weekWorkouts:{...c.weekWorkouts,completed:c.weekWorkouts.completed+1}}));
    case"LOG_WEIGHT":return upClient(action.userId,c=>({...c,weightLog:[...c.weightLog.filter(l=>l.date!==action.entry.date),action.entry].sort((a,b)=>a.date.localeCompare(b.date)),goals:{...c.goals,currentWeight:action.entry.weight}}));
    case"DELETE_WEIGHT":return upClient(action.userId,c=>{const updated=c.weightLog.filter(l=>l.date!==action.date);const latest=updated.length?updated[updated.length-1].weight:c.goals.startWeight;return{...c,weightLog:updated,goals:{...c.goals,currentWeight:latest}};});
    case"LOG_NUTRITION":return upClient(action.userId,c=>({...c,nutrition:Object.fromEntries(Object.entries(c.nutrition).map(([k,v])=>([k,{...v,consumed:v.consumed+(parseInt(action.form[k])||0)}])))}));
    case"TOGGLE_HABIT":return upClient(action.userId,c=>({...c,habits:c.habits.map(h=>h.id===action.habitId?{...h,done:!h.done}:h)}));
    case"REMOVE_HABIT":return upClient(action.userId,c=>({...c,habits:c.habits.filter(h=>h.id!==action.habitId)}));
    case"UPDATE_NOTE":return upClient(action.userId,c=>({...c,coachNote:{text:action.text,updatedAt:NOW()}}));
    case"UPDATE_GOALS":return upClient(action.userId,c=>({...c,goals:action.goals}));
    default:return db;
  }
}

const CLIENT_NAV=[{id:"dashboard",icon:"🏠",label:"Home"},{id:"weight",icon:"⚖️",label:"Weight"},{id:"workout",icon:"🏋️",label:"Workout"},{id:"nutrition",icon:"🥗",label:"Nutrition"},{id:"more",icon:"...",label:"More"}];
const MORE_ITEMS=[{id:"goals",icon:"🎯",label:"Goals"},{id:"habits",icon:"✅",label:"Habits"}];
const PAGE_TITLES={dashboard:"Dashboard",weight:"Weight Tracker",workout:"Workouts",nutrition:"Nutrition",goals:"Goals",habits:"Daily Habits"};

function ClientShell({db,dispatch}){
  const {user,logout}=useAuth();
  const [page,setPage]=useState("dashboard");
  const [showMore,setShowMore]=useState(false);
  const client=db.clients[user.id];
  if(!client) return <div style={{padding:24,textAlign:"center"}}><p style={{color:C.red,fontWeight:700}}>Access denied.</p></div>;
  return(
    <div style={{maxWidth:430,margin:"0 auto",background:"#f8f8f8",minHeight:"100vh",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{position:"sticky",top:0,zIndex:100,background:C.white,borderBottom:`1px solid ${C.border}`,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>🔥</span>
          <div>
            <p style={{margin:0,fontSize:9,fontWeight:700,color:C.gray,textTransform:"uppercase",letterSpacing:1}}>The Fidelis Formula</p>
            <p style={{margin:0,fontSize:15,fontWeight:800,color:C.dark}}>{PAGE_TITLES[page]||"Dashboard"}</p>
          </div>
        </div>
        <button onClick={logout} style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",fontSize:12,color:C.gray,cursor:"pointer"}}>Sign Out</button>
      </div>
      <div style={{padding:"14px 14px 100px"}}>
        {page==="dashboard"&&<ClientDashboard client={client} dispatch={dispatch}/>}
        {page==="weight"&&<ClientWeight client={client} dispatch={dispatch}/>}
        {page==="workout"&&<ClientWorkouts client={client} dispatch={dispatch}/>}
        {page==="nutrition"&&<ClientNutrition client={client} dispatch={dispatch}/>}
        {page==="goals"&&<ClientGoals client={client} canEdit={false} dispatch={dispatch}/>}
        {page==="habits"&&(
          <div>
            <Card style={{background:C.dark}}>
              <p style={{margin:"0 0 4px",fontSize:13,color:"rgba(255,255,255,.5)",fontWeight:600}}>Today's Compliance</p>
              {(()=>{const done=client.habits.filter(h=>h.done).length;const pct=Math.round((done/client.habits.length)*100);return(
                <>
                  <p style={{margin:"0 0 10px",fontSize:44,fontWeight:800,color:pct>=80?C.green:pct>=60?C.yellow:C.red}}>{pct}%</p>
                  <div style={{background:"rgba(255,255,255,.15)",borderRadius:99,height:10}}><div style={{width:`${pct}%`,background:pct>=80?C.green:C.yellow,height:"100%",borderRadius:99}}/></div>
                  <p style={{margin:"6px 0 0",fontSize:13,color:"rgba(255,255,255,.4)"}}>{done}/{client.habits.length} completed</p>
                </>
              );})()}
            </Card>
            <Card>
              {client.habits.map(h=>(
                <div key={h.id} onClick={()=>dispatch({type:"TOGGLE_HABIT",userId:client.userId,habitId:h.id})} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer"}}>
                  <div style={{width:28,height:28,borderRadius:99,background:h.done?C.green:C.lightGray,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{h.done&&<span style={{color:C.white,fontSize:14}}>✓</span>}</div>
                  <span style={{fontSize:20}}>{h.icon}</span>
                  <span style={{fontSize:15,flex:1,color:h.done?C.gray:C.dark,textDecoration:h.done?"line-through":"none"}}>{h.name}</span>
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>
      {showMore&&(
        <div onClick={()=>setShowMore(false)} style={{position:"fixed",inset:0,zIndex:200}}>
          <div onClick={e=>e.stopPropagation()} style={{position:"absolute",bottom:70,left:"50%",transform:"translateX(-50%)",width:"calc(100% - 32px)",maxWidth:398,background:C.white,borderRadius:20,border:`1px solid ${C.border}`,padding:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {MORE_ITEMS.map(m=>(
                <button key={m.id} onClick={()=>{setPage(m.id);setShowMore(false);}} style={{display:"flex",alignItems:"center",gap:10,padding:"14px",borderRadius:12,border:`1px solid ${page===m.id?C.red:C.border}`,background:page===m.id?C.redLight:C.white,cursor:"pointer"}}>
                  <span style={{fontSize:22}}>{m.icon}</span>
                  <span style={{fontSize:14,fontWeight:600,color:page===m.id?C.red:C.dark}}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:C.white,borderTop:`1px solid ${C.border}`,display:"flex",zIndex:150}}>
        {CLIENT_NAV.map(n=>{
          const isMore=n.id==="more";const active=isMore?showMore:page===n.id;
          return(
            <button key={n.id} onClick={()=>{if(isMore)setShowMore(v=>!v);else{setPage(n.id);setShowMore(false);}}} style={{flex:1,padding:"10px 4px 8px",background:"transparent",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <span style={{fontSize:20}}>{n.icon}</span>
              <span style={{fontSize:10,fontWeight:active?700:500,color:active?C.red:C.gray}}>{n.label}</span>
              {active&&<div style={{width:4,height:4,borderRadius:99,background:C.red}}/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CoachShell({db,dispatch}){
  const {user,logout}=useAuth();
  return(
    <div style={{maxWidth:430,margin:"0 auto",background:"#f8f8f8",minHeight:"100vh",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{position:"sticky",top:0,zIndex:100,background:C.white,borderBottom:`1px solid ${C.border}`,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>🔥</span>
          <div>
            <p style={{margin:0,fontSize:9,fontWeight:700,color:C.gray,textTransform:"uppercase",letterSpacing:1}}>The Fidelis Formula</p>
            <p style={{margin:0,fontSize:15,fontWeight:800,color:C.dark}}>Coach Dashboard</p>
          </div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <span style={{fontSize:11,color:C.white,background:C.red,padding:"3px 8px",borderRadius:6,fontWeight:700}}>COACH</span>
          <button onClick={logout} style={{padding:"5px 10px",borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",fontSize:12,color:C.gray,cursor:"pointer"}}>Sign Out</button>
        </div>
      </div>
      <div style={{padding:"14px 14px 24px"}}>
        <CoachHome db={db} dispatch={dispatch}/>
      </div>
    </div>
  );
}

function Login({onLogin}){
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const attempt=()=>{
    setError("");
    if(!username.trim()||!password){setError("Please enter your username and password.");return;}
    setLoading(true);
    setTimeout(()=>{
      const key=username.trim().toLowerCase();
      const user=USERS.find(u=>u.username===key);
      const valid=user&&CREDENTIALS[key]===password;
      if(!valid){setError("Incorrect username or password. Please try again.");setLoading(false);return;}
      onLogin(user);
    },600);
  };
  return(
    <div style={{minHeight:"100vh",background:C.dark,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{marginBottom:32,textAlign:"center"}}>
        <div style={{width:64,height:64,background:C.red,borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto 16px"}}>🔥</div>
        <h1 style={{color:C.white,margin:0,fontSize:28,fontWeight:800}}>The Fidelis Formula</h1>
        <p style={{color:"rgba(255,255,255,.5)",margin:"6px 0 0"}}>Stay Fidelis.</p>
      </div>
      <div style={{background:C.white,borderRadius:20,padding:"28px 24px",width:"100%",maxWidth:340,boxSizing:"border-box"}}>
        <h2 style={{margin:"0 0 4px",fontSize:20,fontWeight:700}}>Sign In</h2>
        <p style={{margin:"0 0 20px",fontSize:13,color:C.gray}}>Welcome back. Sign in to your account.</p>
        <label style={{fontSize:13,fontWeight:600,color:C.dark,display:"block",marginBottom:5}}>Username</label>
        <input value={username} onChange={e=>{setUsername(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&attempt()} placeholder="Enter your username" autoComplete="username" style={{display:"block",width:"100%",padding:"13px 14px",borderRadius:10,border:`1.5px solid ${error?C.red:C.border}`,fontSize:15,marginBottom:14,boxSizing:"border-box"}}/>
        <label style={{fontSize:13,fontWeight:600,color:C.dark,display:"block",marginBottom:5}}>Password</label>
        <input type="password" value={password} onChange={e=>{setPassword(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&attempt()} placeholder="Enter your password" autoComplete="current-password" style={{display:"block",width:"100%",padding:"13px 14px",borderRadius:10,border:`1.5px solid ${error?C.red:C.border}`,fontSize:15,marginBottom:error?8:20,boxSizing:"border-box"}}/>
        {error&&<p style={{margin:"0 0 14px",fontSize:13,color:C.red,fontWeight:500}}>{error}</p>}
        <button onClick={attempt} disabled={loading} style={{width:"100%",padding:"14px",background:loading?"#f87171":C.red,color:C.white,border:"none",borderRadius:12,fontSize:16,fontWeight:700,cursor:loading?"not-allowed":"pointer",marginBottom:16}}>
          {loading?"Signing in...":"Sign In"}
        </button>
        <p style={{textAlign:"center",fontSize:13,color:C.gray,margin:0}}>Forgot your password? <span style={{color:C.red,cursor:"pointer",fontWeight:600}}>Reset it here</span></p>
      </div>
    </div>
  );
}

export default function App(){
  const [user,setUser]=useState(null);
  const [db,setDb]=useState(initDB);
  const dispatch=useCallback(action=>setDb(prev=>dbReducer(prev,action)),[]);
  const logout=useCallback(()=>setUser(null),[]);
  const authValue=useMemo(()=>({user,logout}),[user,logout]);
  if(!user) return <Login onLogin={u=>setUser(u)}/>;
  const role=getRole(user.username);
  return(
    <AuthContext.Provider value={authValue}>
      {role===ROLES.COACH?<CoachShell db={db} dispatch={dispatch}/>:<ClientShell db={db} dispatch={dispatch}/>}
    </AuthContext.Provider>
  );
}
