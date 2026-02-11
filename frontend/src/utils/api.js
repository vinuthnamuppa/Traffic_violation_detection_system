import axios from "axios";

// Axios instance with JWT interceptor support.
// In dev, Vite proxy sends /api requests to http://localhost:5000.

class ApiClient {
  constructor() {
    this.axios = axios.create({
      baseURL: "/api"
    });

    this.accessToken = null;

    this.axios.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });
  }

  setToken(token) {
    this.accessToken = token;
  }

  // Auth endpoints
  register(payload) {
    return this.axios.post("/auth/register", payload);
  }

  login(payload) {
    return this.axios.post("/auth/login", payload);
  }

  refresh(refreshToken) {
    return this.axios.post("/auth/refresh", { refresh_token: refreshToken });
  }

  validateOfficialKey(key) {
    return this.axios.post("/auth/validate-official-key", {
      official_key: key
    });
  }

  // Violations
  listViolations(params) {
    return this.axios.get("/violations", { params });
  }

  // Challans
  listChallans() {
    return this.axios.get("/challans");
  }

  createChallanFromViolation(payload) {
    return this.axios.post("/challans/from-violation", payload);
  }

  updateChallan(challanId, payload) {
    return this.axios.patch(`/challans/${challanId}`, payload);
  }

  deleteChallan(challanId) {
    return this.axios.delete(`/challans/${challanId}`);
  }

  payChallan(challanId) {
    return this.axios.post(`/challans/${challanId}/pay`);
  }
}

const api = new ApiClient();

export default api;

