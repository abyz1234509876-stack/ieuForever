/**
 * ieuForever - Student & Staff Visualization
 * Data Source: totaldata.json
 * Updated: 3200px width, horizontal X-axis labels (smaller).
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

function titleize(key) {
  return key.replace(/^(.)/, c => c.toUpperCase());
}

function clearChart() {
  d3.select('#chart').html('');
}

function init() {
  d3.json(config.dataFile).then(data => {
    const sortedData = data.sort((a, b) => a.academic_year.localeCompare(b.academic_year));

    const studentData = sortedData.map(d => ({
      year: d.academic_year,
      vocational: d.students ? +d.students.vocational.total : 0,
      bachelor:   d.students ? +d.students.bachelor.total : 0,
      master:     d.students ? +d.students.master.total : 0,
      phd:        d.students ? +d.students.phd.total : 0
    }));

    const staffData = sortedData.map(d => ({
      year: d.academic_year,
      totalStaff: d.staff ? +d.staff.total.total : 0
    }));

    clearChart();
    drawChart(studentData, staffData);
  }).catch(err => console.error("Error loading totaldata.json:", err));
}

function drawChart(students, staff) {
  const font = "'Bricolage Grotesque', sans-serif";
  const margin = { top: 60, right: 50, bottom: 150, left: 70 };
  
  // 1. Updated width to 3200
  const W = 3200; 
  const H = 650; 
  const w = W - margin.left - margin.right;
  const h = H - margin.top - margin.bottom;

  const svg = d3.select('#chart').append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('width', W)
    .style('font-family', font)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

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

  // Grid Lines
  svg.append('g')
    .attr('class', 'grid')
    .selectAll('line')
    .data(y.ticks(8))
    .join('line')
    .attr('x1', 0)
    .attr('x2', w)
    .attr('y1', d => y(d))
    .attr('y2', d => y(d))
    .attr('stroke', 'rgba(0, 0, 0, 0.1)')
    .attr('stroke-dasharray', '5,5');

  const areaGenerator = (key) => d3.area()
    .x(d => x(d.year))
    .y0(h) 
    .y1(d => y(d[key]))
    .curve(d3.curveBasis);

  const renderOrder = ['bachelor', 'vocational', 'master', 'phd'];

  svg.selectAll('.layer')
    .data(renderOrder)
    .join('path')
    .attr('class', 'layer')
    .attr('d', key => areaGenerator(key)(students))
    .attr('fill', key => config.colors[key])
    .attr('opacity', 0.8) 
    .attr('stroke', key => config.colors[key])
    .attr('stroke-width', 1);

  svg.selectAll('.staff-circle')
    .data(staff)
    .join('circle')
    .attr('class', 'staff-circle')
    .attr('cx', d => x(d.year))
    .attr('cy', h + 155) 
    .attr('r', d => rScale(d.totalStaff))
    .attr('fill', config.colors.staffCircle)
    .attr('stroke', '#E65100')
    .attr('stroke-width', 0.5);

  const yAxis = svg.append('g')
    .call(d3.axisLeft(y).ticks(8).tickFormat(d => d.toLocaleString()));
  
  yAxis.select('.domain').attr('stroke', '#333').attr('stroke-width', 1.5);
  yAxis.selectAll('text').attr('fill', '#666').attr('font-size', '11px');

  svg.append('line')
    .attr('x1', 0).attr('x2', w).attr('y1', h).attr('y2', h)
    .attr('stroke', '#333').attr('stroke-width', 1.5);

  // 2. X-Axis: Labels are now horizontal (no rotation) and smaller
  const xAxis = svg.append('g')
    .attr('transform', `translate(0,${h})`)
    .call(d3.axisBottom(x).tickSize(0)); 
  
  xAxis.select('.domain').remove();
  xAxis.selectAll('text')
    .attr('fill', 'rgba(0,0,0,0.55)')
    .attr('font-size', '9px') // Smaller font
    .attr('dy', '1.5em')
    .attr('text-anchor', 'middle'); // Centered under the point
}

init();