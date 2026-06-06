'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import HomeTab from '@/components/HomeTab'
import PipTab from '@/components/PipTab'
import RollCloudTab from '@/components/RollCloudTab'
import OwlCloudTab from '@/components/OwlCloudTab'
import FoundCloudTab from '@/components/FoundCloudTab'
import CoyoteCloudTab from '@/components/CoyoteCloudTab'

type Tab = 'home' | 'rollcloud' | 'owlcloud' | 'foundcloud' | 'coyotecloud' | 'pip'

// Canonical short slug written to the URL hash per tab (home clears the hash).
const HASH_FROM_TAB: Record<Tab, string> = {
  home: '',
  rollcloud: 'roll',
  owlcloud: 'owl',
  foundcloud: 'found',
  coyotecloud: 'coyote',
  pip: 'pip',
}

// Hash -> tab, accepting the short slug, the full tab id, and friendly aliases.
const TAB_FROM_HASH: Record<string, Tab> = {
  '': 'home', home: 'home',
  roll: 'rollcloud', rollcloud: 'rollcloud', roll20: 'rollcloud',
  owl: 'owlcloud', owlcloud: 'owlcloud', owlbear: 'owlcloud',
  found: 'foundcloud', foundcloud: 'foundcloud', foundry: 'foundcloud',
  coyote: 'coyotecloud', coyotecloud: 'coyotecloud', coyotes: 'coyotecloud', candles: 'coyotecloud',
  pip: 'pip', pip2: 'pip',
}

function tabFromHash(): Tab {
  if (typeof window === 'undefined') return 'home'
  const h = window.location.hash.replace(/^#/, '').toLowerCase()
  return TAB_FROM_HASH[h] ?? 'home'
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('home')

  // Drive the tab from the URL hash: on first mount (so deep links like
  // /#coyote open the right tab) and whenever the hash changes via the address
  // bar, an external link, or the browser back/forward buttons.
  useEffect(() => {
    const sync = () => setActiveTab(tabFromHash())
    sync()
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])

  const goTab = (tab: Tab) => {
    setActiveTab(tab)
    const slug = HASH_FROM_TAB[tab]
    if (slug) {
      if (window.location.hash !== `#${slug}`) window.history.pushState(null, '', `#${slug}`)
    } else if (window.location.hash) {
      // Home: drop the hash without leaving a bare "#".
      window.history.pushState(null, '', window.location.pathname + window.location.search)
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="CarmaClouds Logo"
              width={180}
              height={180}
              className="rounded-lg"
            />
          </div>
          <h1 className="text-5xl font-bold mb-4 text-white">
            CarmaClouds
          </h1>
          <p className="text-gray-400 text-lg">
            Tabletop Gaming Tools for DiceCloud, Roll20, Owlbear Rodeo, Foundry VTT & Coyotes & Candles
          </p>
        </header>

        {/* Tab Navigation */}
        <nav className="flex gap-4 mb-8 border-b border-gray-800">
          <button
            onClick={() => goTab('home')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'home'
                ? 'border-b-2 border-[#16a75a] text-[#16a75a]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => goTab('rollcloud')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'rollcloud'
                ? 'border-b-2 border-[#e91e8c] text-[#e91e8c]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            RollCloud
          </button>
          <button
            onClick={() => goTab('owlcloud')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'owlcloud'
                ? 'border-b-2 border-[#a855f7] text-[#a855f7]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            OwlCloud
          </button>
          <button
            onClick={() => goTab('foundcloud')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'foundcloud'
                ? 'border-b-2 border-orange-400 text-orange-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            FoundCloud
          </button>
          <button
            onClick={() => goTab('coyotecloud')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'coyotecloud'
                ? 'border-b-2 border-[#ffdd77] text-[#ffdd77]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            CoyoteCloud
          </button>
          <button
            onClick={() => goTab('pip')}
            className={`ml-auto px-6 py-3 font-medium transition-colors ${
              activeTab === 'pip'
                ? 'border-b-2 border-[#2dd97c] text-[#2dd97c]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Pip2
          </button>
        </nav>

        {/* Tab Content */}
        <div className="bg-gray-900/50 rounded-lg p-8 border border-gray-800">
          {activeTab === 'home' && <HomeTab setActiveTab={goTab} />}
          {activeTab === 'pip' && <PipTab />}
          {activeTab === 'rollcloud' && <RollCloudTab />}
          {activeTab === 'owlcloud' && <OwlCloudTab />}
          {activeTab === 'foundcloud' && <FoundCloudTab />}
          {activeTab === 'coyotecloud' && <CoyoteCloudTab />}
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-400 text-sm">
          <p>
            Built with ❤️ by{' '}
            <a
              href="https://carmabella.carrd.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#16a75a] hover:text-[#1ec96e]"
            >
              Carmabella
            </a>
          </p>
          <p className="mt-2">
            <a
              href="https://github.com/CarmaNayeli/carmaclouds"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-300"
            >
              GitHub
            </a>
            {' • '}
            <a
              href="https://github.com/CarmaNayeli/carmaclouds/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-300"
            >
              Report Issue
            </a>
          </p>
        </footer>
      </div>
    </main>
  )
}
