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
          <h1 className="o-h1">Personalized collars,<br />made to order.</h1>
          <p className="o-lede">
            A collar with the dog&apos;s name, and a bracelet to match. We put a free
            display on your counter. You keep 30%.
          </p>
          <div className="o-actions">
            <Link href="/onboard/register" className="t-btn t-btn--primary">Claim your display</Link>
            <a href="tel:+17159791259" className="t-btn t-btn--secondary">(715) 979-1259</a>
          </div>
        </div>

        {/* This photo is the pitch: the dog's name, the collar, and the owner's
            matching bracelet, all in one frame. It answers "will my customers
            actually want this" better than any sentence can. */}
        <div className="o-hero__img">
          <Image
            src="/images/hero-set.png"
            alt="A dog wearing a beaded collar spelling HARRY, with its owner wearing the matching HARRY bracelet"
            width={1200}
            height={1200}
            priority
            sizes="(max-width: 900px) 100vw, 52vw"
          />
        </div>
      </section>

      {/* Now the thing they actually receive. */}
      <section className="o-row">
        <div className="o-row__img">
          <Image
            src="/images/image41.jpg"
            alt="The Pawpaya countertop display, stocked with beaded name collars"
            width={1000}
            height={1000}
            sizes="(max-width: 900px) 100vw, 50vw"
          />
        </div>
        <div className="o-row__copy">
          <h2 className="o-h2">This goes on your counter</h2>
          <p className="o-body">
            We print it, stock it, and ship it to you free. Customers tap the paw
            print with their phone to build their set — no app, nothing for you to
            ring up, and nothing to restock.
          </p>
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
          <p className="o-fact__v o-fact__v--brand">30%</p>
        </div>
      </section>

      {/* What a set actually looks like. Three colorways, no copy needed. */}
      <section className="o-sets">
        <div className="t-wrap">
          <h2 className="o-h2">Every set is made to order</h2>
          <p className="o-body">
            Customers pick the colors and type the name right on the display. Five
            colorways, sizes 10&quot; to 25&quot;, handmade and shipped free.
          </p>
          <div className="o-sets__grid">
            <Image src="/images/diy-kit.webp" alt="A rainbow beaded collar spelling MOZZIE with a matching bracelet" width={900} height={900} sizes="(max-width: 900px) 100vw, 33vw" />
            <Image src="/images/image3.webp" alt="A pink and lavender beaded collar spelling OAKLEY with a matching bracelet" width={900} height={900} sizes="(max-width: 900px) 100vw, 33vw" />
            <Image src="/images/image4.webp" alt="A beaded name collar with its matching bracelet" width={900} height={900} sizes="(max-width: 900px) 100vw, 33vw" />
          </div>
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
