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
            The Foundry VTT tab in CarmaClouds extension. Sync your DiceCloud V2 characters to Foundry VTT with cloud storage.
          </p>
        </div>
      </section>

      <section className="bg-black border border-orange-400 rounded-lg p-6">
        <h3 className="text-2xl font-semibold mb-4 text-orange-400">Download CarmaClouds</h3>
        <div className="space-y-4">
          <p className="text-gray-400 mb-4">
            FoundCloud is included in the unified CarmaClouds extension. Install once, use everywhere.
          </p>
          <div className="flex gap-4">
            <a
              href="https://github.com/CarmaNayeli/carmaclouds/releases/latest/download/carmaclouds-chrome.zip"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-orange-400 hover:bg-orange-500 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Download for Chrome/Edge
            </a>
            <a
              href="https://github.com/CarmaNayeli/carmaclouds/releases/latest/download/carmaclouds-firefox.zip"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-orange-400 hover:bg-orange-500 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Download for Firefox
            </a>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-semibold mb-4 text-white">How to Use FoundCloud</h3>
        <ol className="space-y-4 text-gray-400">
          <li className="flex items-start">
            <span className="text-orange-400 font-semibold mr-3 text-xl">1.</span>
            <div>
              <strong className="text-white">Install Foundry Module</strong>
              <p className="mt-1">In Foundry VTT, install the FoundCloud module using manifest URL: <code className="bg-gray-800 px-2 py-1 rounded text-sm">https://carmaclouds.vercel.app/foundry-module/module.json</code></p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="text-orange-400 font-semibold mr-3 text-xl">2.</span>
            <div>
              <strong className="text-white">Sync from DiceCloud</strong>
              <p className="mt-1">Open the CarmaClouds extension → FoundCloud tab → Click "☁️ Sync to Cloud" on your character</p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="text-orange-400 font-semibold mr-3 text-xl">3.</span>
            <div>
              <strong className="text-white">Import to Foundry</strong>
              <p className="mt-1">In Foundry, click the orange "Import from DiceCloud" button in the Actors sidebar</p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="text-orange-400 font-semibold mr-3 text-xl">4.</span>
            <div>
              <strong className="text-white">Done!</strong>
              <p className="mt-1">Your character is now in Foundry with stats, skills, spells, features, and inventory</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="bg-black border border-orange-400 rounded-lg p-6">
        <h3 className="text-2xl font-semibold mb-4 text-orange-400">Foundry Module Installation</h3>
        <p className="text-gray-400 mb-6">
          Copy the manifest URL below to install the FoundCloud module in Foundry VTT.
        </p>

        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
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
            <h4 className="font-semibold text-orange-400 mb-2">✨ Complete Import</h4>
            <p className="text-gray-400 text-sm">
              Import stats, skills, HP, AC, spells, features, inventory, and portraits
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-orange-400 transition-colors">
            <h4 className="font-semibold text-orange-400 mb-2">🔄 Easy Sync</h4>
            <p className="text-gray-400 text-sm">
              One-click sync from DiceCloud to Foundry via cloud storage
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
