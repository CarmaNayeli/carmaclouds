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
            Browser extension that integrates DiceCloud character sheets with Owlbear Rodeo,
            bringing your D&D characters to life in your favorite virtual tabletop.
          </p>
        </div>
      </section>

      <section className="bg-black border border-[#a855f7] rounded-lg p-6">
        <h3 className="text-2xl font-semibold mb-4 text-[#a855f7]">Download Browser Extension</h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <a
              href="https://github.com/CarmaNayeli/carmaclouds/releases/download/owlcloud-v2.1.0/owlcloud-v2.1.0-firefox.zip"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#a855f7] hover:bg-[#c084fc] text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              📥 Download Firefox Extension
            </a>
            <a
              href="https://github.com/CarmaNayeli/carmaclouds/releases/tag/owlcloud-v2.1.0"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gray-700 hover:bg-gray-600 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              📋 View Release Notes
            </a>
          </div>
          <p className="text-gray-500 text-sm">
            Current version: <span className="text-[#a855f7] font-semibold">v2.2.1</span> - HP management, formula evaluation, and enhanced character sync!
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-semibold mb-4 text-white">Features</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#a855f7] transition-colors">
            <h4 className="font-semibold text-[#a855f7] mb-2">🎲 3D Dice Integration</h4>
            <p className="text-gray-400 text-sm">
              Beautiful physics-based 3D dice with{' '}
              <a
                href="https://extensions.owlbear.rodeo/dice-plus"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#a855f7] hover:text-[#c084fc] underline"
              >
                Dice+
              </a>
              {' '}extension support. If you enjoy Dice+, support the developer:{' '}
              <a
                href="https://www.patreon.com/c/MissingLinkDev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#a855f7] hover:text-[#c084fc] underline"
              >
                Missing Link Dev on Patreon
              </a>
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#a855f7] transition-colors">
            <h4 className="font-semibold text-[#a855f7] mb-2">📜 DiceCloud Integration</h4>
            <p className="text-gray-400 text-sm">
              Access your DiceCloud character sheets from Owlbear Rodeo
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#a855f7] transition-colors">
            <h4 className="font-semibold text-[#a855f7] mb-2">🦉 Owlbear Extension</h4>
            <p className="text-gray-400 text-sm">
              Native Owlbear Rodeo extension for in-game character management
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#a855f7] transition-colors">
            <h4 className="font-semibold text-[#a855f7] mb-2">💬 Persistent Chat</h4>
            <p className="text-gray-400 text-sm">
              Session-long chat history with all rolls, spells, and actions
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#a855f7] transition-colors">
            <h4 className="font-semibold text-[#a855f7] mb-2">⚔️ Combat Tools</h4>
            <p className="text-gray-400 text-sm">
              Attack rolls, damage, death saves, and advantage/disadvantage
            </p>
          </div>
          <div className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#a855f7] transition-colors">
            <h4 className="font-semibold text-[#a855f7] mb-2">📊 Character State</h4>
            <p className="text-gray-400 text-sm">
              Track HP, spell slots, and other resources in real-time
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-semibold mb-4 text-white">Setup Guide</h3>

        <div className="bg-black border border-gray-800 rounded-lg p-6 mb-6">
          <h4 className="text-xl font-semibold mb-3 text-[#a855f7]">Step 1: Install Browser Extension</h4>
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
          </ol>
        </div>

        <div className="bg-black border border-yellow-500 rounded-lg p-6 mb-6">
          <h4 className="text-xl font-semibold mb-3 text-yellow-500">Step 2: Create CarmaClouds Account</h4>
          <div className="bg-yellow-900 border border-yellow-500 rounded-lg p-4 mb-4">
            <p className="text-white font-semibold mb-2">⚠️ IMPORTANT SECURITY NOTICE</p>
            <p className="text-gray-300 text-sm leading-relaxed">
              Your CarmaClouds login is <span className="text-yellow-400 font-bold">NOT</span> your DiceCloud password!
              Create a <span className="text-[#a855f7] font-semibold">new, separate account</span> for CarmaClouds.
              Never use your DiceCloud credentials here.
            </p>
          </div>
          <ol className="space-y-3 text-gray-400">
            <li className="flex items-start">
              <span className="text-[#a855f7] font-semibold mr-3">1.</span>
              <span>Open the browser extension and click the OwlCloud tab</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#a855f7] font-semibold mr-3">2.</span>
              <span>Expand the "Character Sync" section</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#a855f7] font-semibold mr-3">3.</span>
              <span>Enter a <span className="text-[#a855f7]">new email and password</span> (not your DiceCloud credentials)</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#a855f7] font-semibold mr-3">4.</span>
              <span>Click "Sign Up" to create your account</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#a855f7] font-semibold mr-3">5.</span>
              <span>Once signed in, your DiceCloud characters will be synced automatically</span>
            </li>
          </ol>
          <div className="mt-4 p-3 bg-gray-900 border border-gray-700 rounded-lg">
            <p className="text-gray-400 text-sm">
              <span className="text-[#a855f7] font-semibold">Why a separate account?</span> CarmaClouds stores character sync data
              in a secure database. We never ask for or store your DiceCloud password. This keeps your DiceCloud account
              completely separate and secure.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-black border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-[#a855f7]">Step 3: Install Owlbear Extension</h3>
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

      <section className="bg-black border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-[#a855f7]">Step 4: Using OwlCloud in Owlbear Rodeo</h3>
        <ol className="space-y-3 text-gray-400 mb-4">
          <li className="flex items-start">
            <span className="text-[#a855f7] font-semibold mr-3">1.</span>
            <span>Open the OwlCloud extension popover in your Owlbear room</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#a855f7] font-semibold mr-3">2.</span>
            <span>Your active DiceCloud character will appear automatically</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#a855f7] font-semibold mr-3">3.</span>
            <span>Use the "Switch Character" section to select different characters</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#a855f7] font-semibold mr-3">4.</span>
            <span>Click through the tabs (Stats, Spells, Actions, etc.) to access your character sheet</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#a855f7] font-semibold mr-3">5.</span>
            <span>Roll abilities, cast spells, and track resources directly from the extension</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#a855f7] font-semibold mr-3">6.</span>
            <span>Open the chat window to see your complete session history</span>
          </li>
        </ol>
        <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
          <p className="text-gray-400 text-sm">
            <span className="text-[#a855f7] font-semibold">Pro Tip:</span> Install the{' '}
            <a
              href="https://extensions.owlbear.rodeo/dice-plus"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#a855f7] hover:text-[#c084fc] underline"
            >
              Dice+ extension
            </a>
            {' '}for beautiful 3D dice rolls that automatically sync with OwlCloud!
          </p>
        </div>
      </section>
    </div>
  )
}
