import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

// The one page where Tesla's actual mechanism applies: there IS photography, and
// it's good. So the display carries the page and the UI gets out of the way.
// Sections alternate side to side, and stack on mobile.
export default function OnboardIndex() {
  const [isCopied, setIsCopied] = useState(false);

  const handleManagerShare = async () => {
    const shareUrl = window.location.origin + '/onboard/about';
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (clipboardErr) {
      console.log('Clipboard write failed:', clipboardErr);
    }
  };

  return (
    <div className="t-page">
      {/* Hero — the display is the argument. Two actions, nothing else. */}
      <section className="o-hero">
        <div className="o-hero__copy">
          <p className="o-eyebrow">For pet stores, groomers &amp; self-wash</p>
          <h1 className="o-h1">
            Free display.<br />
            <span className="o-h1__brand">30% of every tap.</span>
          </h1>
          <p className="o-lede">
            We print it, ship it, and stock it. A customer taps their phone, builds a
            collar, and we mail it to them. You keep 30% and never touch inventory.
          </p>
          <div className="o-actions">
            <Link href="/onboard/register" className="t-btn t-btn--primary">Claim your display</Link>
            <button onClick={handleManagerShare} className="t-btn t-btn--secondary">
              {isCopied ? 'Link copied' : 'I’m a manager — share this'}
            </button>
          </div>
        </div>
        <div className="o-hero__img">
          <Image
            src="/images/image41.jpg"
            alt="The Pawpaya countertop display, stocked with beaded name collars"
            width={1200}
            height={1200}
            priority
            sizes="(max-width: 900px) 100vw, 50vw"
          />
        </div>
      </section>

      {/* Alternating rows. Each makes exactly one claim. */}
      <section className="o-row">
        <div className="o-row__img">
          <Image src="/images/image40.jpg" alt="The display on a store counter" width={1000} height={1000} sizes="(max-width: 900px) 100vw, 50vw" />
        </div>
        <div className="o-row__copy">
          <h2 className="o-h2">It sits by your register</h2>
          <p className="o-body">
            Comes with hooks for peg board and slat wall, sample collars, and the tags
            already encoded. You unbox it and put it down. That&apos;s the whole install.
          </p>
        </div>
      </section>

      <section className="o-row o-row--flip">
        <div className="o-row__img">
          <Image src="/images/image42.jpg" alt="A dog wearing a personalized beaded collar" width={1000} height={1000} sizes="(max-width: 900px) 100vw, 50vw" />
        </div>
        <div className="o-row__copy">
          <h2 className="o-h2">They tap. We ship. You get paid.</h2>
          <p className="o-body">
            The customer taps their phone on the paw print, picks their dog&apos;s name and
            colors, and checks out on their own phone. We make it and mail it straight
            to them. Nothing ships to you, and there&apos;s no wholesale to buy.
          </p>
        </div>
      </section>

      {/* The mechanism as a spec row, not four emoji cards. */}
      <section className="o-steps">
        <div className="t-wrap">
          <h2 className="o-h2" style={{ marginBottom: 40 }}>How it works</h2>
          <ol className="o-steps__grid">
            {[
              ['Customer sees the display', 'Near your register, where they’re already standing.'],
              ['Taps their phone', 'No app. The tag opens the builder straight away.'],
              ['We make and ship it', 'Direct to them, usually within a week.'],
              ['You earn 30%', 'Tracked to your store automatically, paid to your bank.'],
            ].map(([title, note], i) => (
              <li key={i} className="o-step">
                <span className="o-step__n">{i + 1}</span>
                <h3 className="o-step__t">{title}</h3>
                <p className="o-step__p">{note}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Two doors, because two different people read this page. */}
      <section className="o-doors">
        <div className="o-door">
          <h2 className="o-h2">You own the store</h2>
          <p className="o-body">Claim a display and we&apos;ll ship it free. Takes about two minutes.</p>
          <Link href="/onboard/register" className="t-btn t-btn--primary" style={{ marginTop: 24 }}>
            Claim your display
          </Link>
        </div>
        <div className="o-door">
          <h2 className="o-h2">You work here</h2>
          <p className="o-body">Send this to whoever makes the call. If they sign up, you get credited.</p>
          <button onClick={handleManagerShare} className="t-btn t-btn--secondary" style={{ marginTop: 24 }}>
            {isCopied ? 'Link copied' : 'Copy the link'}
          </button>
        </div>
      </section>

      <section className="o-close">
        <p className="o-body" style={{ margin: 0 }}>Questions? Call us — a real person answers.</p>
        <a href="tel:+17159791259" className="o-phone">(715) 979-1259</a>
      </section>
    </div>
  );
}
