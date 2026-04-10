// // // "use client";
// // // import { useState } from "react";
// // // import { useRouter } from "next/navigation";
// // // import { motion } from "framer-motion";
// // // import { Mic, Brain, BarChart3, Shield, ArrowRight, Star } from "lucide-react";

// // // export default function LandingPage() {
// // //   const [name, setName] = useState("");
// // //   const [email, setEmail] = useState("");
// // //   const router = useRouter();

// // //   const handleStart = () => {
// // //     if (!name.trim() || !email.trim()) return;
// // //     localStorage.setItem("candidate_name", name);
// // //     localStorage.setItem("candidate_email", email);
// // //     router.push("/interview");
// // //   };

// // //   return (
// // //     <div className="min-h-screen gradient-bg flex flex-col">
// // //       {/* Header */}
// // //       <header className="p-6 flex items-center justify-between">
// // //         <div className="flex items-center gap-2">
// // //           <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
// // //             <Brain size={18} className="text-white" />
// // //           </div>
// // //           <span className="font-bold text-white text-lg">Cuemath</span>
// // //         </div>
// // //         <span className="text-purple-400 text-sm glass px-3 py-1 rounded-full">
// // //           AI Tutor Screener
// // //         </span>
// // //       </header>

// // //       {/* Hero */}
// // //       <main className="flex-1 flex items-center justify-center px-4">
// // //         <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

// // //           {/* Left — Hero Text */}
// // //           <motion.div
// // //             initial={{ opacity: 0, x: -40 }}
// // //             animate={{ opacity: 1, x: 0 }}
// // //             transition={{ duration: 0.7 }}
// // //           >
// // //             <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-6">
// // //               <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
// // //               <span className="text-green-400 text-sm">AI Interviewer Active</span>
// // //             </div>

// // //             <h1 className="text-5xl font-bold text-white leading-tight mb-4">
// // //               Meet Maya —
// // //               <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-orange-400">
// // //                 {" "}Your AI Interviewer
// // //               </span>
// // //             </h1>

// // //             <p className="text-gray-400 text-lg mb-8 leading-relaxed">
// // //               A 5-minute voice interview that assesses communication, 
// // //               warmth, and teaching ability. Instant structured report. 
// // //               Fair, consistent, and human-like.
// // //             </p>

// // //             {/* Stats */}
// // //             <div className="grid grid-cols-3 gap-4 mb-8">
// // //               {[
// // //                 { value: "5 min", label: "Interview" },
// // //                 { value: "5 dims", label: "Assessed" },
// // //                 { value: "100%", label: "Objective" },
// // //               ].map((stat) => (
// // //                 <div key={stat.label} className="glass rounded-xl p-4 text-center">
// // //                   <div className="text-2xl font-bold text-purple-400">{stat.value}</div>
// // //                   <div className="text-gray-400 text-sm">{stat.label}</div>
// // //                 </div>
// // //               ))}
// // //             </div>

// // //             {/* Features */}
// // //             <div className="space-y-3">
// // //               {[
// // //                 { icon: Mic, text: "Real voice conversation — speak naturally" },
// // //                 { icon: Brain, text: "Adaptive AI questions based on your answers" },
// // //                 { icon: BarChart3, text: "Detailed scored report across 5 dimensions" },
// // //                 { icon: Shield, text: "Fair, unbiased, consistent every time" },
// // //               ].map(({ icon: Icon, text }) => (
// // //                 <div key={text} className="flex items-center gap-3">
// // //                   <div className="w-8 h-8 rounded-lg bg-purple-900 flex items-center justify-center flex-shrink-0">
// // //                     <Icon size={16} className="text-purple-400" />
// // //                   </div>
// // //                   <span className="text-gray-300 text-sm">{text}</span>
// // //                 </div>
// // //               ))}
// // //             </div>
// // //           </motion.div>

// // //           {/* Right — Sign In Card */}
// // //           <motion.div
// // //             initial={{ opacity: 0, x: 40 }}
// // //             animate={{ opacity: 1, x: 0 }}
// // //             transition={{ duration: 0.7, delay: 0.2 }}
// // //           >
// // //             <div className="glass rounded-2xl p-8 purple-glow">
// // //               <div className="flex items-center gap-3 mb-6">
// // //                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-orange-400 flex items-center justify-center">
// // //                   <span className="text-white font-bold text-lg">M</span>
// // //                 </div>
// // //                 <div>
// // //                   <div className="text-white font-semibold">Maya</div>
// // //                   <div className="text-gray-400 text-sm flex items-center gap-1">
// // //                     <Star size={12} className="text-yellow-400 fill-yellow-400" />
// // //                     AI Interviewer · Cuemath
// // //                   </div>
// // //                 </div>
// // //               </div>

// // //               <div className="glass rounded-xl p-4 mb-6">
// // //                 <p className="text-gray-300 text-sm italic leading-relaxed">
// // //                   "Hi! I'm Maya, your interviewer today. I'll ask you a few questions 
// // //                   to understand how you communicate and connect with students. 
// // //                   There are no right or wrong answers — just be yourself."
// // //                 </p>
// // //               </div>

// // //               <div className="space-y-4 mb-6">
// // //                 <div>
// // //                   <label className="text-gray-400 text-sm mb-2 block">Your Full Name</label>
// // //                   <input
// // //                     type="text"
// // //                     value={name}
// // //                     onChange={(e) => setName(e.target.value)}
// // //                     placeholder="Enter your name"
// // //                     className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
// // //                   />
// // //                 </div>
// // //                 <div>
// // //                   <label className="text-gray-400 text-sm mb-2 block">Email Address</label>
// // //                   <input
// // //                     type="email"
// // //                     value={email}
// // //                     onChange={(e) => setEmail(e.target.value)}
// // //                     placeholder="Enter your email"
// // //                     className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
// // //                   />
// // //                 </div>
// // //               </div>

// // //               <motion.button
// // //                 onClick={handleStart}
// // //                 disabled={!name.trim() || !email.trim()}
// // //                 whileHover={{ scale: 1.02 }}
// // //                 whileTap={{ scale: 0.98 }}
// // //                 className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
// // //               >
// // //                 Begin Interview with Maya
// // //                 <ArrowRight size={18} />
// // //               </motion.button>

// // //               <p className="text-gray-500 text-xs text-center mt-4">
// // //                 🎤 Requires microphone access · Works best on Chrome
// // //               </p>
// // //             </div>
// // //           </motion.div>
// // //         </div>
// // //       </main>
// // //     </div>
// // //   );
// // // }




// // // "use client";

// // // import { useState } from "react";
// // // import { useRouter } from "next/navigation";
// // // import { ArrowRight, Brain, Mic } from "lucide-react";

// // // export default function LandingPage() {
// // //   const [name, setName] = useState("");
// // //   const [email, setEmail] = useState("");
// // //   const router = useRouter();

// // //   const handleStart = () => {
// // //     if (!name.trim() || !email.trim()) return;

// // //     localStorage.setItem("candidate_name", name.trim());
// // //     localStorage.setItem("candidate_email", email.trim());
// // //     router.push("/interview");
// // //   };

// // //   return (
// // //     <div className="min-h-screen bg-[#0B1020] text-white">
// // //       <header className="border-b border-white/10">
// // //         <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
// // //           <div className="flex items-center gap-3">
// // //             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6D28D9]">
// // //               <Brain size={18} />
// // //             </div>
// // //             <div>
// // //               <p className="text-sm font-medium tracking-wide text-white">Cuemath</p>
// // //               <p className="text-xs text-white/50">AI Tutor Screener</p>
// // //             </div>
// // //           </div>

// // //           <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
// // //             Candidate Assessment
// // //           </div>
// // //         </div>
// // //       </header>

// // //       <main className="mx-auto grid min-h-[calc(100vh-81px)] max-w-6xl items-center gap-14 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr]">
// // //         <section className="max-w-2xl">
// // //           <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
// // //             <span className="h-2 w-2 rounded-full bg-emerald-400" />
// // //             Interview assistant ready
// // //           </div>

// // //           <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
// // //             Screen tutor communication with a calm, structured AI interview.
// // //           </h1>

// // //           <p className="mt-5 max-w-xl text-base leading-7 text-white/65 md:text-lg">
// // //             A short voice-based interview designed to evaluate clarity, warmth,
// // //             patience, and teaching presence — with an instant structured report.
// // //           </p>

// // //           <div className="mt-10 grid gap-4 sm:grid-cols-3">
// // //             <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
// // //               <p className="text-2xl font-semibold">5 min</p>
// // //               <p className="mt-1 text-sm text-white/50">Interview length</p>
// // //             </div>

// // //             <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
// // //               <p className="text-2xl font-semibold">5 signals</p>
// // //               <p className="mt-1 text-sm text-white/50">Scored dimensions</p>
// // //             </div>

// // //             <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
// // //               <p className="text-2xl font-semibold">1 report</p>
// // //               <p className="mt-1 text-sm text-white/50">Structured outcome</p>
// // //             </div>
// // //           </div>
// // //         </section>

// // //         <section>
// // //           <div className="rounded-3xl border border-white/10 bg-[#11182B] p-8 shadow-2xl shadow-black/20">
// // //             <div className="mb-8 flex items-center gap-4">
// // //               <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6D28D9] text-lg font-semibold">
// // //                 M
// // //               </div>
// // //               <div>
// // //                 <p className="text-lg font-semibold text-white">Maya</p>
// // //                 <p className="text-sm text-white/50">AI Interviewer</p>
// // //               </div>
// // //             </div>

// // //             <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5">
// // //               <p className="text-sm leading-6 text-white/70">
// // //                 You’ll answer a few short questions verbally. The interview is
// // //                 designed to understand how you explain ideas, respond with
// // //                 patience, and communicate with students.
// // //               </p>
// // //             </div>

// // //             <div className="space-y-5">
// // //               <div>
// // //                 <label className="mb-2 block text-sm text-white/60">
// // //                   Full name
// // //                 </label>
// // //                 <input
// // //                   type="text"
// // //                   value={name}
// // //                   onChange={(e) => setName(e.target.value)}
// // //                   placeholder="Enter your full name"
// // //                   className="w-full rounded-2xl border border-white/10 bg-[#0F172A] px-4 py-3 text-white outline-none transition focus:border-[#8B5CF6]"
// // //                 />
// // //               </div>

// // //               <div>
// // //                 <label className="mb-2 block text-sm text-white/60">
// // //                   Email address
// // //                 </label>
// // //                 <input
// // //                   type="email"
// // //                   value={email}
// // //                   onChange={(e) => setEmail(e.target.value)}
// // //                   placeholder="Enter your email"
// // //                   className="w-full rounded-2xl border border-white/10 bg-[#0F172A] px-4 py-3 text-white outline-none transition focus:border-[#8B5CF6]"
// // //                 />
// // //               </div>
// // //             </div>

// // //             <button
// // //               onClick={handleStart}
// // //               disabled={!name.trim() || !email.trim()}
// // //               className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6D28D9] px-4 py-4 text-sm font-semibold text-white transition hover:bg-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-50"
// // //             >
// // //               <Mic size={18} />
// // //               Start interview
// // //               <ArrowRight size={18} />
// // //             </button>

// // //             <p className="mt-4 text-center text-xs text-white/40">
// // //               Best experienced on Chrome with microphone enabled
// // //             </p>
// // //           </div>
// // //         </section>
// // //       </main>
// // //     </div>
// // //   );
// // // }





// // "use client";

// // import { useState } from "react";
// // import { useRouter } from "next/navigation";
// // import { ArrowRight, BrainCircuit, Mail, UserRound, ShieldCheck } from "lucide-react";

// // export default function LandingPage() {
// //   const [name, setName] = useState("");
// //   const [email, setEmail] = useState("");
// //   const router = useRouter();

// //   const handleStart = () => {
// //     if (!name.trim() || !email.trim()) return;

// //     localStorage.setItem("candidate_name", name.trim());
// //     localStorage.setItem("candidate_email", email.trim());
// //     router.push("/interview");
// //   };

// //   return (
// //     <div className="min-h-screen bg-[#09111F] text-white">
// //       <header className="border-b border-white/8 bg-[#0B1324]">
// //         <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
// //           <div className="flex items-center gap-3">
// //             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6D28D9] shadow-lg shadow-violet-900/30">
// //               <BrainCircuit size={18} className="text-white" />
// //             </div>
// //             <div>
// //               <p className="text-base font-semibold tracking-tight text-white">Cuemath</p>
// //               <p className="text-xs text-white/45">Tutor Screening Platform</p>
// //             </div>
// //           </div>

// //           <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60">
// //             AI Interview Workflow
// //           </div>
// //         </div>
// //       </header>

// //       <main className="mx-auto grid min-h-[calc(100vh-81px)] max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1.15fr_0.85fr]">
// //         {/* Left panel */}
// //         <section className="flex flex-col justify-between rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,#0E172A_0%,#0A1220_100%)] p-8 md:p-10">
// //           <div>
// //             <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-sm text-emerald-300">
// //               <span className="h-2 w-2 rounded-full bg-emerald-400" />
// //               Interview assistant online
// //             </div>

// //             <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
// //               Evaluate tutor communication with a structured AI-led voice interview.
// //             </h1>

// //             <p className="mt-5 max-w-2xl text-base leading-7 text-white/62 md:text-lg">
// //               A focused screening experience designed to assess clarity, warmth,
// //               patience, and teaching presence in a consistent and scalable way.
// //             </p>
// //           </div>

// //           <div className="mt-12 grid gap-4 sm:grid-cols-3">
// //             <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
// //               <p className="text-3xl font-semibold tracking-tight text-white">5 min</p>
// //               <p className="mt-1 text-sm text-white/45">Average interview duration</p>
// //             </div>

// //             <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
// //               <p className="text-3xl font-semibold tracking-tight text-white">5 traits</p>
// //               <p className="mt-1 text-sm text-white/45">Core communication signals</p>
// //             </div>

// //             <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
// //               <p className="text-3xl font-semibold tracking-tight text-white">Instant</p>
// //               <p className="mt-1 text-sm text-white/45">Structured assessment output</p>
// //             </div>
// //           </div>

// //           <div className="mt-12 grid gap-4 md:grid-cols-2">
// //             <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
// //               <p className="text-sm font-medium text-white">What gets assessed</p>
// //               <ul className="mt-3 space-y-2 text-sm leading-6 text-white/55">
// //                 <li>Communication clarity</li>
// //                 <li>Warmth and tone</li>
// //                 <li>Patience under pressure</li>
// //                 <li>Ability to simplify concepts</li>
// //                 <li>English fluency</li>
// //               </ul>
// //             </div>

// //             <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
// //               <div className="flex items-start gap-3">
// //                 <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15">
// //                   <ShieldCheck size={18} className="text-emerald-300" />
// //                 </div>
// //                 <div>
// //                   <p className="text-sm font-medium text-white">Consistent screening logic</p>
// //                   <p className="mt-2 text-sm leading-6 text-white/55">
// //                     Each candidate goes through the same structured evaluation flow,
// //                     reducing interviewer variance and improving decision consistency.
// //                   </p>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //         </section>

// //         {/* Right panel */}
// //         <section className="flex items-center">
// //           <div className="w-full rounded-[28px] border border-white/8 bg-[#101A2D] p-8 shadow-2xl shadow-black/20 md:p-9">
// //             <div className="mb-8 flex items-start justify-between">
// //               <div className="flex items-center gap-4">
// //                 <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-400 text-lg font-semibold text-white">
// //                   M
// //                 </div>
// //                 <div>
// //                   <p className="text-lg font-semibold tracking-tight text-white">Maya</p>
// //                   <p className="text-sm text-white/45">AI Interviewer</p>
// //                 </div>
// //               </div>

// //               <div className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-200">
// //                 Ready
// //               </div>
// //             </div>

// //             <div className="mb-8 rounded-2xl border border-white/8 bg-[#0C1424] p-5">
// //               <p className="text-sm leading-6 text-white/65">
// //                 This interview takes around five minutes. You will be asked a small
// //                 set of voice-based questions designed to understand how you explain,
// //                 respond, and connect with students.
// //               </p>
// //             </div>

// //             <div className="space-y-5">
// //               <div>
// //                 <label className="mb-2 block text-sm font-medium text-white/60">
// //                   Full name
// //                 </label>
// //                 <div className="relative">
// //                   <UserRound
// //                     size={18}
// //                     className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
// //                   />
// //                   <input
// //                     type="text"
// //                     value={name}
// //                     onChange={(e) => setName(e.target.value)}
// //                     placeholder="Enter your full name"
// //                     className="w-full rounded-2xl border border-white/10 bg-[#0B1322] py-3.5 pl-12 pr-4 text-white outline-none transition focus:border-violet-400/70 focus:bg-[#0C1629]"
// //                   />
// //                 </div>
// //               </div>

// //               <div>
// //                 <label className="mb-2 block text-sm font-medium text-white/60">
// //                   Email address
// //                 </label>
// //                 <div className="relative">
// //                   <Mail
// //                     size={18}
// //                     className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
// //                   />
// //                   <input
// //                     type="email"
// //                     value={email}
// //                     onChange={(e) => setEmail(e.target.value)}
// //                     placeholder="Enter your email address"
// //                     className="w-full rounded-2xl border border-white/10 bg-[#0B1322] py-3.5 pl-12 pr-4 text-white outline-none transition focus:border-violet-400/70 focus:bg-[#0C1629]"
// //                   />
// //                 </div>
// //               </div>
// //             </div>

// //             <button
// //               onClick={handleStart}
// //               disabled={!name.trim() || !email.trim()}
// //               className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-4 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-45"
// //             >
// //               Start interview
// //               <ArrowRight size={18} />
// //             </button>

// //             <div className="mt-6 flex items-center justify-between border-t border-white/8 pt-4 text-xs text-white/38">
// //               <span>Microphone access required</span>
// //               <span>Optimized for Chrome</span>
// //             </div>
// //           </div>
// //         </section>
// //       </main>
// //     </div>
// //   );
// // }





// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   ArrowRight,
//   BrainCircuit,
//   Mail,
//   ShieldCheck,
//   UserRound,
// } from "lucide-react";

// export default function LandingPage() {
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const router = useRouter();

//   const handleStart = () => {
//     if (!name.trim() || !email.trim()) return;

//     localStorage.setItem("candidate_name", name.trim());
//     localStorage.setItem("candidate_email", email.trim());
//     router.push("/interview");
//   };

//   return (
//     <div className="min-h-screen bg-[#081120] text-white">
//       <header className="sticky top-0 z-20 border-b border-white/8 bg-[#0A1324]/90 backdrop-blur-md">
//         <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
//           <div className="flex items-center gap-3">
//             <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 shadow-[0_10px_30px_rgba(109,40,217,0.25)]">
//               <BrainCircuit size={18} className="text-white" />
//             </div>
//             <div>
//               <p className="text-[17px] font-semibold tracking-tight text-white">
//                 Cuemath
//               </p>
//               <p className="text-xs text-white/45">Tutor Screening Platform</p>
//             </div>
//           </div>

//           <div className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/60">
//             AI Interview Workflow
//           </div>
//         </div>
//       </header>

//       <main className="mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
//         <section className="rounded-[30px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(109,40,217,0.08),transparent_30%),linear-gradient(180deg,#0C1628_0%,#09111F_100%)] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:p-10">
//           <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-sm text-emerald-300">
//             <span className="h-2 w-2 rounded-full bg-emerald-400" />
//             Interview assistant online
//           </div>

//           {/* <h1 className="max-w-3xl text-4xl font-semibold leading-[1.12] tracking-tight text-white md:text-[56px]">
//             Evaluate tutor communication through a structured AI-led voice interview.
//           </h1> */}
//           <h1 className="max-w-[12ch] text-[38px] font-semibold leading-[1.1] tracking-[-0.03em] text-white md:text-[44px]">
//               Assess tutor communication through a structured voice interview.
//     </h1>

//           <p className="mt-5 max-w-2xl text-[17px] leading-8 text-white/62">
//             A focused screening experience designed to assess clarity, warmth,
//             patience, and teaching presence in a consistent and scalable way.
//           </p>

//           <div className="mt-10 grid gap-4 sm:grid-cols-3">
//             {[
//               { value: "5 min", label: "Average interview duration" },
//               { value: "5 traits", label: "Core communication signals" },
//               { value: "Instant", label: "Structured assessment output" },
//             ].map((item) => (
//               <div
//                 key={item.label}
//                 className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 transition hover:border-white/12 hover:bg-white/[0.045]"
//               >
//                 <p className="text-[38px] font-semibold tracking-tight text-white">
//                   {item.value}
//                 </p>
//                 <p className="mt-1 text-sm leading-6 text-white/45">
//                   {item.label}
//                 </p>
//               </div>
//             ))}
//           </div>

//           <div className="mt-10 grid gap-4 md:grid-cols-2">
//             <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
//               <p className="text-sm font-semibold text-white">What gets assessed</p>
//               <div className="mt-4 space-y-3 text-sm text-white/58">
//                 <p>Communication clarity</p>
//                 <p>Warmth and tone</p>
//                 <p>Patience under pressure</p>
//                 <p>Ability to simplify concepts</p>
//                 <p>English fluency</p>
//               </div>
//             </div>

//             <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
//               <div className="flex items-start gap-3">
//                 <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
//                   <ShieldCheck size={18} className="text-emerald-300" />
//                 </div>
//                 <div>
//                   <p className="text-sm font-semibold text-white">
//                     Consistent screening logic
//                   </p>
//                   <p className="mt-2 text-sm leading-7 text-white/55">
//                     Each candidate goes through the same structured evaluation flow,
//                     reducing interviewer variance and improving decision consistency.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>

//         <section className="flex items-center">
//           <div className="w-full rounded-[30px] border border-white/8 bg-[#0F1A2D] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)] md:p-9">
//             <div className="mb-8 flex items-start justify-between">
//               <div className="flex items-center gap-4">
//                 <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-400 text-lg font-semibold text-white shadow-[0_10px_30px_rgba(168,85,247,0.2)]">
//                   M
//                 </div>
//                 <div>
//                   <p className="text-[22px] font-semibold tracking-tight text-white">
//                     Maya
//                   </p>
//                   <p className="text-sm text-white/45">AI Interviewer</p>
//                 </div>
//               </div>

//               <div className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-200">
//                 Ready
//               </div>
//             </div>

//             <div className="mb-8 rounded-2xl border border-white/8 bg-[#0A1424] p-5">
//               <p className="text-sm leading-7 text-white/65">
//                 This interview takes around five minutes. You’ll answer a short set
//                 of voice-based questions designed to understand how you explain,
//                 respond, and connect with students.
//               </p>
//             </div>

//             <div className="space-y-5">
//               <div>
//                 <label className="mb-2.5 block text-sm font-medium text-white/60">
//                   Full name
//                 </label>
//                 <div className="relative">
//                   <UserRound
//                     size={18}
//                     className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/28"
//                   />
//                   <input
//                     type="text"
//                     value={name}
//                     onChange={(e) => setName(e.target.value)}
//                     placeholder="Enter your full name"
//                     className="w-full rounded-2xl border border-white/10 bg-[#091321] py-3.5 pl-12 pr-4 text-[15px] text-white outline-none transition placeholder:text-white/28 focus:border-violet-400/70 focus:bg-[#0B1628]"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="mb-2.5 block text-sm font-medium text-white/60">
//                   Email address
//                 </label>
//                 <div className="relative">
//                   <Mail
//                     size={18}
//                     className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/28"
//                   />
//                   <input
//                     type="email"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     placeholder="Enter your email address"
//                     className="w-full rounded-2xl border border-white/10 bg-[#091321] py-3.5 pl-12 pr-4 text-[15px] text-white outline-none transition placeholder:text-white/28 focus:border-violet-400/70 focus:bg-[#0B1628]"
//                   />
//                 </div>
//               </div>
//             </div>

//             <button
//               onClick={handleStart}
//               disabled={!name.trim() || !email.trim()}
//               className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-violet-600/50 disabled:text-white/45"
//             >
//               Start interview
//               <ArrowRight size={18} />
//             </button>

//             <div className="mt-6 flex items-center justify-between border-t border-white/8 pt-4 text-xs text-white/38">
//               <span>Microphone access required</span>
//               <span>Optimized for Chrome</span>
//             </div>
//           </div>
//         </section>
//       </main>
//     </div>
//   );
// }






"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BrainCircuit,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
} from "lucide-react";

type ThemeMode = "dark" | "light";

export default function LandingPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme_mode") as ThemeMode | null;
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("theme_mode", theme);
  }, [theme]);

  const isDark = theme === "dark";

  const handleStart = () => {
    if (!name.trim() || !email.trim()) return;
    localStorage.setItem("candidate_name", name.trim());
    localStorage.setItem("candidate_email", email.trim());
    router.push("/interview");
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const colors = isDark
    ? {
        pageBg: "bg-[#081120]",
        headerBg: "bg-[#0A1324]/90",
        headerBorder: "border-white/8",
        panelBg:
          "bg-[radial-gradient(circle_at_top_left,rgba(109,40,217,0.07),transparent_28%),linear-gradient(180deg,#0C1628_0%,#09111F_100%)]",
        rightCardBg: "bg-[#101A2D]",
        surfaceBg: "bg-[#0A1424]",
        inputBg: "bg-[#091321]",
        textMain: "text-white",
        textSoft: "text-white/60",
        textMuted: "text-white/45",
        border: "border-white/8",
        borderStrong: "border-white/10",
        chipBg: "bg-white/[0.04]",
        chipText: "text-white/65",
        metricBg: "bg-white/[0.03]",
        infoBg: "bg-white/[0.025]",
        inputPlaceholder: "placeholder:text-white/28",
        toggleBg: "bg-white/[0.04]",
        toggleText: "text-white/70",
        heroBadgeBg: "bg-emerald-400/10",
        heroBadgeBorder: "border-emerald-400/20",
        heroBadgeText: "text-emerald-300",
        primaryBtn: "bg-violet-600 hover:bg-violet-500",
        disabledBtn: "disabled:bg-violet-600/50 disabled:text-white/45",
      }
    : {
        pageBg: "bg-[#F5F7FB]",
        headerBg: "bg-white/90",
        headerBorder: "border-slate-200",
        panelBg:
          "bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.08),transparent_28%),linear-gradient(180deg,#FFFFFF_0%,#F7F9FC_100%)]",
        rightCardBg: "bg-white",
        surfaceBg: "bg-[#F8FAFC]",
        inputBg: "bg-white",
        textMain: "text-slate-900",
        textSoft: "text-slate-600",
        textMuted: "text-slate-500",
        border: "border-slate-200",
        borderStrong: "border-slate-300/80",
        chipBg: "bg-slate-100",
        chipText: "text-slate-600",
        metricBg: "bg-white",
        infoBg: "bg-white",
        inputPlaceholder: "placeholder:text-slate-400",
        toggleBg: "bg-slate-100",
        toggleText: "text-slate-700",
        heroBadgeBg: "bg-emerald-50",
        heroBadgeBorder: "border-emerald-200",
        heroBadgeText: "text-emerald-700",
        primaryBtn: "bg-violet-600 hover:bg-violet-500",
        disabledBtn: "disabled:bg-violet-300 disabled:text-white/70",
      };

  return (
    <div className={`min-h-screen ${colors.pageBg} ${colors.textMain} transition-colors duration-300`}>
      <header
        className={`sticky top-0 z-20 border-b ${colors.headerBorder} ${colors.headerBg} backdrop-blur-md`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 shadow-[0_10px_30px_rgba(109,40,217,0.22)]">
              <BrainCircuit size={18} className="text-white" />
            </div>

            <div>
              <p className="text-[17px] font-semibold tracking-tight">Cuemath</p>
              <p className={`text-xs ${colors.textMuted}`}>Tutor Screening Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`hidden rounded-full border px-3.5 py-1.5 text-xs font-medium md:block ${colors.borderStrong} ${colors.chipBg} ${colors.chipText}`}
            >
              AI Interview Workflow
            </div>

            <button
              onClick={toggleTheme}
              type="button"
              aria-label="Toggle theme"
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${colors.borderStrong} ${colors.toggleBg} ${colors.toggleText}`}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-76px)] max-w-6xl gap-6 px-5 py-6 lg:grid-cols-[1fr_0.96fr] lg:items-start">
        <section
          className={`rounded-[28px] border p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:p-7 ${colors.border} ${colors.panelBg}`}
        >
          <div
            className={`mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${colors.heroBadgeBg} ${colors.heroBadgeBorder} ${colors.heroBadgeText}`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Interview assistant online
          </div>

          <h1 className="max-w-[12ch] text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] md:text-[42px]">
            Assess tutor communication through a structured voice interview.
          </h1>

          <p className={`mt-4 max-w-xl text-[15px] leading-7 ${colors.textSoft}`}>
            A focused screening experience designed to assess clarity, warmth,
            patience, and teaching presence in a consistent and scalable way.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { value: "5 min", label: "Average session" },
              { value: "5", label: "Evaluation dimensions" },
              { value: "Instant", label: "Decision summary" },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-2xl border p-4 ${colors.border} ${colors.metricBg}`}
              >
                <p className="text-[26px] font-semibold leading-tight tracking-tight md:text-[30px]">
                  {item.value}
                </p>
                <p className={`mt-2 text-sm leading-6 ${colors.textMuted}`}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-3">
            <div className={`rounded-2xl border p-4 ${colors.border} ${colors.infoBg}`}>
              <p className="text-sm font-semibold">Assessment dimensions</p>
              <div className={`mt-4 grid gap-2 text-sm ${colors.textSoft} sm:grid-cols-2`}>
                <p>Communication clarity</p>
                <p>Warmth and tone</p>
                <p>Patience under pressure</p>
                <p>Ability to simplify concepts</p>
                <p>English fluency</p>
              </div>
            </div>

            <div className={`rounded-2xl border p-4 ${colors.border} ${colors.infoBg}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
                  <ShieldCheck size={18} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Standardized evaluation flow</p>
                  <p className={`mt-2 text-sm leading-7 ${colors.textSoft}`}>
                    Each candidate goes through the same structured evaluation
                    pattern, reducing interviewer variance and improving hiring
                    consistency.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-start">
          <div
            className={`w-full rounded-[28px] border p-7 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-8 ${colors.border} ${colors.rightCardBg}`}
          >
            <div className="mb-8 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-400 text-lg font-semibold text-white shadow-[0_10px_30px_rgba(168,85,247,0.20)]">
                  M
                </div>
                <div>
                  <p className="text-[22px] font-semibold tracking-tight">Maya</p>
                  <p className={`text-sm ${colors.textMuted}`}>AI Interviewer</p>
                </div>
              </div>

              <div className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-200">
                Ready
              </div>
            </div>

            <div className={`mb-8 rounded-2xl border p-5 ${colors.border} ${colors.surfaceBg}`}>
              <p className={`text-sm leading-7 ${colors.textSoft}`}>
                This interview takes around five minutes. You’ll answer a short
                set of voice-based questions designed to understand how you
                explain, respond, and connect with students.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className={`mb-2.5 block text-sm font-medium ${colors.textSoft}`}>
                  Full name
                </label>
                <div className="relative">
                  <UserRound
                    size={18}
                    className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? "text-white/28" : "text-slate-400"}`}
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className={`w-full rounded-2xl border py-3.5 pl-12 pr-4 text-[15px] outline-none transition focus:border-violet-400/70 ${colors.borderStrong} ${colors.inputBg} ${colors.inputPlaceholder} ${
                      isDark ? "text-white focus:bg-[#0B1628]" : "text-slate-900 focus:bg-white"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`mb-2.5 block text-sm font-medium ${colors.textSoft}`}>
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? "text-white/28" : "text-slate-400"}`}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className={`w-full rounded-2xl border py-3.5 pl-12 pr-4 text-[15px] outline-none transition focus:border-violet-400/70 ${colors.borderStrong} ${colors.inputBg} ${colors.inputPlaceholder} ${
                      isDark ? "text-white focus:bg-[#0B1628]" : "text-slate-900 focus:bg-white"
                    }`}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={!name.trim() || !email.trim()}
              className={`mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white transition ${colors.primaryBtn} ${colors.disabledBtn} disabled:cursor-not-allowed`}
            >
              Begin assessment
              <ArrowRight size={18} />
            </button>

            <div className={`mt-6 flex items-center justify-between border-t pt-4 text-xs ${colors.border} ${colors.textMuted}`}>
              <span>Secure browser microphone access required</span>
              <span>Best experienced on Chrome</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}