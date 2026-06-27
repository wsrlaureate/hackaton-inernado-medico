import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Stethoscope, 
  Scissors, 
  Baby, 
  Activity, 
  HeartPulse, 
  Hospital as HospitalIcon, 
  Trophy, 
  User, 
  ChevronRight, 
  MessageSquare, 
  ClipboardList, 
  Thermometer, 
  Heart, 
  Wind, 
  ArrowLeft,
  Send,
  CheckCircle2,
  XCircle,
  Lock,
  Search,
  MessageCircle,
  FlaskConical,
  Image as ImageIcon,
  Volume2,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  UserCircle,
  Camera
} from "lucide-react";
import { HOSPITALS, MEDICAL_AREAS, Hospital } from "./constants";
import { generateClinicalCase, getPatientResponse, getMentorAdvice, generateSpeech, getResponseWithAudio, generatePatientImage, ClinicalCase, PatientMessage, DiagnosticTest } from "./services/geminiService";

// --- Types ---
type GameState = "START" | "HOSPITAL_SELECT" | "DASHBOARD" | "SIMULATION" | "CONVERSATION" | "VOICE_CALL";

interface UserStats {
  score: number;
  level: number;
  areaScores: Record<string, number>;
  completedCases: string[];
}

// --- Components ---

const HospitalCard: React.FC<{ hospital: Hospital; onSelect: (h: Hospital) => void; isLocked: boolean }> = ({ hospital, onSelect, isLocked }) => (
  <motion.div
    whileHover={isLocked ? {} : { scale: 1.02 }}
    whileTap={isLocked ? {} : { scale: 0.98 }}
    onClick={() => !isLocked && onSelect(hospital)}
    className={`bg-white border-2 rounded-xl overflow-hidden cursor-pointer shadow-sm transition-all ${
      isLocked ? "border-slate-100 opacity-60 grayscale cursor-not-allowed" : "border-slate-200 hover:shadow-md"
    }`}
  >
    <div className="h-32 bg-slate-100 relative">
      <img src={hospital.image} alt={hospital.name} className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
      <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
        {hospital.type}
      </div>
      {isLocked && (
        <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
          <Lock className="text-white" size={32} />
        </div>
      )}
    </div>
    <div className="p-4">
      <h3 className="font-bold text-slate-800 text-sm leading-tight mb-1">{hospital.name}</h3>
      <p className="text-slate-500 text-xs line-clamp-2">{hospital.description}</p>
      {isLocked && (
        <p className="text-[10px] font-bold text-blue-600 mt-2 uppercase tracking-widest">
          Desbloquea con {hospital.minScoreToUnlock} XP
        </p>
      )}
    </div>
  </motion.div>
);

const StatBadge = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) => (
  <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
    <div className={`p-2 rounded-md ${color}`}>
      <Icon size={18} className="text-white" />
    </div>
    <div>
      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{label}</p>
      <p className="text-sm font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

export default function App() {
  const [gameState, setGameState] = useState<GameState>("START");
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [stats, setStats] = useState<UserStats>({
    score: 0,
    level: 1,
    areaScores: { interna: 0, cirugia: 0, pediatria: 0, gineco: 0, emergencia: 0 },
    completedCases: [],
  });
  
  const [currentArea, setCurrentArea] = useState<string | null>(null);
  const [currentCase, setCurrentCase] = useState<ClinicalCase | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<PatientMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [simulationStep, setSimulationStep] = useState<"VITALES" | "HISTORIA" | "EXAMEN" | "EXAMENES" | "PREGUNTAS">("VITALES");
  const [orderedTests, setOrderedTests] = useState<string[]>([]);
  const [mentorAdvice, setMentorAdvice] = useState<string | null>(null);
  const [showMentor, setShowMentor] = useState(false);
  const [mentorPersonality, setMentorPersonality] = useState<string>("docil");
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [patientImage, setPatientImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioRequestId = useRef<number>(0);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContextRef.current;
  };

  const enableAudio = async () => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') await ctx.resume();
      setAudioEnabled(true);
      // Play a tiny beep to confirm
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 0.1;
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
      console.log("AudioContext resumed and test beep played.");
    } catch (e) {
      console.error("Error enabling audio:", e);
    }
  };

  const testSound = async () => {
    try {
      const ctx = getAudioContext();
      await ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error("Error testing sound:", e);
    }
  };
  const stopVoice = () => {
    audioRequestId.current += 1; // Cancela cualquier petición en curso
    if (audioRef.current) {
      try { (audioRef.current as any).stop(); } catch (e) {}
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setIsGeneratingAudio(false);
  };

  const playAudioData = async (base64Data: string) => {
    const requestId = audioRequestId.current;
    stopVoice();
    audioRequestId.current = requestId; // Mantener el ID para que esta función pase el check

    setIsSpeaking(true);
    setAudioError(null);
    try {
      // PROCESAMIENTO ASÍNCRONO DEL AUDIO
      const binaryString = atob(base64Data.trim());
      if (audioRequestId.current !== requestId) return; // ABORTAR SI SE CANCELÓ

      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const len = Math.floor(bytes.length / 2);
      const pcmData = new Int16Array(len);
      const view = new DataView(bytes.buffer);
      
      for (let i = 0; i < len; i++) {
        pcmData[i] = view.getInt16(i * 2, true);
      }

      const ctx = getAudioContext();
      if (ctx.state === 'suspended') await ctx.resume();
      if (audioRequestId.current !== requestId) return; // ABORTAR SI SE CANCELÓ
      
      const audioBuffer = ctx.createBuffer(1, len, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) {
        channelData[i] = pcmData[i] / 32768;
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      const gainNode = ctx.createGain();
      gainNode.gain.value = 1.5;
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      audioRef.current = source as any;
      source.onended = () => {
        setIsSpeaking(false);
        if (audioRef.current === source) audioRef.current = null;
      };
      
      if (audioRequestId.current === requestId) {
        source.start();
      }
    } catch (e) {
      console.error("Error playing audio data:", e);
      setIsSpeaking(false);
    }
  };

  const playVoice = async (text: string, voice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr') => {
    const requestId = ++audioRequestId.current;
    stopVoice();
    audioRequestId.current = requestId;

    setIsSpeaking(true);
    setIsGeneratingAudio(true);
    setAudioError(null);
    try {
      console.log("Generando voz para:", text.substring(0, 30) + "...");
      const base64Data = await generateSpeech(text, voice);
      if (audioRequestId.current !== requestId) return; // ABORTAR SI CAMBIÓ LA PETICIÓN
      
      setIsGeneratingAudio(false);
      if (!base64Data) throw new Error("No se pudo generar el audio");

      await playAudioData(base64Data);
    } catch (e) {
      console.error("Error playing voice:", e);
      setAudioError("Error de audio. Reintenta.");
      setIsSpeaking(false);
      setIsGeneratingAudio(false);
      audioRef.current = null;
    }
  };

  useEffect(() => {
    let interval: any;
    if (isTimerActive) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      clearInterval(interval);
      stopVoice();
    };
  }, [isTimerActive]);

  useEffect(() => {
    // Limpieza al cambiar de estado global
    if (gameState !== "VOICE_CALL") {
      stopVoice();
    }
  }, [gameState]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startSimulation = async (area: string) => {
    if (!selectedHospital) return;
    setLoading(true);
    setCurrentArea(area);
    const personalities = ["docil", "duro", "espeso"];
    const randomMentor = personalities[Math.floor(Math.random() * personalities.length)];
    setMentorPersonality(randomMentor);
    setTimer(0);
    
    try {
      const newCase = await generateClinicalCase(area, selectedHospital.level, selectedHospital.type);
      setCurrentCase(newCase);
      setGameState("SIMULATION");
      setSimulationStep("VITALES");
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setShowExplanation(false);
      setOrderedTests([]);
      setMentorAdvice(null);
      setShowMentor(false);
      setIsTimerActive(true);
      setPatientImage(null);
      
      // Generate patient image in background
      setIsGeneratingImage(true);
      generatePatientImage(newCase.patientDescription).then(img => {
        setPatientImage(img);
        setIsGeneratingImage(false);
      });
    } catch (error) {
      console.error("Error generating case:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMentorAdvice = async () => {
    if (!currentCase) return;
    setLoading(true);
    try {
      const advice = await getMentorAdvice(
        currentCase.title + ": " + currentCase.patientDescription, 
        simulationStep,
        mentorPersonality
      );
      setMentorAdvice(advice);
      setShowMentor(true);
      // Mentor voice: Fenrir or Charon (authoritative)
      playVoice(advice, mentorPersonality === 'docil' ? 'Zephyr' : 'Fenrir');
    } catch (error) {
      console.error("Error getting mentor advice:", error);
    } finally {
      setLoading(false);
    }
  };

  const startConversation = () => {
    const initialText = "Hola doctor... me siento un poco mal.";
    setMessages([
      { role: "patient", content: initialText }
    ]);
    setGameState("VOICE_CALL");
    
    // Resume audio context to ensure immediate playback and satisfy browser requirements
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => console.log("AudioContext resumed in startConversation"));
      }
    } catch (e) {
      console.error("Error resuming AudioContext:", e);
    }
    
    // Trigger patient voice immediately when starting the call
    const voice = currentCase?.patientPersonality === 'ansioso' ? 'Puck' : 'Kore';
    playVoice(initialText, voice);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    // Resume audio context on user interaction
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    } catch (e) {
      console.error("Error resuming AudioContext:", e);
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setAudioError("Tu navegador no soporta reconocimiento de voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-PE';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setAudioError(null);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error("SpeechRecognition error:", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setAudioError("Permiso de micrófono denegado. Por favor, actívalo en tu navegador.");
      } else if (event.error === 'no-speech') {
        // Silently handle no-speech to avoid annoying alerts
      } else {
        setAudioError(`Error de voz: ${event.error}`);
      }
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleVoiceMessage(transcript);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error("Error starting recognition:", e);
      setIsListening(false);
    }
  };

  const handleVoiceMessage = async (text: string) => {
    if (!text.trim() || !currentCase || isWaitingForResponse) return;
    
    const newMessages: PatientMessage[] = [...messages, { role: "doctor", content: text }];
    setMessages(newMessages);
    setIsWaitingForResponse(true);
    
    const requestId = ++audioRequestId.current;
    
    try {
      const voice = currentCase.patientPersonality === 'ansioso' ? 'Puck' : 'Kore';
      const { text: response, audio } = await getResponseWithAudio(
        currentCase.history, 
        currentCase.patientPersonality, 
        newMessages,
        voice
      );
      
      if (audioRequestId.current !== requestId) return; // ABORTAR SI EL USUARIO SALIÓ O CAMBIÓ ALGO
      
      setMessages([...newMessages, { role: "patient", content: response }]);
      setIsWaitingForResponse(false);
      
      if (audio) {
        playAudioData(audio);
      } else {
        playVoice(response, voice);
      }
    } catch (error) {
      console.error("Error getting patient response:", error);
      setIsWaitingForResponse(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentCase || isWaitingForResponse) return;
    
    const newMessages: PatientMessage[] = [...messages, { role: "doctor", content: inputMessage }];
    setMessages(newMessages);
    setInputMessage("");
    setIsWaitingForResponse(true);
    
    const requestId = ++audioRequestId.current;
    
    try {
      const voice = currentCase.patientPersonality === 'ansioso' ? 'Puck' : 'Kore';
      const { text: response, audio } = await getResponseWithAudio(
        currentCase.history, 
        currentCase.patientPersonality, 
        newMessages,
        voice
      );
      
      if (audioRequestId.current !== requestId) return;
      
      setMessages([...newMessages, { role: "patient", content: response }]);
      setIsWaitingForResponse(false);
      
      if (audio) {
        playAudioData(audio);
      } else {
        playVoice(response, voice);
      }
    } catch (error) {
      console.error("Error getting patient response:", error);
      setIsWaitingForResponse(false);
    }
  };

  const handleAnswer = (index: number) => {
    if (showExplanation) return;
    setSelectedOption(index);
    setShowExplanation(true);
    
    if (index === currentCase?.questions[currentQuestionIndex].correctIndex) {
      // Time bonus: faster is better. Max bonus 50 points if under 60 seconds.
      const timeBonus = Math.max(0, 50 - Math.floor(timer / 10));
      const points = (100 * stats.level) + timeBonus;
      
      setStats(prev => ({
        ...prev,
        score: prev.score + points,
        areaScores: {
          ...prev.areaScores,
          [currentArea!]: prev.areaScores[currentArea!] + points
        }
      }));
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < (currentCase?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setIsTimerActive(false);
      setGameState("DASHBOARD");
      // Level up logic
      if (stats.score > stats.level * 1000) {
        setStats(prev => ({ ...prev, level: prev.level + 1 }));
      }
    }
  };

  // --- Renderers ---

  if (gameState === "START") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md"
        >
          <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/20 rotate-3">
            <Stethoscope size={48} className="text-white -rotate-3" />
          </div>
          <h1 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase italic">Internado Médico</h1>
          <p className="text-slate-400 mb-10 leading-relaxed">
            Prepárate para el reto más grande de tu carrera. Rotaciones reales, casos críticos y la presión de un hospital en Lima.
          </p>
          <button
            onClick={() => setGameState("HOSPITAL_SELECT")}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 group"
          >
            COMENZAR GUARDIA
            <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    );
  }

  if (gameState === "HOSPITAL_SELECT") {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto">
          <header className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic mb-2">Selecciona tu Hospital</h2>
            <p className="text-slate-500">Elige dónde realizarás tu internado. Cada hospital tiene sus propios desafíos.</p>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {HOSPITALS.map(h => (
              <HospitalCard 
                key={h.id} 
                hospital={h} 
                isLocked={stats.score < h.minScoreToUnlock}
                onSelect={(hospital) => {
                  setSelectedHospital(hospital);
                  setGameState("DASHBOARD");
                }} 
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "DASHBOARD") {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <HospitalIcon size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">{selectedHospital?.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sede de Internado</p>
              </div>
            </div>
            <div className="flex gap-2">
              {!audioEnabled ? (
                <button 
                  onClick={enableAudio}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase animate-pulse"
                >
                  <Volume2 size={14} />
                  Activar Audio
                </button>
              ) : (
                <button 
                  onClick={testSound}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase"
                >
                  <Volume2 size={14} />
                  Probar Sonido
                </button>
              )}
              <StatBadge icon={Trophy} label="Puntaje" value={stats.score} color="bg-amber-500" />
              <StatBadge icon={Activity} label="Nivel" value={stats.level} color="bg-emerald-500" />
            </div>
          </div>
        </div>

        <main className="max-w-5xl mx-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Areas Grid */}
            <div className="md:col-span-2">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Rotaciones Disponibles</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MEDICAL_AREAS.map(area => {
                  const Icon = ({
                    Stethoscope,
                    Scissors,
                    Baby,
                    HeartPulse,
                    Activity
                  } as any)[area.icon] || Stethoscope;
                  return (
                    <motion.div
                      key={area.id}
                      whileHover={{ y: -4 }}
                      onClick={() => startSimulation(area.id)}
                      className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm cursor-pointer hover:border-blue-200 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                          <Icon size={24} className="text-slate-600 group-hover:text-blue-600" />
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">XP Acumulada</p>
                          <p className="text-sm font-bold text-slate-800">{stats.areaScores[area.id]}</p>
                        </div>
                      </div>
                      <h5 className="font-bold text-slate-900 mb-1">{area.name}</h5>
                      <p className="text-xs text-slate-500">Haz clic para iniciar una simulación de caso clínico.</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative">
                <div className="relative z-10">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Perfil del Interno</h4>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                      <User size={24} />
                    </div>
                    <div>
                      <p className="font-bold">Walter R.</p>
                      <p className="text-xs text-slate-400">Interno de Medicina</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {MEDICAL_AREAS.map(area => (
                      <div key={area.id}>
                        <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                          <span>{area.name}</span>
                          <span>{Math.min(100, (stats.areaScores[area.id] / 1000) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (stats.areaScores[area.id] / 1000) * 100)}%` }}
                            className="h-full bg-blue-500" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 opacity-10">
                  <Stethoscope size={160} />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Logros Recientes</h4>
                <div className="space-y-4">
                  {stats.completedCases.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Aún no has completado guardias.</p>
                  ) : (
                    stats.completedCases.map((c, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <p className="text-xs font-medium text-slate-700">{c}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {loading && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white font-bold animate-pulse">PREPARANDO CASO CLÍNICO...</p>
              <p className="text-slate-400 text-xs mt-2 italic">Revisando guías de práctica clínica...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (gameState === "SIMULATION" && currentCase) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button onClick={() => { setGameState("DASHBOARD"); stopVoice(); }} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <h3 className="font-black text-slate-900 uppercase italic tracking-tight">{currentCase.title}</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                <Activity size={14} className="text-slate-600" />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                  {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                <Activity size={14} className="text-blue-600" />
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Simulación Activa</span>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 max-w-4xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Patient Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <User size={20} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Paciente</p>
                  <p className="font-bold text-slate-800">{currentCase.patientDescription}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                      currentCase.patientPersonality === 'colaborador' ? 'bg-emerald-100 text-emerald-700' :
                      currentCase.patientPersonality === 'irrespetuoso' ? 'bg-red-100 text-red-700' :
                      currentCase.patientPersonality === 'ansioso' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {currentCase.patientPersonality}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Thermometer size={12} />
                    <span className="text-[10px] font-bold uppercase">T°</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{currentCase.vitals.temp}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Heart size={12} />
                    <span className="text-[10px] font-bold uppercase">PA</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{currentCase.vitals.bp}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Activity size={12} />
                    <span className="text-[10px] font-bold uppercase">FC</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{currentCase.vitals.hr}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Wind size={12} />
                    <span className="text-[10px] font-bold uppercase">FR</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{currentCase.vitals.rr}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={startConversation}
              className="w-full bg-white border-2 border-blue-100 hover:border-blue-300 text-blue-600 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare size={18} />
              HABLAR CON PACIENTE
            </button>

            <div className="relative">
              <button 
                onClick={fetchMentorAdvice}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
              >
                <MessageCircle size={18} className="text-blue-400" />
                PEDIR CONSEJO AL JEFE
              </button>
              
              <AnimatePresence>
                {showMentor && mentorAdvice && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute bottom-full mb-4 left-0 right-0 bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-2xl z-20"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        mentorPersonality === 'duro' ? 'bg-red-600' : 
                        mentorPersonality === 'espeso' ? 'bg-amber-600' : 'bg-slate-900'
                      }`}>
                        <User size={16} className="text-white" />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Dr. Jefe de Internos</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Personalidad: {mentorPersonality}</p>
                      </div>
                      {isSpeaking && <Volume2 size={16} className="text-blue-500 animate-pulse" />}
                      {isGeneratingAudio && <div className="text-[8px] text-blue-500 font-bold animate-pulse ml-2">GENERANDO AUDIO...</div>}
                      <button onClick={() => { setShowMentor(false); stopVoice(); }} className="ml-auto text-slate-400 hover:text-slate-600">
                        <XCircle size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed italic">"{mentorAdvice}"</p>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b-2 border-r-2 border-slate-900 rotate-45" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Steps and Content */}
          <div className="md:col-span-2 space-y-4">
            {/* Steps Nav */}
            <div className="space-y-2">
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${
                      simulationStep === "VITALES" ? 20 :
                      simulationStep === "HISTORIA" ? 40 :
                      simulationStep === "EXAMEN" ? 60 :
                      simulationStep === "EXAMENES" ? 80 : 100
                    }%` 
                  }}
                  className="h-full bg-blue-600"
                />
              </div>
              <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm overflow-x-auto">
                {(["VITALES", "HISTORIA", "EXAMEN", "EXAMENES", "PREGUNTAS"] as const).map(step => (
                  <button
                    key={step}
                    onClick={() => setSimulationStep(step)}
                    className={`flex-1 py-2 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${
                      simulationStep === step ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {step}
                  </button>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[300px]">
              <AnimatePresence mode="wait">
                {simulationStep === "VITALES" && (
                  <motion.div key="vitales" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <ClipboardList size={18} className="text-blue-500" />
                      Funciones Vitales
                    </h4>
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-sm text-slate-600 leading-relaxed">
                          Al ingreso, el paciente presenta {currentCase.vitals.temp} de temperatura, una presión arterial de {currentCase.vitals.bp} y frecuencia cardíaca de {currentCase.vitals.hr}. La saturación de oxígeno se encuentra en {currentCase.vitals.sat}.
                        </p>
                      </div>
                      <p className="text-xs text-slate-400 italic">Analiza estos valores antes de proceder con la anamnesis.</p>
                    </div>
                  </motion.div>
                )}

                {simulationStep === "HISTORIA" && (
                  <motion.div key="historia" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <ClipboardList size={18} className="text-blue-500" />
                      Anamnesis / Historia Clínica
                    </h4>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{currentCase.history}</p>
                    </div>
                  </motion.div>
                )}

                {simulationStep === "EXAMEN" && (
                  <motion.div key="examen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <ClipboardList size={18} className="text-blue-500" />
                      Examen Físico Dirigido
                    </h4>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{currentCase.physicalExam}</p>
                    </div>
                  </motion.div>
                )}

                {simulationStep === "EXAMENES" && (
                  <motion.div key="examenes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <FlaskConical size={18} className="text-blue-500" />
                      Exámenes Auxiliares
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      {currentCase.diagnosticTests.map((test) => {
                        const isOrdered = orderedTests.includes(test.id);
                        return (
                          <div key={test.id} className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                            <div className="p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg border border-slate-200">
                                  {test.name.toLowerCase().includes("radio") || test.name.toLowerCase().includes("eco") ? (
                                    <ImageIcon size={16} className="text-slate-500" />
                                  ) : (
                                    <FlaskConical size={16} className="text-slate-500" />
                                  )}
                                </div>
                                <span className="text-sm font-bold text-slate-700">{test.name}</span>
                              </div>
                              {!isOrdered ? (
                                <button
                                  onClick={() => setOrderedTests(prev => [...prev, test.id])}
                                  className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  ORDENAR EXAMEN
                                </button>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                  <CheckCircle2 size={12} /> Resultados Listos
                                </span>
                              )}
                            </div>
                            {isOrdered && (
                              <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                className="px-4 pb-4 border-t border-slate-200 pt-3 bg-white"
                              >
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resultado</p>
                                    <p className="text-sm text-slate-700 font-medium">{test.result}</p>
                                  </div>
                                  <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Interpretación</p>
                                    <p className="text-xs text-blue-800 leading-relaxed italic">{test.interpretation}</p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {simulationStep === "PREGUNTAS" && (
                  <motion.div key="preguntas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <Trophy size={18} className="text-amber-500" />
                        Evaluación Clínica
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">
                        Pregunta {currentQuestionIndex + 1} de {currentCase.questions.length}
                      </span>
                    </div>

                    <p className="font-bold text-slate-800 mb-6 leading-tight">{currentCase.questions[currentQuestionIndex].question}</p>

                    <div className="space-y-3">
                      {currentCase.questions[currentQuestionIndex].options.map((option, idx) => {
                        let style = "border-slate-200 hover:border-blue-300 hover:bg-blue-50";
                        let icon = null;

                        if (showExplanation) {
                          if (idx === currentCase.questions[currentQuestionIndex].correctIndex) {
                            style = "border-emerald-500 bg-emerald-50 text-emerald-700";
                            icon = <CheckCircle2 size={16} />;
                          } else if (idx === selectedOption) {
                            style = "border-red-500 bg-red-50 text-red-700";
                            icon = <XCircle size={16} />;
                          } else {
                            style = "border-slate-100 opacity-50";
                          }
                        }

                        return (
                          <button
                            key={idx}
                            disabled={showExplanation}
                            onClick={() => handleAnswer(idx)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${style}`}
                          >
                            <span className="text-sm font-medium">{option}</span>
                            {icon}
                          </button>
                        );
                      })}
                    </div>

                    {showExplanation && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 bg-slate-900 rounded-xl text-white"
                      >
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Fundamento Médico</p>
                        <p className="text-xs leading-relaxed opacity-90">{currentCase.questions[currentQuestionIndex].explanation}</p>
                        <button
                          onClick={nextQuestion}
                          className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                        >
                          {currentQuestionIndex < currentCase.questions.length - 1 ? "SIGUIENTE PREGUNTA" : "FINALIZAR GUARDIA"}
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>

        {/* Floating Mic Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={startConversation}
          className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl shadow-blue-600/40 flex items-center justify-center z-40 group"
          title="Hablar con el paciente"
        >
          <Mic size={28} className="group-hover:animate-pulse" />
          <div className="absolute -top-12 right-0 bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest">
            Hablar con Paciente
          </div>
        </motion.button>
      </div>
    );
  }

  if (gameState === "VOICE_CALL" && currentCase) {
    return (
      <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden">
        {/* Call Header */}
        <div className="p-4 flex items-center justify-between bg-slate-900/50 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <User size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm">{currentCase.patientName}</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">En Consulta Cara a Cara</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => { setGameState("SIMULATION"); stopVoice(); }}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {!audioEnabled && (
          <div className="bg-red-600 p-2 flex items-center justify-center gap-4">
            <p className="text-[10px] font-bold uppercase tracking-widest">El audio está desactivado</p>
            <button 
              onClick={enableAudio}
              className="bg-white text-red-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase"
            >
              Activar Audio
            </button>
          </div>
        )}

        {/* Main View: Face-to-Face */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-6">
          <div className="relative w-full max-w-md aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900">
            {patientImage ? (
              <img 
                src={patientImage} 
                alt="Paciente" 
                className={`w-full h-full object-cover transition-all duration-1000 ${isSpeaking ? 'scale-105 brightness-110' : 'scale-100'}`}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-500">
                {isGeneratingImage ? (
                  <>
                    <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-xs font-medium animate-pulse">Visualizando al paciente...</p>
                  </>
                ) : (
                  <>
                    <UserCircle size={80} strokeWidth={1} />
                    <p className="text-xs">Imagen no disponible</p>
                  </>
                )}
              </div>
            )}

            {/* Overlay Info */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
              <div className="flex flex-wrap gap-2 mb-3">
                {isSpeaking ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500 text-black text-[10px] font-black uppercase flex items-center gap-1.5 shadow-lg shadow-emerald-500/20">
                    <Volume2 size={12} className="animate-pulse" />
                    Paciente Hablando
                  </span>
                ) : isListening ? (
                  <span className="px-3 py-1 rounded-full bg-blue-500 text-white text-[10px] font-black uppercase flex items-center gap-1.5 shadow-lg shadow-blue-500/20 animate-pulse">
                    <Mic size={12} />
                    Escuchando...
                  </span>
                ) : isGeneratingAudio ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500 text-black text-[10px] font-black uppercase flex items-center gap-1.5 shadow-lg shadow-emerald-500/20">
                    <Volume2 size={12} className="animate-pulse" />
                    Generando Voz...
                  </span>
                ) : isWaitingForResponse ? (
                  <span className="px-3 py-1 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase flex items-center gap-1.5 shadow-lg shadow-amber-500/20">
                    <div className="w-2 h-2 bg-black rounded-full animate-bounce" />
                    Paciente Pensando
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase flex items-center gap-1.5 border border-white/10">
                    <MessageSquare size={12} />
                    Tu Turno
                  </span>
                )}
              </div>
              
              <div className="min-h-[60px] flex items-center">
                <p className="text-base md:text-lg text-white font-medium leading-tight drop-shadow-lg">
                  {isGeneratingAudio ? (
                    <span className="text-emerald-400 opacity-80 italic">"..."</span>
                  ) : isWaitingForResponse ? (
                    <span className="text-blue-400 opacity-80 italic">"..."</span>
                  ) : messages[messages.length - 1]?.role === 'patient' 
                    ? <span className="text-white">"{messages[messages.length - 1]?.content}"</span>
                    : messages[messages.length - 1]?.role === 'doctor'
                    ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-400 text-xs uppercase font-bold tracking-tighter">Tú preguntaste:</span>
                        <span className="text-slate-300 text-sm italic">"{messages[messages.length - 1]?.content}"</span>
                        {/* Show previous patient message if available */}
                        {messages[messages.length - 2]?.role === 'patient' && (
                          <span className="text-white/40 text-[10px] mt-2">Anterior: "{messages[messages.length - 2]?.content}"</span>
                        )}
                      </div>
                    )
                    : <span className="text-slate-500 text-sm">Inicia la conversación con el paciente.</span>}
                </p>
              </div>

              {/* Turn Indicator Overlay - Now a functional button with pulse effect */}
              {!isSpeaking && !isListening && !isWaitingForResponse && !isGeneratingAudio && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
                >
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleListening();
                    }}
                    className="pointer-events-auto bg-blue-600 hover:bg-blue-500 border-4 border-white/20 px-10 py-5 rounded-3xl flex flex-col items-center gap-3 shadow-2xl shadow-blue-600/60 animate-pulse transition-all active:scale-95 group cursor-pointer"
                  >
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Mic size={32} className="text-white" />
                    </div>
                    <div className="text-center">
                      <span className="block text-sm font-black text-white uppercase tracking-[0.2em]">Tu Turno</span>
                      <span className="block text-[10px] font-bold text-blue-200 uppercase tracking-widest mt-1">Pulsa para Hablar</span>
                    </div>
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {/* User Preview (Selfie-style) */}
          <div className="absolute bottom-10 right-10 w-24 h-32 rounded-xl bg-slate-800 border-2 border-white/20 shadow-lg overflow-hidden hidden md:block">
            <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900">
              <Camera size={24} />
            </div>
            <div className="absolute bottom-1 left-1 right-1 bg-black/40 backdrop-blur-sm rounded px-1 py-0.5">
              <p className="text-[8px] font-bold uppercase text-center">Tú (Interno)</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-8 bg-slate-900/80 backdrop-blur-xl border-t border-white/10">
          <div className="max-w-md mx-auto flex items-center justify-around">
            <button 
              onClick={() => setGameState("SIMULATION")}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/20 transition-transform active:scale-95"
            >
              <PhoneOff size={24} />
            </button>
            
            <button 
              className="w-14 h-14 rounded-full bg-slate-800 hover:bg-slate-700 flex flex-col items-center justify-center border border-white/10 transition-transform active:scale-95"
              onClick={testSound}
            >
              <Volume2 size={24} />
              <span className="text-[6px] font-bold uppercase mt-1 text-slate-400">Test</span>
            </button>

            <button 
              onClick={toggleListening}
              disabled={isSpeaking || isWaitingForResponse || isGeneratingAudio}
              className={`w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 transform active:scale-90 ${
                isListening 
                  ? 'bg-emerald-500 animate-pulse shadow-emerald-500/40 scale-110' 
                  : (isSpeaking || isWaitingForResponse || isGeneratingAudio)
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-white text-slate-900 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              {isListening ? <Mic size={36} /> : <MicOff size={36} className={isSpeaking || isWaitingForResponse ? 'opacity-20' : ''} />}
              <span className={`text-[10px] font-black mt-2 uppercase tracking-tighter ${isListening ? 'text-white' : 'text-slate-400'}`}>
                {isListening ? 'Escuchando' : 'Pulsa para Hablar'}
              </span>
            </button>

            <button 
              className="w-14 h-14 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center border border-white/10 transition-transform active:scale-95"
              onClick={() => {
                const lastMsg = messages[messages.length - 1];
                if (lastMsg && lastMsg.role === 'patient') {
                  playVoice(lastMsg.content, 'Puck');
                }
              }}
            >
              <Volume2 size={24} />
            </button>
          </div>
          <p className="text-center mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            {isListening ? 'Escuchando tu voz...' : 'Pulsa el micro para hablar'}
          </p>
          {audioError && (
            <p className="text-center text-red-400 text-[10px] mt-2 font-bold uppercase tracking-widest animate-pulse">
              {audioError}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (gameState === "CONVERSATION" && currentCase) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="bg-white border-b border-slate-200 p-4">
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            <button onClick={() => setGameState("SIMULATION")} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Entrevista al Paciente</h3>
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">En línea {isSpeaking && "• Hablando..."}</p>
              </div>
            </div>
            {isSpeaking && <Volume2 size={20} className="text-blue-500 animate-pulse" />}
          </div>
        </div>

        <div className="flex-1 max-w-2xl w-full mx-auto p-4 overflow-y-auto space-y-4">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: m.role === "doctor" ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${m.role === "doctor" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                m.role === "doctor" 
                  ? "bg-blue-600 text-white rounded-tr-none" 
                  : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
              }`}>
                <p className="text-sm leading-relaxed">{m.content}</p>
              </div>
            </motion.div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="bg-white border-t border-slate-200 p-4">
          <div className="max-w-2xl mx-auto flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Hazle una pregunta al paciente..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-colors shadow-lg shadow-blue-600/20"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
