import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// TypeScript types for MLSuggestion props
interface MLSuggestionProps {
  distributorProduct: string;
  suggestedMatch: string;
  confidence: number;
}

const AutoMatchingPage: React.FC = () => (
  <div className="space-y-6 p-8 bg-gray-100 min-h-screen">
    <h2 className="text-2xl font-bold">Automated Matching</h2>
    
    <Card>
      <CardHeader>
        <CardTitle>ML-Based Suggestions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* ML suggestions with confidence scores */}
          <MLSuggestion 
            distributorProduct="TO RENDIPEL PRO D"
            suggestedMatch="Rendipel Pro 500ml"
            confidence={92}
          />
          <MLSuggestion 
            distributorProduct="SHAM CLEAR"
            suggestedMatch="Clear Shampoo 200ml"
            confidence={87}
          />
        </div>
      </CardContent>
    </Card>
  </div>
);

const MLSuggestion: React.FC<MLSuggestionProps> = ({ distributorProduct, suggestedMatch, confidence }) => (
  <div className="p-4 border rounded-lg">
    <div className="flex justify-between items-center">
      <div>
        <p className="font-medium">{distributorProduct}</p>
        <p className="text-sm text-gray-500">Suggested: {suggestedMatch}</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-green-600">{confidence}%</p>
        <p className="text-sm text-gray-500">confidence</p>
      </div>
    </div>
    <div className="mt-4 flex space-x-4">
      <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
        Accept Match
      </button>
      <button className="px-4 py-2 border rounded hover:bg-gray-50">
        Reject
      </button>
    </div>
  </div>
);

export default AutoMatchingPage;
