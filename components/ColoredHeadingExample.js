// Example component showing how to use multi-colored headings
// You can copy these patterns to any page in your app

export default function ColoredHeadingExample() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">

      {/* Example 1: Simple two-color heading */}
      <div>
        <h1>
          Start Earning Passive Income{' '}
          <span className="text-gradient-coral">With Zero Inventory</span>
        </h1>
      </div>

      {/* Example 2: Three-color heading */}
      <div>
        <h2>
          <span className="text-dark">Build Your Business</span>{' '}
          <span className="text-rose">Faster Than Ever</span>{' '}
          <span className="text-gradient-pink">With Tapify</span>
        </h2>
      </div>

      {/* Example 3: Solid colors */}
      <div>
        <h2>
          <span className="text-dark">Launch Your Store</span>{' '}
          <span className="text-coral">In Minutes</span>
        </h2>
      </div>

      {/* Example 4: All gradient */}
      <div>
        <h3 className="text-gradient-coral">
          The Future of Retail Starts With a Tap
        </h3>
      </div>

      {/* Example 5: Mixed styles */}
      <div>
        <h1>
          Grow{' '}
          <span className="text-peach">Your Revenue</span>{' '}
          <span className="text-dark">Without</span>{' '}
          <span className="text-gradient-pink">The Hassle</span>
        </h1>
      </div>

      {/* Example 6: Subheading with color */}
      <div>
        <h4>
          <span className="text-dark">Simple.</span>{' '}
          <span className="text-rose">Powerful.</span>{' '}
          <span className="text-gradient-coral">Profitable.</span>
        </h4>
      </div>
    </div>
  );
}

/*
USAGE GUIDE:
-----------

Available Color Classes:
- text-gradient-coral: Coral/salmon gradient
- text-gradient-pink: Pink/rose gradient
- text-coral: Solid coral (#FF9A8B)
- text-pink: Solid pink (#FFB8D8)
- text-rose: Solid rose (#FF6A88)
- text-peach: Solid peach (#FFC4A0)
- text-dark: Solid dark (#1a1a1a)

How to Use:
1. Wrap the colored portion in a <span> tag
2. Add the color class to the span
3. Use {' '} for proper spacing between spans

Example:
<h1>
  Normal Text{' '}
  <span className="text-gradient-coral">Colored Text</span>
</h1>

Tips:
- All typography settings (font, weight, spacing) are inherited
- Gradients work best on larger headings (h1, h2)
- Mix solid colors and gradients for variety
- Use sparingly for maximum impact
*/
