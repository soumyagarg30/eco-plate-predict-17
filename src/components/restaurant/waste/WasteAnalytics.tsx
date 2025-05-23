
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const WasteAnalytics: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Food Waste Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="font-medium text-gray-900">Current Waste Metrics</h3>
            <p className="text-gray-600">Last week's food waste: 12.5kg</p>
            <p className="text-gray-600">30-day average: 15.2kg per week</p>
            <p className="text-gray-600">Top waste category: Vegetables (40%)</p>
          </div>
          
          <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="font-medium text-gray-900">Recommendations</h3>
            <ul className="list-disc pl-5 text-gray-600 space-y-1">
              <li>Reduce vegetable order by 15%</li>
              <li>Implement smaller portion sizes for side dishes</li>
              <li>Utilize bread products in daily specials before expiration</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WasteAnalytics;
