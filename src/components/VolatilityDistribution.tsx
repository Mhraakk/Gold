import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface VolatilityDistributionProps {
  data?: number[];
  assetName?: string;
}

// Generate some realistic bell-curve-ish data for gold price percentage changes if no data provided
const generateMockData = () => {
  const data = [];
  const mean = 0.05; // slightly positive drift
  const stdDev = 1.2; // 1.2% daily std dev
  
  // Box-Muller transform
  for (let i = 0; i < 200; i++) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    data.push(z0 * stdDev + mean);
  }
  return data;
};

export default function VolatilityDistribution({ 
  data = generateMockData(), 
  assetName = "طلای آب‌شده" 
}: VolatilityDistributionProps) {
  const d3Container = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data || !d3Container.current || data.length === 0) return;

    // Clear previous render
    d3.select(d3Container.current).selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const width = d3Container.current.parentElement?.clientWidth || 400;
    const height = 250;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(d3Container.current)
      .attr('width', '100%')
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X axis: scale and draw
    const x = d3.scaleLinear()
      .domain([d3.min(data)! - 0.5, d3.max(data)! + 0.5])
      .range([0, innerWidth]);

    const xAxis = d3.axisBottom(x).ticks(8).tickFormat(d => d + '%');
    svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr('class', 'text-gray-500 text-[10px] font-mono')
      .selectAll('path, line')
      .attr('stroke', '#334155');

    // set the parameters for the histogram
    const histogram = d3.histogram<number, number>()
      .value(d => d)
      .domain(x.domain() as [number, number])
      .thresholds(x.ticks(40));

    // And apply this function to data to get the bins
    const bins = histogram(data);

    // Y axis: scale and draw
    const y = d3.scaleLinear()
      .range([innerHeight, 0])
      .domain([0, d3.max(bins, d => d.length)! * 1.2]);

    const yAxis = d3.axisLeft(y).ticks(5);
    svg.append('g')
      .call(yAxis)
      .attr('class', 'text-gray-500 text-[10px] font-mono')
      .selectAll('path, line')
      .attr('stroke', '#334155');

    // Add X axis label
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + margin.bottom - 5)
      .attr("fill", "#94a3b8")
      .style("font-size", "10px")
      .style("font-family", "sans-serif")
      .text("بازده روزانه (%)");

    // Calculate statistics
    const median = d3.median(data);
    const mean = d3.mean(data);
    const stdDev = d3.deviation(data) || 0;

    // Add standard deviation bands (Typical range)
    if (mean !== undefined && stdDev) {
      // Highlight the typical range (mean +/- 1 stdDev)
      svg.append('rect')
        .attr('x', x(mean - stdDev))
        .attr('y', 0)
        .attr('width', x(mean + stdDev) - x(mean - stdDev))
        .attr('height', innerHeight)
        .attr('fill', '#ffffff')
        .attr('opacity', 0.03);
        
      // Add text for typical range
      svg.append('text')
        .attr('x', x(mean - stdDev) + 5)
        .attr('y', 15)
        .attr('fill', '#64748b')
        .style('font-size', '9px')
        .style('font-family', 'sans-serif')
        .text('-1σ');

      svg.append('text')
        .attr('x', x(mean + stdDev) - 20)
        .attr('y', 15)
        .attr('fill', '#64748b')
        .style('font-size', '9px')
        .style('font-family', 'sans-serif')
        .text('+1σ');
    }

    // Add a defs element for the gradient
    const defs = svg.append("defs");
    
    // Gradient for typical bars
    const gradient = defs.append("linearGradient")
      .attr("id", "bar-gradient-typical")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#f59e0b") // amber-500
      .attr("stop-opacity", 0.8);
      
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#f59e0b")
      .attr("stop-opacity", 0.1);

    // Gradient for extreme bars
    const gradientExtreme = defs.append("linearGradient")
      .attr("id", "bar-gradient-extreme")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    
    gradientExtreme.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#ef4444") // red-500
      .attr("stop-opacity", 0.8);
      
    gradientExtreme.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#ef4444")
      .attr("stop-opacity", 0.1);

    // append the bar rectangles to the svg element
    svg.selectAll('rect.bar')
      .data(bins)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', 1)
      .attr('transform', d => `translate(${x(d.x0!)},${y(d.length)})`)
      .attr('width', d => Math.max(0, x(d.x1!) - x(d.x0!) - 1))
      .attr('height', d => innerHeight - y(d.length))
      .style('fill', d => {
        // Color extreme tails differently
        if (mean !== undefined && stdDev) {
          const barMid = (d.x0! + d.x1!) / 2;
          if (Math.abs(barMid - mean) > stdDev * 1.5) {
            return 'url(#bar-gradient-extreme)';
          }
        }
        return 'url(#bar-gradient-typical)';
      })
      .attr('rx', 2);

    // Add median line
    if (median !== undefined) {
      svg.append('line')
        .attr('x1', x(median))
        .attr('x2', x(median))
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#10b981') // emerald-500
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4');

      svg.append('text')
        .attr('x', x(median) + 5)
        .attr('y', 20)
        .attr('fill', '#10b981')
        .style('font-size', '10px')
        .style('font-family', 'mono')
        .text('میانه');
    }

  }, [data, d3Container]);

  return (
    <div className="glass-panel lux-card rounded-2xl p-5 border border-white/5 bg-[#0a0a0a] relative overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-display font-semibold text-white text-sm flex items-center gap-2">
            توزیع نوسانات
            <span className="text-[10px] text-amber-500 font-mono bg-amber-500/10 px-2 py-0.5 rounded-full">
              D3.js
            </span>
          </h3>
          <p className="text-[10px] text-gray-500 mt-1 font-sans">
            گستره حرکت قیمت روزانه {assetName}
          </p>
        </div>
        <div className="text-left text-[10px] text-gray-500 font-mono">
          <div className="flex items-center gap-1.5 justify-end mb-1">
            <span className="w-2 h-2 rounded bg-amber-500/80"></span>
            فراوانی بازده
          </div>
          <div className="flex items-center gap-1.5 justify-end mb-1">
            <span className="w-2 h-2 rounded bg-red-500/80"></span>
            نوسانات شدید (±۱.۵σ)
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <span className="w-2 h-0.5 bg-emerald-500 border border-emerald-500"></span>
            میانه نوسان
          </div>
        </div>
      </div>
      
      <div className="w-full relative" dir="ltr">
        <svg ref={d3Container} className="overflow-visible" />
      </div>
    </div>
  );
}
