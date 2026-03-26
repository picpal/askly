interface EmptyStateProps {
  title?: string;
  subtitle?: string;
}

export default function EmptyState({
  title = '아직 질문이 없습니다',
  subtitle = '첫 번째 질문을 등록해보세요!',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg
        className="w-16 h-16 text-gray-300 mb-4"
        fill="none"
        viewBox="0 0 64 64"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <rect x="8" y="12" width="48" height="40" rx="4" />
        <path strokeLinecap="round" d="M20 28h24M20 36h16" />
        <circle cx="48" cy="16" r="8" fill="currentColor" className="text-gray-200" stroke="none" />
        <path
          d="M48 12v4m0 2v0"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          className="text-gray-400"
        />
      </svg>
      <p className="text-lg font-medium text-gray-500 mb-1">{title}</p>
      <p className="text-sm text-gray-400">{subtitle}</p>
    </div>
  );
}
