import { Construction } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

export function ComingSoon({ title, description, icon: Icon }: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="backdrop-blur-xl rounded-2xl p-12 text-center max-w-md" style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(204, 170, 0, 0.3)'
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

        <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
        
        {description && (
          <p className="text-gray-400 mb-6">{description}</p>
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
