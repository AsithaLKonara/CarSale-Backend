export interface CarFilterQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isFeatured?: boolean;
  priceMin?: number;
  priceMax?: number;
  yearMin?: number;
  yearMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  transmission?: string;
  fuelType?: string;
  brand?: string;
  status?: string;
  isAdmin?: boolean | string;
}

export interface CarSpecInput {
  label: string;
  value: string;
}

export interface CarImageInput {
  url: string;
  type: string;
}

export interface CarCreateInput {
  name: string;
  slug: string;
  brand: string;
  description: string;
  horsepower: number;
  torque: number;
  topSpeed: number;
  zeroTo100: number;
  price?: string;
  category: string;
  isFeatured?: boolean;
  
  year?: number;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  vin?: string;
  condition?: string;
  status?: string;
  featured?: boolean;
  soldAt?: Date | string;
  publishedAt?: Date | string;

  images?: CarImageInput[];
  specs?: CarSpecInput[];
}
export type CarUpdateInput = Partial<CarCreateInput>;
