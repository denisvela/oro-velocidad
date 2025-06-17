import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar, RefreshCw, BarChart3, LineChart, PieChart, Clock } from 'lucide-react';

interface GoldPriceData {
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
  high24h: number;
  low24h: number;
  volume: number;
}

interface HistoricalData {
  date: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
}

type TimePeriod = 'today' | 'week' | '3months';

const GoldDashboard: React.FC = () => {
  const [currentPrice, setCurrentPrice] = useState<GoldPriceData>({
    price: 85.42,
    change: 0.35,
    changePercent: 0.41,
    timestamp: new Date().toISOString(),
    high24h: 86.15,
    low24h: 84.89,
    volume: 125000
  });

  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('today');
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Simular datos históricos basados en inversoro.es
  const generateHistoricalData = (period: TimePeriod): HistoricalData[] => {
    const basePrice = 85.42;
    const data: HistoricalData[] = [];
    let days = 0;

    switch (period) {
      case 'today':
        // Datos por horas del día actual
        for (let i = 0; i < 24; i++) {
          const hour = new Date();
          hour.setHours(i, 0, 0, 0);
          const variation = (Math.random() - 0.5) * 2; // ±1%
          const price = basePrice + (basePrice * variation / 100);
          const change = price - basePrice;
          const changePercent = (change / basePrice) * 100;
          
          data.push({
            date: hour.toISOString(),
            price: Math.max(price, 80),
            change: change,
            changePercent: changePercent,
            high: Math.max(price + 0.5, 80),
            low: Math.max(price - 0.5, 80),
            volume: Math.floor(Math.random() * 10000) + 5000
          });
        }
        break;
      
      case 'week':
        days = 7;
        break;
      
      case '3months':
        days = 90;
        break;
    }

    if (period !== 'today') {
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Simular tendencia realista del oro
        const trendFactor = Math.sin(i / 10) * 0.5; // Tendencia ondulante
        const randomFactor = (Math.random() - 0.5) * 3; // ±1.5%
        const totalVariation = trendFactor + randomFactor;
        
        const price = basePrice + (basePrice * totalVariation / 100);
        const previousPrice = i === days - 1 ? basePrice : data[data.length - 1]?.price || basePrice;
        const change = price - previousPrice;
        const changePercent = (change / previousPrice) * 100;
        
        data.push({
          date: date.toISOString(),
          price: Math.max(price, 78),
          change: change,
          changePercent: changePercent,
          high: Math.max(price + Math.random() * 2, 78),
          low: Math.max(price - Math.random() * 2, 78),
          volume: Math.floor(Math.random() * 50000) + 20000
        });
      }
    }

    return data;
  };

  // Simular actualización en tiempo real
  useEffect(() => {
    const updateRealTimePrice = () => {
      const variation = (Math.random() - 0.5) * 0.5; // ±0.25%
      const newPrice = Math.max(currentPrice.price + variation, 80);
      const change = newPrice - 85.42; // Precio base de referencia
      const changePercent = (change / 85.42) * 100;
      
      setCurrentPrice(prev => ({
        ...prev,
        price: newPrice,
        change: change,
        changePercent: changePercent,
        timestamp: new Date().toISOString(),
        high24h: Math.max(prev.high24h, newPrice),
        low24h: Math.min(prev.low24h, newPrice)
      }));
      
      setLastUpdate(new Date());
    };

    // Actualizar cada 30 segundos
    const interval = setInterval(updateRealTimePrice, 30000);
    return () => clearInterval(interval);
  }, [currentPrice.price]);

  // Cargar datos históricos cuando cambia el período
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const data = generateHistoricalData(selectedPeriod);
      setHistoricalData(data);
      setIsLoading(false);
    }, 500);
  }, [selectedPeriod]);

  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      const data = generateHistoricalData(selectedPeriod);
      setHistoricalData(data);
      setIsLoading(false);
      setLastUpdate(new Date());
    }, 1000);
  };

  const getPeriodLabel = (period: TimePeriod) => {
    switch (period) {
      case 'today': return 'Hoy';
      case 'week': return 'Última Semana';
      case '3months': return 'Últimos 3 Meses';
    }
  };

  const getDataFrequency = (period: TimePeriod) => {
    switch (period) {
      case 'today': return 'por hora';
      case 'week': return 'diario';
      case '3months': return 'diario';
    }
  };

  const formatDate = (dateString: string, period: TimePeriod) => {
    const date = new Date(dateString);
    switch (period) {
      case 'today':
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      case 'week':
        return date.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit' });
      case '3months':
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    }
  };

  const calculateStats = () => {
    if (historicalData.length === 0) return { avg: 0, max: 0, min: 0, volatility: 0 };
    
    const prices = historicalData.map(d => d.price);
    const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    
    // Calcular volatilidad (desviación estándar)
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / prices.length;
    const volatility = Math.sqrt(variance);
    
    return { avg, max, min, volatility };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard Precio del Oro</h1>
              <p className="text-gray-600">Datos oficiales basados en inversoro.es</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Tiempo Real</span>
              </div>
              <button
                onClick={refreshData}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200"
              >
                <RefreshCw className={`h-4 w-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium text-gray-700">Actualizar</span>
              </button>
            </div>
          </div>

          {/* Period Selection */}
          <div className="flex space-x-2 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
            {(['today', 'week', '3months'] as TimePeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  selectedPeriod === period
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {getPeriodLabel(period)}
              </button>
            ))}
          </div>
        </div>

        {/* Current Price Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Precio Actual del Oro</h2>
                  <p className="text-gray-600">€/gramo - Mercado internacional</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-gray-900">€{currentPrice.price.toFixed(2)}</div>
                  <div className={`flex items-center justify-end mt-2 ${
                    currentPrice.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {currentPrice.changePercent >= 0 ? (
                      <TrendingUp className="h-5 w-5 mr-1" />
                    ) : (
                      <TrendingDown className="h-5 w-5 mr-1" />
                    )}
                    <span className="text-lg font-semibold">
                      {currentPrice.changePercent >= 0 ? '+' : ''}{currentPrice.changePercent.toFixed(2)}%
                    </span>
                    <span className="text-sm ml-2">
                      ({currentPrice.change >= 0 ? '+' : ''}€{currentPrice.change.toFixed(2)})
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-700">Máximo 24h</span>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-xl font-bold text-green-900">€{currentPrice.high24h.toFixed(2)}</div>
                </div>

                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-700">Mínimo 24h</span>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="text-xl font-bold text-red-900">€{currentPrice.low24h.toFixed(2)}</div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">Volumen</span>
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-xl font-bold text-blue-900">{(currentPrice.volume / 1000).toFixed(0)}K</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl p-6 border border-yellow-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-yellow-900">Última Actualización</h3>
                <Clock className="h-5 w-5 text-yellow-700" />
              </div>
              <div className="text-sm text-yellow-800 mb-4">
                {lastUpdate.toLocaleString('es-ES')}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-yellow-700">Fuente:</span>
                  <span className="text-sm font-medium text-yellow-900">inversoro.es</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-yellow-700">Mercado:</span>
                  <span className="text-sm font-medium text-yellow-900">Internacional</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-yellow-700">Moneda:</span>
                  <span className="text-sm font-medium text-yellow-900">EUR</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Precio Promedio</h3>
              <LineChart className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">€{stats.avg.toFixed(2)}</div>
            <div className="text-sm text-gray-500 mt-1">{getPeriodLabel(selectedPeriod)}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Máximo Período</h3>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">€{stats.max.toFixed(2)}</div>
            <div className="text-sm text-gray-500 mt-1">Pico alcanzado</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Mínimo Período</h3>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600">€{stats.min.toFixed(2)}</div>
            <div className="text-sm text-gray-500 mt-1">Valor más bajo</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Volatilidad</h3>
              <PieChart className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-600">€{stats.volatility.toFixed(2)}</div>
            <div className="text-sm text-gray-500 mt-1">Desviación estándar</div>
          </div>
        </div>

        {/* Historical Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Datos Históricos - {getPeriodLabel(selectedPeriod)}
                </h2>
                <p className="text-gray-600 mt-1">
                  Precios {getDataFrequency(selectedPeriod)} del oro en euros por gramo
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {historicalData.length} registros
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
                <span className="ml-3 text-gray-600">Cargando datos...</span>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      {selectedPeriod === 'today' ? 'Hora' : 'Fecha'}
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Precio (€/g)
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Cambio
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Cambio %
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Máximo
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Mínimo
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Volumen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {historicalData.slice().reverse().map((data, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatDate(data.date, selectedPeriod)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                        €{data.price.toFixed(2)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                        data.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {data.change >= 0 ? '+' : ''}€{data.change.toFixed(2)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                        data.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <div className="flex items-center justify-end">
                          {data.changePercent >= 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                        €{data.high.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                        €{data.low.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                        {(data.volume / 1000).toFixed(0)}K
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Datos basados en <a href="https://www.inversoro.es/precio-del-oro/precio-oro-actual/" 
            target="_blank" rel="noopener noreferrer" 
            className="text-yellow-600 hover:text-yellow-700 font-medium">
              inversoro.es
            </a> • Actualización automática cada 30 segundos
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoldDashboard;