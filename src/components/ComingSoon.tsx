import { Construction } from 'lucide-react';
import { useTheme, t } from '../contexts/ThemeContext';

interface ComingSoonProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

export function ComingSoon({ title, description, icon: Icon }: ComingSoonProps) {
  const { isDark } = useTheme();
  const c = t(isDark);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="backdrop-blur-xl rounded-2xl p-12 text-center max-w-md" style={{
        background: c.bgCard,
        border: `1px solid ${c.borderGold}`
      }}>
        <div 
          className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(204, 170, 0, 0.2))',
            border: '2px solid rgba(204, 170, 0, 0.4)'
          }}
        >
          {Icon ? (
            <Icon className="w-10 h-10" style={{ color: '#ccaa00' }} />
          ) : (
            <Construction className="w-10 h-10" style={{ color: '#ccaa00' }} />
          )}
        </div>

        <h2 className="text-2xl font-bold mb-3" style={{ color: c.text }}>{title}</h2>
        
        {description && (
          <p className="mb-6" style={{ color: c.textSecondary }}>{description}</p>
        )}

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg" style={{
          background: 'rgba(204, 170, 0, 0.1)',
          border: '1px solid rgba(204, 170, 0, 0.3)'
        }}>
          <Construction className="w-4 h-4" style={{ color: '#ccaa00' }} />
          <span className="text-sm font-medium" style={{ color: '#ccaa00' }}>
            Próximamente
          </span>
        </div>
      </div>
    </div>
  );
}
