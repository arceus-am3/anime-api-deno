// src/configs/axios.config.js
import axios from "npm:axios@1.6.7";
import { DEFAULT_HEADERS } from "../configs/header.config.js"; // adapt path if needed

export const axiosInstance = axios.create({
  headers: DEFAULT_HEADERS || { "User-Agent": "Mozilla/5.0 (compatible; API Bot)" },
  timeout: 10000, // 10s
  maxRedirects: 5,
});