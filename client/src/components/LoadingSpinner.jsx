export default function LoadingSpinner({ className = '' }) {
  return (
    <div className={`flex justify-center items-center py-16 ${className}`}>
      <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
    </div>
  );
}
