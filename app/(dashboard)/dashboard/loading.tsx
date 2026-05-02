export default function DashboardLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 animate-pulse">
      <div className="mb-10">
        <div className="h-14 bg-[#0F2040] rounded w-3/4 mb-3" />
        <div className="h-4 bg-[#0F2040] rounded w-48" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-6 flex items-start gap-4">
            <div className="w-6 h-6 bg-[#1A3A5C] rounded shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="h-6 bg-[#1A3A5C] rounded w-2/3 mb-2" />
              <div className="h-4 bg-[#1A3A5C] rounded w-full mb-1" />
              <div className="h-4 bg-[#1A3A5C] rounded w-4/5" />
            </div>
          </div>
        ))}
      </div>

      <div className="h-3 bg-[#0F2040] rounded w-24 mb-3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-[#0F2040] border border-dashed border-[#1A3A5C] rounded-lg p-5 flex items-center gap-4 opacity-50">
            <div className="w-6 h-6 bg-[#1A3A5C] rounded shrink-0" />
            <div className="h-5 bg-[#1A3A5C] rounded w-1/2" />
          </div>
        ))}
      </div>

      <div className="h-6 bg-[#0F2040] rounded w-48 mb-4" />
      <div className="flex flex-col gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3 rounded-md border border-[#1A3A5C]">
            <div>
              <div className="h-4 bg-[#0F2040] rounded w-48 mb-1.5" />
              <div className="h-3 bg-[#0F2040] rounded w-24" />
            </div>
            <div className="h-3 bg-[#0F2040] rounded w-10" />
          </div>
        ))}
      </div>
    </div>
  )
}
