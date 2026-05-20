import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload, FileText, X, Download, Send, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle, Trash2, Search,
  ZoomIn, ZoomOut, Sparkles, Shield,
  Heart, Activity, AlertCircle, Info, FileHeart,
  Dumbbell, MessageSquare, BookOpen, ListChecks, Star,
  ArrowLeft
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { BACKEND_URL } from '../config/api';

const API_BASE = `${BACKEND_URL}/api/reports`;
const MAX_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXTS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

const STEPS = [
  { key: 'uploading',  label: 'Uploading Report',         icon: Upload },
  { key: 'security',   label: 'Checking Security',        icon: Shield },
  { key: 'extracting', label: 'Extracting Medical Data',  icon: FileText },
  { key: 'analyzing',  label: 'Analyzing with Gemini AI', icon: Sparkles },
  { key: 'generating', label: 'Generating Insights',      icon: Activity },
  { key: 'preparing',  label: 'Preparing Dashboard',      icon: CheckCircle },
];

function fmtBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b/1024).toFixed(1) + ' KB';
  return (b/1048576).toFixed(2) + ' MB';
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff/60000);
  if (m < 1) return 'Just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m/60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h/24) + 'd ago';
}

function SafeText({ text, className }) {
  if (!text) return null;
  const renderBoldText = (txt) => {
    if (!txt) return null;
    const parts = txt.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-extrabold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const preprocessed = text.replace(/\s*(\d+)\.\s+\*\*/g, '\n$1. **');
  const lines = preprocessed.split('\n');

  return (
    <div className={`space-y-1 text-left ${className || ''}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1.5" />;

        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          return (
            <ul key={idx} className="list-disc list-inside ml-3 my-0.5">
              <li className="text-[11px] text-slate-700 dark:text-slate-300">
                {renderBoldText(trimmed.substring(2))}
              </li>
            </ul>
          );
        }

        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={idx} className="pl-3 my-0.5 flex items-start gap-1 text-[11px] text-slate-700 dark:text-slate-300">
              <span className="font-bold text-sky-500">{numMatch[1]}.</span>
              <span className="flex-1">{renderBoldText(numMatch[2])}</span>
            </div>
          );
        }

        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-[11px] font-black text-slate-900 dark:text-white mt-2 mb-1">
              {renderBoldText(trimmed.substring(4))}
            </h4>
          );
        }

        return (
          <p key={idx} className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed mb-1">
            {renderBoldText(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function RiskBadge({ level, lg }) {
  const cfg = {
    Green:  { cls:'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400', dot:'bg-emerald-500', lbl:'Normal' },
    Yellow: { cls:'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',         dot:'bg-amber-500',   lbl:'Needs Attention' },
    Red:    { cls:'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400',                 dot:'bg-red-500',     lbl:'Consult Doctor' },
  };
  const c = cfg[level] || cfg.Green;
  return (
    <span className={`inline-flex items-center gap-1.5 font-bold border rounded-full ${c.cls} ${lg ? 'text-xs px-3 py-1.5' : 'text-[10px] px-2 py-0.5'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.lbl}
    </span>
  );
}

function Toasts({ toasts, remove }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold backdrop-blur-sm max-w-sm
          ${t.type==='success'?'bg-emerald-600/90 border-emerald-500/30 text-white':t.type==='error'?'bg-red-600/90 border-red-500/30 text-white':'bg-slate-800/90 border-slate-700/30 text-white'}`}>
          {t.type==='success'?<CheckCircle size={14} className="shrink-0 mt-0.5"/>:t.type==='error'?<AlertCircle size={14} className="shrink-0 mt-0.5"/>:<Info size={14} className="shrink-0 mt-0.5"/>}
          <span className="flex-1 leading-relaxed">{t.message}</span>
          <button onClick={()=>remove(t.id)} className="opacity-70 hover:opacity-100 cursor-pointer"><X size={12}/></button>
        </div>
      ))}
    </div>
  );
}

function Skel({ cls }) { return <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${cls}`} />; }

export default function MedicalReportAnalyzer({ profileEmail = 'gaurav@medigrid.ai', refreshAllData }) {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((message, type='info') => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500);
  }, []);
  const rmToast = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);

  const [view, setView] = useState('home'); // home | preview | analyzing | result
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [dashTab, setDashTab] = useState('overview');
  const [normalOpen, setNormalOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const chatEnd = useRef(null);
  const [history, setHistory] = useState([]);
  const [histBusy, setHistBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [ftType, setFtType] = useState('All');
  const [ftTime, setFtTime] = useState('All');
  const [zoom, setZoom] = useState(1);

  useEffect(() => { loadHistory(); }, []);
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior:'smooth' }); }, [analysis?.chatHistory, chatBusy]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const loadHistory = async () => {
    setHistBusy(true);
    try {
      const r = await fetch(`${API_BASE}/history`, { headers:{ 'X-User-Email': profileEmail } });
      if (r.ok) setHistory((await r.json()).history || []);
      else toast('Could not load history.', 'error');
    } catch { toast('Server offline. History unavailable.', 'error'); }
    finally { setHistBusy(false); }
  };

  const pick = useCallback((f) => {
    if (!f) return;
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) { toast(`"${ext}" not allowed. Use PDF/PNG/JPG/JPEG/WEBP.`, 'error'); return; }
    if (!ALLOWED_TYPES.includes(f.type)) { toast('Invalid MIME type.', 'error'); return; }
    if (f.size > MAX_SIZE) { toast(`File too large (${fmtBytes(f.size)}). Max 20 MB.`, 'error'); return; }
    setFile(f); setError(null); setZoom(1);
    setPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
    setView('preview');
    toast(`"${f.name}" ready for analysis.`, 'success');
  }, [toast]);

  const reset = () => {
    setFile(null); setPreview(null); setAnalysis(null);
    setError(null); setStep(0); setChatMsg('');
    setDashTab('overview'); setNormalOpen(false); setZoom(1);
    setView('home'); loadHistory();
  };

  const analyze = async () => {
    if (!file) return;
    setView('analyzing'); setError(null); setStep(0);
    const iv = setInterval(() => setStep(p => p >= STEPS.length-2 ? (clearInterval(iv),p) : p+1), 900);
    try {
      const fd = new FormData(); fd.append('report', file);
      const r = await fetch(`${API_BASE}/analyze`, {
        method:'POST', headers:{ 'X-User-Email': profileEmail }, body: fd
      });
      clearInterval(iv); setStep(STEPS.length-1);
      if (!r.ok) { const e = await r.json().catch(()=>({})); throw new Error(e.error || `Error ${r.status}`); }
      const data = await r.json();
      await new Promise(res => setTimeout(res, 600));
      setAnalysis(data.analysis); setView('result'); setDashTab('overview');
      toast('Analysis complete!', 'success'); loadHistory();
      if (refreshAllData) refreshAllData();
    } catch (err) {
      clearInterval(iv); setError(err.message); setView('preview');
      toast(err.message || 'Analysis failed.', 'error');
    }
  };

  const openRecord = async (item) => {
    try {
      const r = await fetch(`${API_BASE}/${item._id}`, { headers:{ 'X-User-Email': profileEmail } });
      if (!r.ok) throw new Error('Could not load.');
      const data = await r.json();
      setAnalysis(data.analysis); setFile(null); setPreview(null);
      setView('result'); setDashTab('overview');
    } catch(err) { toast(err.message, 'error'); }
  };

  const deleteRecord = async (id) => {
    try {
      const r = await fetch(`${API_BASE}/${id}`, { method:'DELETE', headers:{ 'X-User-Email': profileEmail } });
      if (!r.ok) throw new Error('Delete failed.');
      toast('Report deleted.', 'success');
      if (analysis?._id === id) reset(); else loadHistory();
      if (refreshAllData) refreshAllData();
    } catch(err) { toast(err.message, 'error'); }
  };

  const sendChat = async (e, override) => {
    if (e) e.preventDefault();
    const msg = override || chatMsg;
    if (!msg.trim() || chatBusy || !analysis) return;
    const m = msg.trim(); setChatMsg(''); setChatBusy(true);
    setAnalysis(p => ({ ...p, chatHistory:[...(p.chatHistory||[]), {role:'user',content:m}] }));
    try {
      const r = await fetch(`${API_BASE}/${analysis._id}/chat`, {
        method:'POST', headers:{ 'Content-Type':'application/json','X-User-Email':profileEmail },
        body: JSON.stringify({ question: m })
      });
      if (!r.ok) { const e = await r.json().catch(()=>({})); throw new Error(e.error||'Chat error'); }
      const data = await r.json();
      setAnalysis(p => ({ ...p, chatHistory: data.chatHistory }));
    } catch(err) {
      toast(err.message,'error');
      setAnalysis(p => ({ ...p, chatHistory: p.chatHistory.slice(0,-1) }));
    } finally { setChatBusy(false); }
  };

  const downloadPDF = () => {
    if (!analysis) return;
    const d = analysis.structuredData || {};
    const doc = new jsPDF({ unit:'mm', format:'a4' });
    const W=210, M=15, CW=W-2*M; let y=M;
    const brk = (h=8) => { if(y+h>280){doc.addPage();y=M;} };
    doc.setFillColor(14,165,233); doc.rect(0,0,W,26,'F');
    doc.setTextColor(255,255,255); doc.setFont('Helvetica','bold'); doc.setFontSize(15);
    doc.text('MediGrid — Medical Report Summary', M, 11);
    doc.setFontSize(8); doc.setFont('Helvetica','normal');
    doc.text(`File: ${analysis.fileName||'N/A'}  |  Generated: ${fmtDate(analysis.createdAt)}`, M, 21);
    y = 34;
    doc.setTextColor(30,41,59);
    doc.setFont('Helvetica','bold'); doc.setFontSize(12); doc.text('Executive Summary', M, y); y+=6;
    doc.setFont('Helvetica','normal'); doc.setFontSize(9);
    doc.splitTextToSize(d.executiveSummary||'N/A', CW).forEach(l=>{brk(5);doc.text(l,M,y);y+=5;});
    y+=4;
    brk(10); doc.setFont('Helvetica','bold'); doc.setFontSize(10);
    doc.text(`Risk: ${d.riskLevel||analysis.riskLevel||'N/A'}  |  Status: ${d.overallHealthStatus||'N/A'}  |  Type: ${analysis.reportType||'N/A'}`, M, y); y+=10;
    if (d.abnormalValues?.length) {
      brk(12); doc.setFont('Helvetica','bold'); doc.setFontSize(11); doc.setTextColor(220,38,38);
      doc.text('Abnormal Values', M, y); y+=6;
      d.abnormalValues.forEach(v => {
        const ls = doc.splitTextToSize(`• ${v.parameter}: ${v.value} (Ref: ${v.referenceRange}) — ${v.explanation||''}`, CW-4);
        const bh = ls.length*4.5+4; brk(bh+2);
        doc.setFillColor(254,242,242); doc.rect(M,y-3,CW,bh,'F');
        doc.setTextColor(127,29,29); doc.setFont('Helvetica','normal'); doc.setFontSize(8.5);
        ls.forEach(l=>{doc.text(l,M+2,y);y+=4.5;}); y+=3;
      });
    }
    if (d.recommendations?.length) {
      brk(12); doc.setTextColor(30,41,59); doc.setFont('Helvetica','bold'); doc.setFontSize(11);
      doc.text('Recommendations', M, y); y+=6;
      doc.setFont('Helvetica','normal'); doc.setFontSize(9);
      d.recommendations.forEach(r=>{
        doc.splitTextToSize('• '+r, CW).forEach(l=>{brk(5);doc.text(l,M,y);y+=5;});
      }); y+=4;
    }
    if (d.questionsToAskDoctor?.length) {
      brk(12); doc.setFont('Helvetica','bold'); doc.setFontSize(11);
      doc.text('Questions for Your Doctor', M, y); y+=6;
      doc.setFont('Helvetica','normal'); doc.setFontSize(9);
      d.questionsToAskDoctor.forEach((q,i)=>{
        doc.splitTextToSize(`${i+1}. ${q}`, CW).forEach(l=>{brk(5);doc.text(l,M,y);y+=5;});
      }); y+=4;
    }
    brk(18); doc.setFontSize(7.5); doc.setTextColor(100,116,139);
    doc.splitTextToSize(d.medicalDisclaimer||'For educational use only. Not a diagnosis.', CW).forEach(l=>{doc.text(l,M,y);y+=4;});
    const n=doc.internal.getNumberOfPages();
    for(let i=1;i<=n;i++){doc.setPage(i);doc.setFontSize(7);doc.setTextColor(148,163,184);doc.text(`MediGrid Report  |  Page ${i}/${n}  |  Educational purposes only`,M,292);}
    doc.save(`MediGrid_${analysis.fileName?.replace(/\.[^.]+$/,'')||'Report'}.pdf`);
    toast('PDF saved!','success');
  };

  const filtered = history.filter(it => {
    const ms = !search || it.fileName?.toLowerCase().includes(search.toLowerCase()) || it.reportType?.toLowerCase().includes(search.toLowerCase());
    let mt = true;
    if (ftTime!=='All') {
      const d=new Date(it.createdAt),now=new Date();
      if(ftTime==='Today') mt=d.toDateString()===now.toDateString();
      else if(ftTime==='This Week') mt=(now-d)<7*86400000;
      else if(ftTime==='This Month') mt=d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
    }
    let my = true;
    if (ftType!=='All') {
      const k=ftType.toLowerCase().replace(' reports','').replace(' test','');
      my = it.reportType?.toLowerCase().includes(k);
    }
    return ms&&mt&&my;
  });

  const DASHTABS = [
    {k:'overview',    l:'Overview',        I:Activity},
    {k:'findings',    l:'Findings',        I:AlertTriangle},
    {k:'values',      l:'Lab Values',      I:FileText},
    {k:'terminology', l:'Terminology',     I:BookOpen},
    {k:'lifestyle',   l:'Lifestyle',       I:Dumbbell},
    {k:'doctor',      l:'For Your Doctor', I:Heart},
    {k:'chat',        l:'Ask AI',          I:MessageSquare},
  ];

  return (
    <div className="text-left relative">
      <Toasts toasts={toasts} remove={rmToast}/>

      {/* ── HOME ── */}
      {view==='home' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Drop zone */}
            <div className="lg:col-span-7">
              <div
                onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                onDragLeave={()=>setDragOver(false)}
                onDrop={e=>{e.preventDefault();setDragOver(false);pick(e.dataTransfer.files[0]);}}
                onClick={()=>fileRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-5 cursor-pointer min-h-[280px] group transition-all duration-300
                  ${dragOver?'border-sky-500 bg-sky-500/5 scale-[1.01]':'border-slate-200 dark:border-slate-800 hover:border-sky-400/60 bg-white dark:bg-[#080c14]'}`}
              >
                <input ref={fileRef} type="file" className="hidden" accept={ALLOWED_EXTS.join(',')} onChange={e=>pick(e.target.files[0])} onClick={e=>e.stopPropagation()}/>
                <div className="absolute top-4 left-4 w-20 h-20 rounded-full bg-sky-500/8 blur-2xl pointer-events-none group-hover:scale-125 transition-transform"/>
                <div className="absolute bottom-4 right-4 w-24 h-24 rounded-full bg-cyan-500/6 blur-2xl pointer-events-none group-hover:scale-125 transition-transform"/>
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${dragOver?'bg-sky-500 text-white scale-110':'bg-sky-500/10 border border-sky-500/20 text-sky-500 group-hover:scale-105'}`}>
                  <FileHeart size={34}/>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white mb-1.5">{dragOver?'Drop it here!':'Drag & Drop Medical Report'}</h3>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">Blood reports, CBC, lipid profiles, MRI, CT scans, X-rays, prescriptions — all supported.</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-xs font-black rounded-xl shadow-md pointer-events-none">Browse Files</span>
                  <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                    <span>PDF · PNG · JPG · JPEG · WEBP</span><span className="opacity-30">•</span><span>Max 20 MB</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Feature list */}
            <div className="lg:col-span-5 bg-white dark:bg-[#080c14] border border-slate-200 dark:border-slate-800/60 rounded-2xl p-6 flex flex-col gap-4">
              <div>
                <span className="text-[9px] font-black text-cyan-500 tracking-widest uppercase">What you get</span>
                <h4 className="text-sm font-black text-slate-800 dark:text-white mt-1">AI Report Analytics</h4>
              </div>
              <div className="space-y-3 flex-1">
                {[
                  [BookOpen,'Plain-English explanations of complex lab values'],
                  [AlertTriangle,'Color-coded abnormal values flagged automatically'],
                  [Dumbbell,'Personalized diet & exercise recommendations'],
                  [MessageSquare,'Conversational AI follow-up Q&A'],
                  [ListChecks,'Suggested tests & questions for your doctor'],
                  [Download,'Professional PDF summary download'],
                ].map(([Icon,txt])=>(
                  <div key={txt} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 flex items-center justify-center shrink-0"><Icon size={11}/></span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{txt}</span>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-1.5 text-[10px] text-slate-500">
                <Shield size={11} className="text-sky-500"/> Files processed securely — never stored permanently.
              </div>
            </div>
          </div>

          {/* History */}
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white">Analysis History</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{history.length} report{history.length!==1?'s':''} analyzed</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <div className="relative flex-1 sm:w-44">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="w-full pl-8 pr-3 py-2 text-[11px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 rounded-xl focus:outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"/>
                </div>
                <select value={ftType} onChange={e=>setFtType(e.target.value)} className="px-2.5 py-2 text-[11px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 rounded-xl focus:outline-none focus:border-sky-500 cursor-pointer">
                  {['All','Blood','MRI','CT Scan','Prescription','Urine','Others'].map(t=><option key={t}>{t}</option>)}
                </select>
                <select value={ftTime} onChange={e=>setFtTime(e.target.value)} className="px-2.5 py-2 text-[11px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 rounded-xl focus:outline-none focus:border-sky-500 cursor-pointer">
                  {['All','Today','This Week','This Month'].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            {histBusy ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{[1,2,3].map(i=><Skel key={i} cls="h-28"/>)}</div>
            ) : filtered.length===0 ? (
              <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#080c14]">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center mx-auto mb-4"><FileHeart size={24} className="text-slate-400"/></div>
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">No reports analyzed yet</p>
                <p className="text-[11px] text-slate-400">Upload your first medical report above to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map(it=>(
                  <div key={it._id} className="group bg-white dark:bg-[#080c14] border border-slate-200 dark:border-slate-800/60 rounded-2xl p-4 hover:border-sky-500/40 hover:shadow-md hover:shadow-sky-500/5 transition-all cursor-pointer" onClick={()=>openRecord(it)}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-500 flex items-center justify-center shrink-0"><FileHeart size={15}/></div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-black text-slate-800 dark:text-white truncate">{it.fileName}</p>
                          <p className="text-[9px] text-slate-400">{it.reportType}</p>
                        </div>
                      </div>
                      <button onClick={e=>{e.stopPropagation();deleteRecord(it._id);}} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all cursor-pointer"><Trash2 size={12}/></button>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-2 leading-relaxed">{it.summary}</p>
                    <div className="flex items-center justify-between"><RiskBadge level={it.riskLevel}/><span className="text-[9px] text-slate-400">{timeAgo(it.createdAt)}</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PREVIEW ── */}
      {view==='preview' && file && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-[#080c14] border border-slate-200 dark:border-slate-800/60 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Preview</span>
                {preview && (
                  <div className="flex items-center gap-1.5">
                    <button onClick={()=>setZoom(z=>Math.max(0.5,z-0.25))} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"><ZoomOut size={13}/></button>
                    <span className="text-[10px] font-bold text-slate-500 w-12 text-center">{Math.round(zoom*100)}%</span>
                    <button onClick={()=>setZoom(z=>Math.min(3,z+0.25))} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"><ZoomIn size={13}/></button>
                    <a href={preview} download={file.name} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"><Download size={13}/></a>
                  </div>
                )}
              </div>
              <div className="h-72 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950/30">
                {preview
                  ? <img src={preview} alt="preview" style={{transform:`scale(${zoom})`,transformOrigin:'center',transition:'transform .2s'}} className="max-h-full max-w-full object-contain"/>
                  : <div className="text-center"><div className="w-16 h-16 mx-auto rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-3"><FileText size={28} className="text-sky-500"/></div><p className="text-xs font-bold text-slate-700 dark:text-slate-300">PDF Document</p><p className="text-[10px] text-slate-400 mt-1">{file.name}</p></div>
                }
              </div>
            </div>
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-500/8 border border-red-500/20 rounded-xl">
                <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5"/>
                <div><p className="text-xs font-bold text-red-600 dark:text-red-400 mb-0.5">Analysis Failed</p><p className="text-[11px] text-red-500/80">{error}</p></div>
              </div>
            )}
          </div>
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-[#080c14] border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">File Details</span>
              <div className="mt-3 space-y-3">
                {[['File Name',file.name],['File Size',fmtBytes(file.size)],['Format',file.type]].map(([l,v])=>(
                  <div key={l} className="flex items-start justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">{l}</span>
                    <span className="text-[10px] text-slate-700 dark:text-slate-300 font-bold text-right truncate max-w-[60%]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-start gap-2.5">
              <Shield size={14} className="text-emerald-500 shrink-0 mt-0.5"/>
              <div>
                <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1">Secure Processing</p>
                <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500/60 leading-relaxed">File validated, text extracted locally, sent to Gemini AI. Never stored permanently.</p>
              </div>
            </div>
            <button onClick={analyze} className="w-full py-4 bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-sky-500/25 hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2">
              <Sparkles size={16}/> Analyze Report with AI
            </button>
            <button onClick={()=>{setFile(null);setPreview(null);setView('home');}} className="w-full py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer">
              Replace File
            </button>
          </div>
        </div>
      )}

      {/* ── ANALYZING ── */}
      {view==='analyzing' && (
        <div className="flex flex-col items-center justify-center py-20 gap-8">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full border-4 border-sky-500/10"/>
            <div className="absolute inset-0 rounded-full border-4 border-t-sky-500 border-r-cyan-500 border-b-transparent border-l-transparent animate-spin"/>
            <div className="absolute inset-0 flex items-center justify-center">
              {(()=>{const S=STEPS[step]?.icon||Sparkles;return <S size={28} className="text-sky-500"/>;})()}
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-base font-black text-slate-800 dark:text-white mb-1">{STEPS[step]?.label||'Processing...'}</h3>
            <p className="text-[11px] text-slate-400">Usually takes 15–30 seconds</p>
          </div>
          <div className="w-full max-w-sm space-y-2">
            {STEPS.map((s,i)=>{
              const Icon=s.icon; const done=i<step; const active=i===step;
              return (
                <div key={s.key} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 border
                  ${active?'bg-sky-500/10 border-sky-500/20':done?'bg-emerald-500/5 border-emerald-500/15':'bg-slate-50 dark:bg-slate-900/40 border-transparent opacity-40'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${active?'bg-sky-500 text-white':done?'bg-emerald-500 text-white':'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                    {done?<CheckCircle size={13}/>:<Icon size={12}/>}
                  </div>
                  <span className={`text-[11px] font-bold ${active?'text-sky-600 dark:text-sky-400':done?'text-emerald-600 dark:text-emerald-400':'text-slate-500'}`}>{s.label}</span>
                  {active&&<div className="ml-auto flex gap-1">{[0,1,2].map(d=><div key={d} className="w-1 h-1 bg-sky-500 rounded-full animate-bounce" style={{animationDelay:`${d*150}ms`}}/>)}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── RESULT ── */}
      {view==='result' && analysis && (()=>{
        const d=analysis.structuredData||{};
        const isR=analysis.riskLevel==='Red'; const isY=analysis.riskLevel==='Yellow';
        return (
          <div className="space-y-6">
            {/* Status banner */}
            <div className={`relative overflow-hidden rounded-2xl p-6 border ${isR?'bg-red-500/5 border-red-500/20':isY?'bg-amber-500/5 border-amber-500/20':'bg-emerald-500/5 border-emerald-500/20'}`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <RiskBadge level={analysis.riskLevel} lg/>
                    {d.healthScore!=null&&<span className="flex items-center gap-1 text-[10px] font-black bg-white/60 dark:bg-black/30 border border-slate-200/50 dark:border-slate-700/50 px-2.5 py-1 rounded-full"><Star size={10} className="text-amber-500"/>{d.healthScore}/100</span>}
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">{d.overallHealthStatus||'Analysis Complete'}</h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">{d.executiveSummary}</p>
                </div>
                <div className="shrink-0 text-right text-[9px] text-slate-400 space-y-0.5">
                  <p className="font-medium">{analysis.reportType}</p>
                  <p>{fmtDate(analysis.createdAt)}</p>
                  <p className="truncate max-w-[140px]">{analysis.fileName}</p>
                </div>
              </div>
            </div>

            {/* Sub-tab bar */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {DASHTABS.map(({k,l,I})=>(
                <button key={k} onClick={()=>setDashTab(k)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-black whitespace-nowrap transition-all cursor-pointer shrink-0
                    ${dashTab===k?'bg-sky-500 text-white shadow-md shadow-sky-500/20':'bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-sky-400/40'}`}>
                  <I size={11}/>{l}
                </button>
              ))}
            </div>

            {/* Overview */}
            {dashTab==='overview'&&(
              <div className="space-y-4">
                {d.recommendations?.length>0&&(
                  <div className="bg-white dark:bg-[#080c14] border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5">
                    <h4 className="text-xs font-black text-slate-800 dark:text-white mb-3">Personalized Recommendations</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {d.recommendations.map((r,i)=>(
                        <div key={i} className="flex items-start gap-2.5 p-3 bg-sky-500/3 border border-sky-500/10 rounded-xl">
                          <CheckCircle size={13} className="text-sky-500 shrink-0 mt-0.5"/>
                          <span className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {d.suggestedFollowUpTests?.length>0&&(
                  <div className="bg-white dark:bg-[#080c14] border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5">
                    <h4 className="text-xs font-black text-slate-800 dark:text-white mb-3">Suggested Follow-up Tests</h4>
                    <div className="space-y-2">
                      {d.suggestedFollowUpTests.map((t,i)=>(
                        <div key={i} className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40 rounded-xl">
                          <Activity size={13} className="text-amber-500 shrink-0 mt-0.5"/>
                          <div><p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{t.testName}</p>{t.reason&&<p className="text-[10px] text-slate-400 mt-0.5">{t.reason}</p>}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {d.medicalDisclaimer&&(
                  <div className="flex items-start gap-2.5 p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/40 rounded-xl">
                    <Info size={13} className="text-slate-400 shrink-0 mt-0.5"/>
                    <p className="text-[10px] text-slate-500 leading-relaxed">{d.medicalDisclaimer}</p>
                  </div>
                )}
              </div>
            )}

            {/* Findings */}
            {dashTab==='findings'&&(
              <div className="space-y-3">
                {d.importantFindings?.length>0
                  ?d.importantFindings.map((f,i)=>{
                      const pc=f.priority==='High'?'text-red-500 bg-red-500/10 border-red-500/20':f.priority==='Medium'?'text-amber-500 bg-amber-500/10 border-amber-500/20':'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
                      return(
                        <div key={i} className="bg-white dark:bg-[#080c14] border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5 flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-500 flex items-center justify-center shrink-0"><Activity size={18}/></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-xs font-black text-slate-800 dark:text-white">{f.heading}</h4>
                              {f.priority&&<span className={`text-[9px] font-black border px-2 py-0.5 rounded-full ${pc}`}>{f.priority}</span>}
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{f.explanation}</p>
                          </div>
                        </div>
                      );
                    })
                  :<p className="text-center py-10 text-sm text-slate-400">No specific findings highlighted.</p>
                }
              </div>
            )}

            {/* Lab Values */}
            {dashTab==='values'&&(
              <div className="space-y-4">
                {d.abnormalValues?.length>0&&(
                  <div className="bg-white dark:bg-[#080c14] border border-slate-200 dark:border-slate-800/60 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-2">
                      <AlertTriangle size={13} className="text-red-500"/>
                      <h4 className="text-xs font-black text-slate-800 dark:text-white">Abnormal Values</h4>
                      <span className="ml-auto text-[9px] font-black text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">{d.abnormalValues.length} flagged</span>
                    </div>
                    {d.abnormalValues.map((v,i)=>(
                      <div key={i} className={`px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/30 last:border-0 ${v.status==='Red'?'bg-red-500/3':'bg-amber-500/3'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1.5">
                          <span className="text-xs font-black text-slate-800 dark:text-white">{v.parameter}</span>
                          <div className="flex items-center gap-2 ml-auto">
                            <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg ${v.status==='Red'?'bg-red-500 text-white':'bg-amber-500 text-white'}`}>{v.value}</span>
                            <span className="text-[10px] text-slate-400">Ref: {v.referenceRange}</span>
                          </div>
                        </div>
                        {v.explanation&&<p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{v.explanation}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {d.normalValues?.length>0&&(
                  <div className="bg-white dark:bg-[#080c14] border border-slate-200 dark:border-slate-800/60 rounded-2xl overflow-hidden">
                    <button onClick={()=>setNormalOpen(!normalOpen)} className="w-full px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/3 transition-all">
                      <CheckCircle size={13} className="text-emerald-500"/>
                      <h4 className="text-xs font-black text-slate-800 dark:text-white">Normal Values</h4>
                      <span className="ml-auto text-[9px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">{d.normalValues.length} normal</span>
                      {normalOpen?<ChevronUp size={13} className="text-slate-400 ml-1"/>:<ChevronDown size={13} className="text-slate-400 ml-1"/>}
                    </button>
                    {normalOpen&&d.normalValues.map((v,i)=>(
                      <div key={i} className="px-5 py-3 flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/30 last:border-0">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{v.parameter}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">{v.value}</span>
                          <span className="text-[10px] text-slate-400">({v.referenceRange})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Terminology */}
            {dashTab==='terminology'&&(
              <div className="space-y-3">
                {d.medicalExplanations?.length>0
                  ?d.medicalExplanations.map((it,i)=>(
                      <div key={i} className="bg-white dark:bg-[#080c14] border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5">
                        <p className="text-xs font-black text-sky-600 dark:text-sky-400 mb-1">{it.term}</p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{it.explanation}</p>
                      </div>
                    ))
                  :<p className="text-center py-10 text-sm text-slate-400">No medical terms to explain.</p>
                }
              </div>
            )}

            {/* Lifestyle */}
            {dashTab==='lifestyle'&&(
              <div className="space-y-5">
                {d.dietSuggestions&&(
                  <div className="bg-white dark:bg-[#080c14] border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center"><Heart size={15}/></div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-white">Diet Suggestions</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {[['Breakfast',d.dietSuggestions.breakfast],['Lunch',d.dietSuggestions.lunch],['Dinner',d.dietSuggestions.dinner],['Snacks',d.dietSuggestions.snacks]].map(([l,v])=>v&&(
                        <div key={l} className="p-3 bg-emerald-500/3 border border-emerald-500/15 rounded-xl">
                          <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-0.5">{l}</p>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300">{v}</p>
                        </div>
                      ))}
                    </div>
                    {d.dietSuggestions.avoid?.length>0&&(
                      <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-xl">
                        <p className="text-[9px] font-black text-red-500 uppercase tracking-wider mb-1.5">Foods to Avoid</p>
                        <div className="flex flex-wrap gap-1.5">
                          {d.dietSuggestions.avoid.map((f,i)=><span key={i} className="text-[10px] font-bold bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">{f}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {d.exerciseSuggestions&&(
                  <div className="bg-white dark:bg-[#080c14] border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center"><Dumbbell size={15}/></div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-white">Exercise Plan</h4>
                    </div>
                    {d.exerciseSuggestions.plan&&<p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-3">{d.exerciseSuggestions.plan}</p>}
                    {d.exerciseSuggestions.suggestions?.length>0&&(
                      <div className="flex flex-wrap gap-2">
                        {d.exerciseSuggestions.suggestions.map((s,i)=><span key={i} className="text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full">{s}</span>)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Doctor Q&A */}
            {dashTab==='doctor'&&(
              <div className="bg-white dark:bg-[#080c14] border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5">
                <h4 className="text-xs font-black text-slate-800 dark:text-white mb-3">Questions to Ask Your Doctor</h4>
                <div className="space-y-2">
                  {d.questionsToAskDoctor?.length>0
                    ?d.questionsToAskDoctor.map((q,i)=>(
                        <div key={i} className="flex items-start gap-2.5 p-3 bg-sky-500/3 border border-sky-500/10 rounded-xl">
                          <span className="text-[10px] font-black text-sky-500 shrink-0 mt-0.5">{i+1}.</span>
                          <span className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">{q}</span>
                        </div>
                      ))
                    :<p className="text-sm text-slate-400">No questions generated.</p>
                  }
                </div>
              </div>
            )}

            {/* Chat */}
            {dashTab==='chat'&&(
              <div className="bg-white dark:bg-[#080c14] border border-slate-200 dark:border-slate-800/60 rounded-2xl overflow-hidden flex flex-col" style={{height:'520px'}}>
                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-2 shrink-0">
                  <div className="w-7 h-7 rounded-xl bg-sky-500 flex items-center justify-center"><Sparkles size={13} className="text-white"/></div>
                  <div><p className="text-[11px] font-black text-slate-800 dark:text-white">AI Report Assistant</p><p className="text-[9px] text-emerald-500 font-bold">● Online</p></div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {analysis.chatHistory?.map((m,i)=>(
                    <div key={i} className={`flex gap-2.5 ${m.role==='user'?'justify-end':'justify-start'}`}>
                      {m.role==='assistant'&&<div className="w-6 h-6 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-500 flex items-center justify-center shrink-0 mt-1"><Sparkles size={10}/></div>}
                      <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[11px] leading-relaxed ${m.role==='user'?'bg-sky-500 text-white rounded-tr-sm':'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-tl-sm border border-slate-200 dark:border-slate-800'}`}>
                        <SafeText text={m.content}/>
                      </div>
                    </div>
                  ))}
                  {chatBusy&&(
                    <div className="flex gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center"><Sparkles size={10} className="text-sky-500"/></div>
                      <div className="px-4 py-3 bg-slate-100 dark:bg-slate-900 rounded-2xl rounded-tl-sm border border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                        {[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce" style={{animationDelay:`${i*150}ms`}}/>)}
                      </div>
                    </div>
                  )}
                  <div ref={chatEnd}/>
                </div>
                <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap gap-1.5 shrink-0">
                  {['What does LDL mean?','Is this value risky?','Explain hemoglobin.','What should I eat?'].map(q=>(
                    <button key={q} onClick={()=>sendChat(null,q)} disabled={chatBusy} className="text-[9px] font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-sky-500 hover:border-sky-500/30 rounded-lg px-2.5 py-1 cursor-pointer transition-all disabled:opacity-40">{q}</button>
                  ))}
                </div>
                <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 shrink-0">
                  <form onSubmit={sendChat} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl">
                    <input type="text" value={chatMsg} onChange={e=>setChatMsg(e.target.value)} disabled={chatBusy} placeholder="Ask about your report..." className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"/>
                    <button type="submit" disabled={chatBusy||!chatMsg.trim()} className="p-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-all cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed"><Send size={13}/></button>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
