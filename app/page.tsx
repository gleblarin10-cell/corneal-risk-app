"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Eye, UserRound, Microscope, ShieldAlert, Activity, FileText, Search, Download, Plus,
  Trash2, LogIn, LayoutDashboard, BarChart3, Database, ClipboardList, Stethoscope,
  ArrowUpRight, HeartPulse, X,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";

type Patient = {
  id: string; fullName: string; age: number | string; sex: string; graftType: string;
  neovascularization: string; priorInflammation: string; rejectionHistory: string;
  hlaMismatch: string; dsa: string; il6: number | string; tnf: number | string;
  vegf: number | string; tgfb: number | string; notes: string; lastVisit: string;
};

const STORAGE_KEY = "corneal_graft_app_v2";
const historyData = [
  { date: "Нед 1", IL6: 8, TNFa: 5, VEGF: 46, TGFB: 32 },
  { date: "Нед 2", IL6: 11, TNFa: 7, VEGF: 55, TGFB: 34 },
  { date: "Нед 3", IL6: 13, TNFa: 8, VEGF: 60, TGFB: 38 },
  { date: "Нед 4", IL6: 9, TNFa: 6, VEGF: 49, TGFB: 33 },
];
const starterPatients: Patient[] = [
  { id:"PT-001", fullName:"Иванов И.И.", age:46, sex:"М", graftType:"high_risk", neovascularization:"severe", priorInflammation:"yes", rejectionHistory:"yes", hlaMismatch:"high", dsa:"positive", il6:17, tnf:9, vegf:95, tgfb:48, notes:"Повторная госпитализация, выраженная васкуляризация. Требуется усиленный контроль после кератопластики.", lastVisit:"2026-03-10" },
  { id:"PT-002", fullName:"Петрова А.А.", age:31, sex:"Ж", graftType:"primary", neovascularization:"none", priorInflammation:"no", rejectionHistory:"no", hlaMismatch:"low", dsa:"negative", il6:4, tnf:3, vegf:22, tgfb:18, notes:"Стабильное течение послеоперационного периода. Плановое наблюдение.", lastVisit:"2026-03-12" },
  { id:"PT-003", fullName:"Сидоров Д.В.", age:58, sex:"М", graftType:"repeat", neovascularization:"moderate", priorInflammation:"yes", rejectionHistory:"no", hlaMismatch:"moderate", dsa:"negative", il6:10, tnf:6, vegf:61, tgfb:35, notes:"Повторная трансплантация. Требуется промежуточная оценка иммунологических маркеров.", lastVisit:"2026-03-08" }
];
const emptyPatient: Patient = { id:"", fullName:"", age:"", sex:"М", graftType:"primary", neovascularization:"none", priorInflammation:"no", rejectionHistory:"no", hlaMismatch:"low", dsa:"negative", il6:"", tnf:"", vegf:"", tgfb:"", notes:"", lastVisit:new Date().toISOString().slice(0,10) };

function clamp(v:number, a:number, b:number){ return Math.min(Math.max(v,a),b); }
function labelize(code:string, map:Record<string,string>){ return map[code] || code; }
function calc(patient: Patient){
  let score = 0;
  if (patient.graftType === "repeat") score += 18;
  if (patient.graftType === "high_risk") score += 24;
  if (patient.neovascularization === "moderate") score += 14;
  if (patient.neovascularization === "severe") score += 24;
  if (patient.priorInflammation === "yes") score += 12;
  if (patient.rejectionHistory === "yes") score += 18;
  if (patient.hlaMismatch === "moderate") score += 8;
  if (patient.hlaMismatch === "high") score += 14;
  if (patient.dsa === "positive") score += 12;
  score += clamp((Number(patient.il6)||0)/2,0,12);
  score += clamp((Number(patient.tnf)||0)/2,0,10);
  score += clamp((Number(patient.vegf)||0)/10,0,12);
  score += clamp((Number(patient.tgfb)||0)/12,0,10);
  const risk = clamp(Math.round(score),0,100);
  const level = risk < 35 ? "Низкий" : risk < 65 ? "Умеренный" : "Высокий";
  const status = risk < 35 ? "Стабильное наблюдение" : risk < 65 ? "Усиленный мониторинг" : "Критический приоритет";
  const recommendation = risk < 35 ? "Стандартный протокол наблюдения, контроль по графику." : risk < 65 ? "Рекомендуется более частый контроль и оценка динамики биомаркеров." : "Требуются частое наблюдение и пересмотр иммуносупрессивной тактики.";
  return { risk, level, status, recommendation };
}
function exportReport(p?:Patient){
  if(!p) return;
  const r = calc(p);
  const text = `Отчёт по пациенту\n\nID: ${p.id}\nФИО: ${p.fullName}\nВозраст: ${p.age}\nПол: ${p.sex}\nДата визита: ${p.lastVisit}\n\nIL-6: ${p.il6}\nTNF-α: ${p.tnf}\nVEGF: ${p.vegf}\nTGF-β: ${p.tgfb}\n\nРиск: ${r.risk}%\nУровень: ${r.level}\nСтатус: ${r.status}\nРекомендация: ${r.recommendation}`;
  const blob = new Blob([text], {type:"text/plain;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${p.id}_report.txt`; a.click();
  URL.revokeObjectURL(url);
}
function RiskBadge({ risk }:{risk:number}){ return <span className={`badge ${risk>=65?"high":risk>=35?"mid":"low"}`}>{risk}%</span>; }
function Stat({title,value,caption,icon:Icon}:any){ return <div className="stat"><div className="statTop"><div><div className="muted small">{title}</div><div className="big">{value}</div><div className="muted small">{caption}</div></div><div className="iconBox"><Icon size={20}/></div></div></div>; }

function Login({onLogin}:{onLogin:(u:{email:string})=>void}){
  const [email,setEmail] = useState("doctor@clinic.local");
  const [password,setPassword] = useState("demo123");
  return (
    <div style={{minHeight:"100vh",padding:24}}>
      <div className="wrap" style={{maxWidth:1200,minHeight:"calc(100vh - 48px)",alignItems:"center"}}>
        <div className="grid g2">
          <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}}>
            <div className="card">
              <div className="brand" style={{marginBottom:16}}>
                <div className="brandbox"><Eye size={24}/></div>
                <div><div className="card-title">Corneal Graft Risk Platform</div><div className="card-subtitle">Полноценный дипломный прототип веб-приложения</div></div>
              </div>
              <div className="grid">
                <div><label className="label">Email</label><input className="input" value={email} onChange={e=>setEmail(e.target.value)} /></div>
                <div><label className="label">Пароль</label><input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
              </div>
              <div style={{marginTop:20}}><button className="btn" style={{width:"100%"}} onClick={()=>onLogin({email})}><LogIn size={16}/>Войти в систему</button></div>
              <p className="muted small" style={{marginTop:16}}>Демо-вход для защиты проекта: данные сохраняются локально в браузере.</p>
            </div>
          </motion.div>
          <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:0.05}}>
            <div className="hero">
              <div className="card-title" style={{color:"white"}}>Назначение системы</div>
              <div className="card-subtitle" style={{color:"#cbd5e1"}}>Клинико-иммунологическая поддержка принятия решений</div>
              <div className="grid" style={{marginTop:18}}>
                {[
                  ["1. Ведение базы пациентов","Карточки пациентов, история визитов, клинические заметки."],
                  ["2. Ввод иммунологических маркеров","IL-6, TNF-α, VEGF, TGF-β, DSA и HLA-параметры."],
                  ["3. Оценка риска","Демонстрационная модель расчёта риска отторжения трансплантата."],
                  ["4. Аналитика и отчётность","Дашборд, графики, экспорт результатов, наглядность для защиты."]
                ].map(([t,s])=><div key={t} className="softbox" style={{background:"rgba(255,255,255,.1)",color:"white"}}><div style={{fontWeight:700}}>{t}</div><div className="small" style={{color:"#e2e8f0",marginTop:6}}>{s}</div></div>)}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function Page(){
  const [user,setUser] = useState<{email:string}|null>(null);
  const [page,setPage] = useState("dashboard");
  const [patients,setPatients] = useState<Patient[]>(starterPatients);
  const [selectedId,setSelectedId] = useState(starterPatients[0].id);
  const [query,setQuery] = useState("");
  const [tab,setTab] = useState("summary");
  const [modal,setModal] = useState(false);
  const [form,setForm] = useState<Patient>(emptyPatient);

  useEffect(()=>{ const raw = localStorage.getItem(STORAGE_KEY); if(raw){ try{ const p = JSON.parse(raw); if(p?.patients?.length){ setPatients(p.patients); setSelectedId(p.patients[0].id); } }catch{} } },[]);
  useEffect(()=>{ localStorage.setItem(STORAGE_KEY, JSON.stringify({patients})); },[patients]);

  const selected = useMemo(()=>patients.find(p=>p.id===selectedId) || patients[0], [patients,selectedId]);
  const result = useMemo(()=>selected ? calc(selected) : null, [selected]);
  const filtered = useMemo(()=>patients.filter(p=>[p.id,p.fullName,p.notes].some(v=>String(v).toLowerCase().includes(query.toLowerCase()))), [patients,query]);
  const stats = useMemo(()=>{
    const high = patients.filter(p=>calc(p).risk>=65).length;
    const moderate = patients.filter(p=>{const r=calc(p).risk; return r>=35 && r<65;}).length;
    const avg = patients.length ? Math.round(patients.reduce((a,p)=>a+calc(p).risk,0)/patients.length) : 0;
    return {total:patients.length,high,moderate,avg};
  },[patients]);
  const riskData = useMemo(()=>[
    {name:"Низкий", value:patients.filter(p=>calc(p).risk<35).length},
    {name:"Умеренный", value:patients.filter(p=>{const r=calc(p).risk; return r>=35&&r<65;}).length},
    {name:"Высокий", value:patients.filter(p=>calc(p).risk>=65).length},
  ],[patients]);
  const biomarkerData = useMemo(()=>{
    const avg = (k:keyof Patient)=>Math.round((patients.reduce((a,p)=>a+Number(p[k]||0),0)/patients.length)*10)/10;
    return [{marker:"IL-6",value:avg("il6")},{marker:"TNF-α",value:avg("tnf")},{marker:"VEGF",value:avg("vegf")},{marker:"TGF-β",value:avg("tgfb")}];
  },[patients]);

  const openNew = ()=>{ setForm({...emptyPatient,id:`PT-${String(patients.length+1).padStart(3,"0")}`, lastVisit:new Date().toISOString().slice(0,10)}); setModal(true); };
  const save = ()=>{
    if(!form.id || !form.fullName) return;
    const normalized:Patient = {...form, age:Number(form.age)||0, il6:Number(form.il6)||0, tnf:Number(form.tnf)||0, vegf:Number(form.vegf)||0, tgfb:Number(form.tgfb)||0 };
    const exists = patients.some(p=>p.id===form.id);
    setPatients(prev=> exists ? prev.map(p=>p.id===form.id?normalized:p) : [normalized,...prev]);
    setSelectedId(form.id); setModal(false);
  };
  const edit = (p:Patient)=>{ setForm(p); setModal(true); };
  const remove = (id:string)=>{ const next = patients.filter(p=>p.id!==id); setPatients(next); setSelectedId(next[0]?.id || ""); };

  if(!user) return <Login onLogin={setUser} />;

  return (
    <div className="page">
      <aside className="side">
        <div className="brand">
          <div className="brandbox"><Eye size={24}/></div>
          <div><div style={{fontWeight:700}}>Corneal Risk</div><div className="muted small">Clinical Decision Support</div></div>
        </div>
        <div className="nav">
          {[["dashboard","Дашборд",LayoutDashboard],["patients","Пациенты",UserRound],["analytics","Аналитика",BarChart3],["model","Модель риска",Microscope],["about","О проекте",FileText]].map(([k,l,Icon])=>
            <button key={String(k)} className={`navbtn ${page===k?"active":""}`} onClick={()=>setPage(String(k))}><Icon size={16}/>{l}</button>
          )}
        </div>
        <div className="user">
          <div style={{fontWeight:700,color:"#0f172a"}}>Пользователь</div>
          <div style={{marginTop:6}}>{user.email}</div>
          <div className="tiny" style={{marginTop:12}}>Демо-система для дипломного проекта. Данные хранятся локально.</div>
        </div>
      </aside>

      <main className="main">
        <div className="wrap">
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="hero">
            <div className="heroGrid">
              <div>
                <div className="chip"><HeartPulse size={14}/>Медицинское веб-приложение</div>
                <h1 className="title">Прогнозирование риска отторжения трансплантата роговицы</h1>
                <div className="sub">Полноценный прототип для дипломной работы: база пациентов, клинико-иммунологические показатели, аналитика, экспорт отчёта и демонстрационная модель оценки риска.</div>
                <div className="heroActions">
                  <button className="btn outline" onClick={openNew}><Plus size={16}/>Новый пациент</button>
                  <button className="btn soft" onClick={()=>exportReport(selected)}><Download size={16}/>Экспорт отчёта</button>
                </div>
              </div>
              <div className="grid">
                <div className="heroStat"><div className="heroStatLabel">Пациентов в базе</div><div className="heroStatValue">{stats.total}</div><div className="tiny" style={{color:"#cbd5e1"}}>Демо-данные для защиты проекта</div></div>
                <div className="heroStat"><div className="heroStatLabel">Высокий риск</div><div className="heroStatValue">{stats.high}</div><div className="tiny" style={{color:"#cbd5e1"}}>Пациенты с риском ≥ 65%</div></div>
                <div className="heroStat"><div className="heroStatLabel">Средний риск</div><div className="heroStatValue">{stats.avg}%</div><div className="tiny" style={{color:"#cbd5e1"}}>Среднее значение по выборке</div></div>
              </div>
            </div>
          </motion.div>

          {page==="dashboard" && result && selected && <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="grid">
            <div className="grid g4">
              <Stat title="Всего пациентов" value={stats.total} caption="Записи в локальной базе" icon={Database}/>
              <Stat title="Высокий риск" value={stats.high} caption="Пациенты с риском ≥ 65%" icon={ShieldAlert}/>
              <Stat title="Умеренный риск" value={stats.moderate} caption="Требуют усиленного наблюдения" icon={Stethoscope}/>
              <Stat title="Средний риск" value={`${stats.avg}%`} caption="По всей выборке" icon={Activity}/>
            </div>
            <div className="grid g3">
              <div className="card" style={{gridColumn:"span 2"}}>
                <h2>Сводка по пациенту</h2><div className="muted small">Текущая активная карточка и её интерпретация</div>
                <div className="grid g2" style={{marginTop:18}}>
                  <div className="grid">
                    <div className="softbox"><div style={{display:"flex",justifyContent:"space-between",gap:12}}><div><div className="muted small">Пациент</div><div style={{fontSize:24,fontWeight:700,marginTop:6}}>{selected.fullName}</div><div className="muted small">{selected.id} · {selected.age} лет · визит {selected.lastVisit}</div></div><div className="brandbox"><UserRound size={20}/></div></div></div>
                    <div className="grid g2">
                      <div className="whitebox"><div className="muted small">Тип трансплантации</div><div style={{marginTop:6,fontWeight:700}}>{labelize(selected.graftType,{primary:"Первичная",repeat:"Повторная",high_risk:"Высокорисковая"})}</div></div>
                      <div className="whitebox"><div className="muted small">Неоваскуляризация</div><div style={{marginTop:6,fontWeight:700}}>{labelize(selected.neovascularization,{none:"Нет",moderate:"Умеренная",severe:"Выраженная"})}</div></div>
                      <div className="whitebox"><div className="muted small">IL-6</div><div style={{marginTop:6,fontWeight:700}}>{selected.il6}</div></div>
                      <div className="whitebox"><div className="muted small">VEGF</div><div style={{marginTop:6,fontWeight:700}}>{selected.vegf}</div></div>
                    </div>
                  </div>
                  <div className="grid">
                    <div className="softbox"><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}} className="small"><span>Оценка риска</span><strong>{result.risk}%</strong></div><div className="progress"><div className="bar" style={{width:`${result.risk}%`}}/></div></div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><span className="badge dark">{result.level} риск</span><span className="badge outlineBadge">{result.status}</span></div>
                    <div className="muted small">{result.recommendation}</div>
                  </div>
                </div>
              </div>
              <div className="card">
                <h2>Подсказка для защиты</h2><div className="muted small">Как быстро показать руководителю работу приложения</div>
                <div className="grid" style={{marginTop:18}}>
                  {[
                    "Откройте PT-002 и покажите низкий риск.",
                    "Переключитесь на PT-001 и покажите высокий риск.",
                    "Скажите, что сейчас используется демонстрационный скоринг, а потом будет ML-модель."
                  ].map((t,i)=><div key={i} className="softbox"><div style={{display:"flex",gap:12}}><div className="brandbox" style={{width:36,height:36}}><ArrowUpRight size={16}/></div><div className="small">{t}</div></div></div>)}
                </div>
              </div>
            </div>
          </motion.div>}

          {page==="patients" && selected && result && <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="grid g3">
            <div className="card">
              <h2>Пациенты</h2><div className="muted small">Поиск и выбор карточки пациента</div>
              <div className="searchWrap"><Search className="searchIcon" size={16}/><input className="input searchInput" placeholder="Поиск по ID, ФИО, заметкам" value={query} onChange={e=>setQuery(e.target.value)} /></div>
              <div className="list" style={{marginTop:18}}>
                {filtered.map(p=>{ const r=calc(p); return <button key={p.id} className={`patient ${selectedId===p.id?"active":""}`} onClick={()=>setSelectedId(p.id)}><div style={{display:"flex",justifyContent:"space-between",gap:10}}><div><div style={{fontWeight:700}}>{p.fullName}</div><div className="muted small">{p.id} · визит {p.lastVisit}</div></div><RiskBadge risk={r.risk}/></div><div className="muted small" style={{marginTop:8}}>{p.notes}</div></button>})}
              </div>
            </div>

            <div className="card" style={{gridColumn:"span 2"}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
                <div><h2>Карточка пациента</h2><div className="muted small">Подробные клинические и лабораторные сведения</div></div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button className="btn outline" onClick={()=>{setForm(selected); setModal(true);}}>Редактировать</button><button className="btn" style={{background:"#dc2626"}} onClick={()=>remove(selected.id)}><Trash2 size={16}/>Удалить</button></div>
              </div>
              <div className="tabs" style={{marginTop:18}}>
                {[["summary","Сводка"],["markers","Маркеры"],["recommendations","Рекомендации"]].map(([k,l])=><button key={k} className={`tab ${tab===k?"active":""}`} onClick={()=>setTab(k)}>{l}</button>)}
              </div>
              {tab==="summary" && <div className="grid g3" style={{marginTop:18}}>
                {[
                  ["ФИО", selected.fullName],["ID", selected.id],["Возраст", `${selected.age} лет`],["Пол", selected.sex],
                  ["Тип трансплантации", labelize(selected.graftType,{primary:"Первичная",repeat:"Повторная",high_risk:"Высокорисковая"})],
                  ["Неоваскуляризация", labelize(selected.neovascularization,{none:"Нет",moderate:"Умеренная",severe:"Выраженная"})],
                  ["Предшествующее воспаление", selected.priorInflammation==="yes"?"Да":"Нет"],
                  ["Отторжение в анамнезе", selected.rejectionHistory==="yes"?"Да":"Нет"],
                  ["Дата визита", selected.lastVisit]
                ].map(([l,v])=><div key={String(l)} className="softbox"><div className="muted small">{l}</div><div style={{marginTop:6,fontWeight:700}}>{v}</div></div>)}
                <div className="whitebox" style={{gridColumn:"1 / -1"}}><div className="muted small">Заметки врача</div><div className="small" style={{marginTop:8}}>{selected.notes || "—"}</div></div>
              </div>}
              {tab==="markers" && <div className="grid g2" style={{marginTop:18}}>
                {[["HLA-несовместимость", labelize(selected.hlaMismatch,{low:"Низкая",moderate:"Умеренная",high:"Высокая"})],["DSA", selected.dsa==="positive"?"Положительные":"Отрицательные"],["IL-6", selected.il6],["TNF-α", selected.tnf],["VEGF", selected.vegf],["TGF-β", selected.tgfb]].map(([l,v])=><div key={String(l)} className="softbox"><div className="muted small">{l}</div><div style={{fontSize:22,fontWeight:700,marginTop:6}}>{v}</div></div>)}
              </div>}
              {tab==="recommendations" && <div className="grid" style={{marginTop:18}}>
                <div className="softbox"><div className="muted small">Риск</div><div style={{fontSize:30,fontWeight:700,marginTop:6}}>{result.risk}%</div><div className="muted small" style={{marginTop:6}}>{result.level} риск · {result.status}</div></div>
                <div className="whitebox"><div className="muted small">Рекомендация</div><div className="small" style={{marginTop:8}}>{result.recommendation}</div></div>
              </div>}
            </div>
          </motion.div>}

          {page==="analytics" && <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="grid">
            <div className="grid g2">
              <div className="card"><h2>Распределение по уровням риска</h2><div className="muted small">Сколько пациентов находится в каждой группе</div><div style={{height:320,marginTop:10}}><ResponsiveContainer width="100%" height="100%"><BarChart data={riskData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="value" radius={[10,10,0,0]}/></BarChart></ResponsiveContainer></div></div>
              <div className="card"><h2>Средние значения биомаркеров</h2><div className="muted small">По всей текущей выборке пациентов</div><div style={{height:320,marginTop:10}}><ResponsiveContainer width="100%" height="100%"><BarChart data={biomarkerData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="marker"/><YAxis/><Tooltip/><Bar dataKey="value" radius={[10,10,0,0]}/></BarChart></ResponsiveContainer></div></div>
            </div>
            <div className="card"><h2>Динамика биомаркеров</h2><div className="muted small">Пример временного ряда для презентации проекта</div><div style={{height:360,marginTop:10}}><ResponsiveContainer width="100%" height="100%"><LineChart data={historyData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date"/><YAxis/><Tooltip/><Legend/><Line type="monotone" dataKey="IL6" name="IL-6" strokeWidth={2}/><Line type="monotone" dataKey="TNFa" name="TNF-α" strokeWidth={2}/><Line type="monotone" dataKey="VEGF" name="VEGF" strokeWidth={2}/><Line type="monotone" dataKey="TGFB" name="TGF-β" strokeWidth={2}/></LineChart></ResponsiveContainer></div></div>
          </motion.div>}

          {page==="model" && <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="grid g3">
            <div className="card" style={{gridColumn:"span 2"}}>
              <h2>Логика модели риска</h2><div className="muted small">Как веб-приложение может работать в реальной системе</div>
              <div className="grid" style={{marginTop:18}}>
                {[
                  ["Входные признаки","Тип кератопластики, неоваскуляризация, воспаление, эпизоды отторжения, HLA-несовместимость, DSA, IL-6, TNF-α, VEGF, TGF-β и другие клинические данные."],
                  ["Возможные алгоритмы","Логистическая регрессия, Random Forest, XGBoost и ансамбли моделей."],
                  ["Выход модели","Вероятность риска отторжения и классификация уровня риска."],
                  ["Метрики качества","ROC-AUC, sensitivity, specificity, F1-score, calibration curve, внешняя валидация."]
                ].map(([t,s])=><div key={String(t)} className="softbox"><div style={{fontWeight:700}}>{t}</div><div className="small muted" style={{marginTop:6}}>{s}</div></div>)}
              </div>
            </div>
            <div className="card"><h2>Ограничения</h2><div className="grid small muted" style={{marginTop:18}}><div>• Малые клинические выборки</div><div>• Риск переобучения моделей</div><div>• Неполные или гетерогенные данные</div><div>• Необходимость внешней валидации</div><div>• Требование интерпретируемости для врача</div></div></div>
          </motion.div>}

          {page==="about" && <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="grid g2">
            <div className="card"><h2>О приложении</h2><div className="grid small muted" style={{marginTop:18}}><div>Это дипломный прототип веб-приложения по теме прогнозирования риска отторжения трансплантата роговицы.</div><div>Интерфейс демонстрирует, как может выглядеть система поддержки принятия решений для врача-офтальмолога.</div><div>В текущей версии расчёт основан на демонстрационном скоринге. На следующем этапе его можно заменить реальной ML-моделью.</div></div></div>
            <div className="card"><h2>Что можно сделать дальше</h2><div className="grid small muted" style={{marginTop:18}}><div>• Подключить PostgreSQL</div><div>• Добавить аутентификацию и роли пользователей</div><div>• Реализовать REST API</div><div>• Обучить модель на реальном датасете</div><div>• Сделать деплой на Render или Vercel</div></div></div>
          </motion.div>}
        </div>
      </main>

      {modal && <div className="modalBg"><div className="modal">
        <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"start"}}>
          <div><h2 style={{margin:0}}>{patients.some(p=>p.id===form.id)?"Редактирование пациента":"Новый пациент"}</h2><div className="muted small">Заполните клинические и иммунологические параметры для расчёта риска.</div></div>
          <button className="btn outline" onClick={()=>setModal(false)}><X size={16}/></button>
        </div>
        <div className="grid g3" style={{marginTop:20}}>
          <div><label className="label">ID пациента</label><input className="input" value={form.id} onChange={e=>setForm({...form,id:e.target.value})} /></div>
          <div><label className="label">ФИО</label><input className="input" value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})} /></div>
          <div><label className="label">Возраст</label><input className="input" type="number" value={form.age} onChange={e=>setForm({...form,age:e.target.value})} /></div>
          <div><label className="label">Пол</label><select className="select" value={form.sex} onChange={e=>setForm({...form,sex:e.target.value})}><option value="М">М</option><option value="Ж">Ж</option></select></div>
          <div><label className="label">Дата визита</label><input className="input" type="date" value={form.lastVisit} onChange={e=>setForm({...form,lastVisit:e.target.value})} /></div>
          <div><label className="label">Тип трансплантации</label><select className="select" value={form.graftType} onChange={e=>setForm({...form,graftType:e.target.value})}><option value="primary">Первичная</option><option value="repeat">Повторная</option><option value="high_risk">Высокорисковая</option></select></div>
          <div><label className="label">Неоваскуляризация</label><select className="select" value={form.neovascularization} onChange={e=>setForm({...form,neovascularization:e.target.value})}><option value="none">Нет</option><option value="moderate">Умеренная</option><option value="severe">Выраженная</option></select></div>
          <div><label className="label">Предшествующее воспаление</label><select className="select" value={form.priorInflammation} onChange={e=>setForm({...form,priorInflammation:e.target.value})}><option value="no">Нет</option><option value="yes">Да</option></select></div>
          <div><label className="label">Отторжение в анамнезе</label><select className="select" value={form.rejectionHistory} onChange={e=>setForm({...form,rejectionHistory:e.target.value})}><option value="no">Нет</option><option value="yes">Да</option></select></div>
          <div><label className="label">HLA-несовместимость</label><select className="select" value={form.hlaMismatch} onChange={e=>setForm({...form,hlaMismatch:e.target.value})}><option value="low">Низкая</option><option value="moderate">Умеренная</option><option value="high">Высокая</option></select></div>
          <div><label className="label">DSA</label><select className="select" value={form.dsa} onChange={e=>setForm({...form,dsa:e.target.value})}><option value="negative">Отрицательные</option><option value="positive">Положительные</option></select></div>
          <div><label className="label">IL-6</label><input className="input" type="number" value={form.il6} onChange={e=>setForm({...form,il6:e.target.value})} /></div>
          <div><label className="label">TNF-α</label><input className="input" type="number" value={form.tnf} onChange={e=>setForm({...form,tnf:e.target.value})} /></div>
          <div><label className="label">VEGF</label><input className="input" type="number" value={form.vegf} onChange={e=>setForm({...form,vegf:e.target.value})} /></div>
          <div><label className="label">TGF-β</label><input className="input" type="number" value={form.tgfb} onChange={e=>setForm({...form,tgfb:e.target.value})} /></div>
          <div style={{gridColumn:"1 / -1"}}><label className="label">Клинические заметки</label><textarea className="textarea" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
        </div>
        <div style={{display:"flex",justifyContent:"end",gap:10,marginTop:18}}>
          <button className="btn outline" onClick={()=>setModal(false)}>Отмена</button>
          <button className="btn" onClick={save}><ClipboardList size={16}/>Сохранить пациента</button>
        </div>
      </div></div>}
    </div>
  );
}
