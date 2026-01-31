export default function HomeTab() {
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

      <section className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="bg-black border border-gray-800 rounded-lg p-6 hover:border-[#16a75a] transition-colors">
          <h3 className="text-xl font-semibold text-[#16a75a] mb-3">RollCloud</h3>
          <p className="text-gray-400">
            Browser extension connecting DiceCloud character sheets to Roll20 and Pip2.
            Stream your rolls and character data seamlessly.
          </p>
        </div>

        <div className="bg-black border border-gray-800 rounded-lg p-6 hover:border-[#16a75a] transition-colors">
          <h3 className="text-xl font-semibold text-[#16a75a] mb-3">OwlCloud</h3>
          <p className="text-gray-400">
            Browser extension integrating DiceCloud with Owlbear Rodeo.
            Manage characters and roll dice directly in your VTT.
          </p>
        </div>

        <div className="bg-black border border-gray-800 rounded-lg p-6 hover:border-orange-400 transition-colors">
          <h3 className="text-xl font-semibold text-orange-400 mb-3">FoundCloud</h3>
          <p className="text-gray-400">
            Coming soon! DiceCloud integration for Foundry VTT.
            Stay tuned for updates.
          </p>
        </div>
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
