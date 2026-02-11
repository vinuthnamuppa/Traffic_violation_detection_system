import axios from "axios";

class ApiClient {
  constructor() {
    this.axios = axios.create({
      // Call Flask backend directly on port 5000.
      // This avoids any dev proxy issues.
      baseURL: "http://127.0.0.1:5000/api"
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

  register(payload) {
    return this.axios.post("/auth/register", payload);
  }

  login(payload) {
    return this.axios.post("/auth/login", payload);
  }

  validateOfficialKey(key) {
    return this.axios.post("/auth/validate-official-key", {
      official_key: key
    });
  }

  listViolations(params) {
    return this.axios.get("/violations", { params });
  }

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

