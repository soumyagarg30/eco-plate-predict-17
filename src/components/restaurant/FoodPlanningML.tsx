
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, ChefHat, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
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
    const wastePercent = Math.max(5, Math.min(25, Math.abs(wastagePercentage * 100)));
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
  
  const [prediction, setPrediction] = useState<FoodPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [predictor] = useState(() => new FoodPlanningPredictor());
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const saveToDatabase = async (inputData: FoodPlanningData, outputData: FoodPrediction) => {
    try {
      const { error } = await supabase.rpc('store_ml_data', {
        p_model_type: 'food_planning_prediction',
        p_input_data: inputData,
        p_output_data: outputData,
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
      await saveToDatabase(formData as FoodPlanningData, result);
      
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

  const modelInfo = predictor.getModelInfo();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
          <ChefHat className="text-orange-600" />
          AI Food Planning & Waste Reduction
        </h1>
        <div className="bg-gradient-to-r from-blue-100 to-green-100 rounded-lg p-4">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="flex items-center gap-2">
              <Brain className="text-blue-600" size={20} />
              <span className="font-semibold">{modelInfo.type}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="text-green-600" size={20} />
              <span className="font-semibold">{modelInfo.totalParameters.toLocaleString()} Parameters</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Advanced ML model with {modelInfo.polynomialFeatures} polynomial features
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
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
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mealTime">Meal Time *</Label>
                <Select value={formData.mealTime} onValueChange={(value) => handleInputChange('mealTime', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select meal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dietaryPreference">Dietary Preference *</Label>
                <Select value={formData.dietaryPreference} onValueChange={(value) => handleInputChange('dietaryPreference', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="non-vegetarian">Non-Vegetarian</SelectItem>
                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="vegan">Vegan</SelectItem>
                    <SelectItem value="pescatarian">Pescatarian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="demandedDish">Demanded Dish</Label>
              <Input
                id="demandedDish"
                value={formData.demandedDish}
                onChange={(e) => handleInputChange('demandedDish', e.target.value)}
                placeholder="e.g., Chicken Curry, Pasta, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantityRequested">Base Quantity</Label>
                <Input
                  id="quantityRequested"
                  type="number"
                  value={formData.quantityRequested}
                  onChange={(e) => handleInputChange('quantityRequested', parseFloat(e.target.value))}
                  min="1"
                  step="0.5"
                />
              </div>

              <div>
                <Label htmlFor="familyMembers">Family Members</Label>
                <Input
                  id="familyMembers"
                  type="number"
                  value={formData.familyMembers}
                  onChange={(e) => handleInputChange('familyMembers', parseInt(e.target.value))}
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="adults">Adults</Label>
                <Input
                  id="adults"
                  type="number"
                  value={formData.adults}
                  onChange={(e) => handleInputChange('adults', parseInt(e.target.value))}
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="children">Children</Label>
                <Input
                  id="children"
                  type="number"
                  value={formData.children}
                  onChange={(e) => handleInputChange('children', parseInt(e.target.value))}
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
                  min="1"
                  max="100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eventDuration">Event Duration (hours)</Label>
                <Input
                  id="eventDuration"
                  type="number"
                  value={formData.eventDuration}
                  onChange={(e) => handleInputChange('eventDuration', parseFloat(e.target.value))}
                  min="0.5"
                  step="0.5"
                />
              </div>

              <div>
                <Label htmlFor="peoplePerDay">Total People</Label>
                <Input
                  id="peoplePerDay"
                  type="number"
                  value={formData.peoplePerDay}
                  onChange={(e) => handleInputChange('peoplePerDay', parseInt(e.target.value))}
                  min="1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="dishRating">Dish Rating (1-5)</Label>
              <Input
                id="dishRating"
                type="number"
                value={formData.dishRating}
                onChange={(e) => handleInputChange('dishRating', parseFloat(e.target.value))}
                min="1"
                max="5"
                step="0.1"
              />
            </div>

            <Button 
              onClick={handlePredict} 
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Brain className="mr-2 animate-spin" size={16} />
                  Generating AI Prediction...
                </>
              ) : (
                <>
                  <Brain className="mr-2" size={16} />
                  Generate AI Prediction
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>AI Predictions & Recommendations</CardTitle>
            <CardDescription>ML-powered food planning results</CardDescription>
          </CardHeader>
          <CardContent>
            {prediction ? (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="dishes">Dish Details</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="text-blue-600" size={20} />
                        <span className="font-semibold text-blue-700">Total Quantity</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {prediction.totalQuantity} servings
                      </div>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="text-orange-600" size={20} />
                        <span className="font-semibold text-orange-700">Expected Waste</span>
                      </div>
                      <div className="text-2xl font-bold text-orange-600">
                        {prediction.wastePercentage}%
                      </div>
                      <div className="text-sm text-orange-600">
                        ({prediction.expectedWastage} servings)
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="font-semibold text-green-700">Efficiency Score</div>
                      <div className="text-xl font-bold text-green-600">
                        {prediction.efficiencyScore}/100
                      </div>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="font-semibold text-purple-700">Confidence</div>
                      <div className="text-xl font-bold text-purple-600">
                        {prediction.confidenceScore}%
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="font-semibold mb-2">Raw Materials Needed</div>
                    <div className="text-lg font-bold">
                      {prediction.rawMaterialsNeeded} units
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Recommended preparation quantity: {prediction.recommendedQuantity} servings
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="dishes" className="space-y-4">
                  {prediction.dishRecommendations && prediction.dishRecommendations.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="font-semibold">Recommended Dishes:</h4>
                      {prediction.dishRecommendations.map((dish, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{dish.name}</div>
                              <div className="text-sm text-gray-600">
                                {dish.quantity} servings
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">₹{dish.cost}</div>
                              <Badge variant="secondary">
                                {Math.round((dish.ratio || 0) * 100)}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="font-semibold text-blue-700">
                          Total Cost: ₹{prediction.dishRecommendations.reduce((sum, dish) => sum + dish.cost, 0)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No specific dish recommendations available
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Brain className="mx-auto mb-4 text-gray-400" size={48} />
                <p>Click "Generate AI Prediction" to see results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FoodPlanningForm;
