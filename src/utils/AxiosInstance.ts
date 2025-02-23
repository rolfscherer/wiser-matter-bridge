import axios from 'axios';

// Axios instance
const axiosInstance = axios.create({
  timeout: 50000, // Timeout in milliseconds
});

// Max retries for requests
const maxRetries = 3;

// Interceptor for requests
axiosInstance.interceptors.request.use(request => {
  return request;
});

// Interceptor for responses
axiosInstance.interceptors.response.use(
  response => {
    return response;
  },
  async error => {
    const config = error.config;

    // If there is no configuration or no retries left, return error
    if (!config || config.__retryCount >= maxRetries) {
      return Promise.reject(error);
    }

    // Increase the number of previous retries
    config.__retryCount = config.__retryCount || 0;
    config.__retryCount += 1;

    // Wait before the next attempt (1 second)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Resend request
    return axiosInstance(config);
  }
);

export default axiosInstance;
