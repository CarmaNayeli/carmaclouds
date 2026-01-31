export default function FoundCloudTab() {
  return (
    <div className="space-y-6">
      <section className="text-center py-12">
        <div className="inline-block bg-black border-2 border-orange-400 rounded-lg p-8 mb-6">
          <h2 className="text-4xl font-bold mb-4 text-orange-400">
            Coming Soon
          </h2>
          <p className="text-gray-400 text-lg">
            FoundCloud is currently in development
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <h3 className="text-2xl font-semibold mb-4 text-white">
            What is FoundCloud?
          </h3>
          <p className="text-gray-400 text-lg leading-relaxed mb-8">
            FoundCloud will integrate DiceCloud character sheets with Foundry VTT,
            bringing the same seamless character management and dice rolling experience
            to one of the most powerful virtual tabletop platforms.
          </p>

          <div className="bg-black border border-gray-800 rounded-lg p-6">
            <h4 className="text-xl font-semibold mb-3 text-orange-400">Planned Features</h4>
            <ul className="space-y-2 text-gray-400 text-left">
              <li className="flex items-start">
                <span className="text-orange-400 mr-3">•</span>
                <span>DiceCloud character sheet integration with Foundry VTT</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-400 mr-3">•</span>
                <span>Real-time dice rolling and result display</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-400 mr-3">•</span>
                <span>Character state synchronization</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-400 mr-3">•</span>
                <span>Support for Foundry VTT modules and systems</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 text-gray-500">
            <p>
              Stay tuned for updates on the CarmaClouds{' '}
              <a
                href="https://github.com/CarmaNayeli/carmaclouds"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-300 underline"
              >
                GitHub repository
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
