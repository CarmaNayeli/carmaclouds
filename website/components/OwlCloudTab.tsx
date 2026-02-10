'use client'

import Image from 'next/image'
import { useState } from 'react'

export default function OwlCloudTab() {
  const [copied, setCopied] = useState(false)

  const copyManifestUrl = async () => {
    const url = 'https://carmaclouds.vercel.app/extension/owlbear-extension/manifest.json'
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
          src="/owlcloud-die.png"
          alt="OwlCloud Die"
          width={80}
          height={80}
          className="rounded-lg"
        />
        <div>
          <h2 className="text-3xl font-bold mb-2 text-white">
            OwlCloud
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            The Owlbear Rodeo tab in CarmaClouds extension. Sync your DiceCloud V2 characters to Owlbear Rodeo with one click.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-semibold mb-4 text-white">How to Use OwlCloud</h3>
        <ol className="space-y-4 text-gray-400">
          <li className="flex items-start">
            <span className="text-[#a855f7] font-semibold mr-3 text-xl">1.</span>
            <div>
              <strong className="text-white">Install Owlbear Extension</strong>
              <p className="mt-1">In Owlbear Rodeo, add the OwlCloud extension using manifest URL: <code className="bg-gray-800 px-2 py-1 rounded text-sm">https://carmaclouds.vercel.app/extension/owlbear-extension/manifest.json</code></p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="text-[#a855f7] font-semibold mr-3 text-xl">2.</span>
            <div>
              <strong className="text-white">Sync from DiceCloud</strong>
              <p className="mt-1">Go to dicecloud.com, open your character, and click "Sync to CarmaClouds"</p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="text-[#a855f7] font-semibold mr-3 text-xl">3.</span>
            <div>
              <strong className="text-white">Open Owlbear Rodeo</strong>
              <p className="mt-1">Navigate to owlbear.rodeo and open your room</p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="text-[#a855f7] font-semibold mr-3 text-xl">4.</span>
            <div>
              <strong className="text-white">Done!</strong>
              <p className="mt-1">Open the OwlCloud popover to access your character sheet with rolls, spells, and abilities</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="bg-black border border-[#a855f7] rounded-lg p-6">
        <h3 className="text-2xl font-semibold mb-4 text-[#a855f7]">Owlbear Extension Installation</h3>
        <p className="text-gray-400 mb-6">
          Copy the manifest URL below to install the OwlCloud extension in Owlbear Rodeo.
        </p>

        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Extension Manifest URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value="https://carmaclouds.vercel.app/extension/owlbear-extension/manifest.json"
              readOnly
              className="flex-1 bg-black border border-gray-600 rounded px-3 py-2 text-gray-300 font-mono text-sm"
            />
            <button
              onClick={copyManifestUrl}
              className="bg-[#a855f7] hover:bg-[#c084fc] text-white font-medium px-4 py-2 rounded transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-semibold mb-4 text-white">Features</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#a855f7] transition-colors">
            <h4 className="font-semibold text-[#a855f7] mb-2">One-Click Push</h4>
            <p className="text-gray-400 text-sm">
              Send your entire character sheet to Owlbear Rodeo instantly
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#a855f7] transition-colors">
            <h4 className="font-semibold text-[#a855f7] mb-2">Full Character Data</h4>
            <p className="text-gray-400 text-sm">
              Attributes, skills, saves, spells, inventory - everything syncs
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#a855f7] transition-colors">
            <h4 className="font-semibold text-[#a855f7] mb-2">3D Dice Integration</h4>
            <p className="text-gray-400 text-sm">
              Beautiful physics-based 3D dice with Dice+ extension support
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#a855f7] transition-colors">
            <h4 className="font-semibold text-[#a855f7] mb-2">Persistent Chat</h4>
            <p className="text-gray-400 text-sm">
              Session-long chat history with all rolls, spells, and actions
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
