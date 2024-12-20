'use client';

import React, { useState } from 'react';
import { Search, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Define types for the products
interface DistributorProduct {
  id: number;
  distributor: string;
  code: string;
  name: string;
  unit: string;
  price: number;
}

interface CatalogProduct {
  id: number;
  sku: string;
  name: string;
  category: string;
  unit: string;
}

const ProductMatchingInterface = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistributorProduct, setSelectedDistributorProduct] = useState<DistributorProduct | null>(null);
  const [selectedCatalogProduct, setSelectedCatalogProduct] = useState<CatalogProduct | null>(null);

  // Sample data for distributor products and catalog products
  const distributorProducts: DistributorProduct[] = [
    { id: 1, distributor: 'Distributor A', code: '361499', name: 'TO RENDIPEL PRO D', unit: 'UNIDAD', price: 45.99 },
    { id: 2, distributor: 'Distributor B', code: 'RP-2023', name: 'Rendipel Professional', unit: 'UNIT', price: 46.50 },
    { id: 3, distributor: 'Distributor C', code: 'RPD-01', name: 'Rendipel Pro Dispenser', unit: 'PC', price: 44.99 },
  ];

  const catalogProducts: CatalogProduct[] = [
    { id: 1, sku: 'REND-500', name: 'Rendipel Pro 500ml', category: 'Professional Care', unit: 'UNIT' },
    { id: 2, sku: 'REND-1000', name: 'Rendipel Pro 1000ml', category: 'Professional Care', unit: 'UNIT' },
    { id: 3, sku: 'REND-DISP', name: 'Rendipel Dispenser', category: 'Accessories', unit: 'UNIT' },
  ];

  // Filter catalog products based on search query
  const filteredCatalogProducts = catalogProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMatch = () => {
    if (selectedDistributorProduct && selectedCatalogProduct) {
      const distributorProductName = selectedDistributorProduct.name || 'Unknown Distributor Product';
      const catalogProductName = selectedCatalogProduct.name || 'Unknown Catalog Product';
      alert(`Matched: ${distributorProductName} → ${catalogProductName}`);
    } else {
      alert('Please select both products to match.');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Product Homologation Interface</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Distributor Products */}
        <Card>
          <CardHeader>
            <CardTitle>Distributor Products (Unmatched)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {distributorProducts.map((product) => (
                <div
                  key={product.id}
                  className={`p-4 border rounded-lg cursor-pointer ${
                    selectedDistributorProduct?.id === product.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedDistributorProduct(product)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">Code: {product.code}</p>
                      <p className="text-sm text-gray-500">Distributor: {product.distributor}</p>
                    </div>
                    <AlertCircle className="text-yellow-500" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Official Catalog */}
        <Card>
          <CardHeader>
            <CardTitle>Official Catalog</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name or SKU..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-4">
              {filteredCatalogProducts.map((product) => (
                <div
                  key={product.id}
                  className={`p-4 border rounded-lg cursor-pointer ${
                    selectedCatalogProduct?.id === product.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedCatalogProduct(product)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                      <p className="text-sm text-gray-500">Category: {product.category}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Match Action */}
      <div className="flex justify-center">
        <button
          className={`px-6 py-3 rounded-lg flex items-center space-x-2 ${
            selectedDistributorProduct && selectedCatalogProduct
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
          onClick={handleMatch}
          disabled={!selectedDistributorProduct || !selectedCatalogProduct}
        >
          <CheckCircle size={20} />
          <span>Confirm Match</span>
        </button>
      </div>

      {/* Selected Products Summary */}
      {(selectedDistributorProduct || selectedCatalogProduct) && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Match</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Distributor Product</h3>
                {selectedDistributorProduct ? (
                  <div className="text-sm">
                    <p>Name: {selectedDistributorProduct.name}</p>
                    <p>Code: {selectedDistributorProduct.code}</p>
                    <p>Distributor: {selectedDistributorProduct.distributor}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No product selected</p>
                )}
              </div>
              <div>
                <h3 className="font-medium mb-2">Official Catalog Product</h3>
                {selectedCatalogProduct ? (
                  <div className="text-sm">
                    <p>Name: {selectedCatalogProduct.name}</p>
                    <p>SKU: {selectedCatalogProduct.sku}</p>
                    <p>Category: {selectedCatalogProduct.category}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No product selected</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductMatchingInterface;
