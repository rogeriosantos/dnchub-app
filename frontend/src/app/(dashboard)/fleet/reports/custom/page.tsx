"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  FileEdit,
  MoreHorizontal,
  Eye,
  Download,
  Pencil,
  Trash2,
  Copy,
  Calendar,
} from "lucide-react";

// Mock custom reports
const mockCustomReports = [
  {
    id: "custom-001",
    name: "Weekly Fleet Performance",
    description: "Custom weekly summary of fleet metrics",
    createdBy: "Admin User",
    createdAt: "2024-11-15",
    lastRun: "2024-12-10",
    dataSource: "vehicles, trips",
  },
  {
    id: "custom-002",
    name: "Driver Efficiency Analysis",
    description: "Compare fuel efficiency across drivers",
    createdBy: "Fleet Manager",
    createdAt: "2024-10-20",
    lastRun: "2024-12-08",
    dataSource: "drivers, fuel",
  },
  {
    id: "custom-003",
    name: "Maintenance Cost by Vehicle",
    description: "Breakdown of maintenance expenses per vehicle",
    createdBy: "Admin User",
    createdAt: "2024-09-05",
    lastRun: "2024-12-01",
    dataSource: "vehicles, maintenance",
  },
];

const availableFields = [
  { id: "vehicle_plate", name: "Vehicle Plate", category: "vehicle" },
  { id: "vehicle_make", name: "Vehicle Make", category: "vehicle" },
  { id: "vehicle_model", name: "Vehicle Model", category: "vehicle" },
  { id: "vehicle_status", name: "Vehicle Status", category: "vehicle" },
  { id: "driver_name", name: "Driver Name", category: "driver" },
  { id: "driver_score", name: "Safety Score", category: "driver" },
  { id: "fuel_amount", name: "Fuel Amount", category: "fuel" },
  { id: "fuel_cost", name: "Fuel Cost", category: "fuel" },
  { id: "trip_distance", name: "Trip Distance", category: "trip" },
  { id: "trip_duration", name: "Trip Duration", category: "trip" },
  { id: "maintenance_type", name: "Maintenance Type", category: "maintenance" },
  { id: "maintenance_cost", name: "Maintenance Cost", category: "maintenance" },
];

export default function CustomReportsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [selectedFields, setSelectedFields] = React.useState<string[]>([]);

  const filteredReports = mockCustomReports.filter((report) =>
    report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleField = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId)
        ? prev.filter((id) => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Custom Reports</h1>
          <p className="text-muted-foreground">
            Build your own reports with custom data and filters
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Custom Report</DialogTitle>
              <DialogDescription>
                Build a new report by selecting data fields and filters
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="report-name">Report Name</Label>
                <Input id="report-name" placeholder="Enter report name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="report-desc">Description</Label>
                <Input id="report-desc" placeholder="Enter description" />
              </div>

              <div className="space-y-2">
                <Label>Select Data Fields</Label>
                <div className="grid grid-cols-2 gap-4">
                  {["vehicle", "driver", "fuel", "trip", "maintenance"].map((category) => (
                    <Card key={category} className="p-3">
                      <h4 className="font-medium capitalize mb-2">{category}</h4>
                      <div className="space-y-2">
                        {availableFields
                          .filter((f) => f.category === category)
                          .map((field) => (
                            <div key={field.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={field.id}
                                checked={selectedFields.includes(field.id)}
                                onCheckedChange={() => toggleField(field.id)}
                              />
                              <Label htmlFor={field.id} className="text-sm">
                                {field.name}
                              </Label>
                            </div>
                          ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Group By</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grouping" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="vehicle">Vehicle</SelectItem>
                      <SelectItem value="driver">Driver</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="cost_center">Cost Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(false)}>
                Create Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search custom reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Custom Reports</CardTitle>
          <CardDescription>Manage and run your custom reports</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileEdit className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No custom reports found</p>
              <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                Create Your First Report
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Data Sources</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{report.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {report.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {report.dataSource.split(", ").map((source) => (
                            <Badge key={source} variant="secondary" className="text-xs">
                              {source}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{report.createdBy}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {report.lastRun}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Run & Export
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
