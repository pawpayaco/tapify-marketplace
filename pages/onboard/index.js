import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

// A store owner who has never heard of Pawpaya needs three things: what this is,
// what they get, and how to get one. The display photo answers the first one on
// its own, so the page mostly gets out of its way.
export default function OnboardIndex() {
  const [isCopied, setIsCopied] = useState(false);

  const handleManagerShare = async () => {
    const shareUrl = window.location.origin + '/onboard/about';

    // Native share sheet where it exists (iOS/iPadOS/macOS, Android) so the
    // manager can text it to the owner directly. Only fall back to the clipboard
    // when there's no sheet to open — showing "Link copied" while a share sheet
    // is up tells the user the wrong thing happened.
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pawpaya Display Program',
          text: "I found this program that's completely free to sign up, can you check it out?",
          url: shareUrl,
        });
        return;
      } catch (shareErr) {
        if (shareErr.name === 'AbortError') return; // user dismissed the sheet
        console.log('Share failed, falling back to clipboard:', shareErr);
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (clipboardErr) {
      console.log('Clipboard write failed:', clipboardErr);
    }
  };

  return (
    <div className="t-page">
      <section className="o-hero">
        <div className="o-hero__copy">
          <h1 className="o-h1">
            A free display<br />for your store.
          </h1>
          <p className="o-lede">
            Customers tap it to make a collar for their dog. We ship it to them.
            You keep <span className="o-pct">30%</span>.
          </p>
          <div className="o-actions">
            <Link href="/onboard/register" className="t-btn t-btn--primary">Claim your display</Link>
            <a href="tel:+17159791259" className="t-btn t-btn--secondary">(715) 979-1259</a>
          </div>
        </div>

        <div className="o-hero__img">
          <Image
            src="/images/image41.jpg"
            alt="The Pawpaya countertop display, stocked with beaded name collars"
            width={1200}
            height={1200}
            priority
            sizes="(max-width: 900px) 100vw, 52vw"
          />
        </div>
      </section>

      <section className="o-facts">
        <div className="o-fact">
          <p className="o-fact__k">Your cost</p>
          <p className="o-fact__v">$0</p>
        </div>
        <div className="o-fact">
          <p className="o-fact__k">Your inventory</p>
          <p className="o-fact__v">None</p>
        </div>
        <div className="o-fact">
          <p className="o-fact__k">Your cut</p>
          <p className="o-fact__v">30%</p>
        </div>
      </section>

      <section className="o-close">
        <Link href="/onboard/register" className="t-btn t-btn--primary">Claim your display</Link>
        <p className="o-close__note">Not the owner?</p>
        <button onClick={handleManagerShare} className="t-btn t-btn--secondary o-share">
          <svg className="o-share__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 16V3" />
            <path d="M8 7l4-4 4 4" />
            <path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
          {isCopied ? 'Link copied' : 'Send this to them'}
        </button>
      </section>
    </div>
  );
}
