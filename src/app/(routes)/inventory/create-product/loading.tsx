export default function CreateProductLoading() {
 return (
 <div className="@container min-h-screen bg-gray-50 p-3 @[640px]:p-4 @[768px]:p-6">
 <div className="mb-4 h-5 w-40 rounded bg-gray-200 animate-pulse" />
 <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 min-h-[28rem] p-4 @[640px]:p-6 @[768px]:p-8">
 <div className="h-8 w-64 rounded bg-gray-100 animate-pulse mb-6" />
 <div className="grid grid-cols-1 @[768px]:grid-cols-2 gap-4">
  <div className="h-32 rounded-xl bg-gray-100 animate-pulse" />
  <div className="h-32 rounded-xl bg-gray-100 animate-pulse" />
 </div>
 </div>
 </div>
 );
}
