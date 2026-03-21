import React, { useState } from 'react';
import { useUserStore } from '@/src/store/userStore';
import { LetterAvatar } from '@/src/components/ui/LetterAvatar';
import { Users, UserPlus, ChevronLeft, Trash2, MessageCircle, Plus, Search, ChevronRight, Crown } from 'lucide-react';
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
    if (joinId) { joinTeam(joinId, '', ''); setShowJoin(false); setJoinId(''); }
  };

  const inputCls = 'w-full bg-app-fill rounded-[12px] py-3 px-4 text-[16px] text-text-primary placeholder:text-text-muted outline-none focus:bg-app-elevated transition-colors';

  const SheetModal = ({ visible, onClose, title, children }: any) => (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm"/>
          <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring',stiffness:300,damping:30}}
            className="relative w-full max-w-[440px] bg-app-card rounded-t-[28px] pb-10">
            <div className="flex justify-center pt-3 pb-4">
              <div className="w-10 h-[5px] bg-app-elevated rounded-full" />
            </div>
            <div className="px-5 pb-2">
              <h2 className="text-[20px] font-semibold text-text-primary mb-5">{title}</h2>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="h-full flex flex-col bg-app-bg">
      <header className="h-[56px] px-5 flex items-center bg-app-bg/90 backdrop-blur-md border-b border-app-border sticky top-0 z-50">
        <Link to="/profile" className="text-[17px] text-brand-primary font-normal mr-auto">‹ Account</Link>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-text-primary">My Team</h1>
      </header>

      <div className="flex-1 scrollable-content px-4 py-5 pb-10">
        {!team ? (
          /* No team state */
          <div className="flex flex-col items-center justify-center min-h-[65vh] gap-8">
            <div className="text-center space-y-3">
              <div className="w-[88px] h-[88px] bg-brand-primary/10 border border-brand-primary/20 rounded-[28px] flex items-center justify-center mx-auto shadow-xl shadow-brand-primary/10">
                <Users size={40} className="text-brand-primary" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-[22px] font-semibold text-text-primary tracking-[-0.5px]">Squad Up!</h2>
                <p className="text-[15px] text-text-secondary font-normal max-w-[240px] mx-auto leading-relaxed">
                  Compete in team tournaments and dominate the leaderboard
                </p>
              </div>
            </div>
            <div className="w-full space-y-3">
              <button onClick={() => setShowCreate(true)}
                className="w-full flex items-center gap-4 p-5 bg-brand-primary/8 border border-brand-primary/20 rounded-[18px] active:opacity-70 transition-opacity text-left">
                <div className="w-12 h-12 bg-brand-primary/15 rounded-2xl flex items-center justify-center shrink-0">
                  <Plus size={24} className="text-brand-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-[16px] font-semibold text-text-primary">Create Team</p>
                  <p className="text-[13px] text-text-muted font-normal mt-0.5">Start your own legacy</p>
                </div>
                <ChevronRight size={17} className="text-text-muted" />
              </button>
              <button onClick={() => setShowJoin(true)}
                className="w-full flex items-center gap-4 p-5 bg-app-card border border-app-border rounded-[18px] active:opacity-70 transition-opacity text-left">
                <div className="w-12 h-12 bg-brand-cyan/15 rounded-2xl flex items-center justify-center shrink-0">
                  <Search size={24} className="text-brand-cyan" />
                </div>
                <div className="flex-1">
                  <p className="text-[16px] font-semibold text-text-primary">Join Team</p>
                  <p className="text-[13px] text-text-muted font-normal mt-0.5">Find your perfect squad</p>
                </div>
                <ChevronRight size={17} className="text-text-muted" />
              </button>
            </div>
          </div>
        ) : (
          /* Team view */
          <div className="space-y-5">
            {/* Team card */}
            <div className="relative rounded-[22px] overflow-hidden p-5"
              style={{ background:'linear-gradient(145deg,#1a1a2e,#16213e,#0f3460)', border:'1px solid rgba(94,92,230,0.2)' }}>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none"/>
              <div className="relative space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-13 h-13 bg-white/15 rounded-2xl flex items-center justify-center border border-white/20 p-3">
                    <Users size={22} className="text-white" />
                  </div>
                  <div className="flex gap-2">
                    {[MessageCircle, UserPlus].map((Icon, i) => (
                      <button key={i} className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center border border-white/15 text-white active:opacity-70 transition-opacity">
                        <Icon size={16} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="text-[22px] font-bold text-white tracking-[-0.5px]">{team.name}</h2>
                  <p className="text-[13px] text-white/45 font-normal mt-0.5">Team ID: #{team.id}</p>
                </div>
                <div className="flex gap-3">
                  {[{l:'Members',v:`${team.members.length}/5`},{l:'Tag',v:team.tag}].map(s=>(
                    <div key={s.l} className="flex-1 bg-white/8 rounded-2xl p-3 border border-white/8">
                      <p className="text-[10px] font-medium text-white/35 uppercase tracking-wide mb-1">{s.l}</p>
                      <p className="text-[15px] font-semibold text-white">{s.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Members */}
            <section className="space-y-2">
              <p className="ios-section-header">Team Members</p>
              <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
                {team.members.map((m, i) => (
                  <motion.div key={m.id}
                    initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}}
                    className="flex items-center gap-3.5 px-4 py-3.5 active:bg-app-elevated transition-colors">
                    <div className="relative shrink-0">
                      <LetterAvatar name={m.username} size="sm" />
                      {m.role==='Leader' && (
                        <Crown size={10} className="absolute -top-1.5 -right-1.5 text-brand-gold fill-brand-gold" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[16px] font-normal text-text-primary truncate">{m.username}</p>
                      <p className="text-[13px] text-text-muted font-normal mt-0.5">{m.role} · {m.rank}</p>
                    </div>
                    {m.role!=='Leader' && (
                      <button className="w-8 h-8 flex items-center justify-center text-text-muted active:text-brand-live transition-colors">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>

            <button onClick={leaveTeam}
              className="w-full py-3.5 bg-app-card rounded-[16px] text-brand-live text-[16px] font-normal active:opacity-70 transition-opacity border border-app-border">
              Leave Team
            </button>
          </div>
        )}
      </div>

      {/* Create modal */}
      <SheetModal visible={showCreate} onClose={() => setShowCreate(false)} title="Create Team">
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="space-y-1"><label className="text-[13px] text-text-secondary font-normal">Team Name</label>
            <input type="text" value={teamName} onChange={e=>setTeamName(e.target.value)} className={inputCls} placeholder="e.g. Elite Squad" required/></div>
          <div className="space-y-1"><label className="text-[13px] text-text-secondary font-normal">Team Tag (max 5)</label>
            <input type="text" value={teamTag} onChange={e=>setTeamTag(e.target.value.toUpperCase())} maxLength={5} className={inputCls} placeholder="e.g. ELITE" required/></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={()=>setShowCreate(false)}
              className="flex-1 py-3.5 bg-app-elevated rounded-[14px] text-text-primary text-[16px] font-medium active:opacity-70 transition-opacity border border-app-border">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-3.5 bg-brand-primary rounded-[14px] text-white text-[16px] font-semibold active:opacity-75 transition-opacity shadow-lg shadow-brand-primary/20">
              Create
            </button>
          </div>
        </form>
      </SheetModal>

      {/* Join modal */}
      <SheetModal visible={showJoin} onClose={() => setShowJoin(false)} title="Join Team">
        <form onSubmit={handleJoin} className="space-y-3">
          <div className="space-y-1"><label className="text-[13px] text-text-secondary font-normal">Team ID</label>
            <input type="text" value={joinId} onChange={e=>setJoinId(e.target.value.toUpperCase())} className={inputCls} placeholder="e.g. ELITE-9921" required/></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={()=>setShowJoin(false)}
              className="flex-1 py-3.5 bg-app-elevated rounded-[14px] text-text-primary text-[16px] font-medium active:opacity-70 transition-opacity border border-app-border">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-3.5 bg-brand-primary rounded-[14px] text-white text-[16px] font-semibold active:opacity-75 transition-opacity shadow-lg shadow-brand-primary/20">
              Join
            </button>
          </div>
        </form>
      </SheetModal>
    </div>
  );
}
