'use client'

import Image from 'next/image'

export default function CoyoteCloudTab() {
  return (
    <div className="space-y-8">
      <section className="flex items-center gap-4">
        <Image
          src="/coyotecloud.png"
          alt="CoyoteCloud"
          width={80}
          height={80}
          className="rounded-lg"
        />
        <div>
          <h2 className="text-3xl font-bold mb-2 text-white">
            CoyoteCloud
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            The Coyotes &amp; Candles tab in the CarmaClouds extension. Bring your DiceCloud V2
            character straight into the Coyotes &amp; Candles built-in virtual tabletop.
          </p>
        </div>
      </section>

      {/* What is Coyotes & Candles */}
      <section className="bg-[#ffdd77]/10 border border-[#ffdd77]/40 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-[#ffdd77] mb-3">🌙 What is Coyotes &amp; Candles?</h3>
        <p className="text-gray-300 leading-relaxed">
          <a
            href="https://coyotesandcandles.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#ffdd77] hover:underline"
          >
            Coyotes &amp; Candles
          </a>{' '}
          is an online tarot and tabletop-gaming service that runs its own browser-based virtual
          tabletop (handcrafted candles are on the way). Every game room (&ldquo;meet&rdquo;) has live
          video and voice, a battle map with tokens, fog of war and an initiative tracker, a shared
          dice roller, and built-in character sheets &mdash; including full D&amp;D 5e. No installs, no
          separate app: you just open a link and play in the browser.
        </p>
        <p className="text-gray-300 leading-relaxed mt-3">
          <strong className="text-white">CoyoteCloud</strong> connects that VTT to DiceCloud. Sync a
          character once and it drops straight into the room&apos;s 5e sheet &mdash; abilities, saves,
          skills, HP, AC, attacks, spells, slots and currency &mdash; ready to roll.
        </p>
        <p className="text-gray-300 leading-relaxed mt-3">
          <strong className="text-white">Note:</strong> the VTT isn&apos;t open to the public &mdash;
          it&apos;s for players in a Coyotes &amp; Candles game. You&apos;ll use CoyoteCloud once
          you&apos;re booked into one of their tabletop sessions, not as a standalone tool.
        </p>
      </section>

      {/* How to use */}
      <section>
        <h3 className="text-2xl font-semibold mb-4 text-white">How to Use CoyoteCloud</h3>
        <ol className="space-y-4 text-gray-400">
          <li className="flex items-start">
            <span className="text-[#ffdd77] font-semibold mr-3 text-xl">1.</span>
            <div>
              <strong className="text-white">Sync from DiceCloud</strong>
              <p className="mt-1">Open the CarmaClouds extension &rarr; <strong>CoyoteCloud</strong> tab &rarr; click &ldquo;☁️ Sync to CoyoteCloud&rdquo; on your character.</p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="text-[#ffdd77] font-semibold mr-3 text-xl">2.</span>
            <div>
              <strong className="text-white">Open your game</strong>
              <p className="mt-1">Head to your room on <a href="https://coyotesandcandles.com" target="_blank" rel="noopener noreferrer" className="text-[#ffdd77] hover:underline">Coyotes &amp; Candles</a> and open the board&apos;s <strong>Sheets</strong> panel.</p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="text-[#ffdd77] font-semibold mr-3 text-xl">3.</span>
            <div>
              <strong className="text-white">Import from DiceCloud</strong>
              <p className="mt-1">Click <strong>Import from DiceCloud</strong>, pick your character, and it maps straight into the 5e sheet.</p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="text-[#ffdd77] font-semibold mr-3 text-xl">4.</span>
            <div>
              <strong className="text-white">Done!</strong>
              <p className="mt-1">Your character is live in the room &mdash; drop it on the map, roll attacks and saves, and track HP and spell slots.</p>
            </div>
          </li>
        </ol>
      </section>

      {/* CTA */}
      <section className="bg-black border border-[#ffdd77] rounded-lg p-6 text-center">
        <Image
          src="/coyotes-and-candles-logo.png"
          alt="Coyotes & Candles"
          width={96}
          height={96}
          className="mx-auto mb-4"
        />
        <h3 className="text-2xl font-semibold mb-3 text-[#ffdd77]">Join a Coyotes &amp; Candles game</h3>
        <p className="text-gray-400 mb-5">
          The VTT runs inside Coyotes &amp; Candles&apos; tabletop sessions &mdash; book or join a game
          to play, then bring your DiceCloud character in with CoyoteCloud. Tarot readings available too.
        </p>
        <a
          href="https://coyotesandcandles.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-[#ffdd77] hover:bg-[#ffe9a0] text-black font-semibold px-6 py-3 rounded transition-colors"
        >
          🌙 Visit Coyotes &amp; Candles
        </a>
      </section>

      {/* Features */}
      <section>
        <h3 className="text-2xl font-semibold mb-4 text-white">Features</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#ffdd77] transition-colors">
            <h4 className="font-semibold text-[#ffdd77] mb-2">☁️ Cloud Sync</h4>
            <p className="text-gray-400 text-sm">
              Sync DiceCloud V2 characters to the cloud for import on any device.
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#ffdd77] transition-colors">
            <h4 className="font-semibold text-[#ffdd77] mb-2">🗺️ Built-in VTT</h4>
            <p className="text-gray-400 text-sm">
              Video, battle maps, fog of war, initiative and a shared dice roller &mdash; all in the browser.
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#ffdd77] transition-colors">
            <h4 className="font-semibold text-[#ffdd77] mb-2">✨ Full 5e Import</h4>
            <p className="text-gray-400 text-sm">
              Abilities, saves, skills, HP, AC, attacks, spells, slots and currency map into the sheet.
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#ffdd77] transition-colors">
            <h4 className="font-semibold text-[#ffdd77] mb-2">🔗 One-click Pickup</h4>
            <p className="text-gray-400 text-sm">
              The extension surfaces your synced characters right inside the room&apos;s import picker.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
