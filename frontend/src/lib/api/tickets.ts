/**
 * Tickets API service
 */

import { apiClient } from "./client";
import { transformTicket, transformTickets, transformTicketStats, toSnakeCase } from "./transformers";
import type { Ticket, TicketStats, TicketStatus, TicketType } from "@/types";
import type { TicketApiResponse, TicketStatsApiResponse, TicketPayRequest } from "./types";

export interface TicketListParams {
  skip?: number;
  limit?: number;
  status?: TicketStatus;
  type?: TicketType;
  vehicle_id?: string;
  driver_id?: string;
  overdue_only?: boolean;
  start_date?: string;
  end_date?: string;
}

export const ticketsService = {
  /**
   * Get all tickets with optional filters
   */
  async getAll(params?: TicketListParams): Promise<Ticket[]> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      skip: params?.skip,
      limit: params?.limit,
      status: params?.status,
      type: params?.type,
      vehicle_id: params?.vehicle_id,
      employee_id: params?.driver_id,
      overdue_only: params?.overdue_only,
      start_date: params?.start_date,
      end_date: params?.end_date,
    };

    const response = await apiClient.get<TicketApiResponse[]>("/tickets", {
      params: queryParams,
    });

    return transformTickets(response);
  },

  /**
   * Get ticket by ID
   */
  async getById(id: string): Promise<Ticket> {
    const response = await apiClient.get<TicketApiResponse>(`/tickets/${id}`);
    return transformTicket(response);
  },

  /**
   * Create a new ticket
   */
  async create(data: Partial<Ticket>): Promise<Ticket> {
    const request = toSnakeCase(data);
    const response = await apiClient.post<TicketApiResponse>("/tickets", request);
    return transformTicket(response);
  },

  /**
   * Update a ticket
   */
  async update(id: string, data: Partial<Ticket>): Promise<Ticket> {
    const request = toSnakeCase(data);
    const response = await apiClient.patch<TicketApiResponse>(`/tickets/${id}`, request);
    return transformTicket(response);
  },

  /**
   * Delete a ticket
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/tickets/${id}`);
  },

  /**
   * Mark ticket as paid
   */
  async markAsPaid(id: string, paymentData: {
    paidDate: string;
    paidAmount: number;
    paymentMethod: string;
    paymentReference?: string;
  }): Promise<Ticket> {
    const request: TicketPayRequest = {
      paid_date: paymentData.paidDate,
      paid_amount: paymentData.paidAmount,
      payment_method: paymentData.paymentMethod,
      payment_reference: paymentData.paymentReference,
    };
    const response = await apiClient.post<TicketApiResponse>(`/tickets/${id}/pay`, request);
    return transformTicket(response);
  },

  /**
   * Update ticket status
   */
  async updateStatus(id: string, newStatus: TicketStatus): Promise<Ticket> {
    const response = await apiClient.post<TicketApiResponse>(
      `/tickets/${id}/status`,
      undefined,
      { params: { new_status: newStatus } }
    );
    return transformTicket(response);
  },

  /**
   * Get overdue tickets
   */
  async getOverdue(skip?: number, limit?: number): Promise<Ticket[]> {
    const response = await apiClient.get<TicketApiResponse[]>("/tickets/overdue", {
      params: { skip, limit },
    });
    return transformTickets(response);
  },

  /**
   * Get ticket statistics
   */
  async getStats(startDate?: string, endDate?: string): Promise<TicketStats> {
    const response = await apiClient.get<TicketStatsApiResponse>("/tickets/stats", {
      params: { start_date: startDate, end_date: endDate },
    });
    return transformTicketStats(response);
  },

  /**
   * Get tickets by vehicle
   */
  async getByVehicle(vehicleId: string, skip?: number, limit?: number): Promise<Ticket[]> {
    const response = await apiClient.get<TicketApiResponse[]>(`/tickets/by-vehicle/${vehicleId}`, {
      params: { skip, limit },
    });
    return transformTickets(response);
  },

  /**
   * Get tickets by driver
   */
  async getByDriver(driverId: string, skip?: number, limit?: number): Promise<Ticket[]> {
    const response = await apiClient.get<TicketApiResponse[]>(`/tickets/by-employee/${driverId}`, {
      params: { skip, limit },
    });
    return transformTickets(response);
  },
};

export default ticketsService;
