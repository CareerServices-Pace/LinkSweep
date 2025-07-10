import React from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit, Trash2, Plus, Play } from "lucide-react";
import { SavedConfiguration } from "@/services/configService";

interface SavedConfigurationsProps {
  configurations: SavedConfiguration[];
  onEdit: (config: SavedConfiguration) => void;
  onDelete: (scanID: number) => void;
  onAddNew: () => void;
  onScan?: (config: SavedConfiguration) => void;
  showAddButton: boolean;
}

const SavedConfigurations: React.FC<SavedConfigurationsProps> = ({
  configurations,
  onEdit,
  onDelete,
  onAddNew,
  onScan,
  showAddButton,
}) => {
  const [deleteDialog, setDeleteDialog] = React.useState<{
    open: boolean;
    scanID: number | null;
  }>({ open: false, scanID: null });

  const handleDeleteClick = (scanID: number) => {
    setDeleteDialog({ open: true, scanID });
  };

  const confirmDelete = () => {
    if (deleteDialog.scanID) {
      onDelete(deleteDialog.scanID);
      setDeleteDialog({ open: false, scanID: null });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleScan = (config: SavedConfiguration) => {
    if (onScan) {
      onScan(config);
    } else {
      console.log("Starting scan for configuration:", config);
    }
  };

  if (configurations.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg mb-8">
        <CardHeader className="flex flex-row items-center justify-between pb-6">
          <CardTitle className="text-2xl text-gray-900">
            Saved Configurations
          </CardTitle>
          {showAddButton && (
            <Button
              onClick={onAddNew}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          )}
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="h-16 px-6 text-left font-semibold text-gray-700">
                    Start URL
                  </TableHead>
                  <TableHead className="h-16 px-6 text-center font-semibold text-gray-700">
                    Max Depth
                  </TableHead>
                  <TableHead className="h-16 px-6 text-center font-semibold text-gray-700">
                    Timeout
                  </TableHead>
                  <TableHead className="h-16 px-6 text-center font-semibold text-gray-700">
                    Auto Scan
                  </TableHead>
                  <TableHead className="h-16 px-6 text-center font-semibold text-gray-700">
                    Created
                  </TableHead>
                  <TableHead className="h-16 px-6 text-center font-semibold text-gray-700 min-w-[250px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configurations.map((config) => (
                  <TableRow key={config.scanID} className="hover:bg-gray-50/50">
                    <TableCell className="px-6 py-5 font-medium text-gray-900 max-w-xs">
                      <div className="truncate" title={config.startURL}>
                        {config.startURL}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-center text-gray-700">
                      {config.config.maxDepth}
                    </TableCell>
                    <TableCell className="px-6 py-5 text-center text-gray-700">
                      {config.config.timeout}
                    </TableCell>
                    <TableCell className="px-6 py-5 text-center">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          config.config.autoScan
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {config.config.autoScan ? "Enabled" : "Disabled"}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-center text-gray-700 text-sm">
                      {formatDate(config.createdAt)}
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleScan(config)}
                          className="h-8 px-2 bg-green-50 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400 font-medium"
                        >
                          <Play className="h-1 w-1"/>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(config)}
                          className="h-8 px-2 bg-blue-50 border-blue-400 text-blue-700 hover:bg-blue-100 hover:border-blue-500 font-medium"
                        >
                          <Edit className="h-1 w-1" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(config.scanID)}
                          className="h-8 px-2 bg-red-50 border-red-400 text-red-700 hover:bg-red-100 hover:border-red-500 font-medium"
                        >
                          <Trash2 className="h-1 w-1" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, scanID: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this configuration? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, scanID: null })}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SavedConfigurations;
