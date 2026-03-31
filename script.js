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
  const W = document.getElementById('chart').clientWidth || 2400;
  const H = 500;
  const w = W - margin.left - margin.right;
  const h = H - margin.top - margin.bottom;

  const svg = d3.select('#chart').append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('width', '100%')
    .style('font-family', font)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const stack = d3.stack()
    .keys(config.keys)
    .offset(d3.stackOffsetNone) 
    .order(d3.stackOrderNone);

  const series = stack(raw);

  const x = d3.scalePoint()
    .domain(raw.map(d => d.year))
    .range([0, w]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(series, s => d3.max(s, d => d[1]))])
    .range([h, 0]);

  const area = d3.area()
    .x(d => x(d.data.year))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]))
    .curve(d3.curveBasis); 

  const layers = svg.selectAll('.layer')
    .data(series)
    .join('path')
    .attr('class', 'layer')
    .attr('d', area)
    .attr('fill', d => config.colors[d.key])
    .attr('opacity', 0.9);

  // Y-Axis (The y-bar showing numbers at the left)
  const yAxis = svg.append('g')
    .call(d3.axisLeft(y)
      .ticks(8)
      .tickFormat(d => d.toLocaleString())
    );
  
  // Style the Y-axis line and text
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

  // Tooltip
  const tooltip = d3.select('#chart').append('div').attr('class', 'tooltip');

  layers
    .on('mouseenter', function() {
      layers.attr('opacity', 0.4);
      d3.select(this).attr('opacity', 1);
    })
    .on('mousemove', function(event, d) {
      const mouseX = d3.pointer(event)[0];
      const domain = x.domain();
      const range = x.range();
      const step = (range[1] - range[0]) / (domain.length - 1);
      const index = Math.round((mouseX - range[0]) / step);
      const dataPoint = raw[index];

      if (dataPoint) {
        let tooltipHtml = `<strong>${dataPoint.year}</strong><br>`;
        config.keys.forEach(key => {
          tooltipHtml += `<span style="color:${config.colors[key]}">&#9632;</span> ${titleize(key)}: ${dataPoint[key].toLocaleString()}<br>`;
        });

        tooltip.style('opacity', 1)
          .style('left', (event.offsetX + 15) + 'px')
          .style('top', (event.offsetY - 50) + 'px')
          .html(tooltipHtml);
      }
    })
    .on('mouseleave', function() {
      layers.attr('opacity', 0.9);
      tooltip.style('opacity', 0);
    });
}

loadDataset('students');
// Export logic has been removed