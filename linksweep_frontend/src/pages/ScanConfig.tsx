import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import SavedConfigurations from "@/components/SavedConfigurations";
import {
  configService,
  SavedConfiguration,
  UpdateConfigRequest,
} from "@/services/configService";

const formSchema = z.object({
  startUrl: z
    .string()
    .url("Please enter a valid URL")
    .min(1, "Start URL is required"),
  maxDepth: z.coerce.number().int().min(1, "Max depth must be at least 1"),
  timeout: z.coerce.number().int().min(1, "Timeout must be at least 1 second"),
  excludePaths: z.string().optional(),
  retryCount: z.coerce.number().int().min(0, "Retry count cannot be negative"),
  autoScan: z.boolean(),
  autoScanTimes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const ScanConfig = () => {
  const [activeTab, setActiveTab] = useState("Config");
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SavedConfiguration | null>(
    null
  );
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startUrl: "",
      maxDepth: 3,
      timeout: 30,
      excludePaths: "",
      retryCount: 2,
      autoScan: false,
      autoScanTimes: "",
    },
  });

  // Fetch all configurations
  const { data: configurations = [], isLoading } = useQuery({
    queryKey: ["configurations"],
    queryFn: configService.getAllConfigurations,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
  });

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: configService.saveConfiguration,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Configuration saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["configurations"] });
      setShowForm(false);
      setEditingConfig(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save configuration.",
        variant: "destructive",
      });
    },
  });

  // Delete configuration mutation
  const deleteConfigMutation = useMutation({
    mutationFn: configService.deleteConfiguration,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Configuration deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["configurations"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete configuration.",
        variant: "destructive",
      });
    },
  });

  // Show form by default if no configurations exist
  useEffect(() => {
    if (!isLoading && configurations.length === 0) {
      setShowForm(true);
    }
  }, [configurations, isLoading]);

  const onSubmit = (data: FormData) => {
    const configData = {
      config: {
        startURL: data.startUrl,
        maxDepth: data.maxDepth,
        timeout: data.timeout,
        excludePaths: data.excludePaths || "",
        retryCount: data.retryCount,
        autoScan: data.autoScan ? 1 : 0,
        autoScanTimes: data.autoScanTimes || "",
      },
    };

    if (editingConfig) {
      // ---------- UPDATE CASE ----------
      const updateData = {
        scanID: editingConfig.scanID,
        ...configData,
      };

      configService
        .updateConfiguration(updateData)
        .then(() => {
          toast({
            title: "Success",
            description: "Configuration updated successfully.",
          });
          queryClient.invalidateQueries({ queryKey: ["configurations"] });
          setShowForm(false);
          setEditingConfig(null);
          form.reset();
        })
        .catch(() => {
          toast({
            title: "Error",
            description: "Failed to update configuration.",
            variant: "destructive",
          });
        });
    } else {
      // ---------- CREATE CASE ----------
      saveConfigMutation.mutate(configData);
    }
  };

  const handleEdit = async (config: SavedConfiguration) => {
    try {
      const fullConfig = await configService.getConfiguration(config.scanID);

      // Populate form with existing data
      form.reset({
        startUrl: fullConfig.startURL,
        maxDepth: fullConfig.config.maxDepth,
        timeout: fullConfig.config.timeout,
        excludePaths: fullConfig.config.excludePaths,
        retryCount: fullConfig.config.retryCount,
        autoScan: fullConfig.config.autoScan === 1,
        autoScanTimes: fullConfig.config.autoScanTimes,
      });

      setEditingConfig(fullConfig);
      setShowForm(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load configuration for editing.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (scanID: number) => {
    deleteConfigMutation.mutate(scanID);
  };

  const handleAddNew = () => {
    form.reset();
    setEditingConfig(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingConfig(null);
    form.reset();
  };

  const handleScan = async (config: SavedConfiguration) => {
    try {
      await configService.triggerScan(config.scanID);
      toast({
        title: "Scan Triggered",
        description: `Scan started for ${config.startURL}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start scan.",
        variant: "destructive",
      });
    }
  };

  const watchAutoScan = form.watch("autoScan");
  const hasConfigurations = configurations.length > 0;
  const showCancelButton = hasConfigurations && showForm;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Scan Configuration
          </h1>
          <p className="text-gray-600 text-lg">
            Configure your web scanning settings
          </p>
        </div>

        {/* {isLoading && (
            <div className="text-gray-500 text-center py-4">
              Loading saved configurations...
            </div>
          )} */}

        {/* Saved Configurations Table */}
        <SavedConfigurations
          configurations={configurations}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAddNew={handleAddNew}
          onScan={handleScan}
          showAddButton={!showForm}
        />

        {/* Configuration Form */}
        {showForm && (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">
                {editingConfig ? "Edit Configuration" : "Web Scan Settings"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="startUrl"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="text-gray-800 font-medium">
                            Start URL <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://example.com"
                              className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-gray-600">
                            The URL where the scan will begin
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxDepth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-800 font-medium">
                            Max Depth <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="3"
                              className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-gray-600">
                            Maximum crawling depth (integer)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="timeout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-800 font-medium">
                            Timeout <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="30"
                              className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-gray-600">
                            Request timeout in seconds
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="excludePaths"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-800 font-medium">
                          Exclude Paths
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="/admin, /private, /api/internal"
                            className="min-h-[100px] bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-gray-600">
                          Comma-separated list of paths to exclude from scanning
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="retryCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-800 font-medium">
                          Retry Count
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="2"
                            className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-gray-600">
                          Number of retry attempts for failed requests
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="autoScan"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-300 bg-white p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base font-medium text-gray-800">
                            Auto Scan
                          </FormLabel>
                          <FormDescription className="text-gray-600">
                            Enable automatic scanning at specified times
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {watchAutoScan && (
                    <FormField
                      control={form.control}
                      name="autoScanTimes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-800 font-medium">
                            Auto Scan Times
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="09:00, 13:00, 18:00"
                              className="min-h-[100px] bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-gray-600">
                            Comma-separated list of times (HH:MM format) for
                            automatic scans
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    {showCancelButton && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        className="px-6"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => form.reset()}
                      className="px-6"
                    >
                      Reset
                    </Button>
                    <Button
                      type="submit"
                      className="px-6 bg-blue-600 hover:bg-blue-700"
                      disabled={saveConfigMutation.isPending}
                    >
                      {editingConfig
                        ? "Update Configuration"
                        : "Save Configuration"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ScanConfig;
