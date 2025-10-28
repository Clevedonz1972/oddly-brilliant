import type { ReactNode } from 'react';

interface SkipLinkProps {
  href: string;
  children: ReactNode;
}

/**
 * Skip link component for keyboard navigation
 * Allows keyboard users to skip to main content
 * WCAG 2.4.1 Bypass Blocks (Level A)
 */
export const SkipLink = ({ href, children }: SkipLinkProps) => {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-cyan-500 focus:text-cyber-dark focus:rounded-md focus:shadow-cyber-lg focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-cyber-dark font-display font-semibold transition-all duration-200"
    >
      {children}
    </a>
  );
};

/**
 * Container for skip links
 * Renders multiple skip links at the top of the page
 */
interface SkipLinksProps {
  links: Array<{
    href: string;
    label: string;
  }>;
}

export const SkipLinks = ({ links }: SkipLinksProps) => {
  return (
    <div className="skip-links">
      {links.map((link) => (
        <SkipLink key={link.href} href={link.href}>
          {link.label}
        </SkipLink>
      ))}
    </div>
  );
};
