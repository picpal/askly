export default function SkeletonCard() {
  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse"
      aria-hidden="true"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {/* Nickname placeholder */}
            <div className="h-4 w-20 bg-gray-200 rounded" />
            {/* Time placeholder */}
            <div className="h-3 w-12 bg-gray-100 rounded" />
          </div>
          {/* Content placeholders */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-3/4 bg-gray-200 rounded" />
          </div>
        </div>
        {/* Thumb button placeholder */}
        <div className="h-8 w-16 bg-gray-200 rounded-full" />
      </div>
    </div>
  );
}
