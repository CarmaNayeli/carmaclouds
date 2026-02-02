type HomeTabProps = {
  setActiveTab: (tab: 'home' | 'pip' | 'rollcloud' | 'owlcloud' | 'foundcloud') => void
}

export default function HomeTab({ setActiveTab }: HomeTabProps) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-3xl font-bold mb-4 text-white">
          Welcome to CarmaClouds
        </h2>
        <p className="text-gray-400 text-lg leading-relaxed">
          One unified browser extension that syncs your DiceCloud V2 characters to Roll20, Owlbear Rodeo, and Foundry VTT.
          Install once, access everywhere.
        </p>
      </section>

      <section className="bg-gradient-to-r from-[#16a75a]/10 to-[#16a75a]/5 border border-[#16a75a]/30 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-[#16a75a] mb-3">🎯 How It Works</h3>
        <ol className="space-y-3 text-gray-300">
          <li className="flex items-start">
            <span className="text-[#16a75a] mr-3 font-bold">1.</span>
            <span>Install the CarmaClouds browser extension (Chrome or Firefox)</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#16a75a] mr-3 font-bold">2.</span>
            <span>Visit any DiceCloud character page and click "Sync to CarmaClouds"</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#16a75a] mr-3 font-bold">3.</span>
            <span>Open the extension and choose your VTT tab: RollCloud, OwlCloud, or FoundCloud</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#16a75a] mr-3 font-bold">4.</span>
            <span>Click "Push to VTT" to send your character to Roll20 or Owlbear Rodeo</span>
          </li>
        </ol>
      </section>

      <section className="grid md:grid-cols-4 gap-6">
        <button
          onClick={() => setActiveTab('rollcloud')}
          className="bg-black border border-gray-800 rounded-lg p-6 hover:border-[#e91e8c] transition-colors text-left cursor-pointer"
        >
          <h3 className="text-xl font-semibold text-[#e91e8c] mb-3">RollCloud</h3>
          <p className="text-gray-400">
            DiceCloud → Roll20 character sync with one-click push.
          </p>
        </button>

        <button
          onClick={() => setActiveTab('owlcloud')}
          className="bg-black border border-gray-800 rounded-lg p-6 hover:border-[#a855f7] transition-colors text-left cursor-pointer"
        >
          <h3 className="text-xl font-semibold text-[#a855f7] mb-3">OwlCloud</h3>
          <p className="text-gray-400">
            DiceCloud → Owlbear Rodeo integration with real-time sync.
          </p>
        </button>

        <button
          onClick={() => setActiveTab('foundcloud')}
          className="bg-black border border-gray-800 rounded-lg p-6 hover:border-orange-400 transition-colors text-left cursor-pointer"
        >
          <h3 className="text-xl font-semibold text-orange-400 mb-3">FoundCloud</h3>
          <p className="text-gray-400">
            Coming soon! DiceCloud → Foundry VTT integration.
          </p>
        </button>

        <button
          onClick={() => setActiveTab('pip')}
          className="bg-black border border-gray-800 rounded-lg p-6 hover:border-[#2dd97c] transition-colors text-left cursor-pointer"
        >
          <h3 className="text-xl font-semibold text-[#2dd97c] mb-3">Pip2</h3>
          <p className="text-gray-400">
            Discord bot for character management and dice rolling.
          </p>
        </button>
      </section>

      <section className="mt-8 bg-black border border-gray-800 rounded-lg p-6">
        <h3 className="text-2xl font-semibold mb-4 text-white">Features</h3>
        <ul className="space-y-3 text-gray-400">
          <li className="flex items-start">
            <span className="text-[#16a75a] mr-3">✓</span>
            <span><strong>One Extension</strong> - All VTT platforms in a single install</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#16a75a] mr-3">✓</span>
            <span><strong>Cloud Storage</strong> - Characters synced across devices via Supabase</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#16a75a] mr-3">✓</span>
            <span><strong>Auto-Login</strong> - Works with Google Sign-In or username/password</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#16a75a] mr-3">✓</span>
            <span><strong>VTT-Specific Parsing</strong> - Each platform gets optimized character data</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#16a75a] mr-3">✓</span>
            <span><strong>Open Source</strong> - Community-driven development on GitHub</span>
          </li>
        </ul>
      </section>
    </div>
  )
}
