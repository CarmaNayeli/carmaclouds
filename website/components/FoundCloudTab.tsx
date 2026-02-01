'use client'

import Image from 'next/image'
import { useState } from 'react'

export default function FoundCloudTab() {
  const [copied, setCopied] = useState(false)

  const copyManifestUrl = async () => {
    const url = 'https://carmaclouds.vercel.app/foundry-module/module.json'
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="space-y-8">
      <section className="flex items-center gap-4">
        <Image
          src="/foundcloud-die.png"
          alt="FoundCloud Die"
          width={80}
          height={80}
          className="rounded-lg"
        />
        <div>
          <h2 className="text-3xl font-bold mb-2 text-white">
            FoundCloud
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            DiceCloud integration for Foundry VTT - sync your character sheets with cloud storage
            and access them from the browser extension.
          </p>
        </div>
      </section>

      {/* Foundry VTT Module Section */}
      <section className="bg-black border border-orange-400 rounded-lg p-6">
        <h3 className="text-2xl font-semibold mb-4 text-orange-400">Foundry VTT Module</h3>
        <p className="text-gray-400 mb-6">
          Install the FoundCloud module in Foundry VTT to sync DiceCloud characters via Supabase cloud storage.
        </p>

        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Module Manifest URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value="https://carmaclouds.vercel.app/foundry-module/module.json"
              readOnly
              className="flex-1 bg-black border border-gray-600 rounded px-3 py-2 text-gray-300 font-mono text-sm"
            />
            <button
              onClick={copyManifestUrl}
              className="bg-orange-400 hover:bg-orange-500 text-white font-medium px-4 py-2 rounded transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Installation Steps:</h4>
          <ol className="space-y-3 text-gray-400">
            <li className="flex items-start">
              <span className="text-orange-400 font-semibold mr-3">1.</span>
              <span>Open Foundry VTT and navigate to the "Add-on Modules" tab</span>
            </li>
            <li className="flex items-start">
              <span className="text-orange-400 font-semibold mr-3">2.</span>
              <span>Click "Install Module"</span>
            </li>
            <li className="flex items-start">
              <span className="text-orange-400 font-semibold mr-3">3.</span>
              <span>Paste the manifest URL above into the "Manifest URL" field</span>
            </li>
            <li className="flex items-start">
              <span className="text-orange-400 font-semibold mr-3">4.</span>
              <span>Click "Install" and activate the module in your world</span>
            </li>
          </ol>
        </div>
      </section>

      {/* Browser Extension Section - Coming Soon */}
      <section className="bg-black border border-gray-800 rounded-lg p-6">
        <h3 className="text-2xl font-semibold mb-4 text-white">Browser Extension</h3>
        <div className="bg-gray-900 border border-orange-400/30 rounded-lg p-6 text-center">
          <h4 className="text-xl font-bold mb-2 text-orange-400">
            Coming Soon
          </h4>
          <p className="text-gray-400 mb-4">
            The FoundCloud browser extension is currently in development
          </p>
          <a
            href="https://github.com/CarmaNayeli/carmaclouds"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-orange-400 hover:bg-orange-500 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            📋 Follow Development on GitHub
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <h3 className="text-2xl font-semibold mb-4 text-white">Features</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-orange-400 transition-colors">
            <h4 className="font-semibold text-orange-400 mb-2">☁️ Cloud Sync</h4>
            <p className="text-gray-400 text-sm">
              Sync your DiceCloud characters to Foundry VTT via Supabase cloud storage
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-orange-400 transition-colors">
            <h4 className="font-semibold text-orange-400 mb-2">📜 DiceCloud Integration</h4>
            <p className="text-gray-400 text-sm">
              Access your DiceCloud V2 character sheets directly in Foundry
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-orange-400 transition-colors">
            <h4 className="font-semibold text-orange-400 mb-2">🎲 Custom Sheet</h4>
            <p className="text-gray-400 text-sm">
              Beautiful custom character sheet with combat tracking and action economy
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-orange-400 transition-colors">
            <h4 className="font-semibold text-orange-400 mb-2">⚔️ Combat Tools</h4>
            <p className="text-gray-400 text-sm">
              Attack rolls, damage, spell slots, and resource tracking
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
