import { Logger } from '@matter/main';
import { type AxiosResponse } from 'axios';
import { StatusCodes } from 'http-status-codes';
import { inject, injectable } from 'inversify';
import axiosInstance from '../utils/AxiosInstance.js';
import { Config } from '../config/Config.js';

export interface ResponseWrapper<T> {
  data?: T;
  status: string;
  message?: string;
  error?: Error;
  code: number;
}

@injectable()
export class WiserRestClient {
  logger = new Logger('WiserRestClient');
  static readonly error = 'error';

  baseURL = '';

  constructor(@inject(Config) public readonly config: Config) {
    this.baseURL = this.config.wiserRestUrl;
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.config.wiserAuthToken}`;
  }

  async get<T>(url: string): Promise<ResponseWrapper<T>> {
    return await axiosInstance
      .get<ResponseWrapper<T>>(this.baseURL + url)
      .then(response => this.processResponse(response))
      .catch(error => this.processError(error));
  }

  async post<T>(url: string, data: T): Promise<ResponseWrapper<T>> {
    return await axiosInstance
      .post<ResponseWrapper<T>>(this.baseURL + url, JSON.stringify(data))
      .then(response => this.processResponse(response))
      .catch(error => this.processError(error));
  }

  async put<T>(url: string, data: T): Promise<ResponseWrapper<T>> {
    return await this.put2<T, T>(url, data);
  }

  async put2<T, R>(url: string, data: T): Promise<ResponseWrapper<R>> {
    return await axiosInstance
      .put<ResponseWrapper<R>>(this.baseURL + url, JSON.stringify(data))
      .then(response => this.processResponse(response))
      .catch(error => this.processError(error));
  }

  async patch<T>(url: string, data: T): Promise<ResponseWrapper<T>> {
    return axiosInstance
      .post<ResponseWrapper<T>>(this.baseURL + url, JSON.stringify(data))
      .then(response => this.processResponse(response))
      .catch(error => this.processError(error));
  }

  async delete<T>(url: string): Promise<ResponseWrapper<T>> {
    return axiosInstance
      .delete<ResponseWrapper<T>>(this.baseURL + url)
      .then(response => this.processResponse(response))
      .catch(error => this.processError(error));
  }

  private processResponse<T>(r: AxiosResponse<ResponseWrapper<T>>): ResponseWrapper<T> {
    if (r.data.status === WiserRestClient.error) {
      this.logger.error(`Error in rest call. ${r.data.message}`);
      r.data.error = new Error(r.data.message);
      r.data.code = StatusCodes.BAD_REQUEST;
      return r.data;
    } else {
      r.data.code = StatusCodes.OK;
    }
    return r.data;
  }

  // eslint-disable-next-line
  private processError<T>(error: any): ResponseWrapper<T> {
    this.logger.error(`Error in rest call. ${error.message}`);
    const r: ResponseWrapper<T> = {
      status: 'error',
      message: error.message,
      error: error,
      code: error.status ?? StatusCodes.INTERNAL_SERVER_ERROR,
    };
    return r;
  }
}
