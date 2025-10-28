/**
 * Common UI Components
 * Centralized exports for all reusable components
 */

export { Badge } from './Badge';
export type { BadgeVariant, BadgeSize, BadgeStyle } from './Badge';

export { Button } from './Button';
export type { ButtonVariant, ButtonSize } from './Button';

export { Card } from './Card';
export type { CardVariant, CardElevation } from './Card';

export { ConfirmDialog } from './ConfirmDialog';

export { ErrorMessage } from './ErrorMessage';

export { Input } from './Input';
export type { InputSize, InputState } from './Input';

export { Loading } from './Loading';
export type { LoadingSize, LoadingVariant } from './Loading';

export {
  LoadingSkeleton,
  TextSkeleton,
  CardSkeleton,
  ListItemSkeleton,
  TableRowSkeleton,
  ButtonSkeleton,
} from './LoadingSkeleton';

export { PageTransition, AnimatedPage } from './PageTransition';

export { SuccessAnimation, useSuccessAnimation } from './SuccessAnimation';

export { ToastProvider, useToast } from './Toast';
export type { ToastVariant, ToastPosition } from './Toast';

export { SkipLink, SkipLinks } from './SkipLink';

export { FocusManager, LiveRegion, VisuallyHidden } from './FocusManager';
