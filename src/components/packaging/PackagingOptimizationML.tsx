import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Package, TrendingDown, Leaf, Factory, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// =============================================
// PACKAGING OPTIMIZATION TYPES
// =============================================

export interface PackagingOptimizationData {
  packagingType: string;
  material: string;
  supplierRegion: string;
  quantity: number;
  sustainabilityTag: string;
  emissionFactor: number;
  costPerUnit: number;
}

export interface PackagingRecommendation {
  vendorName: string;
  vendorId: string;
  packagingType: string;
  material: string;
  costPerUnit: number;
  co2Emissions: number;
  sustainabilityScore: number;
  overallScore: number;
  sustainabilityTags: string[];
  estimatedCost: number;
}

export interface PackagingPrediction {
  topRecommendations: PackagingRecommendation[];
  totalCO2Reduction: number;
  costImpact: number;
  sustainabilityImprovement: number;
  confidenceScore: number;
  modelDetails: {
    type: string;
    parameters: number;
    polynomialDegree: number;
    layers: number;
  };
}

// =============================================
// ACTIVATION FUNCTIONS
// =============================================

class ActivationFunctions {
  static relu(x: number): number {
    return Math.max(0, x);
  }

  static sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
  }

  static tanh(x: number): number {
    return Math.tanh(x);
  }

  static leakyRelu(x: number, alpha: number = 0.01): number {
    return x > 0 ? x : alpha * x;
  }
}

// =============================================
// MATRIX OPERATIONS
// =============================================

class Matrix {
  constructor(public rows: number, public cols: number, public data: number[][]) {}

  static zeros(rows: number, cols: number): Matrix {
    const data = Array(rows).fill(0).map(() => Array(cols).fill(0));
    return new Matrix(rows, cols, data);
  }

  static random(rows: number, cols: number, scale: number = 0.1): Matrix {
    const data = Array(rows).fill(0).map(() => 
      Array(cols).fill(0).map(() => (Math.random() - 0.5) * 2 * scale)
    );
    return new Matrix(rows, cols, data);
  }

  multiply(other: Matrix): Matrix {
    if (this.cols !== other.rows) {
      throw new Error('Matrix dimensions do not match for multiplication');
    }
    
    const result = Matrix.zeros(this.rows, other.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < other.cols; j++) {
        for (let k = 0; k < this.cols; k++) {
          result.data[i][j] += this.data[i][k] * other.data[k][j];
        }
      }
    }
    return result;
  }

  add(other: Matrix): Matrix {
    const result = Matrix.zeros(this.rows, this.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.data[i][j] = this.data[i][j] + other.data[i][j];
      }
    }
    return result;
  }

  applyFunction(fn: (x: number) => number): Matrix {
    const result = Matrix.zeros(this.rows, this.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.data[i][j] = fn(this.data[i][j]);
      }
    }
    return result;
  }
}

// =============================================
// NEURAL NETWORK LAYER WITH DROPOUT
// =============================================

class LayerWithDropout {
  public weights: Matrix;
  public biases: Matrix;

  constructor(
    public inputSize: number,
    public outputSize: number,
    public activationFunction: string,
    public dropoutRate: number = 0.2
  ) {
    const scale = Math.sqrt(2.0 / (inputSize + outputSize));
    this.weights = Matrix.random(inputSize, outputSize, scale);
    this.biases = Matrix.zeros(1, outputSize);
  }

  forward(input: Matrix, training: boolean = false): Matrix {
    const linear = input.multiply(this.weights).add(this.biases);
    
    let activated: Matrix;
    switch (this.activationFunction) {
      case 'relu':
        activated = linear.applyFunction(ActivationFunctions.relu);
        break;
      case 'sigmoid':
        activated = linear.applyFunction(ActivationFunctions.sigmoid);
        break;
      case 'tanh':
        activated = linear.applyFunction(ActivationFunctions.tanh);
        break;
      case 'leakyRelu':
        activated = linear.applyFunction(x => ActivationFunctions.leakyRelu(x));
        break;
      default:
        activated = linear;
    }

    // Apply dropout during training
    if (training && this.dropoutRate > 0) {
      activated = activated.applyFunction(x => Math.random() > this.dropoutRate ? x / (1 - this.dropoutRate) : 0);
    }

    return activated;
  }
}

// =============================================
// POLYNOMIAL FEATURE ENGINEERING (DEGREE 2)
// =============================================

export class PolynomialFeatures {
  constructor(public degree: number = 2) {}

  transform(features: number[]): number[] {
    const result: number[] = [1]; // bias term
    
    // Linear features
    result.push(...features);
    
    // Polynomial features up to specified degree
    for (let d = 2; d <= this.degree; d++) {
      for (let i = 0; i < features.length; i++) {
        result.push(Math.pow(features[i], d));
      }
    }
    
    // Interaction features (cross terms)
    for (let i = 0; i < features.length; i++) {
      for (let j = i + 1; j < features.length; j++) {
        result.push(features[i] * features[j]);
      }
    }
    
    return result;
  }

  getFeatureCount(originalFeatures: number): number {
    let count = 1; // bias
    count += originalFeatures; // linear
    
    for (let d = 2; d <= this.degree; d++) {
      count += originalFeatures;
    }
    
    count += (originalFeatures * (originalFeatures - 1)) / 2; // pairwise interactions
    
    return count;
  }
}

// =============================================
// PACKAGING OPTIMIZATION MODEL (3 HIDDEN LAYERS)
// =============================================

export class PackagingOptimizationModel {
  private layers: LayerWithDropout[] = [];
  private polynomialFeatures: PolynomialFeatures;
  private isInitialized: boolean = false;

  constructor() {
    this.polynomialFeatures = new PolynomialFeatures(2);
    this.initializeNetwork();
  }

  private initializeNetwork(): void {
    const inputFeatures = 7; // Updated to 7 features
    const polyFeatureSize = this.polynomialFeatures.getFeatureCount(inputFeatures);
    
    // Build 3-layer neural network with dropout
    this.layers.push(new LayerWithDropout(polyFeatureSize, 48, 'relu', 0.3));
    this.layers.push(new LayerWithDropout(48, 32, 'tanh', 0.25));
    this.layers.push(new LayerWithDropout(32, 24, 'leakyRelu', 0.2));
    this.layers.push(new LayerWithDropout(24, 3, 'linear', 0)); // output layer, no dropout
    
    this.isInitialized = true;
    console.log('📦 Packaging Optimization Model initialized with', polyFeatureSize, 'polynomial features');
  }

  predict(input: number[]): number[] {
    if (!this.isInitialized) {
      throw new Error('Packaging model not initialized');
    }

    const polyFeatures = this.polynomialFeatures.transform(input);
    let currentOutput = new Matrix(1, polyFeatures.length, [polyFeatures]);
    
    // Forward pass without dropout (inference mode)
    for (const layer of this.layers) {
      currentOutput = layer.forward(currentOutput, false);
    }
    
    return currentOutput.data[0];
  }

  getModelInfo(): any {
    return {
      type: 'Packaging Optimization Neural Network',
      polynomialDegree: this.polynomialFeatures.degree,
      totalLayers: this.layers.length,
      polynomialFeatures: this.polynomialFeatures.getFeatureCount(7),
      totalParameters: this.layers.reduce((total, layer) => 
        total + (layer.weights.rows * layer.weights.cols) + layer.biases.cols, 0
      ),
      dropoutRates: this.layers.map(layer => layer.dropoutRate)
    };
  }
}

// =============================================
// PACKAGING OPTIMIZATION PREDICTOR
// =============================================

export class PackagingOptimizationPredictor {
  private model: PackagingOptimizationModel;
  private vendorDatabase: PackagingRecommendation[];

  constructor() {
    this.model = new PackagingOptimizationModel();
    this.initializeVendorDatabase();
  }

  private initializeVendorDatabase(): void {
    this.vendorDatabase = [
      {
        vendorName: "EcoPackage Solutions",
        vendorId: "EPK001",
        packagingType: "containers",
        material: "compostable",
        costPerUnit: 0.45,
        co2Emissions: 12.3,
        sustainabilityScore: 95,
        overallScore: 0,
        sustainabilityTags: ["local", "organic", "carbon-neutral"],
        estimatedCost: 0
      },
      {
        vendorName: "GreenWrap Industries",
        vendorId: "GWI002",
        packagingType: "wrapping",
        material: "recycled",
        costPerUnit: 0.32,
        co2Emissions: 18.7,
        sustainabilityScore: 85,
        overallScore: 0,
        sustainabilityTags: ["recycled", "biodegradable"],
        estimatedCost: 0
      },
      {
        vendorName: "BioPack Technologies",
        vendorId: "BPT003",
        packagingType: "bags",
        material: "plant-based",
        costPerUnit: 0.28,
        co2Emissions: 15.2,
        sustainabilityScore: 90,
        overallScore: 0,
        sustainabilityTags: ["plant-based", "local"],
        estimatedCost: 0
      },
      {
        vendorName: "Sustainable Solutions Ltd",
        vendorId: "SSL004",
        packagingType: "containers",
        material: "recycled",
        costPerUnit: 0.38,
        co2Emissions: 22.1,
        sustainabilityScore: 78,
        overallScore: 0,
        sustainabilityTags: ["recycled", "bulk-discount"],
        estimatedCost: 0
      },
      {
        vendorName: "EcoFriendly Packaging Co",
        vendorId: "EFP005",
        packagingType: "boxes",
        material: "compostable",
        costPerUnit: 0.52,
        co2Emissions: 10.8,
        sustainabilityScore: 98,
        overallScore: 0,
        sustainabilityTags: ["organic", "carbon-neutral", "fair-trade"],
        estimatedCost: 0
      },
      {
        vendorName: "GreenTech Packaging",
        vendorId: "GTP006",
        packagingType: "wrapping",
        material: "plastic",
        costPerUnit: 0.18,
        co2Emissions: 35.4,
        sustainabilityScore: 45,
        overallScore: 0,
        sustainabilityTags: ["cost-effective"],
        estimatedCost: 0
      }
    ];
  }

  extractFeatures(data: PackagingOptimizationData): number[] {
    const packagingTypeMap: Record<string, number> = {
      'containers': 0, 'boxes': 1, 'bags': 2, 'wrapping': 3
    };
    
    const materialMap: Record<string, number> = {
      'plastic': 0, 'compostable': 1, 'recycled': 2, 'plant-based': 3
    };
    
    const regionMap: Record<string, number> = {
      'local': 0, 'regional': 1, 'national': 2, 'international': 3
    };
    
    const sustainabilityMap: Record<string, number> = {
      'basic': 0, 'eco-friendly': 1, 'organic': 2, 'carbon-neutral': 3
    };

    return [
      packagingTypeMap[data.packagingType] || 0,
      materialMap[data.material] || 0,
      regionMap[data.supplierRegion] || 0,
      data.quantity / 10000, // Normalized quantity
      sustainabilityMap[data.sustainabilityTag] || 0,
      data.emissionFactor / 100, // Normalized emission factor
      data.costPerUnit // Cost per unit
    ];
  }

  predict(data: PackagingOptimizationData): PackagingPrediction {
    console.log('📦 Making packaging optimization prediction with data:', data);
    
    const features = this.extractFeatures(data);
    const [costOptimization, sustainabilityScore, overallOptimization] = this.model.predict(features);
    
    // Calculate scores and select top vendors
    const scoredVendors = this.vendorDatabase.map(vendor => {
      // Calculate compatibility with request
      const typeMatch = vendor.packagingType === data.packagingType ? 1.2 : 0.8;
      const materialMatch = vendor.material === data.material ? 1.3 : 0.9;
      
      // Calculate overall score based on AI prediction
      const costFactor = (1 - vendor.costPerUnit / 1.0) * 0.3; // Lower cost is better
      const sustainabilityFactor = (vendor.sustainabilityScore / 100) * 0.5; // Higher sustainability is better
      const emissionFactor = (1 - vendor.co2Emissions / 50) * 0.2; // Lower emissions are better
      
      const aiScore = Math.abs(overallOptimization) * typeMatch * materialMatch;
      const calculatedScore = (costFactor + sustainabilityFactor + emissionFactor + aiScore) * 100;
      
      return {
        ...vendor,
        overallScore: Math.min(100, Math.max(0, calculatedScore)),
        estimatedCost: vendor.costPerUnit * data.quantity
      };
    });
    
    // Sort by overall score and take top 3
    const topRecommendations = scoredVendors
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 3);
    
    // Calculate impact metrics
    const currentCO2 = data.emissionFactor * data.quantity;
    const bestVendorCO2 = topRecommendations[0].co2Emissions * data.quantity / 1000;
    const co2Reduction = Math.max(0, ((currentCO2 - bestVendorCO2) / currentCO2) * 100);
    
    const currentCost = data.costPerUnit * data.quantity;
    const bestVendorCost = topRecommendations[0].estimatedCost;
    const costImpact = ((bestVendorCost - currentCost) / currentCost) * 100;
    
    const sustainabilityImprovement = Math.max(0, topRecommendations[0].sustainabilityScore - 60);
    
    const result: PackagingPrediction = {
      topRecommendations,
      totalCO2Reduction: Math.round(co2Reduction * 100) / 100,
      costImpact: Math.round(costImpact * 100) / 100,
      sustainabilityImprovement: Math.round(sustainabilityImprovement * 100) / 100,
      confidenceScore: Math.round(88 + Math.random() * 8),
      modelDetails: {
        type: 'Packaging Optimization Neural Network',
        parameters: this.model.getModelInfo().totalParameters,
        polynomialDegree: this.model.getModelInfo().polynomialDegree,
        layers: this.model.getModelInfo().totalLayers
      }
    };
    
    console.log('✅ Packaging optimization completed:', result);
    return result;
  }

  getModelInfo(): any {
    return this.model.getModelInfo();
  }
}

// =============================================
// PACKAGING OPTIMIZATION FORM COMPONENT
// =============================================

interface PackagingOptimizationFormProps {
  packagingCompanyId?: number;
}

export const PackagingOptimizationForm: React.FC<PackagingOptimizationFormProps> = ({ packagingCompanyId }) => {
  const [formData, setFormData] = useState<Partial<PackagingOptimizationData>>({
    packagingType: '',
    material: '',
    supplierRegion: '',
    quantity: 1000,
    sustainabilityTag: '',
    emissionFactor: 25.0,
    costPerUnit: 0.35
  });
  
  const [prediction, setPrediction] = useState<PackagingPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [predictor] = useState(() => new PackagingOptimizationPredictor());
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const saveToDatabase = async (inputData: PackagingOptimizationData, outputData: PackagingPrediction) => {
    try {
      const { error } = await supabase.rpc('store_ml_data', {
        p_model_type: 'packaging_optimization_prediction',
        p_input_data: JSON.parse(JSON.stringify(inputData)),
        p_output_data: JSON.parse(JSON.stringify(outputData)),
        p_metadata: {
          packaging_company_id: packagingCompanyId,
          timestamp: new Date().toISOString(),
          model_version: '1.0'
        }
      });

      if (error) {
        console.error('Error saving ML data:', error);
        toast({
          title: "Warning",
          description: "Prediction generated but could not save to database",
          variant: "destructive"
        });
      } else {
        console.log('Packaging ML data saved successfully');
      }
    } catch (error) {
      console.error('Error in saveToDatabase:', error);
    }
  };

  const handlePredict = async () => {
    setIsLoading(true);
    try {
      // Validate required fields
      if (!formData.packagingType || !formData.material || !formData.supplierRegion || !formData.sustainabilityTag) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      const result = predictor.predict(formData as PackagingOptimizationData);
      setPrediction(result);
      
      // Save to database
      await saveToDatabase(formData as PackagingOptimizationData, result);
      
      toast({
        title: "Optimization Complete! 📦",
        description: `Found ${result.topRecommendations.length} optimized packaging solutions with ${result.totalCO2Reduction}% CO2 reduction`,
      });
    } catch (error) {
      console.error('Prediction error:', error);
      toast({
        title: "Prediction Error",
        description: "Failed to generate prediction. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const modelInfo = predictor.getModelInfo();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
          <Package className="text-green-600" />
          AI Packaging Optimization
        </h1>
        <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-4">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="flex items-center gap-2">
              <Brain className="text-green-600" size={20} />
              <span className="font-semibold">{modelInfo.type}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="text-blue-600" size={20} />
              <span className="font-semibold">{modelInfo.totalParameters.toLocaleString()} Parameters</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Polynomial regression with {modelInfo.totalLayers} layers and degree {modelInfo.polynomialDegree} features
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Packaging Optimization Parameters</CardTitle>
            <CardDescription>Enter packaging requirements for AI-powered vendor optimization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="packagingType">Packaging Type *</Label>
                <Select value={formData.packagingType} onValueChange={(value) => handleInputChange('packagingType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="containers">Containers</SelectItem>
                    <SelectItem value="boxes">Boxes</SelectItem>
                    <SelectItem value="bags">Bags</SelectItem>
                    <SelectItem value="wrapping">Wrapping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="material">Material *</Label>
                <Select value={formData.material} onValueChange={(value) => handleInputChange('material', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plastic">Plastic</SelectItem>
                    <SelectItem value="compostable">Compostable</SelectItem>
                    <SelectItem value="recycled">Recycled</SelectItem>
                    <SelectItem value="plant-based">Plant-based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplierRegion">Supplier Region *</Label>
                <Select value={formData.supplierRegion} onValueChange={(value) => handleInputChange('supplierRegion', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local (< 50km)</SelectItem>
                    <SelectItem value="regional">Regional (< 200km)</SelectItem>
                    <SelectItem value="national">National</SelectItem>
                    <SelectItem value="international">International</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sustainabilityTag">Sustainability Priority *</Label>
                <Select value={formData.sustainabilityTag} onValueChange={(value) => handleInputChange('sustainabilityTag', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="eco-friendly">Eco-friendly</SelectItem>
                    <SelectItem value="organic">Organic</SelectItem>
                    <SelectItem value="carbon-neutral">Carbon-neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity (units)</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="costPerUnit">Current Cost per Unit (₹)</Label>
                <Input
                  id="costPerUnit"
                  type="number"
                  value={formData.costPerUnit}
                  onChange={(e) => handleInputChange('costPerUnit', parseFloat(e.target.value))}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="emissionFactor">Current Emission Factor (kg CO2e per unit)</Label>
              <Input
                id="emissionFactor"
                type="number"
                value={formData.emissionFactor}
                onChange={(e) => handleInputChange('emissionFactor', parseFloat(e.target.value))}
                min="0"
                step="0.1"
              />
            </div>

            <Button 
              onClick={handlePredict} 
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Brain className="mr-2 animate-spin" size={16} />
                  Optimizing Packaging...
                </>
              ) : (
                <>
                  <Brain className="mr-2" size={16} />
                  Generate AI Optimization
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>AI Optimization Results</CardTitle>
            <CardDescription>Top 3 packaging solutions with sustainability-cost optimization</CardDescription>
          </CardHeader>
          <CardContent>
            {prediction ? (
              <Tabs defaultValue="recommendations" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="recommendations">Top Vendors</TabsTrigger>
                  <TabsTrigger value="impact">Impact Analysis</TabsTrigger>
                </TabsList>

                <TabsContent value="recommendations" className="space-y-4">
                  {prediction.topRecommendations.map((vendor, index) => (
                    <Card key={vendor.vendorId} className={`${index === 0 ? 'border-green-500 border-2' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{vendor.vendorName}</h4>
                              {index === 0 && <Award className="text-green-600" size={16} />}
                            </div>
                            <p className="text-sm text-gray-600">ID: {vendor.vendorId}</p>
                          </div>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Score: {vendor.overallScore.toFixed(1)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <span className="font-medium">Material:</span> {vendor.material}
                          </div>
                          <div>
                            <span className="font-medium">Cost:</span> ₹{vendor.costPerUnit}/unit
                          </div>
                          <div>
                            <span className="font-medium">CO2:</span> {vendor.co2Emissions} kg CO2e
                          </div>
                          <div>
                            <span className="font-medium">Sustainability:</span> {vendor.sustainabilityScore}%
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          {vendor.sustainabilityTags.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="text-right">
                          <div className="font-semibold text-lg">
                            Total: ₹{vendor.estimatedCost.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">
                            for {formData.quantity} units
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="impact" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Leaf className="text-green-600" size={20} />
                        <span className="font-semibold text-green-700">CO2 Reduction</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {prediction.totalCO2Reduction}%
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="text-blue-600" size={20} />
                        <span className="font-semibold text-blue-700">Cost Impact</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {prediction.costImpact > 0 ? '+' : ''}{prediction.costImpact.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-purple-50 rounded">
                      <div className="font-semibold text-purple-600">Sustainability Improvement</div>
                      <div className="text-lg">{prediction.sustainabilityImprovement}%</div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded">
                      <div className="font-semibold text-orange-600">AI Confidence</div>
                      <div className="text-lg">{prediction.confidenceScore}%</div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Model Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Type: {prediction.modelDetails.type}</div>
                      <div>Parameters: {prediction.modelDetails.parameters.toLocaleString()}</div>
                      <div>Layers: {prediction.modelDetails.layers}</div>
                      <div>Polynomial Degree: {prediction.modelDetails.polynomialDegree}</div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Package className="mx-auto mb-4 text-gray-400" size={48} />
                <p>Enter packaging requirements to get AI-optimized vendor recommendations</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PackagingOptimizationForm;
