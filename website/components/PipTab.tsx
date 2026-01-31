export default function PipTab() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-3xl font-bold mb-4 text-white">
          Pip2
        </h2>
        <p className="text-gray-400 text-lg leading-relaxed">
          Discord bot that powers the CarmaClouds ecosystem, handling RollCloud, OwlCloud,
          and FoundCloud integrations for your tabletop gaming sessions.
        </p>
      </section>

      <section className="bg-black border border-[#2dd97c] rounded-lg p-6">
        <h3 className="text-2xl font-semibold mb-4 text-[#2dd97c]">Add to Discord</h3>
        <div className="space-y-4">
          <a
            href="https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#2dd97c] hover:bg-[#3ef090] text-black font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Invite Pip2 to Your Server
          </a>
          <p className="text-gray-500 text-sm">
            Click to add Pip2 to your Discord server and start rolling
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-semibold mb-4 text-white">Features</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#2dd97c] transition-colors">
            <h4 className="font-semibold text-[#2dd97c] mb-2">RollCloud Integration</h4>
            <p className="text-gray-400 text-sm">
              Receive roll notifications from Roll20 directly in Discord
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#2dd97c] transition-colors">
            <h4 className="font-semibold text-[#2dd97c] mb-2">Character Dashboard</h4>
            <p className="text-gray-400 text-sm">
              View and manage your DiceCloud characters in Discord
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#2dd97c] transition-colors">
            <h4 className="font-semibold text-[#2dd97c] mb-2">Turn Notifications</h4>
            <p className="text-gray-400 text-sm">
              Get notified when it's your turn in combat
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#2dd97c] transition-colors">
            <h4 className="font-semibold text-[#2dd97c] mb-2">Cross-Platform</h4>
            <p className="text-gray-400 text-sm">
              Works with RollCloud, OwlCloud, and FoundCloud
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-semibold mb-4 text-white">Commands</h3>
        <div className="space-y-3 bg-black border border-gray-800 rounded-lg p-6">
          <div className="font-mono text-sm">
            <span className="text-[#2dd97c]">/character</span>
            <span className="text-gray-400 ml-4">View your DiceCloud character</span>
          </div>
          <div className="font-mono text-sm">
            <span className="text-[#2dd97c]">/roll</span>
            <span className="text-gray-400 ml-4">Roll dice from your character sheet</span>
          </div>
          <div className="font-mono text-sm">
            <span className="text-[#2dd97c]">/link</span>
            <span className="text-gray-400 ml-4">Link your DiceCloud account</span>
          </div>
          <div className="font-mono text-sm">
            <span className="text-[#2dd97c]">/settings</span>
            <span className="text-gray-400 ml-4">Configure Pip2 for your server</span>
          </div>
        </div>
      </section>

      <section className="bg-black border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-3 text-[#2dd97c]">Open Source</h3>
        <p className="text-gray-400 mb-4">
          Pip2 is open source and built for the community. Contributions are welcome!
        </p>
        <a
          href="https://github.com/CarmaNayeli/carmaclouds/tree/master/packages/pip"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#2dd97c] hover:text-[#3ef090] underline"
        >
          View on GitHub
        </a>
      </section>
    </div>
  )
}
