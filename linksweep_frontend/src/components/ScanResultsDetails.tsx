import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { HistoryService, ScanResultDetail } from "@/services/historyService";

interface ScanResultsDetailsProps {
  scanId: number;
  onBack: () => void;
}

const ScanResultsDetails = ({ scanId, onBack }: ScanResultsDetailsProps) => {
  const [details, setDetails] = useState<ScanResultDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const getStatusIcon = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (statusCode >= 400) {
      return <XCircle className="h-4 w-4 text-red-600" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return "text-green-600";
    } else if (statusCode >= 400) {
      return "text-red-600";
    } else {
      return "text-yellow-600";
    }
  };

  const getLinkTypeColor = (linkType: string) => {
    switch (linkType.toLowerCase()) {
      case "internal":
        return "bg-blue-100 text-blue-800";
      case "external":
        return "bg-purple-100 text-purple-800";
      case "anchor":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  useEffect(() => {
    const fetchScanDetails = async () => {
      try {
        setIsLoading(true);
        const data = await HistoryService.getScanDetails(scanId);

        if (data.success) {
          setDetails(data.data);
        } else {
          throw new Error("Failed to fetch scan history");
        }
      } catch (error) {
        console.error("Failed to fetch scan details:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to load scan details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchScanDetails();
  }, [scanId, toast]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-blue-600" />
            Detailed Scan Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Source Page</TableHead>
                  <TableHead className="font-semibold">Link</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Fix Guide</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.length > 0 ? (
                  details.map((detail, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="max-w-xs">
                        <div className="break-words whitespace-normal">
                          <a
                            href={detail.source_page}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {detail.source_page}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div
                          className="truncate break-words whitespace-normal"
                          title={detail.link}
                        >
                          <a
                            href={detail.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {detail.link}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(detail.status_code)}
                          <span
                            className={`font-medium ${getStatusColor(
                              detail.status_code
                            )}`}
                          >
                            {detail.status_code}
                          </span>
                          <span className="text-sm text-gray-600">
                            {detail.status_text}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getLinkTypeColor(
                            detail.link_type
                          )}`}
                        >
                          {detail.link_type}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate break-words whitespace-normal">
                          <span className="text-sm text-gray-600">
                            {detail.fixGuide}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <div className="text-center p-4 text-gray-500">
                    {" "}
                    No link details found.
                  </div>
                )}
              </TableBody>
            </Table>
          </div>

          {details.length === 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No detailed results found for this scan.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScanResultsDetails;
