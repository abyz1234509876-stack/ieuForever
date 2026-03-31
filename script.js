const datasetConfigs = {
  students: {
    name: 'Students',
    file: 'ieuStudentsEnrolled.json',
    femaleKeys: ['female_vocational', 'female_bachelor', 'female_master', 'female_phd'],
    maleKeys: ['male_vocational', 'male_bachelor', 'male_master', 'male_phd'],
    colors: {
      female_vocational: '#FFCC99',
      female_bachelor:   '#FFB366',
      female_master:     '#FF9933',
      female_phd:        '#FF8000',
      male_vocational:   '#9999f5',
      male_bachelor:     '#6666ef',
      male_master:       '#3333ec',
      male_phd:          '#1e1ee8',
    },
    parse: jsonData => jsonData
      .filter(d => d.program_type === 'TOPLAM')
      .map(d => ({
        year: d.year,
        female_vocational: +d.vocational.female,
        female_bachelor:   +d.bachelor.female,
        female_master:     +d.master.female,
        female_phd:        +d.phd.female,
        male_vocational:   +d.vocational.male,
        male_bachelor:     +d.bachelor.male,
        male_master:       +d.master.male,
        male_phd:          +d.phd.male,
      }))
      .sort((a,b) => (a.year > b.year ? 1 : a.year < b.year ? -1 : 0)),
  },

  staff: {
    name: 'Academic Staff',
    file: 'ieuForeverData_staffRegistered.json',
    femaleKeys: ['female_professor', 'female_associate', 'female_doctor', 'female_lecturer', 'female_research'],
    maleKeys:   ['male_professor',   'male_associate',   'male_doctor',   'male_lecturer',   'male_research'],
    colors: {
      female_professor: '#FFCC99',
      female_associate: '#FFB366',
      female_doctor:    '#FF9933',
      female_lecturer:  '#FF8000',
      female_research:  '#FF6600',
      male_professor:   '#9999f5',
      male_associate:   '#6666ef',
      male_doctor:      '#3333ec',
      male_lecturer:    '#1e1ee8',
      male_research:    '#1e66f2',
    },
    parse: jsonData => jsonData
      .map(d => ({
        year: d['Academic Year'],
        female_professor: toNumber(d['Profesör_K']),
        male_professor:   toNumber(d['Profesör_E']),
        female_associate: toNumber(d['Doçent_K']),
        male_associate:   toNumber(d['Doçent_E']),
        female_doctor:    toNumber(d['Doktor Öğretim Üyesi_K']),
        male_doctor:      toNumber(d['Doktor Öğretim Üyesi_E']),
        female_lecturer:  toNumber(d['Öğretim Görevlisi_K']),
        male_lecturer:    toNumber(d['Öğretim Görevlisi_E']),
        female_research:  toNumber(d['Araştırma Görevlisi_K']),
        male_research:    toNumber(d['Araştırma Görevlisi_E']),
      }))
      .filter(d => d.year)
      .sort((a,b) => (a.year > b.year ? 1 : a.year < b.year ? -1 : 0)),
  }
};

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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
    d3.select('#chart').append('div').text(`Failed to load ${config.file}`);
  });
}

const datasetSelect = document.getElementById('dataset-select');
if (datasetSelect) {
  datasetSelect.addEventListener('change', () => {
    loadDataset(datasetSelect.value);
  });
}

loadDataset('students');

function drawChart(raw, config) {
  const font = "'Open Sans', sans-serif";

  const margin = { top: 100, right: 30, bottom: 50, left: 70 };
  const W = document.getElementById('chart').clientWidth || 1200;
  const H = 500;
  const w = W - margin.left - margin.right;
  const h = H - margin.top - margin.bottom;

  const svg = d3.select('#chart').append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('width', '100%')
    .style('font-family', font)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const allKeys = [...config.femaleKeys, ...config.maleKeys];
  const stack = d3.stack().keys(allKeys).offset(d3.stackOffsetNone);
  const series = stack(raw);

  const maxTotal = d3.max(series[series.length - 1], d => d[1]);
  const y = d3.scaleLinear().domain([0, maxTotal]).range([h, 0]);
  const x = d3.scaleBand().domain(raw.map(d => d.year)).range([0, w]).padding(0.3);

  svg.selectAll('.bar-group')
    .data(series)
    .join('g')
    .attr('class', 'bar-group')
    .attr('fill', d => config.colors[d.key])
    .selectAll('rect')
    .data(d => d)
    .join('rect')
    .attr('x', d => x(d.data.year))
    .attr('y', d => y(d[1]))
    .attr('height', d => y(d[0]) - y(d[1]))
    .attr('width', x.bandwidth())
    .attr('opacity', 0.9);

  const yAxis = svg.append('g')
    .call(d3.axisLeft(y)
      .ticks(6)
      .tickSize(4)
      .tickFormat(d => d.toLocaleString())
    );
  yAxis.select('.domain').remove();
  yAxis.selectAll('line').attr('stroke', 'rgba(0,0,0,0.15)');
  yAxis.selectAll('text').attr('fill', '#666').attr('font-size', '11px').style('font-family', font);

  svg.append('g')
    .attr('transform', `translate(0,${h})`)
    .call(d3.axisBottom(x).tickSize(0))
    .select('.domain').remove();
  
  const xAxisGroup = svg.select('g[transform*="translate(0"]');
  xAxisGroup.selectAll('text')
    .attr('fill', 'rgba(0,0,0,0.55)')
    .attr('font-size', '11px')
    .attr('dy', '1.2em')
    .attr('transform', 'rotate(-30)')
    .attr('text-anchor', 'end')
    .style('font-family', font);

  svg.append('g')
    .selectAll('line')
    .data(y.ticks(6))
    .join('line')
    .attr('x1', 0).attr('x2', w)
    .attr('y1', d => y(d)).attr('y2', d => y(d))
    .attr('stroke', 'rgba(0,0,0,0.08)')
    .attr('stroke-dasharray', '3,3')
    .attr('pointer-events', 'none');

  const tooltip = d3.select('#chart').append('div').attr('class', 'tooltip');
  let currentYear = null;

  svg.selectAll('.bar-group').selectAll('rect')
    .on('mouseenter', function(event, d) {
      const year = d.data.year;
      if (currentYear === year) return;
      currentYear = year;

      svg.selectAll('rect').attr('opacity', 0.4);
      svg.selectAll('.bar-group').selectAll(`rect[data-year="${year}"]`).attr('opacity', 0.9);
      d3.selectAll('rect').filter(function() {
        return this.getAttribute('data-year') === year;
      }).attr('opacity', 0.9);
    })
    .on('mousemove', function(event, d) {
      const data = d.data;
      let tooltipHtml = `<strong>${data.year}</strong><br>`;
      
      config.femaleKeys.forEach(key => {
        tooltipHtml += `<span style="color:${config.colors[key]}">&#9632;</span> ${titleize(key)}: ${data[key].toLocaleString()}<br>`;
      });
      config.maleKeys.forEach(key => {
        tooltipHtml += `<span style="color:${config.colors[key]}">&#9632;</span> ${titleize(key)}: ${data[key].toLocaleString()}<br>`;
      });

      tooltip.style('opacity', 1)
        .style('left', (event.offsetX + 12) + 'px')
        .style('top', (event.offsetY - 48) + 'px')
        .html(tooltipHtml);
    })
    .on('mouseleave', function() {
      tooltip.style('opacity', 0);
      svg.selectAll('rect').attr('opacity', 0.9);
      currentYear = null;
    });

  svg.selectAll('g.bar-group').selectAll('rect')
    .attr('data-year', d => d.data.year);
}

function titleize(key) {
  return key.replace(/_/g, ' ').replace(/^(.)/, c => c.toUpperCase());
}

const exportBtn = document.getElementById('export-btn');
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    const svgEl = document.querySelector('#chart svg');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    let svgStr = serializer.serializeToString(svgEl);
    if (!svgStr.startsWith('<?xml')) {
      svgStr = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgStr;
    }
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${datasetSelect.value || 'data'}_streamgraph.svg`;
    a.click();
    URL.revokeObjectURL(url);
  });
}
