'use client'

import { useState } from 'react'
import Image from 'next/image'
import HomeTab from '@/components/HomeTab'
import PipTab from '@/components/PipTab'
import RollCloudTab from '@/components/RollCloudTab'
import OwlCloudTab from '@/components/OwlCloudTab'
import FoundCloudTab from '@/components/FoundCloudTab'

type Tab = 'home' | 'rollcloud' | 'owlcloud' | 'foundcloud' | 'pip'

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('home')

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="CarmaClouds Logo"
              width={120}
              height={120}
              className="rounded-lg"
            />
          </div>
          <h1 className="text-5xl font-bold mb-4 text-white">
            CarmaClouds
          </h1>
          <p className="text-gray-400 text-lg">
            Tabletop Gaming Tools for DiceCloud, Roll20, Owlbear Rodeo & Foundry VTT
          </p>
        </header>

        {/* Tab Navigation */}
        <nav className="flex gap-4 mb-8 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'home'
                ? 'border-b-2 border-[#16a75a] text-[#16a75a]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveTab('rollcloud')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'rollcloud'
                ? 'border-b-2 border-[#e91e8c] text-[#e91e8c]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            🎲 RollCloud
          </button>
          <button
            onClick={() => setActiveTab('owlcloud')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'owlcloud'
                ? 'border-b-2 border-[#a855f7] text-[#a855f7]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            🎲 OwlCloud
          </button>
          <button
            onClick={() => setActiveTab('foundcloud')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'foundcloud'
                ? 'border-b-2 border-orange-400 text-orange-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            🎲 FoundCloud
            <span className="ml-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
              Coming Soon
            </span>
          </button>
          <button
            onClick={() => setActiveTab('pip')}
            className={`ml-auto px-6 py-3 font-medium transition-colors ${
              activeTab === 'pip'
                ? 'border-b-2 border-[#2dd97c] text-[#2dd97c]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            🤖 Pip2
          </button>
        </nav>

        {/* Tab Content */}
        <div className="bg-gray-900/50 rounded-lg p-8 border border-gray-800">
          {activeTab === 'home' && <HomeTab setActiveTab={setActiveTab} />}
          {activeTab === 'pip' && <PipTab />}
          {activeTab === 'rollcloud' && <RollCloudTab />}
          {activeTab === 'owlcloud' && <OwlCloudTab />}
          {activeTab === 'foundcloud' && <FoundCloudTab />}
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
