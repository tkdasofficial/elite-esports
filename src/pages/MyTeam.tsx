import React, { useState } from 'react';
import { useUserStore } from '@/src/store/userStore';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { LetterAvatar } from '@/src/components/ui/LetterAvatar';
import { 
  Users, 
  UserPlus, 
  Shield, 
  ChevronLeft, 
  Trash2, 
  MessageCircle, 
  Plus, 
  Search, 
  ArrowRight, 
  Trophy, 
  Target 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export default function MyTeam() {
  const { team, createTeam, joinTeam, leaveTeam } = useUserStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamTag, setTeamTag] = useState('');
  const [joinId, setJoinId] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName && teamTag) {
      createTeam(teamName, teamTag);
      setShowCreateModal(false);
      setTeamName('');
      setTeamTag('');
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinId) {
      joinTeam(joinId);
      setShowJoinModal(false);
      setJoinId('');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <header className="h-16 px-6 flex items-center gap-4 bg-brand-dark/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
        <Link to="/profile" className="p-2.5 bg-white/5 rounded-full text-slate-300 active:scale-90 transition-transform">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-xl font-black tracking-tight">My Team</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scrollbar-hide pb-10">
        {!team ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12">
            <div className="text-center space-y-4">
              <div className="relative mx-auto">
                <div className="w-24 h-24 bg-brand-blue/10 rounded-[32px] flex items-center justify-center text-brand-blue shadow-2xl shadow-brand-blue/10 border border-brand-blue/20 relative z-10">
                  <Users size={44} />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-brand-yellow rounded-xl flex items-center justify-center text-black shadow-lg z-20 animate-bounce">
                  <Plus size={16} strokeWidth={3} />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tight">Squad Up!</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] max-w-[260px] mx-auto leading-relaxed">
                  Compete in team tournaments and dominate the leaderboard with your squad
                </p>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 gap-4">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateModal(true)}
                className="w-full p-6 bg-brand-card/40 border border-white/5 rounded-[28px] hover:border-brand-blue/50 transition-all text-left group relative overflow-hidden shadow-xl"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-brand-blue/10 transition-colors" />
                <div className="flex items-center gap-5 relative">
                  <div className="w-14 h-14 bg-brand-blue/10 rounded-2xl flex items-center justify-center text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-all duration-300">
                    <Plus size={28} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="text-lg font-black tracking-tight">Create Team</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Start your own legacy</p>
                  </div>
                  <ArrowRight className="text-slate-700 group-hover:text-brand-blue group-hover:translate-x-1 transition-all" size={24} />
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowJoinModal(true)}
                className="w-full p-6 bg-brand-card/40 border border-white/5 rounded-[28px] hover:border-indigo-500/50 transition-all text-left group relative overflow-hidden shadow-xl"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
                <div className="flex items-center gap-5 relative">
                  <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                    <Search size={28} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="text-lg font-black tracking-tight">Join Team</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Find your perfect squad</p>
                  </div>
                  <ArrowRight className="text-slate-700 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" size={24} />
                </div>
              </motion.button>
            </div>
          </div>
        ) : (
          <>
            {/* Team Info Card */}
            <section>
              <Card className="p-6 bg-gradient-to-br from-brand-blue to-indigo-600 border-none shadow-2xl shadow-brand-blue/20 rounded-[32px] space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/20 rounded-full -ml-12 -mb-12 blur-2xl" />
                
                <div className="relative flex items-center justify-between">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-[24px] flex items-center justify-center border border-white/20 shadow-inner">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex gap-2">
                    <button className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-white active:scale-90 transition-transform hover:bg-white/20">
                      <MessageCircle size={18} />
                    </button>
                    <button className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-white active:scale-90 transition-transform hover:bg-white/20">
                      <UserPlus size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="relative space-y-1">
                  <h2 className="text-2xl font-black text-white tracking-tight">{team.name}</h2>
                  <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Team ID: #{team.id}</p>
                </div>

                <div className="relative flex gap-4">
                  <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-1">Members</p>
                    <p className="text-sm font-black text-white">{team.members.length} / 5</p>
                  </div>
                  <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-1">Tag</p>
                    <p className="text-sm font-black text-white">{team.tag}</p>
                  </div>
                </div>
              </Card>
            </section>

            {/* Members List */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">TEAM MEMBERS</h3>
                <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">{team.members.length} Active</span>
              </div>

              <div className="space-y-3 pb-4">
                {team.members.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-4 flex items-center justify-between bg-brand-card/40 border-none shadow-lg hover:bg-white/5 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <LetterAvatar name={member.username} size="md" variant={member.role === 'Leader' ? 'yellow' : 'slate'} />
                          {member.role === 'Leader' && (
                            <div className="absolute -top-1 -right-1 bg-brand-yellow p-1 rounded-full border-2 border-brand-dark">
                              <Shield size={10} className="text-black" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black tracking-tight">{member.username}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{member.role} • {member.rank}</p>
                        </div>
                      </div>
                      {member.role !== 'Leader' && (
                        <button className="p-2.5 bg-white/5 rounded-xl text-slate-600 hover:text-brand-red transition-all active:scale-90">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
            </section>

            <div className="pb-8">
              <Button
                variant="secondary"
                fullWidth
                size="lg"
                onClick={leaveTeam}
                className="rounded-2xl font-black uppercase tracking-widest text-xs py-4 border-white/5 bg-brand-card/40 hover:bg-brand-red/10 hover:text-brand-red hover:border-brand-red/20 transition-all"
              >
                Leave Team
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Create Team Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-brand-dark border border-white/10 rounded-[32px] p-8 space-y-8 shadow-2xl"
            >
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-black tracking-tight">Create Team</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Build your squad from scratch</p>
              </div>

              <form onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
                      <Trophy size={12} className="text-brand-blue" /> Team Name
                    </label>
                    <input 
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full bg-brand-card/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-black tracking-tight focus:outline-none focus:border-brand-blue transition-all shadow-inner"
                      placeholder="e.g. Elite Squad"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
                      <Target size={12} className="text-brand-blue" /> Team Tag
                    </label>
                    <input 
                      type="text"
                      value={teamTag}
                      onChange={(e) => setTeamTag(e.target.value.toUpperCase())}
                      maxLength={5}
                      className="w-full bg-brand-card/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-black tracking-tight focus:outline-none focus:border-brand-blue transition-all shadow-inner"
                      placeholder="e.g. ELITE"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-2xl font-black uppercase tracking-widest text-[10px] py-4 border-white/5"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    fullWidth
                    className="rounded-2xl font-black uppercase tracking-widest text-[10px] py-4 shadow-xl shadow-brand-blue/20"
                  >
                    Create
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Join Team Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-brand-dark border border-white/10 rounded-[32px] p-8 space-y-8 shadow-2xl"
            >
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-black tracking-tight">Join Team</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enter a Team ID to join</p>
              </div>

              <form onSubmit={handleJoin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
                    <Users size={12} className="text-brand-blue" /> Team ID
                  </label>
                  <input 
                    type="text"
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                    className="w-full bg-brand-card/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-black tracking-tight focus:outline-none focus:border-brand-blue transition-all shadow-inner"
                    placeholder="e.g. ELITE-9921"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    onClick={() => setShowJoinModal(false)}
                    className="rounded-2xl font-black uppercase tracking-widest text-[10px] py-4 border-white/5"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    fullWidth
                    className="rounded-2xl font-black uppercase tracking-widest text-[10px] py-4 shadow-xl shadow-brand-blue/20"
                  >
                    Join
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
