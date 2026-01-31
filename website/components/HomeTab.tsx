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
          A suite of browser extensions and tools designed to enhance your tabletop gaming experience
          across multiple platforms including DiceCloud, Roll20, Owlbear Rodeo, and Foundry VTT.
        </p>
      </section>

      <section className="grid md:grid-cols-4 gap-6 mt-8">
        <button
          onClick={() => setActiveTab('pip')}
          className="bg-black border border-gray-800 rounded-lg p-6 hover:border-[#2dd97c] transition-colors text-left cursor-pointer"
        >
          <h3 className="text-xl font-semibold text-[#2dd97c] mb-3">Pip2</h3>
          <p className="text-gray-400">
            Discord bot powering RollCloud, OwlCloud, and FoundCloud integrations.
          </p>
        </button>

        <button
          onClick={() => setActiveTab('rollcloud')}
          className="bg-black border border-gray-800 rounded-lg p-6 hover:border-[#e91e8c] transition-colors text-left cursor-pointer"
        >
          <h3 className="text-xl font-semibold text-[#e91e8c] mb-3">RollCloud</h3>
          <p className="text-gray-400">
            Browser extension connecting DiceCloud character sheets to Roll20 and Pip2.
          </p>
        </button>

        <button
          onClick={() => setActiveTab('owlcloud')}
          className="bg-black border border-gray-800 rounded-lg p-6 hover:border-[#a855f7] transition-colors text-left cursor-pointer"
        >
          <h3 className="text-xl font-semibold text-[#a855f7] mb-3">OwlCloud</h3>
          <p className="text-gray-400">
            Browser extension integrating DiceCloud with Owlbear Rodeo.
          </p>
        </button>

        <button
          onClick={() => setActiveTab('foundcloud')}
          className="bg-black border border-gray-800 rounded-lg p-6 hover:border-orange-400 transition-colors text-left cursor-pointer"
        >
          <h3 className="text-xl font-semibold text-orange-400 mb-3">FoundCloud</h3>
          <p className="text-gray-400">
            Coming soon! DiceCloud integration for Foundry VTT.
          </p>
        </button>
      </section>

      <section className="mt-8 bg-black border border-gray-800 rounded-lg p-6">
        <h3 className="text-2xl font-semibold mb-4 text-white">Features</h3>
        <ul className="space-y-3 text-gray-400">
          <li className="flex items-start">
            <span className="text-[#16a75a] mr-3">•</span>
            <span>Seamless character sheet integration across platforms</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#16a75a] mr-3">•</span>
            <span>Real-time dice rolling and result streaming</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#16a75a] mr-3">•</span>
            <span>Character state synchronization</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#16a75a] mr-3">•</span>
            <span>Open source and community-driven</span>
          </li>
        </ul>
      </section>
    </div>
  )
}
