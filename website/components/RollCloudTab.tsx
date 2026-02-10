import Image from 'next/image'

export default function RollCloudTab() {
  return (
    <div className="space-y-8">
      <section className="flex items-center gap-4">
        <Image
          src="/rollcloud-die.png"
          alt="RollCloud Die"
          width={80}
          height={80}
          className="rounded-lg"
        />
        <div>
          <h2 className="text-3xl font-bold mb-2 text-white">
            RollCloud
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            The Roll20 tab in CarmaClouds extension. Sync your DiceCloud V2 characters to Roll20 with one click.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-semibold mb-4 text-white">How to Use RollCloud</h3>
        <ol className="space-y-4 text-gray-400">
          <li className="flex items-start">
            <span className="text-[#e91e8c] font-semibold mr-3 text-xl">1.</span>
            <div>
              <strong className="text-white">Sync from DiceCloud</strong>
              <p className="mt-1">Go to dicecloud.com, open your character, and click "Sync to CarmaClouds"</p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="text-[#e91e8c] font-semibold mr-3 text-xl">2.</span>
            <div>
              <strong className="text-white">Open Roll20</strong>
              <p className="mt-1">Navigate to app.roll20.net and open your game</p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="text-[#e91e8c] font-semibold mr-3 text-xl">3.</span>
            <div>
              <strong className="text-white">Push to Roll20</strong>
              <p className="mt-1">Click the CarmaClouds extension icon → RollCloud tab → "Push to Roll20"</p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="text-[#e91e8c] font-semibold mr-3 text-xl">4.</span>
            <div>
              <strong className="text-white">Done!</strong>
              <p className="mt-1">Your character is now in Roll20 with all stats, skills, spells, and abilities</p>
            </div>
          </li>
        </ol>
      </section>

      <section>
        <h3 className="text-2xl font-semibold mb-4 text-white">Features</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#e91e8c] transition-colors">
            <h4 className="font-semibold text-[#e91e8c] mb-2">One-Click Push</h4>
            <p className="text-gray-400 text-sm">
              Send your entire character sheet to Roll20 instantly
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#e91e8c] transition-colors">
            <h4 className="font-semibold text-[#e91e8c] mb-2">Full Character Data</h4>
            <p className="text-gray-400 text-sm">
              Attributes, skills, saves, spells, inventory - everything syncs
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#e91e8c] transition-colors">
            <h4 className="font-semibold text-[#e91e8c] mb-2">Cloud Storage</h4>
            <p className="text-gray-400 text-sm">
              Characters stored in Supabase for access anywhere
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#e91e8c] transition-colors">
            <h4 className="font-semibold text-[#e91e8c] mb-2">Auto-Login</h4>
            <p className="text-gray-400 text-sm">
              Works with Google Sign-In or username/password
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
