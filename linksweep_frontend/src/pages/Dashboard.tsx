import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Activity,
  TrendingUp,
  Calendar,
  Search,
  Settings,
  History,
  BarChart3,
  ChevronDown,
  LogOut,
  User,
  AlertTriangle,
  Eye,
  Download,
} from "lucide-react";
import {
  dashboardService,
  DashboardSummary,
  ScanHistory,
  ScanResult,
} from "@/services/dashboardService";
import {
  StatsCardSkeleton,
  ScanHistoryRowSkeleton,
} from "@/components/LoadingSkeleton";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import ScanResultsDetails from "@/components/ScanResultsDetails";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(
    null
  );
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedScanId, setSelectedScanId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDetailsDialog = (scanId: number) => {
    setSelectedScanId(scanId);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedScanId(null);
  };

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoadingStats(true);
        const summary = await dashboardService.getDashboardSummary();
        setDashboardData(summary);
      } catch (error) {
        console.error("Failed to fetch dashboard summary:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard summary. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingStats(false);
      }
    };

    const fetchScanHistory = async () => {
      try {
        setIsLoadingHistory(true);
        const history = await dashboardService.getRecentScans();

        if (history.success) {
          setScanHistory(history.data);
        } else {
          throw new Error("Failed to fetch scan history");
        }
      } catch (error) {
        console.error("Failed to fetch scan history:", error);
        toast({
          title: "Error",
          description: "Failed to load scan history. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingHistory(false);
      }
    };

    if (activeTab === "Dashboard") {
      fetchDashboardData();
      fetchScanHistory();
    }
  }, [activeTab, toast]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleViewMore = (scanId: number) => {
    navigate(`/history/${scanId}`);
  };

  const handleDownloadExcel = async (scanId: number) => {
    try {
      await dashboardService.downloadScanReport(scanId);
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

  const statsData = [
    {
      title: "Broken Links",
      subtitle: "Last Scan",
      value: dashboardData?.broken_links_last_scan?.toString() || "0",
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-50/100",
      iconBg: "bg-red-100",
    },
    {
      title: "Total Scans",
      subtitle: "This Week",
      value: dashboardData?.scans_this_week?.toLocaleString() || "0",
      icon: Activity,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50/100",
      iconBg: "bg-indigo-100",
    },
    {
      title: "Total Users",
      subtitle: "Active Now",
      value: dashboardData?.total_users?.toLocaleString() || "0",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50/80",
      iconBg: "bg-purple-100",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "Dashboard" && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Welcome, {user?.firstName || "User"}!
              </h1>
              <p className="text-gray-600 text-lg">
                Here's what's happening with your scans today
              </p>
            </div>

            {/* Stats Cards - Horizontal Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingStats
                ? // Show loading skeletons
                  Array.from({ length: 3 }).map((_, index) => (
                    <StatsCardSkeleton key={index} />
                  ))
                : statsData.map((stat, index) => (
                    <Card
                      key={index}
                      className={`${stat.bgColor} border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div
                            className={`${stat.iconBg} p-3 rounded-full flex-shrink-0`}
                          >
                            <stat.icon className={`h-6 w-6 ${stat.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-600 mb-1">
                              {stat.title}
                            </p>
                            <p className="text-3xl font-bold text-gray-900 mb-1">
                              {stat.value}
                            </p>
                            {stat.subtitle && (
                              <p className="text-xs text-gray-500">
                                {stat.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
            </div>

            {/* Scan History */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Scan History
              </h2>
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                            Start URL
                          </th>
                          <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                            Total Links
                          </th>
                          <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                            Broken Links
                          </th>
                          <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                            Scan Time
                          </th>
                          <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoadingHistory ? (
                          // Show loading skeletons
                          Array.from({ length: 5 }).map((_, index) => (
                            <ScanHistoryRowSkeleton key={index} />
                          ))
                        ) : scanHistory.length > 0 ? (
                          scanHistory.map((scan, index) => (
                            <tr
                              key={scan.scanID}
                              className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${
                                index === scanHistory.length - 1
                                  ? "border-b-0"
                                  : ""
                              }`}
                            >
                              <td className="py-4 px-4">
                                <span className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                                  {scan.startURL}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-sm font-semibold text-gray-900">
                                  {scan.totalLinks.toLocaleString()}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span
                                  className={`text-sm font-semibold ${
                                    scan.brokenLinks > 0
                                      ? "text-red-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  {scan.brokenLinks}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-sm text-gray-600">
                                  {formatDateTime(scan.runStartedAt)}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-blue-100"
                                    title="View More"
                                    onClick={() =>
                                      handleOpenDetailsDialog(scan.scanID)
                                    }
                                  >
                                    <Eye className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-green-100"
                                    title="Download PDF"
                                    onClick={() =>
                                      handleDownloadExcel(scan.runID)
                                    }
                                  >
                                    <Download className="h-4 w-4 text-green-600" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={5}
                              className="py-8 text-center text-gray-500"
                            >
                              No scan history available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Other Tab Content Placeholders */}
        {activeTab === "Config" && (
          <div className="text-center py-12">
            <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Configuration
            </h2>
            <p className="text-gray-600">
              Configure your dashboard settings here
            </p>
          </div>
        )}

        {activeTab === "History" && (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              History
            </h2>
            <p className="text-gray-600">View detailed history and analytics</p>
          </div>
        )}

        {activeTab === "Manage Users" && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Manage Users
            </h2>
            <p className="text-gray-600">Add, edit, and manage user accounts</p>
          </div>
        )}
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Scan Details</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
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

export default Dashboard;
