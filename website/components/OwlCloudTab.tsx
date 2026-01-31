export default function OwlCloudTab() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-3xl font-bold mb-4 text-white">
          OwlCloud
        </h2>
        <p className="text-gray-400 text-lg leading-relaxed">
          Browser extension that integrates DiceCloud character sheets with Owlbear Rodeo,
          bringing your D&D characters to life in your favorite virtual tabletop.
        </p>
      </section>

      <section className="bg-black border border-[#16a75a] rounded-lg p-6">
        <h3 className="text-2xl font-semibold mb-4 text-[#16a75a]">Download</h3>
        <div className="space-y-4">
          <a
            href="https://github.com/CarmaNayeli/carmaclouds/tree/master/packages/owlcloud"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#16a75a] hover:bg-[#1ec96e] text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Download from GitHub
          </a>
          <p className="text-gray-500 text-sm">
            Install the extension in your browser to get started with OwlCloud
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-semibold mb-4 text-white">Features</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#16a75a] transition-colors">
            <h4 className="font-semibold text-[#16a75a] mb-2">DiceCloud Integration</h4>
            <p className="text-gray-400 text-sm">
              Access your DiceCloud character sheets from Owlbear Rodeo
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#16a75a] transition-colors">
            <h4 className="font-semibold text-[#16a75a] mb-2">Owlbear Extension</h4>
            <p className="text-gray-400 text-sm">
              Native Owlbear Rodeo extension for in-game character management
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#16a75a] transition-colors">
            <h4 className="font-semibold text-[#16a75a] mb-2">Dice Rolling</h4>
            <p className="text-gray-400 text-sm">
              Roll dice directly from your character sheet in Owlbear
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#16a75a] transition-colors">
            <h4 className="font-semibold text-[#16a75a] mb-2">Character State</h4>
            <p className="text-gray-400 text-sm">
              Track HP, spell slots, and other resources in real-time
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
            <span>Click "Load unpacked" and select the OwlCloud dist directory</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#16a75a] font-semibold mr-3">5.</span>
            <span>Navigate to DiceCloud or Owlbear Rodeo to start using OwlCloud</span>
          </li>
        </ol>
      </section>

      <section className="bg-black border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-3 text-[#16a75a]">Owlbear Rodeo Extension</h3>
        <p className="text-gray-400 mb-4">
          OwlCloud also includes a native Owlbear Rodeo extension that can be installed directly
          in your Owlbear room for enhanced functionality.
        </p>
        <p className="text-gray-500 text-sm">
          Look for the extension installation instructions in the GitHub repository.
        </p>
      </section>
    </div>
  )
}
