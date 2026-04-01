/**
 * ieuForever - Student & Staff Visualization
 * Data Source: totaldata.json
 * * Features:
 * - Superposed (overlay) student enrollment areas.
 * - Staff total numbers as circles under the baseline.
 * - Dashed horizontal grid lines behind the graph.
 * - Fixed 3200px width for horizontal page scrolling.
 * - Horizontal (non-rotated) X-axis labels with small font.
 */

const config = {
  dataFile: 'totaldata.json',
  studentKeys: ['vocational', 'bachelor', 'master', 'phd'],
  colors: {
    vocational: '#FFE0B2', 
    bachelor:   '#FFB74D', 
    master:     '#F57C00', 
    phd:        '#E65100',
    staffCircle: 'rgba(230, 81, 0, 0.3)' 
  }
};

/**
 * Clears the chart container before re-drawing.
 */
function clearChart() {
  d3.select('#chart').html('');
}

/**
 * Loads the combined dataset and prepares it for D3.
 */
function init() {
  d3.json(config.dataFile).then(data => {
    // Sort data chronologically by academic year
    const sortedData = data.sort((a, b) => a.academic_year.localeCompare(b.academic_year));

    // Map student data (handles nulls for years like 2025-2026)
    const studentData = sortedData.map(d => ({
      year: d.academic_year,
      vocational: d.students ? +d.students.vocational.total : 0,
      bachelor:   d.students ? +d.students.bachelor.total : 0,
      master:     d.students ? +d.students.master.total : 0,
      phd:        d.students ? +d.students.phd.total : 0
    }));

    // Map staff data
    const staffData = sortedData.map(d => ({
      year: d.academic_year,
      totalStaff: d.staff ? +d.staff.total.total : 0
    }));

    clearChart();
    drawChart(studentData, staffData);
  }).catch(err => console.error("Error loading totaldata.json:", err));
}

/**
 * Main D3 function to render the visualization.
 */
function drawChart(students, staff) {
  const font = "'Open Sans', sans-serif";
  
  // INCREASED margin.bottom and H to prevent circles from being cut off
  const margin = { top: 60, right: 50, bottom: 300, left: 70 };
  const W = 3200; 
  const H = 800; 
  
  const w = W - margin.left - margin.right;
  const h = H - margin.top - margin.bottom;

  // --- MANUALLY ADJUST DISTANCES HERE ---
  const circleOffset = 150;  // Pixels below the baseline
  const labelOffset = "1.5em"; // Vertical displacement for year text
  // --------------------------------------

  const svg = d3.select('#chart').append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('width', W)
    .style('font-family', font)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Scales
  const x = d3.scalePoint()
    .domain(students.map(d => d.year))
    .range([0, w]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(students, d => Math.max(d.vocational, d.bachelor, d.master, d.phd))])
    .nice()
    .range([h, 0]);

  const rScale = d3.scaleSqrt()
    .domain([0, d3.max(staff, d => d.totalStaff)])
    .range([0, 60]); 

  // 1. Grid Lines (Dashed, behind the layers)
  svg.append('g')
    .selectAll('line')
    .data(y.ticks(8))
    .join('line')
    .attr('x1', 0).attr('x2', w)
    .attr('y1', d => y(d)).attr('y2', d => y(d))
    .attr('stroke', 'rgba(0, 0, 0, 0.1)')
    .attr('stroke-dasharray', '5,5');

  // 2. Student Area Layers (Overlay)
  const areaGenerator = (key) => d3.area()
    .x(d => x(d.year))
    .y0(h) 
    .y1(d => y(d[key]))
    .curve(d3.curveBasis);

  const renderOrder = ['bachelor', 'vocational', 'master', 'phd'];

  svg.selectAll('.layer')
    .data(renderOrder)
    .join('path')
    .attr('d', key => areaGenerator(key)(students))
    .attr('fill', key => config.colors[key])
    .attr('opacity', 0.8) 
    .attr('stroke', key => config.colors[key])
    .attr('stroke-width', 1);

  // 3. Staff Circles (Under the baseline)
  svg.selectAll('.staff-circle')
    .data(staff)
    .join('circle')
    .attr('cx', d => x(d.year))
    .attr('cy', h + circleOffset) 
    .attr('r', d => rScale(d.totalStaff))
    .attr('fill', config.colors.staffCircle)
    .attr('stroke', '#E65100')
    .attr('stroke-width', 0.5);

  // 4. Y-Axis
  const yAxis = svg.append('g')
    .call(d3.axisLeft(y).ticks(8).tickFormat(d => d.toLocaleString()));
  yAxis.select('.domain').attr('stroke', '#333').attr('stroke-width', 1.5);
  yAxis.selectAll('text').attr('fill', '#666').attr('font-size', '11px');

  // 5. Horizontal Baseline
  svg.append('line')
    .attr('x1', 0).attr('x2', w).attr('y1', h).attr('y2', h)
    .attr('stroke', '#333').attr('stroke-width', 1.5);

  // 6. X-Axis (Horizontal labels, smaller font)
  const xAxis = svg.append('g')
    .attr('transform', `translate(0,${h})`)
    .call(d3.axisBottom(x).tickSize(0)); 
  xAxis.select('.domain').remove();
  xAxis.selectAll('text')
    .attr('fill', 'rgba(0,0,0,0.55)')
    .attr('font-size', '9px') 
    .attr('dy', labelOffset)
    .attr('text-anchor', 'middle');
}

// Kick off the visualization
init();