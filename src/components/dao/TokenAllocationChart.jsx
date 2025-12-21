
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TokenAllocation } from '@/entities/TokenAllocation';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';
import { Package } from 'lucide-react';
import EqoFlowLoader from '../layout/QuantumFlowLoader'; // Changed from QuantumFlowLoader to EqoFlowLoader

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f97316'];
const POOL_NAMES = {
  community_rewards: 'Community Rewards',
  dao_treasury: 'DAO Treasury',
  team_and_advisors: 'Team & Advisors',
  ecosystem_fund: 'Ecosystem Fund',
  public_private_sale: 'Public/Private Sale',
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    // Add null checks for all properties
    const totalAllocated = data?.total_allocated || 0;
    const amountDistributed = data?.amount_distributed || 0;
    const amountRemaining = data?.amount_remaining || 0;
    const poolName = data?.pool_name || '';
    const description = data?.description || '';
    
    return (
      <div className="p-3 bg-slate-900/80 backdrop-blur-sm border border-purple-500/30 rounded-lg text-white">
        <p className="font-bold text-lg">{POOL_NAMES[poolName] || poolName}</p>
        <p className="text-sm">{description}</p>
        <hr className="my-2 border-purple-500/20" />
        <p className="text-cyan-400">Total: {totalAllocated.toLocaleString()} $EQOFLO</p> {/* Changed $QFLOW to $EQOFLO */}
        <p className="text-red-400">Distributed: -{amountDistributed.toLocaleString()} $EQOFLO</p> {/* Changed $QFLOW to $EQOFLO */}
        <p className="text-green-400">Remaining: {amountRemaining.toLocaleString()} $EQOFLO</p> {/* Changed $QFLOW to $EQOFLO */}
      </div>
    );
  }
  return null;
};

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;

  return (
    <g>
      <text x={cx} y={cy - 12} dy={8} textAnchor="middle" fill="#fff" className="font-bold text-lg">
        {payload.name}
      </text>
      <text x={cx} y={cy + 12} dy={8} textAnchor="middle" fill="#ccc" className="text-sm">
        {`${(percent * 100).toFixed(2)}%`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10} // This makes the slice "explode"
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="#fff"
        strokeWidth={2}
      />
    </g>
  );
};


export default function TokenAllocationChart() {
  const [allocations, setAllocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    const fetchAllocations = async () => {
      try {
        const data = await TokenAllocation.list();
        
        console.log('Raw TokenAllocation data:', data); // Debug log
        
        // --- DEDUPLICATION LOGIC (FIXED) ---
        // Use a Map to store only the most recent record for each pool_name
        const uniqueAllocations = new Map();
        data.forEach(item => {
          const existingItem = uniqueAllocations.get(item.pool_name);
          // Prioritize the record with the most recent updated_date to get the latest version
          if (!existingItem || new Date(item.updated_date) > new Date(existingItem.updated_date)) {
            uniqueAllocations.set(item.pool_name, item);
          }
        });

        // Convert the map back to an array for rendering
        let processedData = Array.from(uniqueAllocations.values()).map(item => ({
          ...item,
          amount_remaining: (item?.total_allocated || 0) - (item?.amount_distributed || 0),
        }));
        
        console.log('Processed TokenAllocation data:', processedData); // Debug log
        
        // Optional: Sort the data to maintain a consistent order every time
        const order = ['community_rewards', 'dao_treasury', 'team_and_advisors', 'ecosystem_fund', 'public_private_sale'];
        processedData.sort((a, b) => order.indexOf(a.pool_name) - order.indexOf(b.pool_name));
        
        setAllocations(processedData);
        // --- END OF DEDUPLICATION LOGIC ---

      } catch (error) {
        console.error("Failed to fetch token allocations:", error);
        setAllocations([]); // Set empty array on error
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllocations();
  }, []);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };
  
  const onPieLeave = () => {
    setActiveIndex(null);
  };


  if (isLoading) {
    return (
      <Card className="dark-card">
        <CardContent className="p-10 flex justify-center items-center">
          <EqoFlowLoader message="Loading Tokenomics..." /> {/* Changed QuantumFlowLoader to EqoFlowLoader */}
        </CardContent>
      </Card>
    );
  }

  // Add safety check for empty allocations
  if (allocations.length === 0) {
    return (
      <Card className="dark-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-400" />
            Live Tokenomics & Allocations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-10 text-center">
          <p className="text-gray-400">No allocation data available</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = allocations.map(a => ({
    name: POOL_NAMES[a.pool_name] || a.pool_name,
    value: a?.total_allocated || 0,
    pool_name: a.pool_name, // Include original pool_name for CustomTooltip
    description: a.description, // Include description for CustomTooltip
    total_allocated: a.total_allocated, // Include for CustomTooltip
    amount_distributed: a.amount_distributed, // Include for CustomTooltip
    amount_remaining: a.amount_remaining, // Include for CustomTooltip
  }));
  
  const totalTokens = 1000000000;

  return (
    <Card className="dark-card">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-400" />
          Live Tokenomics & Allocations
        </CardTitle>
        <p className="text-gray-400 text-sm">
          A real-time overview of the total $EQOFLO supply distribution. {/* Changed $QFLOW to $EQOFLO */}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="h-[400px] flex flex-col items-center">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    fill="#8884d8"
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legend Below Chart */}
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {chartData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-sm text-white">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            {allocations.map((alloc, index) => {
              const totalAllocated = alloc?.total_allocated || 0;
              const amountDistributed = alloc?.amount_distributed || 0;
              const percentageDistributed = totalAllocated > 0 ? (amountDistributed / totalAllocated) * 100 : 0;
              
              return (
                <div key={alloc.id} className="p-3 bg-black/20 border border-purple-500/10 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-white flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      {POOL_NAMES[alloc.pool_name] || alloc.pool_name}
                    </span>
                    <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                      {((totalAllocated / totalTokens) * 100).toFixed(2)}% of Total Supply
                    </Badge>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2.5 my-2">
                    <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${percentageDistributed}%` }}></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Distributed: {amountDistributed.toLocaleString()}</span>
                    <span>Remaining: {(totalAllocated - amountDistributed).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
