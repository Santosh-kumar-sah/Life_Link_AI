import React from "react";

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <div className="glass-card max-w-md p-8 rounded-2xl shadow-xl border border-slate-800 glow-border">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent glow-text mb-4">
          LifeLink v1
        </h1>
        <p className="text-slate-400 mb-6">
          Real-Time Organ Donation Matching Platform. Project Scaffold Complete.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Ready for Development
        </div>
      </div>
    </div>
  );
}

export default App;
