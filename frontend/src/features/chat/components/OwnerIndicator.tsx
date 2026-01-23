import React from 'react';
import { Crown } from 'lucide-react';
import { Tooltip } from '../../../design-system';
import { useTranslation } from 'react-i18next';

interface OwnerIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  tooltip?: string;
}

const OwnerIndicator: React.FC<OwnerIndicatorProps> = ({
  size = 'md',
  className = '',
  tooltip
}) => {
  const { t } = useTranslation();
  const displayTooltip = tooltip || t('chat.owner_indicator_tooltip');
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <Tooltip content={displayTooltip}>
      <div className={`text-amber-500 ${sizeClasses[size]} ${className}`}>
        <Crown size={'100%'} fill="currentColor" />
      </div>
    </Tooltip>
  );
};

export default OwnerIndicator;