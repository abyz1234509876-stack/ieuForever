/**
 * ieuForever - Student Enrollment Overlay + Staff Circles
 * Features:
 * - Superposed student enrollment areas.
 * - Staff total numbers as circles under the baseline.
 * - X-axis uses full "Academic Year" strings (e.g., 2001-2002).
 * - Standard lines only (no extra ticks).
 */

const config = {
  studentFile: 'ieuStudentsEnrolled.json',
  staffFile: 'ieuForeverData_staffRegistered.json',
  keys: ['vocational', 'bachelor', 'master', 'phd'],
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

/**
 * Loads both datasets and synchronizes the year format to "YYYY-YYYY".
 */
function init() {
  Promise.all([
    d3.json(config.studentFile),
    d3.json(config.staffFile)
  ]).then(([studentData, staffData]) => {
    // Parse Student Data: Map numerical year 2001 to string "2001-2002"
    const parsedStudents = studentData
      .filter(d => d.program_type === 'TOPLAM')
      .map(d => ({
        year: `${d.year}-${d.year + 1}`, 
        vocational: +d.vocational.total,
        bachelor:   +d.bachelor.total,
        master:     +d.master.total,
        phd:        +d.phd.total,
      }))
      .sort((a, b) => a.year.localeCompare(b.year));

    // Parse Staff Data: Use the original "Academic Year" string
    const parsedStaff = staffData.map(d => ({
      year: d["Academic Year"], 
      totalStaff: +d["Genel Toplam_T"]
    }));

    clearChart();
    drawChart(parsedStudents, parsedStaff);
  }).catch(err => console.error("Error loading data:", err));
}

function drawChart(students, staff) {
  const font = "'Open Sans', sans-serif";
  const margin = { top: 60, right: 50, bottom: 150, left: 70 };
  
  const W = 2400; // Fixed width for horizontal page scroll
  const H = 650; 
  const w = W - margin.left - margin.right;
  const h = H - margin.top - margin.bottom;

  const svg = d3.select('#chart').append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('width', W)
    .style('font-family', font)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Shared X-Axis Domain using academic year strings
  const allYears = Array.from(new Set([
    ...students.map(d => d.year),
    ...staff.map(d => d.year)
  ])).sort((a, b) => a.localeCompare(b));

  const x = d3.scalePoint()
    .domain(allYears)
    .range([0, w]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(students, d => Math.max(d.vocational, d.bachelor, d.master, d.phd))])
    .nice()
    .range([h, 0]);

  // Staff Circle Scale (Radius)
  const maxStaff = d3.max(staff, d => d.totalStaff);
  const rScale = d3.scaleSqrt()
    .domain([0, maxStaff])
    .range([0, 60]); 

  // 1. Draw Student Area Layers (Overlay)
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

  // 2. Draw Staff Circles positioned under the baseline
  svg.selectAll('.staff-circle')
    .data(staff)
    .join('circle')
    .attr('class', 'staff-circle')
    .attr('cx', d => x(d.year))
    .attr('cy', h + 85) 
    .attr('r', d => rScale(d.totalStaff))
    .attr('fill', config.colors.staffCircle)
    .attr('stroke', '#E65100')
    .attr('stroke-width', 0.5);

  // 3. Y-Axis
  const yAxis = svg.append('g')
    .call(d3.axisLeft(y).ticks(8).tickFormat(d => d.toLocaleString()));
  
  yAxis.select('.domain').attr('stroke', '#333').attr('stroke-width', 1.5);
  yAxis.selectAll('text').attr('fill', '#666').attr('font-size', '11px');

  // 4. Baseline (Horizontal Line)
  svg.append('line')
    .attr('x1', 0).attr('x2', w).attr('y1', h).attr('y2', h)
    .attr('stroke', '#333').attr('stroke-width', 1.5);

  // 5. X-Axis (Using tickSize(0) as per "existing lines only" instruction)
  const xAxis = svg.append('g')
    .attr('transform', `translate(0,${h})`)
    .call(d3.axisBottom(x).tickSize(0)); 
  
  xAxis.select('.domain').remove();
  xAxis.selectAll('text')
    .attr('fill', 'rgba(0,0,0,0.55)')
    .attr('font-size', '11px')
    .attr('dy', '1.5em')
    .attr('transform', 'rotate(-30)')
    .attr('text-anchor', 'end');
}

init();