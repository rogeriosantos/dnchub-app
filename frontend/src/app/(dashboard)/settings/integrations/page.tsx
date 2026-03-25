"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Puzzle,
  Plus,
  Search,
  Settings,
  Check,
  X,
  ExternalLink,
  Key,
  RefreshCw,
  MapPin,
  Fuel,
  CreditCard,
  FileText,
  Cloud,
  Webhook,
} from "lucide-react";

// Mock integrations
const mockIntegrations = [
  {
    id: "int-001",
    name: "Google Maps",
    description: "Route optimization and geocoding",
    category: "maps",
    icon: MapPin,
    status: "connected",
    lastSync: "2024-12-11 15:30",
  },
  {
    id: "int-002",
    name: "FuelCard Pro",
    description: "Automatic fuel transaction import",
    category: "fuel",
    icon: Fuel,
    status: "connected",
    lastSync: "2024-12-11 14:00",
  },
  {
    id: "int-003",
    name: "QuickBooks",
    description: "Accounting and invoice sync",
    category: "accounting",
    icon: FileText,
    status: "disconnected",
    lastSync: null,
  },
  {
    id: "int-004",
    name: "Stripe",
    description: "Payment processing",
    category: "payments",
    icon: CreditCard,
    status: "connected",
    lastSync: "2024-12-11 12:45",
  },
  {
    id: "int-005",
    name: "AWS S3",
    description: "Document and backup storage",
    category: "storage",
    icon: Cloud,
    status: "connected",
    lastSync: "2024-12-11 10:00",
  },
  {
    id: "int-006",
    name: "Zapier",
    description: "Workflow automation",
    category: "automation",
    icon: Webhook,
    status: "disconnected",
    lastSync: null,
  },
];

const availableIntegrations = [
  {
    id: "avail-001",
    name: "HERE Maps",
    description: "Alternative mapping and routing",
    category: "maps",
    icon: MapPin,
  },
  {
    id: "avail-002",
    name: "Xero",
    description: "Cloud accounting software",
    category: "accounting",
    icon: FileText,
  },
  {
    id: "avail-003",
    name: "Slack",
    description: "Team notifications and alerts",
    category: "communication",
    icon: Webhook,
  },
];

export default function IntegrationsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = React.useState(false);

  const connectedCount = mockIntegrations.filter((i) => i.status === "connected").length;

  const filteredIntegrations = mockIntegrations.filter((integration) =>
    integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    integration.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">
            Connect third-party services to enhance your fleet management
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isApiKeyDialogOpen} onOpenChange={setIsApiKeyDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Key className="mr-2 h-4 w-4" />
                API Keys
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>API Keys</DialogTitle>
                <DialogDescription>
                  Manage your API keys for external integrations
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Production API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      value="fmo_prod_****************************"
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button variant="outline" size="icon">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created on Dec 1, 2024
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Test API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      value="fmo_test_****************************"
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button variant="outline" size="icon">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created on Nov 15, 2024
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsApiKeyDialogOpen(false)}>
                  Close
                </Button>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate New Key
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Integration
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Puzzle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockIntegrations.length}</p>
                <p className="text-sm text-muted-foreground">Total Integrations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{connectedCount}</p>
                <p className="text-sm text-muted-foreground">Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2">
                <X className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockIntegrations.length - connectedCount}</p>
                <p className="text-sm text-muted-foreground">Disconnected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Connected Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Your Integrations</CardTitle>
          <CardDescription>Manage your connected services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredIntegrations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Puzzle className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No integrations found</p>
              </div>
            ) : (
              filteredIntegrations.map((integration) => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-muted p-3">
                      <integration.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{integration.name}</p>
                        <Badge
                          variant={integration.status === "connected" ? "default" : "secondary"}
                        >
                          {integration.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {integration.description}
                      </p>
                      {integration.lastSync && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Last sync: {integration.lastSync}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={integration.status === "connected"} />
                    <Button variant="ghost" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Available Integrations</CardTitle>
          <CardDescription>Discover new integrations to connect</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {availableIntegrations.map((integration) => (
              <Card key={integration.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <integration.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{integration.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {integration.description}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Connect
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Webhooks Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhooks
          </CardTitle>
          <CardDescription>
            Configure webhooks to receive real-time updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Vehicle Status Updates</p>
              <p className="text-sm text-muted-foreground">
                https://api.example.com/webhooks/vehicles
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Active</Badge>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Maintenance Alerts</p>
              <p className="text-sm text-muted-foreground">
                https://api.example.com/webhooks/maintenance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Active</Badge>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Webhook
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
