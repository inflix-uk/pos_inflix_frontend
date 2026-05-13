export default function RoutesLoading() {
 const shimmer = "animate-pulse bg-gray-200 rounded";
 return (
 <div className="h-full min-h-0 flex flex-col overflow-hidden bg-gray-100">
 <div className="flex-1 min-h-0 flex flex-col p-3 sm:p-4 md:p-5 gap-3 overflow-hidden">
 <div className="flex items-center gap-3 shrink-0">
  <div className={`${shimmer} h-5 w-28`} />
  <div className={`${shimmer} h-5 w-20 rounded-full`} />
  <div className="flex-1" />
  <div className={`${shimmer} h-5 w-48 hidden sm:block`} />
 </div>
 <div className="flex flex-wrap items-end gap-2 shrink-0">
  <div className={`${shimmer} h-10 w-[260px]`} />
  <div className={`${shimmer} h-10 w-[140px]`} />
  <div className={`${shimmer} h-10 w-[180px]`} />
  <div className="flex-1" />
  <div className={`${shimmer} h-10 w-24`} />
  <div className={`${shimmer} h-10 w-28`} />
 </div>
 <div className={`${shimmer} h-11 w-full rounded-xl shrink-0`} />
 <div className="flex-1 min-h-0 rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col">
  <div className="border-b border-gray-100 px-3 py-2">
  <div className={`${shimmer} h-4 w-28`} />
  </div>
  <div className="flex-1 p-4 space-y-3">
  {[1, 2, 3].map((i) => (
  <div key={i} className="flex items-center gap-3">
  <div className={`${shimmer} h-4 w-6`} />
  <div className={`${shimmer} h-4 flex-1`} />
  <div className={`${shimmer} h-4 w-12`} />
  <div className={`${shimmer} h-4 w-16`} />
  </div>
  ))}
  </div>
  <div className="border-t border-gray-100 px-4 py-3 flex justify-between">
  <div className={`${shimmer} h-9 w-24 rounded-lg`} />
  <div className={`${shimmer} h-9 w-36 rounded-lg`} />
  </div>
 </div>
 </div>
 </div>
 );
}
