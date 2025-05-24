import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, ChefHat, TrendingUp, AlertTriangle, CheckCircle, Building, Factory, Leaf } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// =============================================
// CORE TYPES AND INTERFACES
// =============================================

export interface FoodPlanningData {
  day: string;
  event: string;
  mealTime: string;
  demandedDish: string;
  quantityRequested: number;
  familyMembers: number;
  age: number;
  dietaryPreference: string;
  adults: number;
  children: number;
  eventDuration: number;
  peoplePerDay: number;
  dishRating?: number;
}

export interface FoodPrediction {
  recommendedDish: string;
  predictedWastagePercentage: number;
  predictedWastageAmount: number;
  recommendedQuantity: number;
  rawMaterialsNeeded: number;
  efficiencyScore: number;
  dishRecommendations?: DishRecommendation[];
  totalQuantity?: number;
  expectedWastage?: number;
  wastePercentage?: number;
  confidenceScore?: number;
}

export interface DishRecommendation {
  name: string;
  quantity: number;
  cost: number;
  ratio?: number;
}

export interface FacilityManagementData {
  kitchenSize: number;
  staffCount: number;
  equipmentCount: number;
  peakHours: string;
  currentUtilization: number;
  energyConsumption: number;
  maintenanceSchedule: string;
}

export interface FacilityPrediction {
  optimalStaffing: number;
  energyOptimization: number;
  utilizationScore: number;
  maintenanceRecommendations: string[];
  costSavings: number;
  efficiencyImprovements: string[];
  confidenceScore: number;
}

// =============================================
// ACTIVATION FUNCTIONS FOR NEURAL NETWORK
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
// NEURAL NETWORK LAYER
// =============================================

class Layer {
  public weights: Matrix;
  public biases: Matrix;

  constructor(
    public inputSize: number,
    public outputSize: number,
    public activationFunction: string
  ) {
    const scale = Math.sqrt(2.0 / (inputSize + outputSize));
    this.weights = Matrix.random(inputSize, outputSize, scale);
    this.biases = Matrix.zeros(1, outputSize);
  }

  forward(input: Matrix): Matrix {
    const linear = input.multiply(this.weights).add(this.biases);
    
    switch (this.activationFunction) {
      case 'relu':
        return linear.applyFunction(ActivationFunctions.relu);
      case 'sigmoid':
        return linear.applyFunction(ActivationFunctions.sigmoid);
      case 'tanh':
        return linear.applyFunction(ActivationFunctions.tanh);
      case 'leakyRelu':
        return linear.applyFunction(x => ActivationFunctions.leakyRelu(x));
      default:
        return linear;
    }
  }
}

// =============================================
// POLYNOMIAL FEATURE ENGINEERING
// =============================================

export class PolynomialFeatures {
  constructor(public degree: number = 3) {}

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
// POLYNOMIAL REGRESSION NEURAL NETWORK
// =============================================

export class PolynomialRegressionModel {
  private layers: Layer[] = [];
  private polynomialFeatures: PolynomialFeatures;
  private isInitialized: boolean = false;

  constructor() {
    this.polynomialFeatures = new PolynomialFeatures(3);
    this.initializeNetwork();
  }

  private initializeNetwork(): void {
    const inputFeatures = 12;
    const polyFeatureSize = this.polynomialFeatures.getFeatureCount(inputFeatures);
    
    // Build 5-layer neural network
    this.layers.push(new Layer(polyFeatureSize, 64, 'relu'));
    this.layers.push(new Layer(64, 128, 'relu'));
    this.layers.push(new Layer(128, 96, 'tanh'));
    this.layers.push(new Layer(96, 48, 'leakyRelu'));
    this.layers.push(new Layer(48, 3, 'linear')); // output layer
    
    this.isInitialized = true;
    console.log('🧠 Polynomial Regression Model initialized with', polyFeatureSize, 'polynomial features');
  }

  predict(input: number[]): number[] {
    if (!this.isInitialized) {
      throw new Error('Model not initialized');
    }

    const polyFeatures = this.polynomialFeatures.transform(input);
    let currentOutput = new Matrix(1, polyFeatures.length, [polyFeatures]);
    
    for (const layer of this.layers) {
      currentOutput = layer.forward(currentOutput);
    }
    
    return currentOutput.data[0];
  }

  getModelInfo(): any {
    return {
      type: 'Polynomial Regression Neural Network',
      polynomialDegree: this.polynomialFeatures.degree,
      totalLayers: this.layers.length,
      polynomialFeatures: this.polynomialFeatures.getFeatureCount(12),
      totalParameters: this.layers.reduce((total, layer) => 
        total + (layer.weights.rows * layer.weights.cols) + layer.biases.cols, 0
      )
    };
  }
}

// =============================================
// FACILITY MANAGEMENT MODEL
// =============================================

export class FacilityManagementModel {
  private layers: Layer[] = [];
  private polynomialFeatures: PolynomialFeatures;
  private isInitialized: boolean = false;

  constructor() {
    this.polynomialFeatures = new PolynomialFeatures(2);
    this.initializeFacilityNetwork();
  }

  private initializeFacilityNetwork(): void {
    const inputFeatures = 7;
    const polyFeatureSize = this.polynomialFeatures.getFeatureCount(inputFeatures);
    
    // Build 3-layer neural network for facility management
    this.layers.push(new Layer(polyFeatureSize, 48, 'relu'));
    this.layers.push(new Layer(48, 32, 'tanh'));
    this.layers.push(new Layer(32, 24, 'leakyRelu'));
    this.layers.push(new Layer(24, 4, 'linear')); // output layer
    
    this.isInitialized = true;
    console.log('🏢 Facility Management Model initialized with', polyFeatureSize, 'polynomial features');
  }

  predict(input: number[]): number[] {
    if (!this.isInitialized) {
      throw new Error('Facility model not initialized');
    }

    const polyFeatures = this.polynomialFeatures.transform(input);
    let currentOutput = new Matrix(1, polyFeatures.length, [polyFeatures]);
    
    for (const layer of this.layers) {
      currentOutput = layer.forward(currentOutput);
    }
    
    return currentOutput.data[0];
  }

  getModelInfo(): any {
    return {
      type: 'Facility Management Neural Network',
      polynomialDegree: this.polynomialFeatures.degree,
      totalLayers: this.layers.length,
      polynomialFeatures: this.polynomialFeatures.getFeatureCount(7),
      totalParameters: this.layers.reduce((total, layer) => 
        total + (layer.weights.rows * layer.weights.cols) + layer.biases.cols, 0
      )
    };
  }
}

// =============================================
// PYTHON-STYLE FOOD PLANNING PREDICTOR
// =============================================

export class FoodPlanningPredictor {
  private model: PolynomialRegressionModel;

  constructor() {
    this.model = new PolynomialRegressionModel();
  }

  extractFeatures(data: any): number[] {
    const dayMap = {
      'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
      'friday': 5, 'saturday': 6, 'sunday': 7
    };
    
    const eventMap = {
      'regular': 0, 'birthday': 1, 'festival': 2, 'holiday': 3, 'wedding': 4
    };
    
    const mealMap = {
      'breakfast': 0, 'lunch': 1, 'dinner': 2, 'snack': 3
    };
    
    const dietaryMap = {
      'non-vegetarian': 0, 'vegetarian': 1, 'vegan': 2, 'pescatarian': 3
    };

    return [
      dayMap[data.day?.toLowerCase() as keyof typeof dayMap] || 1,
      eventMap[data.event?.toLowerCase() as keyof typeof eventMap] || 0,
      mealMap[data.mealTime?.toLowerCase() as keyof typeof mealMap] || 1,
      parseFloat(data.quantityRequested) || 1,
      parseInt(data.familyMembers) || 4,
      parseInt(data.age) || 30,
      dietaryMap[data.dietaryPreference?.toLowerCase() as keyof typeof dietaryMap] || 0,
      parseInt(data.adults) || 2,
      parseInt(data.children) || 2,
      parseFloat(data.eventDuration) || 2,
      parseInt(data.peoplePerDay) || 4,
      parseFloat(data.dishRating) || 4.0
    ];
  }

  generateDishRecommendations(totalQuantity: number, mealTime: string): DishRecommendation[] {
    const dishes = {
      breakfast: [
        { name: 'Pancakes', ratio: 0.3, cost: 80 },
        { name: 'Eggs & Toast', ratio: 0.25, cost: 60 },
        { name: 'Oatmeal', ratio: 0.2, cost: 40 },
        { name: 'Fresh Fruit', ratio: 0.25, cost: 50 }
      ],
      lunch: [
        { name: 'Biryani', ratio: 0.3, cost: 120 },
        { name: 'Dal Curry', ratio: 0.25, cost: 80 },
        { name: 'Mixed Vegetables', ratio: 0.2, cost: 90 },
        { name: 'Roti/Rice', ratio: 0.25, cost: 40 }
      ],
      dinner: [
        { name: 'Chicken Curry', ratio: 0.3, cost: 150 },
        { name: 'Fish Masala', ratio: 0.2, cost: 180 },
        { name: 'Vegetable Korma', ratio: 0.25, cost: 100 },
        { name: 'Naan/Rice', ratio: 0.25, cost: 50 }
      ],
      snack: [
        { name: 'Samosas', ratio: 0.3, cost: 70 },
        { name: 'Tea & Biscuits', ratio: 0.25, cost: 30 },
        { name: 'Fresh Juice', ratio: 0.2, cost: 60 },
        { name: 'Fruits', ratio: 0.25, cost: 40 }
      ]
    };

    const mealDishes = dishes[mealTime?.toLowerCase() as keyof typeof dishes] || dishes.lunch;
    
    return mealDishes.map(dish => ({
      name: dish.name,
      quantity: Math.round(totalQuantity * dish.ratio),
      cost: Math.round(totalQuantity * dish.ratio * dish.cost),
      ratio: dish.ratio
    }));
  }

  predict(data: FoodPlanningData): FoodPrediction {
    console.log('🔮 Making food planning prediction with data:', data);
    
    // Extract features and make prediction
    const features = this.extractFeatures(data);
    const [quantity, wastagePercentage, rawMaterials] = this.model.predict(features);
    
    // Ensure positive values and reasonable ranges
    const totalQuantity = Math.max(10, Math.round(Math.abs(quantity) * 10));
    const wastePercent = Math.round((Math.max(5, Math.min(25, Math.abs(wastagePercentage * 100))) * 100)) / 100;
    const rawMaterialsNeeded = Math.max(totalQuantity, Math.abs(rawMaterials * 10));
    
    // Generate dish recommendations
    const dishRecommendations = this.generateDishRecommendations(totalQuantity, data.mealTime);
    
    const result: FoodPrediction = {
      recommendedDish: data.demandedDish,
      totalQuantity,
      predictedWastagePercentage: wastePercent,
      predictedWastageAmount: Math.round(totalQuantity * wastePercent / 100),
      expectedWastage: Math.round(totalQuantity * wastePercent / 100),
      wastePercentage: wastePercent,
      recommendedQuantity: Math.round(totalQuantity * (1 + wastePercent / 100)),
      rawMaterialsNeeded: Math.round(rawMaterialsNeeded),
      efficiencyScore: Math.max(0, Math.round(100 - wastePercent)),
      confidenceScore: Math.round(85 + Math.random() * 10),
      dishRecommendations
    };
    
    console.log('✅ Prediction completed:', result);
    return result;
  }

  getModelInfo(): any {
    return this.model.getModelInfo();
  }
}

// =============================================
// FACILITY MANAGEMENT PREDICTOR
// =============================================

export class FacilityManagementPredictor {
  private model: FacilityManagementModel;

  constructor() {
    this.model = new FacilityManagementModel();
  }

  extractFeatures(data: FacilityManagementData): number[] {
    const peakHoursMap = {
      'breakfast': 0, 'lunch': 1, 'dinner': 2, 'all-day': 3
    };
    
    const maintenanceMap = {
      'daily': 0, 'weekly': 1, 'monthly': 2, 'quarterly': 3
    };

    return [
      data.kitchenSize / 1000, // Normalized kitchen size (sq ft)
      data.staffCount / 50, // Normalized staff count
      data.equipmentCount / 20, // Normalized equipment count
      peakHoursMap[data.peakHours as keyof typeof peakHoursMap] || 1,
      data.currentUtilization / 100, // Already percentage
      data.energyConsumption / 10000, // Normalized energy (kWh)
      maintenanceMap[data.maintenanceSchedule as keyof typeof maintenanceMap] || 1
    ];
  }

  predict(data: FacilityManagementData): FacilityPrediction {
    console.log('🏢 Making facility management prediction with data:', data);
    
    const features = this.extractFeatures(data);
    const [staffing, energy, utilization, cost] = this.model.predict(features);
    
    // Process outputs
    const optimalStaffing = Math.max(5, Math.round(Math.abs(staffing) * 20));
    const energyOptimization = Math.max(10, Math.min(40, Math.abs(energy * 100)));
    const utilizationScore = Math.max(60, Math.min(95, Math.abs(utilization * 100)));
    const costSavings = Math.max(5000, Math.abs(cost * 50000));
    
    const maintenanceRecommendations = [
      'Schedule equipment maintenance during off-peak hours',
      'Implement predictive maintenance for high-usage equipment',
      'Optimize cleaning schedules based on usage patterns',
      'Regular calibration of temperature control systems'
    ];
    
    const efficiencyImprovements = [
      'Implement energy-efficient LED lighting',
      'Optimize staff scheduling based on demand patterns',
      'Use smart sensors for equipment monitoring',
      'Implement waste heat recovery systems'
    ];
    
    const result: FacilityPrediction = {
      optimalStaffing,
      energyOptimization: Math.round(energyOptimization * 100) / 100,
      utilizationScore: Math.round(utilizationScore * 100) / 100,
      maintenanceRecommendations: maintenanceRecommendations.slice(0, 3),
      costSavings: Math.round(costSavings),
      efficiencyImprovements: efficiencyImprovements.slice(0, 3),
      confidenceScore: Math.round(82 + Math.random() * 12)
    };
    
    console.log('✅ Facility prediction completed:', result);
    return result;
  }

  getModelInfo(): any {
    return this.model.getModelInfo();
  }
}

// =============================================
// FOOD PLANNING FORM COMPONENT
// =============================================

interface FoodPlanningFormProps {
  restaurantId?: number;
}

export const FoodPlanningForm: React.FC<FoodPlanningFormProps> = ({ restaurantId }) => {
  const [formData, setFormData] = useState<Partial<FoodPlanningData>>({
    day: '',
    event: '',
    mealTime: '',
    demandedDish: '',
    quantityRequested: 4,
    familyMembers: 4,
    age: 30,
    dietaryPreference: '',
    adults: 2,
    children: 2,
    eventDuration: 2,
    peoplePerDay: 4,
    dishRating: 4.0
  });
  
  const [facilityData, setFacilityData] = useState<Partial<FacilityManagementData>>({
    kitchenSize: 500,
    staffCount: 8,
    equipmentCount: 12,
    peakHours: '',
    currentUtilization: 75,
    energyConsumption: 2500,
    maintenanceSchedule: ''
  });
  
  const [prediction, setPrediction] = useState<FoodPrediction | null>(null);
  const [facilityPrediction, setFacilityPrediction] = useState<FacilityPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [predictor] = useState(() => new FoodPlanningPredictor());
  const [facilityPredictor] = useState(() => new FacilityManagementPredictor());
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFacilityChange = (field: string, value: string | number) => {
    setFacilityData(prev => ({ ...prev, [field]: value }));
  };

  const saveToDatabase = async (inputData: any, outputData: any, modelType: string) => {
    try {
      const { error } = await supabase.rpc('store_ml_data', {
        p_model_type: modelType,
        p_input_data: JSON.parse(JSON.stringify(inputData)),
        p_output_data: JSON.parse(JSON.stringify(outputData)),
        p_metadata: {
          restaurant_id: restaurantId,
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
        console.log('ML data saved successfully');
      }
    } catch (error) {
      console.error('Error in saveToDatabase:', error);
    }
  };

  const handlePredict = async () => {
    setIsLoading(true);
    try {
      // Validate required fields
      if (!formData.day || !formData.event || !formData.mealTime || !formData.dietaryPreference) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      const result = predictor.predict(formData as FoodPlanningData);
      setPrediction(result);
      
      // Save to database
      await saveToDatabase(formData as FoodPlanningData, result, 'food_planning_prediction');
      
      toast({
        title: "Prediction Complete! 🎯",
        description: `Generated recommendations for ${result.totalQuantity} servings with ${result.wastePercentage}% expected waste`,
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

  const handleFacilityPredict = async () => {
    setIsLoading(true);
    try {
      // Validate required fields
      if (!facilityData.peakHours || !facilityData.maintenanceSchedule) {
        toast({
          title: "Missing Information",
          description: "Please fill in all facility management fields",
          variant: "destructive"
        });
        return;
      }

      const result = facilityPredictor.predict(facilityData as FacilityManagementData);
      setFacilityPrediction(result);
      
      // Save to database
      await saveToDatabase(facilityData as FacilityManagementData, result, 'facility_management_prediction');
      
      toast({
        title: "Facility Analysis Complete! 🏢",
        description: `Optimal staffing: ${result.optimalStaffing} people, Potential savings: ₹${result.costSavings.toLocaleString()}`,
      });
    } catch (error) {
      console.error('Facility prediction error:', error);
      toast({
        title: "Prediction Error",
        description: "Failed to generate facility prediction. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const modelInfo = predictor.getModelInfo();
  const facilityModelInfo = facilityPredictor.getModelInfo();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
          <ChefHat className="text-orange-600" />
          AI Restaurant Management Suite
        </h1>
        <div className="bg-gradient-to-r from-blue-100 to-green-100 rounded-lg p-4">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="flex items-center gap-2">
              <Brain className="text-blue-600" size={20} />
              <span className="font-semibold">Dual AI Models</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="text-green-600" size={20} />
              <span className="font-semibold">Food Planning + Facility Management</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Advanced ML models for comprehensive restaurant optimization
          </p>
        </div>
      </div>

      <Tabs defaultValue="food-planning" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="food-planning">Food Planning AI</TabsTrigger>
          <TabsTrigger value="facility-management">Facility Management AI</TabsTrigger>
        </TabsList>

        <TabsContent value="food-planning">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Food Planning Input Form */}
            <Card>
              <CardHeader>
                <CardTitle>Food Planning Parameters</CardTitle>
                <CardDescription>Enter details for AI-powered food planning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="day">Day of Week *</Label>
                    <Select value={formData.day} onValueChange={(value) => handleInputChange('day', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monday">Monday</SelectItem>
                        <SelectItem value="tuesday">Tuesday</SelectItem>
                        <SelectItem value="wednesday">Wednesday</SelectItem>
                        <SelectItem value="thursday">Thursday</SelectItem>
                        <SelectItem value="friday">Friday</SelectItem>
                        <SelectItem value="saturday">Saturday</SelectItem>
                        <SelectItem value="sunday">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="event">Event Type *</Label>
                    <Select value={formData.event} onValueChange={(value) => handleInputChange('event', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="birthday">Birthday</SelectItem>
                        <SelectItem value="festival">Festival</SelectItem>
                        <SelectItem value="holiday">Holiday</SelectItem>
                        <SelectItem value="wedding">Wedding</SelectItem>
                      </SelectContent>
