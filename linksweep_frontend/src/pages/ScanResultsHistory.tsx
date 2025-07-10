import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Calendar, Link, AlertTriangle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import ScanResultsDetails from "@/components/ScanResultsDetails";
import { HistoryService, ScanResult } from "@/services/historyService";
import { dashboardService } from "@/services/dashboardService";

const ScanResultsHistory = () => {
  const [activeTab, setActiveTab] = useState("History");
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedScanId, setSelectedScanId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleViewMore = (runID: number) => {
    console.log("View more clicked for scan:", runID);
    setSelectedScanId(runID);
    setIsDialogOpen(true);
  };

  const handleDownloadExcel = async (runID: number) => {
    try {
      await dashboardService.downloadScanReport(runID);
      toast({
        title: "Success",
        description: "Report downloaded successfully.",
      });
    } catch (error) {
      console.error("Failed to download report:", error);
      toast({
        title: "Error",
        description: "Failed to download report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedScanId(null);
  };

  useEffect(() => {
    const fetchScanHistory = async () => {
      try {
        setIsLoading(true);
        const response = await HistoryService.getAllScanHistory();

        if (response.success) {
          setScanResults(response.data);
        } else {
          throw new Error("Failed to fetch scan history");
        }
      } catch (error) {
        console.error("Failed to fetch scan history:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to load scan history. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchScanHistory();
  }, [toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Scan History
          </h1>
          <p className="text-gray-600 text-lg">
            View all your previous scan results
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="mt-4 h-8 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : scanResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scanResults.map((scan) => (
              <Card
                key={scan.runID}
                className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  {/* Start URL */}
                  <div className="mb-4">
                    <h3
                      className="text-lg font-semibold text-gray-900 mb-2 truncate"
                      title={scan.startURL}
                    >
                      {scan.startURL}
                    </h3>
                  </div>

                  {/* Stats Grid */}
                  <div className="space-y-3 mb-6">
                    {/* Date & Time */}
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Date & Time</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDateTime(scan.runStartedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Total Links */}
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                        <Link className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Links</p>
                        <p className="text-sm font-medium text-gray-900">
                          {scan.totalLinks.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Broken Links */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full flex-shrink-0 ${
                          scan.brokenLinks > 0 ? "bg-red-100" : "bg-gray-100"
                        }`}
                      >
                        <AlertTriangle
                          className={`h-4 w-4 ${
                            scan.brokenLinks > 0
                              ? "text-red-600"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Broken Links</p>
                        <p
                          className={`text-sm font-medium ${
                            scan.brokenLinks > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {scan.brokenLinks}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleViewMore(scan.runID)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View More
                    </Button>
                    <Button
                      onClick={() => handleDownloadExcel(scan.runID)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <AlertTriangle className="h-16 w-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No Scan History
            </h2>
            <p className="text-gray-600">
              You haven't performed any scans yet.
            </p>
          </div>
        )}
      </main>

      {/* Dialog for Scan Details */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-8xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Scan Details</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
            {selectedScanId && (
              <ScanResultsDetails
                scanId={selectedScanId}
                onBack={handleCloseDialog}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScanResultsHistory;
