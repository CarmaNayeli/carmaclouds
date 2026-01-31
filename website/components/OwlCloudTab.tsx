'use client'

import Image from 'next/image'
import { useState } from 'react'

export default function OwlCloudTab() {
  const [copied, setCopied] = useState(false)

  const copyManifestUrl = async () => {
    const url = 'https://carmaclouds.vercel.app/owlcloud/extension/manifest.json'
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
            Browser extension that integrates DiceCloud character sheets with Owlbear Rodeo,
            bringing your D&D characters to life in your favorite virtual tabletop.
          </p>
        </div>
      </section>

      <section className="bg-black border border-[#a855f7] rounded-lg p-6">
        <h3 className="text-2xl font-semibold mb-4 text-[#a855f7]">Download</h3>
        <div className="space-y-4">
          <a
            href="https://github.com/CarmaNayeli/carmaclouds/tree/master/packages/owlcloud"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#a855f7] hover:bg-[#c084fc] text-white font-medium px-6 py-3 rounded-lg transition-colors"
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
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#a855f7] transition-colors">
            <h4 className="font-semibold text-[#a855f7] mb-2">DiceCloud Integration</h4>
            <p className="text-gray-400 text-sm">
              Access your DiceCloud character sheets from Owlbear Rodeo
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#a855f7] transition-colors">
            <h4 className="font-semibold text-[#a855f7] mb-2">Owlbear Extension</h4>
            <p className="text-gray-400 text-sm">
              Native Owlbear Rodeo extension for in-game character management
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#a855f7] transition-colors">
            <h4 className="font-semibold text-[#a855f7] mb-2">Dice Rolling</h4>
            <p className="text-gray-400 text-sm">
              Roll dice directly from your character sheet in Owlbear
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#a855f7] transition-colors">
            <h4 className="font-semibold text-[#a855f7] mb-2">Character State</h4>
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
            <span className="text-[#a855f7] font-semibold mr-3">1.</span>
            <span>Download the extension from GitHub</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#a855f7] font-semibold mr-3">2.</span>
            <span>Open your browser's extension management page</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#a855f7] font-semibold mr-3">3.</span>
            <span>Enable "Developer mode"</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#a855f7] font-semibold mr-3">4.</span>
            <span>Click "Load unpacked" and select the OwlCloud dist directory</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#a855f7] font-semibold mr-3">5.</span>
            <span>Navigate to DiceCloud or Owlbear Rodeo to start using OwlCloud</span>
          </li>
        </ol>
      </section>

      <section className="bg-black border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-[#a855f7]">Step 2: Owlbear Extension</h3>
        <ol className="space-y-3 text-gray-400 mb-6">
          <li className="flex items-start">
            <span className="text-[#a855f7] font-semibold mr-3">1.</span>
            <span>Open your Owlbear Rodeo room</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#a855f7] font-semibold mr-3">2.</span>
            <span>Navigate to Extensions in the room settings</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#a855f7] font-semibold mr-3">3.</span>
            <span>Click "Add Extension" and paste the manifest URL below</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#a855f7] font-semibold mr-3">4.</span>
            <span>Enable the extension and reload your room</span>
          </li>
        </ol>
        
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Extension Manifest URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value="https://carmaclouds.vercel.app/owlcloud/extension/manifest.json"
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
    </div>
  )
}
