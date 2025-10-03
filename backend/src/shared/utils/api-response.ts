export interface ApiSuccessResponse<T = any> {
  success: true;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: any;
  timestamp: string;
}

export type ApiResponseType<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

export class ApiResponse {
  /**
   * Crear respuesta exitosa
   */
  static success<T = any>(data: T, message = "Success"): ApiSuccessResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Crear respuesta de error
   */
  static error(message = "Error", errors?: any): ApiErrorResponse {
    return {
      success: false,
      message,
      timestamp: new Date().toISOString(),
      ...(errors && { errors })
    };
  }

  /**
   * Crear respuesta de paginación exitosa
   */
  static paginated<T = any>(
    data: T[], 
    total: number, 
    page: number, 
    limit: number, 
    message = "Data retrieved successfully"
  ): ApiSuccessResponse<{
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    return {
      success: true,
      message,
      data: {
        items: data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      },
      timestamp: new Date().toISOString()
    };
  }
}
