const urlEdu = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json';
const urlCounty = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json'
const source = 'https://www.ers.usda.gov/data-products/county-level-data-sets/county-level-data-sets-download-data/';

const container = d3.select('.container');

container.append('h1')
        .attr('id','title')
        .text('United States Educational Attainment')

container.append('h4')
        .attr('id','subtitle')
        .text("Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)")

container.append('svg')
        .attr('width', 1000)
        .attr('height', 600);
                      
const tooltip = container.append('div')
                        .attr('class','tooltip')
                        .attr('id','tooltip')
                        .style('opacity', 0);

const sourceText = container.append('div')
                        .attr('id','source')
                        .html(
                            `
                            <br>
                            <p>Source: <a href=${source}>USDA Economic Research Service</a></p>
                            `
                        )
                        
const svg = d3.select('svg');

const path = d3.geoPath();
                
//2.6 and 75.1 is min and max of bachelorsOrHigher of Edu data
const x = d3.scaleLinear().domain([2.6, 75.1]).rangeRound([600, 860]);

const color = d3
                .scaleThreshold()
                .domain(d3.range(2.6, 75.1, (75.1 - 2.6)/8))
                .range(d3.schemeGreens[9])

const g = svg
            .append('g')
            .attr('class','key')
            .attr('id','legend')
            .attr('transform', 'translate(0,40)');

g.selectAll('rect')
.data(
    color.range().map( d => {
        d = color.invertExtent(d);
        if (d[0] === null) {
            d[0] = x.domain()[0];
        }
        if (d[1] === null) {
            d[1] = x.domain()[1];
        }
        return d;
    })
)
.enter()
.append('rect')
.attr('height', 8)
.attr('x', d => x(d[0]))
.attr('width', d => d[0] && d[1] ? x(d[1])-x(d[0]) : x(null))
.attr('fill', d => color(d[0]))

g.append('text')
.attr('class','caption')
.attr('x', x.range()[0])
.attr('y', -6)
.attr('fill', '#000')
.attr('text-anchor', 'start')
.attr('font-weight', 'bold');

g.call(
    d3.axisBottom(x)
    .tickSize(13)
    .tickFormat( item => Math.round(item) + '%')
    .tickValues(color.domain())
)
    .select('.domain')
    .remove();



Promise.all([d3.json(urlCounty), d3.json(urlEdu)])
    .then(data => readyFunction(data[0],data[1]))
    .catch(err => console.log(err))

function readyFunction (us, education) {
    //Draw border of states
    svg
        .append('path')
        .datum(
            topojson.mesh(us, us.objects.states, function (a, b) {
                return a !== b
            })
        )
        .attr('class', 'states')
        .attr('d', path);

    //Coloring each state based on data binding
    svg
        .append('g')
        .attr('class', 'counties')
        .selectAll('path')
        .data(topojson.feature(us, us.objects.counties).features)
        .enter()
        .append('path')
        .attr('class','county')
        .attr('data-fips', d => d.id)
        .attr('data-education', d => {
            const result = education.filter( obj => obj.fips === d.id);
            if (result[0]) {
                return result[0].bachelorsOrHigher;
            }
            //could not find a matching fips id in the data
            console.log('could not find data for: ', d.id)
            return 0;
        })
        .attr('fill', d => {
            const result = education.filter( obj => obj.fips === d.id);
            if (result[0]) {
                return color(result[0].bachelorsOrHigher)
            }
            //could not find a matching fips id in the data
            return 0;
        })
        .attr('d', path) //Draw a map
        .on('mouseover', (event, d) => {
            const result = education.filter( obj => obj.fips === d.id);            
            tooltip.style('opacity', 0.8);
            tooltip.style('left', event.pageX + 10 + 'px');
            tooltip.style('top', event.pageY - 28 + 'px');
            if (result[0]) {
                tooltip.html(
                    `
                    ${result[0]['area_name']}, ${result[0].state}: 
                    ${result[0].bachelorsOrHigher}%
                    `
                );
            }
            tooltip.attr('data-education', () => {
                const result = education.filter( obj => obj.fips === d.id)
                if (result[0]) {
                    return result[0].bachelorsOrHigher;
                }
                return 0;        
                } 
            )
        })
        .on('mouseout', ()=>{
            tooltip.style('opacity', 0);
        });

}