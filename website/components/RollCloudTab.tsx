export default function RollCloudTab() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-3xl font-bold mb-4 text-white">
          RollCloud
        </h2>
        <p className="text-gray-400 text-lg leading-relaxed">
          Browser extension that connects your DiceCloud character sheets to Roll20 and Pip2,
          enabling seamless character management and dice rolling across platforms.
        </p>
      </section>

      <section className="bg-black border border-[#16a75a] rounded-lg p-6">
        <h3 className="text-2xl font-semibold mb-4 text-[#16a75a]">Download</h3>
        <div className="space-y-4">
          <a
            href="https://github.com/CarmaNayeli/carmaclouds/tree/master/rollcloud"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#16a75a] hover:bg-[#1ec96e] text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Download from GitHub
          </a>
          <p className="text-gray-500 text-sm">
            Install the extension in your browser to get started with RollCloud
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-semibold mb-4 text-white">Features</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#16a75a] transition-colors">
            <h4 className="font-semibold text-[#16a75a] mb-2">DiceCloud Integration</h4>
            <p className="text-gray-400 text-sm">
              Access your DiceCloud character sheets directly from Roll20
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#16a75a] transition-colors">
            <h4 className="font-semibold text-[#16a75a] mb-2">Roll20 Streaming</h4>
            <p className="text-gray-400 text-sm">
              Stream dice rolls and results to Roll20 in real-time
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#16a75a] transition-colors">
            <h4 className="font-semibold text-[#16a75a] mb-2">Pip2 Dashboard</h4>
            <p className="text-gray-400 text-sm">
              View and manage character stats with the Pip2 interface
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#16a75a] transition-colors">
            <h4 className="font-semibold text-[#16a75a] mb-2">Character Sync</h4>
            <p className="text-gray-400 text-sm">
              Keep your character data synchronized across platforms
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-semibold mb-4 text-white">Installation</h3>
        <ol className="space-y-3 text-gray-400">
          <li className="flex items-start">
            <span className="text-[#16a75a] font-semibold mr-3">1.</span>
            <span>Download the extension from GitHub</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#16a75a] font-semibold mr-3">2.</span>
            <span>Open your browser's extension management page</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#16a75a] font-semibold mr-3">3.</span>
            <span>Enable "Developer mode"</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#16a75a] font-semibold mr-3">4.</span>
            <span>Click "Load unpacked" and select the RollCloud directory</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#16a75a] font-semibold mr-3">5.</span>
            <span>Navigate to DiceCloud or Roll20 to start using RollCloud</span>
          </li>
        </ol>
      </section>
    </div>
  )
}
