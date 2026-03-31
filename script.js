/**
 * ieuForever - Student Enrollment Overlay Chart (Static Version)
 * Features:
 * - Superposed (overlay) areas.
 * - Shades of orange palette.
 * - Fixed 2400px width for horizontal page scrolling.
 * - Left-aligned Y-axis and horizontal baseline.
 * - Hovering/Tooltips removed.
 */

const datasetConfigs = {
  students: {
    name: 'Students',
    file: 'ieuStudentsEnrolled.json',
    keys: ['vocational', 'bachelor', 'master', 'phd'],
    colors: {
      vocational: '#FFE0B2', 
      bachelor:   '#FFB74D', 
      master:     '#F57C00', 
      phd:        '#E65100', 
    },
    parse: jsonData => jsonData
      .filter(d => d.program_type === 'TOPLAM')
      .map(d => ({
        year: d.year,
        vocational: +d.vocational.total,
        bachelor:   +d.bachelor.total,
        master:     +d.master.total,
        phd:        +d.phd.total,
      }))
      .sort((a, b) => (a.year > b.year ? 1 : a.year < b.year ? -1 : 0)),
  }
};

function titleize(key) {
  return key.replace(/^(.)/, c => c.toUpperCase());
}

function clearChart() {
  d3.select('#chart').html('');
}

function loadDataset(datasetKey) {
  const config = datasetConfigs[datasetKey];
  if (!config) return;

  d3.json(config.file).then(jsonData => {
    const raw = config.parse(jsonData);
    clearChart();
    drawChart(raw, config);
  }).catch(err => {
    console.error(`Error loading ${config.file}:`, err);
  });
}

function drawChart(raw, config) {
  const font = "'Open Sans', sans-serif";
  const margin = { top: 60, right: 30, bottom: 50, left: 70 };
  
  const W = 2400; 
  const H = 500;
  const w = W - margin.left - margin.right;
  const h = H - margin.top - margin.bottom;

  const svg = d3.select('#chart').append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('width', W)
    .style('font-family', font)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scalePoint()
    .domain(raw.map(d => d.year))
    .range([0, w]);

  const maxIndividualValue = d3.max(raw, d => 
    Math.max(d.vocational, d.bachelor, d.master, d.phd)
  );
  
  const y = d3.scaleLinear()
    .domain([0, maxIndividualValue])
    .nice()
    .range([h, 0]);

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
    .attr('d', key => areaGenerator(key)(raw))
    .attr('fill', key => config.colors[key])
    .attr('opacity', 0.8) 
    .attr('stroke', key => config.colors[key])
    .attr('stroke-width', 1);

  // Y-Axis
  const yAxis = svg.append('g')
    .call(d3.axisLeft(y).ticks(8).tickFormat(d => d.toLocaleString()));
  
  yAxis.select('.domain').attr('stroke', '#333').attr('stroke-width', 1.5);
  yAxis.selectAll('text').attr('fill', '#666').attr('font-size', '11px');

  // Straight horizontal line at the bottom
  svg.append('line')
    .attr('x1', 0)
    .attr('x2', w)
    .attr('y1', h)
    .attr('y2', h)
    .attr('stroke', '#333')
    .attr('stroke-width', 1.5);

  // X-Axis
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

loadDataset('students');