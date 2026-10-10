'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

export default function BattleLobby() {
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [mode, setMode] = useState<'random' | 'private'>('random');
  const [privateRoomId, setPrivateRoomId] = useState<string | null>(null);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [roomError, setRoomError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserId(payload.id);
    }
    
    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Properly clean up existing socket when unmounting or when socket state changes
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  const connectAndSetupSocket = (): Promise<Socket> => {
    return new Promise((resolve) => {
      if (socket && socket.connected) {
        resolve(socket);
        return;
      }
      
      const newSocket = io('http://localhost:5000');
      
      newSocket.on('connect', () => {
        setSocket(newSocket);
        resolve(newSocket);
      });

      newSocket.on('match_found', (data) => {
        console.log('Match found!', data);
        setIsSearching(false);
        setPrivateRoomId(null);
        localStorage.setItem('battle_data', JSON.stringify(data));
        router.push(`/dashboard/battle/${data.battleId}`);
      });

      newSocket.on('private_room_created', (data) => {
        setPrivateRoomId(data.roomId);
      });

      newSocket.on('room_error', (data) => {
        setRoomError(data.message);
        setIsSearching(false);
        newSocket.disconnect();
        setSocket(null);
      });
    });
  };

  const findMatch = async () => {
    if (!userId) return;
    setIsSearching(true);
    const activeSocket = await connectAndSetupSocket();
    activeSocket.emit('join_queue', { userId });
  };

  const cancelSearch = () => {
    if (socket) {
      socket.emit('leave_queue');
      socket.disconnect();
      setSocket(null);
    }
    setIsSearching(false);
  };

  const createRoom = async () => {
    if (!userId) return;
    setRoomError('');
    const activeSocket = await connectAndSetupSocket();
    activeSocket.emit('create_private_room', { userId });
  };

  const cancelRoom = () => {
    if (socket && privateRoomId) {
      socket.emit('cancel_private_room', { roomId: privateRoomId });
      socket.disconnect();
      setSocket(null);
    }
    setPrivateRoomId(null);
  };

  const joinRoom = async () => {
    if (!userId || !joinRoomId.trim()) return;
    setRoomError('');
    setIsSearching(true);
    const activeSocket = await connectAndSetupSocket();
    activeSocket.emit('join_private_room', { userId, roomId: joinRoomId.trim().toUpperCase() });
  };

  const copyRoomId = () => {
    if (privateRoomId) {
      navigator.clipboard.writeText(privateRoomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col w-full relative min-h-[calc(100vh-140px)]">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div className="max-w-4xl mx-auto py-space-xl w-full px-gutter">
        <div className="text-center mb-space-xl">
          <div className="inline-flex items-center gap-space-xs px-space-md py-space-xs bg-surface-container-highest rounded-full shadow-sm mb-space-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
            <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest font-bold">1v1 Ranked Competitive Duel • Node 09-APTI</span>
          </div>
          <h1 className="font-display text-display text-on-surface tracking-tight mt-2">1v1 Battle Arena</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-xl mx-auto">Challenge other students in real-time competitive aptitude matching. Rise through the ranks.</p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-xl max-w-2xl w-full mx-auto relative overflow-hidden border border-surface-variant">
          {/* Mode Selector */}
          <div className="flex p-1 bg-surface-container rounded-lg mb-space-lg relative z-10 shadow-inner">
            <button
              onClick={() => { setMode('random'); setRoomError(''); setPrivateRoomId(null); setIsSearching(false); }}
              className={`flex-1 py-3 px-4 rounded font-label-md text-label-md uppercase tracking-wider flex items-center justify-center transition-all ${
                mode === 'random' ? 'bg-surface-container-lowest text-primary shadow-sm font-bold' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] mr-2">public</span>
              Random Match
            </button>
            <button
              onClick={() => { setMode('private'); setRoomError(''); setIsSearching(false); }}
              className={`flex-1 py-3 px-4 rounded font-label-md text-label-md uppercase tracking-wider flex items-center justify-center transition-all ${
                mode === 'private' ? 'bg-surface-container-lowest text-secondary shadow-sm font-bold' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] mr-2">group</span>
              Play with Friend
            </button>
          </div>

          {roomError && (
            <div className="mb-6 p-4 bg-error-container/40 text-error rounded-lg font-body-sm text-body-sm relative z-10 flex items-center">
               <span className="material-symbols-outlined text-base mr-2">error</span>
              {roomError}
            </div>
          )}

          {mode === 'random' && (
            <div className="text-center relative z-10">
              <div className="grid grid-cols-2 gap-space-sm pt-space-md mb-10 bg-surface-container-low rounded-xl p-space-md">
                <div className="flex flex-col border-r border-outline-variant/20">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">CURRENT MMR</span>
                  <span className="font-headline-sm text-headline-sm text-primary">1,840 (Diamond II)</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">WIN RATE</span>
                  <span className="font-headline-sm text-headline-sm text-secondary">64.5%</span>
                </div>
              </div>

              {isSearching ? (
                <div className="space-y-6 flex flex-col items-center py-4 bg-surface-container-low rounded-xl p-space-lg shadow-inner">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping"></div>
                    <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[40px] animate-spin">sync</span>
                    </div>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">Finding Matched Opponent</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Searching within ±50 MMR. Maintaining quiet focus...</p>
                  
                  <button 
                    onClick={cancelSearch}
                    className="w-full py-space-xs rounded-lg bg-surface-container-highest text-on-surface font-label-lg text-label-lg hover:bg-surface-dim transition-colors"
                  >
                    Cancel Matchmaking
                  </button>
                </div>
              ) : (
                <button 
                  onClick={findMatch}
                  className="w-full py-4 rounded-xl bg-primary text-on-primary font-headline-sm text-headline-sm shadow-sm hover:bg-primary-container transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[24px]">swords</span>
                  FIND OPPONENT NOW
                </button>
              )}
            </div>
          )}

          {mode === 'private' && (
            <div className="relative z-10">
              {privateRoomId ? (
                <div className="text-center py-8 flex flex-col items-center">
                  <div className="relative flex items-center justify-center w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-2 border-secondary/20 animate-ping"></div>
                    <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                      <span className="material-symbols-outlined text-[32px]">vpn_key</span>
                    </div>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">Chamber Created</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">Share this 6-digit passcode with your challenger.</p>
                  
                  <div className="flex items-center justify-center space-x-3 mb-8 w-full max-w-sm">
                    <div className="flex-1 bg-surface-container border-2 border-surface-container-high px-8 py-4 rounded-xl font-display text-[28px] tracking-widest text-secondary font-bold flex items-center justify-center h-[72px]">
                      {privateRoomId}
                    </div>
                    <button 
                      onClick={copyRoomId}
                      className="w-[72px] h-[72px] flex items-center justify-center bg-surface-container text-on-surface-variant hover:text-secondary hover:bg-surface-container-high rounded-xl transition-colors shadow-sm"
                      title="Copy Code"
                    >
                      <span className="material-symbols-outlined text-[24px]">{copied ? 'check' : 'content_copy'}</span>
                    </button>
                  </div>
                  
                  <button 
                    onClick={cancelRoom}
                    className="font-label-md text-label-md text-error hover:text-on-error-container uppercase tracking-wider transition-colors px-6 py-2 rounded bg-error-container/30 hover:bg-error-container/60"
                  >
                    DISBAND CHAMBER
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="p-8 border-2 border-dashed border-outline-variant/60 rounded-2xl text-center hover:border-secondary hover:bg-surface-container-low transition-colors cursor-pointer group" onClick={createRoom}>
                    <div className="w-14 h-14 bg-secondary-container/40 text-on-secondary-container rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                       <span className="material-symbols-outlined text-[24px]">add_circle</span>
                    </div>
                    <h3 className="font-title-md text-title-md text-on-surface font-semibold mb-2">Host Chamber</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mx-auto">Generate a direct 6-digit lobby passcode for a private match.</p>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/40"></div></div>
                    <div className="relative flex justify-center"><span className="bg-surface-container-lowest px-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">OR</span></div>
                  </div>

                  <div className="bg-surface-container-low p-6 rounded-2xl shadow-sm border border-surface-variant">
                    <h3 className="font-label-md text-label-md text-primary mb-4 uppercase tracking-wider">Join Chamber</h3>
                    <div className="flex space-x-3">
                      <input 
                        type="text" 
                        value={joinRoomId}
                        onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                        placeholder="ENTER PIN"
                        maxLength={6}
                        className="flex-1 bg-surface-container-lowest border border-outline-variant/50 px-4 py-3 rounded-xl font-headline-sm text-headline-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none uppercase tracking-widest text-center text-on-surface shadow-inner"
                      />
                      <button 
                        onClick={joinRoom}
                        disabled={isSearching || joinRoomId.length !== 6}
                        className="bg-primary text-on-primary px-8 py-3 rounded-xl font-label-lg text-label-lg hover:bg-primary-container disabled:opacity-50 transition-colors shadow-sm"
                      >
                        JOIN
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
