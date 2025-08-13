import { apiClient } from "./apiClient";
import axios from "axios";

const API_BASE = `${import.meta.env.VITE_BACKEND_URL}/api`;
console.log("API_BASE:", API_BASE);

export const loginUser = async (data) => {
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, data);
    return res.data;
  } catch (error) {
    // Handle different error scenarios
    if (error.response?.status === 400) {
      throw new Error(
        error.response.data.detail || "Invalid email or password"
      );
    } else if (error.response?.status === 401) {
      throw new Error("Invalid credentials");
    } else if (error.response?.status >= 500) {
      throw new Error("Server error. Please try again later.");
    } else {
      throw new Error("Login failed. Please check your connection.");
    }
  }
};

export const signupUser = async (data) => {
  try {
    console.log("Signing up with url:", `${API_BASE}/auth/signup`);
    const res = await axios.post(`${API_BASE}/auth/signup`, {
      email: data.email,
      password: data.password,
    });
    console.log("Signup response:", res.data);
    return res.data;
  } catch (error) {
    const errorMessage = error.response?.data?.detail || "Signup failed";
    throw new Error(errorMessage);
  }
};

export const getUserProfile = async () => {
  try {
    const response = await apiClient.get("/auth/profile");
    return response.data;
  } catch (error) {
    console.error("Profile fetch error:", error);
    if (error.response?.status === 401) {
      throw new Error("Session expired. Please login again.");
    }
    throw new Error("Failed to fetch user profile");
  }
};
