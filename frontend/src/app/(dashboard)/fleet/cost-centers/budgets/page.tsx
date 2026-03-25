"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  Pencil,
  AlertTriangle,
  BarChart3,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { costCentersService } from "@/lib/api/cost-centers";
import { formatCurrency, cn } from "@/lib/utils";
import type { CostCenter } from "@/types";

export default function BudgetsPage() {
  const [costCenters, setCostCenters] = React.useState<CostCenter[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [timeRange, setTimeRange] = React.useState("year");
  const [editingCostCenter, setEditingCostCenter] = React.useState<CostCenter | null>(null);
  const [editBudget, setEditBudget] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await costCentersService.getAll();
      setCostCenters(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cost centers");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEditClick = (cc: CostCenter) => {
    setEditingCostCenter(cc);
    setEditBudget(cc.budget?.toString() || "");
  };

  const handleSaveBudget = async () => {
    if (!editingCostCenter) return;

    setIsSaving(true);
    try {
      const updated = await costCentersService.update(editingCostCenter.id, {
        budget: editBudget ? Number(editBudget) : undefined,
      });
      setCostCenters((prev) =>
        prev.map((cc) => (cc.id === updated.id ? updated : cc))
      );
      setEditingCostCenter(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update budget");
    } finally {
      setIsSaving(false);
    }
  };

  const totalBudget = costCenters.reduce((acc, cc) => acc + (cc.budget || 0), 0);
  const totalSpent = costCenters.reduce((acc, cc) => acc + (cc.currentSpend || 0), 0);
  const overBudgetCount = costCenters.filter(
    (cc) => cc.budget && cc.currentSpend && cc.currentSpend > cc.budget
  ).length;

  if (error && costCenters.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/fleet/cost-centers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Budget Management</h1>
            <p className="text-muted-foreground">Set and track budgets for each cost center</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium text-destructive mb-2">Error Loading Data</p>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchData} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/fleet/cost-centers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Budget Management</h1>
            <p className="text-muted-foreground">
              Set and track budgets for each cost center
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
                )}
                <p className="text-sm text-muted-foreground">Total Budget</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
                )}
                <p className="text-sm text-muted-foreground">Total Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">
                    {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%
                  </p>
                )}
                <p className="text-sm text-muted-foreground">Budget Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-8" />
                ) : (
                  <p className="text-2xl font-bold">{overBudgetCount}</p>
                )}
                <p className="text-sm text-muted-foreground">Over Budget</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Overview Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
          <CardDescription>Budget vs actual spending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Budget comparison chart would go here
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Center Budgets</CardTitle>
          <CardDescription>Budget allocation and spending by cost center</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cost Center</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Current Spend</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : costCenters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No cost centers found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  costCenters.map((cc, index) => {
                    const budget = cc.budget || 0;
                    const spent = cc.currentSpend || 0;
                    const usagePercent = budget > 0 ? Math.round((spent / budget) * 100) : 0;
                    const isOverBudget = usagePercent > 100;
                    // Simulate trend based on index (in real app this would come from API)
                    const trends = [-5.2, 3.8, -2.1, 8.5, -1.5, 4.2, -3.8, 6.1];
                    const trend = trends[index % trends.length];

                    return (
                      <TableRow key={cc.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{cc.name}</p>
                              <p className="text-xs text-muted-foreground">{cc.code}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(budget)}
                        </TableCell>
                        <TableCell className="capitalize">
                          {cc.budgetPeriod || "yearly"}
                        </TableCell>
                        <TableCell>{formatCurrency(spent)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 w-28">
                            <Progress
                              value={Math.min(usagePercent, 100)}
                              className={cn("h-2", isOverBudget && "[&>div]:bg-red-500")}
                            />
                            <span className={cn(
                              "text-sm tabular-nums",
                              isOverBudget && "text-red-600"
                            )}>
                              {usagePercent}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={cn(
                            "flex items-center gap-1",
                            trend < 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {trend < 0 ? (
                              <TrendingDown className="h-4 w-4" />
                            ) : (
                              <TrendingUp className="h-4 w-4" />
                            )}
                            <span>{Math.abs(trend)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(cc)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Budget</DialogTitle>
                                <DialogDescription>
                                  Update budget for {editingCostCenter?.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Budget Amount</Label>
                                  <Input
                                    type="number"
                                    value={editBudget}
                                    onChange={(e) => setEditBudget(e.target.value)}
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setEditingCostCenter(null)}
                                  disabled={isSaving}
                                >
                                  Cancel
                                </Button>
                                <Button onClick={handleSaveBudget} disabled={isSaving}>
                                  {isSaving ? "Saving..." : "Save Changes"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
