import React, { useState } from 'react';
import { useUserStore } from '@/src/store/userStore';
import { Button } from '@/src/components/ui/Button';
import { LetterAvatar } from '@/src/components/ui/LetterAvatar';
import {
  Users, UserPlus, Shield, ChevronLeft,
  Trash2, MessageCircle, Plus, Search, ArrowRight, Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export default function MyTeam() {
  const { team, createTeam, joinTeam, leaveTeam } = useUserStore();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin,   setShowJoin]   = useState(false);
  const [teamName,   setTeamName]   = useState('');
  const [teamTag,    setTeamTag]    = useState('');
  const [joinId,     setJoinId]     = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName && teamTag) { createTeam(teamName, teamTag); setShowCreate(false); setTeamName(''); setTeamTag(''); }
  };
  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinId) { joinTeam(joinId); setShowJoin(false); setJoinId(''); }
  };

  const inputCls = 'w-full bg-app-elevated border border-app-border rounded-2xl px-4 py-3.5 text-sm font-medium text-text-primary placeholder:text-text-muted focus:border-brand-primary outline-none transition-colors';
  const labelCls = 'text-xs font-semibold text-text-secondary';

  return (
    <div className="h-full flex flex-col bg-app-bg">
      <header className="h-[60px] px-5 flex items-center gap-3 glass-dark border-b border-app-border sticky top-0 z-50">
        <Link to="/profile" className="w-9 h-9 flex items-center justify-center rounded-xl bg-app-elevated border border-app-border text-text-secondary active:scale-90 transition-transform">
          <ChevronLeft size={18} />
        </Link>
        <h1 className="text-[17px] font-bold text-text-primary">My Team</h1>
      </header>

      <div className="flex-1 scrollable-content px-4 py-6 pb-10">
        {!team ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-10">
            <div className="text-center space-y-4">
              <div className="relative w-24 h-24 mx-auto">
                <div className="w-24 h-24 bg-brand-primary/10 border border-brand-primary/20 rounded-[28px] flex items-center justify-center text-brand-primary shadow-xl shadow-brand-primary/10">
                  <Users size={40} />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-brand-warning rounded-xl flex items-center justify-center text-black shadow-lg animate-bounce">
                  <Plus size={16} strokeWidth={3} />
                </div>
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-extrabold text-text-primary">Squad Up!</h2>
                <p className="text-sm text-text-muted font-medium max-w-[240px] mx-auto leading-relaxed">
                  Compete in team tournaments and dominate the leaderboard
                </p>
              </div>
            </div>

            <div className="w-full space-y-3">
              {[
                { icon: Plus,   label:'Create Team',  sub:'Start your own legacy',   color:'text-brand-primary', bg:'bg-brand-primary/8 border-brand-primary/20', fn:()=>setShowCreate(true) },
                { icon: Search, label:'Join Team',     sub:'Find your perfect squad', color:'text-brand-cyan',    bg:'bg-brand-cyan/8 border-brand-cyan/20',       fn:()=>setShowJoin(true)   },
              ].map(a=>(
                <motion.button key={a.label} whileHover={{y:-2}} whileTap={{scale:0.97}}
                  onClick={a.fn}
                  className={`w-full p-5 rounded-2xl border flex items-center gap-4 text-left transition-all ${a.bg}`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${a.color} bg-white/5`}>
                    <a.icon size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-text-primary">{a.label}</p>
                    <p className="text-xs text-text-muted font-medium">{a.sub}</p>
                  </div>
                  <ArrowRight size={18} className="text-text-muted" />
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Team card */}
            <div className="relative rounded-3xl overflow-hidden p-6 bg-gradient-to-br from-[#312E81] via-[#1e1b4b] to-[#0E1626] border border-brand-primary/20 shadow-xl">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />
              <div className="relative space-y-5">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center border border-white/20">
                    <Users size={26} className="text-white" />
                  </div>
                  <div className="flex gap-2">
                    {[MessageCircle, UserPlus].map((Icon,i)=>(
                      <button key={i} className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center border border-white/15 text-white active:scale-90 transition-transform hover:bg-white/20">
                        <Icon size={16} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white">{team.name}</h2>
                  <p className="text-xs font-semibold text-white/50 mt-0.5">Team ID: #{team.id}</p>
                </div>
                <div className="flex gap-3">
                  {[{label:'Members',val:`${team.members.length}/5`},{label:'Tag',val:team.tag}].map(s=>(
                    <div key={s.label} className="flex-1 bg-white/8 backdrop-blur rounded-2xl p-3.5 border border-white/10">
                      <p className="text-[9px] font-bold text-white/40 uppercase tracking-wide mb-1">{s.label}</p>
                      <p className="text-sm font-bold text-white">{s.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Members */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary">Team Members</h3>
                <span className="text-xs font-semibold text-brand-primary-light">{team.members.length} active</span>
              </div>
              <div className="space-y-2.5">
                {team.members.map((m,i)=>(
                  <motion.div key={m.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}}>
                    <div className="flex items-center justify-between bg-app-card border border-app-border rounded-2xl p-4">
                      <div className="flex items-center gap-3.5">
                        <div className="relative">
                          <LetterAvatar name={m.username} size="md" variant={m.role==='Leader'?'yellow':'slate'} />
                          {m.role==='Leader' && (
                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-gold rounded-full flex items-center justify-center border-2 border-app-bg">
                              <Crown size={9} className="text-black" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{m.username}</p>
                          <p className="text-xs text-text-muted font-medium">{m.role} · {m.rank}</p>
                        </div>
                      </div>
                      {m.role!=='Leader' && (
                        <button className="w-8 h-8 bg-app-elevated rounded-xl flex items-center justify-center text-text-muted hover:text-brand-live transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            <button onClick={leaveTeam}
              className="w-full py-3.5 bg-brand-live/8 border border-brand-live/20 rounded-2xl text-brand-live text-sm font-semibold hover:bg-brand-live/15 transition-all active:scale-[0.98]">
              Leave Team
            </button>
          </div>
        )}
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setShowCreate(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{y:60,opacity:0}} animate={{y:0,opacity:1}} exit={{y:60,opacity:0}} transition={{type:'spring',stiffness:260,damping:26}}
              className="relative w-full max-w-md bg-app-card border border-app-border rounded-3xl p-6 space-y-6 shadow-2xl">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-extrabold text-text-primary">Create Team</h2>
                <p className="text-xs text-text-muted font-medium">Build your squad from scratch</p>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5"><label className={labelCls}>Team Name</label><input type="text" value={teamName} onChange={e=>setTeamName(e.target.value)} className={inputCls} placeholder="e.g. Elite Squad" required /></div>
                <div className="space-y-1.5"><label className={labelCls}>Team Tag (max 5)</label><input type="text" value={teamTag} onChange={e=>setTeamTag(e.target.value.toUpperCase())} maxLength={5} className={inputCls} placeholder="e.g. ELITE" required /></div>
                <div className="flex gap-3 pt-1">
                  <Button type="button" variant="secondary" fullWidth onClick={()=>setShowCreate(false)}>Cancel</Button>
                  <Button type="submit" fullWidth>Create</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Join modal */}
      <AnimatePresence>
        {showJoin && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setShowJoin(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{y:60,opacity:0}} animate={{y:0,opacity:1}} exit={{y:60,opacity:0}} transition={{type:'spring',stiffness:260,damping:26}}
              className="relative w-full max-w-md bg-app-card border border-app-border rounded-3xl p-6 space-y-6 shadow-2xl">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-extrabold text-text-primary">Join Team</h2>
                <p className="text-xs text-text-muted font-medium">Enter a Team ID to join your squad</p>
              </div>
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-1.5"><label className={labelCls}>Team ID</label><input type="text" value={joinId} onChange={e=>setJoinId(e.target.value.toUpperCase())} className={inputCls} placeholder="e.g. ELITE-9921" required /></div>
                <div className="flex gap-3 pt-1">
                  <Button type="button" variant="secondary" fullWidth onClick={()=>setShowJoin(false)}>Cancel</Button>
                  <Button type="submit" fullWidth>Join</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
