import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — CarmaClouds',
  description: 'How CarmaClouds handles your data.',
}

// Last substantive update. Bump when the practices described here change.
const LAST_UPDATED = '15 June 2026'
const CONTACT_EMAIL = 'carmabella1222@gmail.com'

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-[#16a75a] hover:text-[#1ec96e] text-sm">
          ← Back to CarmaClouds
        </Link>

        <h1 className="text-4xl font-bold mt-6 mb-2 text-white">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <p>
              CarmaClouds is a free, open-source (MIT) hobby project that syncs your
              Dungeons &amp; Dragons character data from{' '}
              <a className="text-[#16a75a] hover:text-[#1ec96e]" href="https://dicecloud.com" target="_blank" rel="noopener noreferrer">DiceCloud</a>{' '}
              to virtual tabletops (Roll20, Owlbear Rodeo, Foundry VTT and Coyotes &amp; Candles).
              This policy explains what data it handles, why, and the choices you have.
              It is written to meet the EU General Data Protection Regulation (GDPR).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">Who is responsible</h2>
            <p>
              The data controller is the individual maintainer of CarmaClouds (&ldquo;Carmabella&rdquo;).
              For any privacy question or to exercise your rights, contact{' '}
              <a className="text-[#16a75a] hover:text-[#1ec96e]" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{' '}
              or open an issue on{' '}
              <a className="text-[#16a75a] hover:text-[#1ec96e]" href="https://github.com/CarmaNayeli/carmaclouds/issues" target="_blank" rel="noopener noreferrer">GitHub</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">This website</h2>
            <p>
              The carmaclouds website itself uses <strong>no cookies, no analytics, and no
              third-party tracking</strong>. The only thing it stores is a single flag in your
              browser&rsquo;s local storage to remember that you dismissed the notice banner.
              Nothing about that leaves your device.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">The browser extension</h2>
            <p className="mb-3">
              The extension only does anything when you log in to DiceCloud and choose to sync a
              character. When you do, it processes and stores the following so your characters can
              appear on your virtual tabletop:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Character data</strong> — the D&amp;D characters you sync (names, stats,
                spells, inventory, and any notes you put on them). These are fictional, but free-text
                fields may contain whatever you type.
              </li>
              <li>
                <strong>A DiceCloud session token</strong> — stored so the extension can fetch your
                characters on your behalf. It is kept encrypted at rest, is accessible only to your
                own account, and is never shown to other users.
              </li>
              <li>
                <strong>Your DiceCloud username and user ID</strong> — to associate characters with you.
              </li>
              <li>
                <strong>An account identifier</strong> — when you sync, the extension signs you in to
                our database provider. By default this is an <em>anonymous</em> account (no email
                needed). If you want your characters to appear in a separate app you&rsquo;re signed
                into (e.g. the Owlbear Rodeo panel), you can create an optional account with an email
                and password so both sides share one identity.
              </li>
            </ul>
            <p className="mt-3">
              The extension does <strong>not</strong> collect browsing history, and it only runs on
              DiceCloud, Roll20, Owlbear Rodeo and Coyotes &amp; Candles pages (the sites it
              integrates with).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">Legal basis</h2>
            <p>
              We process this data on the basis of your <strong>consent</strong>, which you give by
              logging in and choosing to sync a character. The sole purpose is to provide the sync
              feature you asked for. You can withdraw consent at any time by deleting your data and
              logging out (see <em>Your rights</em>).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">Where your data goes</h2>
            <p className="mb-3">CarmaClouds relies on a small number of service providers (processors):</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Supabase</strong> — database and authentication, hosting your synced
                characters and account. Data is stored in the <strong>European Union</strong>.
              </li>
              <li>
                <strong>Vercel</strong> — hosts this website and the extension downloads.
              </li>
              <li>
                <strong>DiceCloud</strong> — the source of your character data, which you already
                use directly.
              </li>
              <li>
                <strong>The virtual tabletop you choose</strong> (Roll20, Owlbear Rodeo, Foundry VTT,
                Coyotes &amp; Candles) — receives the character data you push to it.
              </li>
            </ul>
            <p className="mt-3">
              Your data is never sold, and is never shared for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">How it is protected</h2>
            <p>
              Each user&rsquo;s data is isolated at the database level so only your own account can
              read or change your characters and token. Session tokens are encrypted at rest, and all
              traffic uses HTTPS.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">How long it is kept</h2>
            <p>
              Synced characters are kept until you delete them or ask us to remove your data. Session
              tokens are short-lived and refreshed as you use the extension. If you stop using
              CarmaClouds and want everything removed, contact us (below).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">Your rights</h2>
            <p className="mb-3">Under the GDPR you can:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>access a copy of the data we hold about you;</li>
              <li>correct or delete it;</li>
              <li>withdraw consent and have your data erased;</li>
              <li>object to or restrict processing;</li>
              <li>lodge a complaint with your local data protection authority.</li>
            </ul>
            <p className="mt-3">
              You can delete individual characters yourself from within the extension. To erase your
              account and everything associated with it, email{' '}
              <a className="text-[#16a75a] hover:text-[#1ec96e]" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{' '}
              and we will action it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">Children</h2>
            <p>
              CarmaClouds is not directed at children under 16 and we do not knowingly collect their data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">Changes</h2>
            <p>
              If these practices change, we&rsquo;ll update this page and the &ldquo;last updated&rdquo;
              date above. Material changes will be noted in the project&rsquo;s release notes.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-800">
          <Link href="/" className="text-[#16a75a] hover:text-[#1ec96e] text-sm">
            ← Back to CarmaClouds
          </Link>
        </div>
      </div>
    </main>
  )
}
