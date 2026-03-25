/**
 * Users API service
 */

import { apiClient } from "./client";
import type { UserApiResponse, UserUpdateRequest, UserPasswordUpdateRequest, UserCreateRequest } from "./types";
import { transformUser } from "./transformers";
import type { User } from "@/types";

export const usersService = {
  /**
   * Get current user profile
   */
  async getMe(): Promise<User> {
    const response = await apiClient.get<UserApiResponse>("/users/me");
    return transformUser(response);
  },

  /**
   * Update current user profile
   */
  async updateMe(data: UserUpdateRequest): Promise<User> {
    const response = await apiClient.patch<UserApiResponse>("/users/me", data);
    return transformUser(response);
  },

  /**
   * Update current user password
   */
  async updatePassword(data: UserPasswordUpdateRequest): Promise<User> {
    const response = await apiClient.post<UserApiResponse>("/users/me/password", data);
    return transformUser(response);
  },

  /**
   * Get user by ID (admin only)
   */
  async getById(id: string): Promise<User> {
    const response = await apiClient.get<UserApiResponse>(`/users/${id}`);
    return transformUser(response);
  },

  /**
   * Update user by ID (admin only)
   */
  async update(id: string, data: UserUpdateRequest): Promise<User> {
    const response = await apiClient.patch<UserApiResponse>(`/users/${id}`, data);
    return transformUser(response);
  },

  /**
   * List all users in organization (admin only)
   */
  async getAll(): Promise<User[]> {
    const response = await apiClient.get<UserApiResponse[]>("/users");
    return response.map(transformUser);
  },

  /**
   * Create a new user (admin only)
   */
  async create(data: UserCreateRequest): Promise<User> {
    const response = await apiClient.post<UserApiResponse>("/users", data);
    return transformUser(response);
  },

  /**
   * Delete/deactivate user by ID (admin only)
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};

export default usersService;
