export interface Category {
  _id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}
