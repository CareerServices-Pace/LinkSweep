
import { Skeleton } from "@/components/ui/skeleton";

export const StatsCardSkeleton = () => (
  <div className="bg-white/90 backdrop-blur-sm border-0 shadow-sm rounded-lg p-6">
    <div className="flex items-center gap-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  </div>
);

export const ScanHistoryRowSkeleton = () => (
  <tr className="border-b border-gray-100">
    <td className="py-4 px-4">
      <Skeleton className="h-4 w-48" />
    </td>
    <td className="py-4 px-4">
      <Skeleton className="h-4 w-12" />
    </td>
    <td className="py-4 px-4">
      <Skeleton className="h-4 w-8" />
    </td>
    <td className="py-4 px-4">
      <Skeleton className="h-4 w-32" />
    </td>
    <td className="py-4 px-4">
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
    </td>
  </tr>
);
