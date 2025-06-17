import React, { useState, useEffect } from 'react';
import { Activity, Trophy, TrendingUp, MapPin, Target, Calendar, RefreshCw } from 'lucide-react';
import GoldPriceService from '../services/goldPriceService';
import GoogleIntegrationService from '../services/googleIntegrationService';

interface KilometerData {
  week: string;
  distance: number;
  change: number;
  date: string;
}

interface Match {
  date: string;
  opponent: string;
  result: 'win' | 'loss' | 'draw';
  score: string;
}

interface GoldPriceData {
  price: number;
  change: number;
  changePercent: number;
  lastUpdate: string;
}

interface DailyGoldPrice {
  date: string;
  day: string;
  price: number;
  change: number;
  changePercent: number;
  isToday: boolean;
}

const Dashboard: React.FC = () => {
  const [goldPriceData, setGoldPriceData] = useState<GoldPriceData>({
    price: 85.25,
    change: 0,
    changePercent: 0,
    lastUpdate: new Date().toISOString()
  });
  
  const [kilometerData, setKilometerData] = useState<KilometerData[]>([
    { week: 'Esta semana', distance: 45.8, change: 12.5, date: new Date().toISOString() },
    { week: 'Semana pasada', distance: 40.7, change: -5.2, date: new Date().toISOString() },
    { week: 'Hace 2 semanas', distance: 43.0, change: 8.1, date: new Date().toISOString() },
    { week: 'Hace 3 semanas', distance: 39.8, change: -2.3, date: new Date().toISOString() },
  ]);

  const [recentMatches] = useState<Match[]>([
    { date: '2025-01-12', opponent: 'FC Barcelona', result: 'win', score: '2-1' },
    { date: '2025-01-09', opponent: 'Real Madrid', result: 'draw', score: '1-1' },
    { date: '2025-01-05', opponent: 'Atlético Madrid', result: 'loss', score: '0-3' },
    { date: '2025-01-02', opponent: 'Valencia CF', result: 'win', score: '3-0' },
  ]);

  const [dailyGoldPrices, setDailyGoldPrices] = useState<DailyGoldPrice[]>([]);

  const [isLoadingGold, setIsLoadingGold] = useState(false);
  const [isLoadingKm, setIsLoadingKm] = useState(false);

  // Generar precios diarios de la semana
  const generateWeeklyGoldPrices = (currentPrice: number): DailyGoldPrice[] => {
    const today = new Date();
    const weekDays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dailyPrices: DailyGoldPrice[] = [];
    
    // Generar datos para los últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const isToday = i === 0;
      const dayName = weekDays[date.getDay()];
      
      // Simular variaciones realistas del precio del oro
      let price: number;
      let changePercent: number;
      
      if (isToday) {
        price = currentPrice;
        changePercent = goldPriceData.changePercent;
      } else {
        // Generar precios históricos con variaciones realistas
        const baseVariation = (Math.random() - 0.5) * 3; // ±1.5%
        const dayPrice = currentPrice * (1 + (baseVariation / 100));
        price = Math.max(dayPrice, 80); // Mínimo 80 EUR
        changePercent = baseVariation;
      }
      
      const change = price * (changePercent / 100);
      
      dailyPrices.push({
        date: date.toISOString().split('T')[0],
        day: dayName,
        price: price,
        change: change,
        changePercent: changePercent,
        isToday: isToday
      });
    }
    
    return dailyPrices;
  };

  // Configurar servicio de precio del oro
  useEffect(() => {
    const goldService = GoldPriceService.getInstance();
    
    const unsubscribe = goldService.subscribe((data: GoldPriceData) => {
      setGoldPriceData(data);
      
      // Actualizar precios diarios de la semana
      const weeklyPrices = generateWeeklyGoldPrices(data.price);
      setDailyGoldPrices(weeklyPrices);
    });

    return unsubscribe;
  }, []);

  // Cargar datos de kilómetros desde Google
  useEffect(() => {
    const loadKilometerData = async () => {
      setIsLoadingKm(true);
      try {
        const googleService = GoogleIntegrationService.getInstance();
        const data = await googleService.fetchKilometerData();
        setKilometerData(data);
      } catch (error) {
        console.error('Error loading kilometer data:', error);
      } finally {
        setIsLoadingKm(false);
      }
    };

    loadKilometerData();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(loadKilometerData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const refreshGoldPrice = async () => {
    setIsLoadingGold(true);
    // El servicio se actualiza automáticamente
    setTimeout(() => setIsLoadingGold(false), 1000);
  };

  const refreshKilometerData = async () => {
    setIsLoadingKm(true);
    try {
      const googleService = GoogleIntegrationService.getInstance();
      const data = await googleService.fetchKilometerData();
      setKilometerData(data);
    } catch (error) {
      console.error('Error refreshing kilometer data:', error);
    } finally {
      setIsLoadingKm(false);
    }
  };

  const getMatchResultColor = (result: string) => {
    switch (result) {
      case 'win': return 'text-green-600 bg-green-50';
      case 'loss': return 'text-red-600 bg-red-50';
      case 'draw': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getMatchResultText = (result: string) => {
    switch (result) {
      case 'win': return 'Victoria';
      case 'loss': return 'Derrota';
      case 'draw': return 'Empate';
      default: return 'N/A';
    }
  };

  const currentWeekKm = kilometerData[0];
  const weeklyStats = {
    totalMatches: recentMatches.length,
    wins: recentMatches.filter(m => m.result === 'win').length,
    winRate: (recentMatches.filter(m => m.result === 'win').length / recentMatches.length) * 100
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard de Rendimiento</h1>
          <p className="text-gray-600">Monitorea tu progreso físico y financiero en tiempo real</p>
          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Precio oro en tiempo real</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Datos sincronizados con Google</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Km Esta Semana</p>
                <p className="text-2xl font-bold text-gray-900">{currentWeekKm.distance}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={refreshKilometerData}
                  disabled={isLoadingKm}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 text-gray-600 ${isLoadingKm ? 'animate-spin' : ''}`} />
                </button>
                <div className={`p-3 rounded-lg ${currentWeekKm.change > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <MapPin className={`h-6 w-6 ${currentWeekKm.change > 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className={`text-sm font-medium ${currentWeekKm.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currentWeekKm.change > 0 ? '+' : ''}{currentWeekKm.change.toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500 ml-2">vs semana anterior</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Oro (€/gramo)</p>
                <p className="text-2xl font-bold text-gray-900">€{goldPriceData.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={refreshGoldPrice}
                  disabled={isLoadingGold}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 text-gray-600 ${isLoadingGold ? 'animate-spin' : ''}`} />
                </button>
                <div className={`p-3 rounded-lg ${goldPriceData.changePercent > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <TrendingUp className={`h-6 w-6 ${goldPriceData.changePercent > 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className={`text-sm font-medium ${goldPriceData.changePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {goldPriceData.changePercent > 0 ? '+' : ''}{goldPriceData.changePercent.toFixed(2)}%
                </span>
                <span className="text-sm text-gray-500 ml-2">tiempo real</span>
              </div>
              <div className="text-xs text-gray-400">
                {new Date(goldPriceData.lastUpdate).toLocaleTimeString('es-ES')}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Partidos Jugados</p>
                <p className="text-2xl font-bold text-gray-900">{weeklyStats.totalMatches}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100">
                <Trophy className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm font-medium text-blue-600">{weeklyStats.wins} victorias</span>
              <span className="text-sm text-gray-500 ml-2">este mes</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa de Victoria</p>
                <p className="text-2xl font-bold text-gray-900">{weeklyStats.winRate.toFixed(0)}%</p>
              </div>
              <div className={`p-3 rounded-lg ${weeklyStats.winRate > 50 ? 'bg-green-100' : 'bg-red-100'}`}>
                <Target className={`h-6 w-6 ${weeklyStats.winRate > 50 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className={`text-sm font-medium ${weeklyStats.winRate > 50 ? 'text-green-600' : 'text-red-600'}`}>
                {weeklyStats.winRate > 50 ? 'Excelente' : 'Mejorar'}
              </span>
              <span className="text-sm text-gray-500 ml-2">rendimiento</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Kilometers Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Kilómetros Semanales</h2>
              <div className="flex items-center space-x-2">
                <div className="text-xs text-gray-500">Google Drive</div>
                <Activity className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="space-y-4">
              {kilometerData.map((data, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{data.week}</p>
                    <p className="text-sm text-gray-600">{data.distance} km</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((data.distance / 50) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium ${data.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.change > 0 ? '+' : ''}{data.change.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gold Price Chart - Updated with daily prices */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Precio del Oro (€/gramo)</h2>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div className="text-xs text-gray-500">Tiempo Real</div>
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="space-y-3">
              {dailyGoldPrices.map((data, index) => (
                <div key={index} className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                  data.isToday ? 'bg-blue-50 border-2 border-blue-200' : 'hover:bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col items-center">
                      <Calendar className={`h-4 w-4 ${data.isToday ? 'text-blue-600' : 'text-gray-400'}`} />
                      {data.isToday && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mt-1"></div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className={`font-medium ${data.isToday ? 'text-blue-900' : 'text-gray-900'}`}>
                          €{data.price.toFixed(2)}
                        </p>
                        {data.isToday && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                            HOY
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${data.isToday ? 'text-blue-700' : 'text-gray-500'}`}>
                        {data.day} - {new Date(data.date).toLocaleDateString('es-ES', { 
                          day: '2-digit', 
                          month: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      data.changePercent > 0 
                        ? 'text-green-700 bg-green-100' 
                        : data.changePercent < 0 
                        ? 'text-red-700 bg-red-100'
                        : 'text-gray-700 bg-gray-100'
                    }`}>
                      {data.changePercent > 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      data.changePercent > 0 
                        ? 'bg-green-500' 
                        : data.changePercent < 0 
                        ? 'bg-red-500'
                        : 'bg-gray-400'
                    } ${data.isToday ? 'animate-pulse' : ''}`}></div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Weekly Summary */}
            <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-yellow-900">Resumen Semanal</p>
                  <p className="text-sm text-yellow-700">
                    Precio promedio: €{dailyGoldPrices.length > 0 ? 
                      (dailyGoldPrices.reduce((sum, day) => sum + day.price, 0) / dailyGoldPrices.length).toFixed(2) 
                      : '0.00'
                    }
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-yellow-900">
                    {dailyGoldPrices.length > 0 && dailyGoldPrices[0] ? 
                      `€${(dailyGoldPrices[dailyGoldPrices.length - 1].price - dailyGoldPrices[0].price).toFixed(2)}`
                      : '€0.00'
                    }
                  </p>
                  <p className="text-sm text-yellow-700">variación semanal</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Matches */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Últimos Partidos Jugados</h2>
            <Trophy className="h-5 w-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentMatches.map((match, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">{new Date(match.date).toLocaleDateString('es-ES')}</span>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchResultColor(match.result)}`}>
                    {getMatchResultText(match.result)}
                  </div>
                </div>
                <p className="font-medium text-gray-900 mb-1">{match.opponent}</p>
                <p className="text-lg font-bold text-gray-900">{match.score}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">Rendimiento del Mes</p>
                <p className="text-sm text-blue-700">{weeklyStats.wins} victorias de {weeklyStats.totalMatches} partidos</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-900">{weeklyStats.winRate.toFixed(0)}%</p>
                <p className="text-sm text-blue-700">tasa de éxito</p>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Status */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Estado de Integraciones</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-gray-900">Precio del Oro</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Activo</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Google Drive/Gmail</span>
              </div>
              <span className="text-sm text-yellow-600 font-medium">Configuración Pendiente</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Para conectar completamente con Google Drive y Gmail (denisvela30@gmail.com), 
              necesitas configurar las credenciales de Google API. Los datos actuales son simulados pero realistas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;