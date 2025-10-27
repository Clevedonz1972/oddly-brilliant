/**
 * Footer component with copyright and links
 * Cyberpunk-themed with dark styling
 */
export const Footer = () => {
  return (
    <footer className="bg-[var(--bg-surface)] text-[var(--text-primary)] mt-auto border-t border-[var(--border)] border-cyber">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <h3 className="text-xl font-bold mb-2 text-gradient-cyber" style={{ fontFamily: 'var(--font-display)' }}>
              oddly-brilliant
            </h3>
            <p className="text-[var(--text-secondary)] text-sm">
              Fair attribution, perpetual royalties, be yourself.
            </p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-[var(--text-secondary)] text-sm">
              &copy; {new Date().getFullYear()} oddly-brilliant. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
