"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  FileText,
  Download,
  Eye,
  Truck,
  Users,
  Fuel,
  Wrench,
  DollarSign,
  BarChart3,
  Calendar,
} from "lucide-react";

// Mock standard reports
const standardReports = [
  {
    id: "report-001",
    name: "Fleet Summary Report",
    description: "Overview of fleet status, utilization, and key metrics",
    category: "fleet",
    icon: Truck,
    lastGenerated: "2024-12-10",
  },
  {
    id: "report-002",
    name: "Vehicle Utilization Report",
    description: "Detailed analysis of vehicle usage and idle time",
    category: "fleet",
    icon: BarChart3,
    lastGenerated: "2024-12-09",
  },
  {
    id: "report-003",
    name: "Driver Performance Report",
    description: "Safety scores, trip statistics, and behavior analysis",
    category: "drivers",
    icon: Users,
    lastGenerated: "2024-12-08",
  },
  {
    id: "report-004",
    name: "Fuel Consumption Report",
    description: "Fuel usage, costs, and efficiency analysis by vehicle",
    category: "fuel",
    icon: Fuel,
    lastGenerated: "2024-12-10",
  },
  {
    id: "report-005",
    name: "Maintenance Summary Report",
    description: "Scheduled maintenance, repairs, and service history",
    category: "maintenance",
    icon: Wrench,
    lastGenerated: "2024-12-07",
  },
  {
    id: "report-006",
    name: "Cost Analysis Report",
    description: "Comprehensive breakdown of all fleet-related expenses",
    category: "financial",
    icon: DollarSign,
    lastGenerated: "2024-12-05",
  },
  {
    id: "report-007",
    name: "Trip History Report",
    description: "Detailed log of all trips with routes and distances",
    category: "fleet",
    icon: FileText,
    lastGenerated: "2024-12-10",
  },
  {
    id: "report-008",
    name: "Compliance Report",
    description: "License, registration, and insurance status tracking",
    category: "compliance",
    icon: Calendar,
    lastGenerated: "2024-12-01",
  },
];

const categoryColors = {
  fleet: "bg-blue-100 text-blue-700",
  drivers: "bg-green-100 text-green-700",
  fuel: "bg-amber-100 text-amber-700",
  maintenance: "bg-purple-100 text-purple-700",
  financial: "bg-red-100 text-red-700",
  compliance: "bg-gray-100 text-gray-700",
};

export default function StandardReportsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");

  const filteredReports = standardReports.filter((report) => {
    const matchesSearch =
      report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || report.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Standard Reports</h1>
          <p className="text-muted-foreground">
            Pre-built reports for common fleet management needs
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="fleet">Fleet</SelectItem>
                <SelectItem value="drivers">Drivers</SelectItem>
                <SelectItem value="fuel">Fuel</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredReports.map((report) => (
          <Card key={report.id} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-muted p-2">
                  <report.icon className="h-5 w-5" />
                </div>
                <Badge className={categoryColors[report.category as keyof typeof categoryColors]}>
                  {report.category}
                </Badge>
              </div>
              <CardTitle className="text-lg mt-3">{report.name}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <div className="text-xs text-muted-foreground mb-3">
                Last generated: {report.lastGenerated}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No reports found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
