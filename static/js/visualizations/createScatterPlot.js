/**
 *
 * Copyright 2016, Institute for Systems Biology
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

define (['jquery', 'd3', 'd3textwrap', 'vizhelpers'],
function($, d3, d3textwrap, vizhelpers) {

    var helpers = Object.create(vizhelpers, {});

    var selex_active = false;
    var zoom_status = {
        translation: null,
        scale: null
    };

    return {
        create_scatterplot: function(svg, data, domain, range, xLabel, yLabel, xParam, yParam, colorBy, legend, width, height, cohort_set) {
            var margin = {top: 10, bottom: 100, left: 120, right: 10};
            // We require at least one of the axes to have valid data
            var checkXvalid = 0;
            var checkYvalid = 0;

            var yVal = function(d) {
                if (helpers.isValidNumber(d[yParam])) {
                    checkYvalid++;
                    return d[yParam];
                } else {
                    d[yParam] = range[1];
                    return range[1];
                }
            };

            var yScale = d3.scale.linear().range([height-margin.bottom, margin.top]).domain(range);
            var yMap = function(d) { if(typeof(Number(d.y)) == "number"){return yScale(yVal(d));} else { return 0;}};
            var yAxis = d3.svg.axis()
                    .scale(yScale)
                    .orient("left")
                    .tickSize(-width - margin.left - margin.right, 0, 0);

            var xVal = function(d) {
                if (helpers.isValidNumber(d[xParam])) {
                    checkXvalid++;
                    return d[xParam];
                } else {
                    d[xParam] = domain[1];
                    return domain[1];
                }
            };

            // If both of our axes have no valid data, we have nothing to plot
            if(checkXvalid <= 0 && checkYvalid <= 0) {
                return null;
            }

            var xScale = d3.scale.linear().range([margin.left, width]).domain(domain);
            var xMap = function(d) {if(typeof(Number(d.x)) == "number"){return xScale(xVal(d));} else { return 0;}};
            var xAxis = d3.svg.axis()
                    .scale(xScale)
                    .orient("bottom")
                    .tickSize(-height - margin.top - margin.bottom, 0, 0);

            var colorVal = function(d) {
                if (colorBy == 'cohort') {
                    return d['cohort'][0];
                }
                return d[colorBy];
            };
            var name_domain = $.map(data, function(d) {
                return d[colorBy];
            });
            var color = d3.scale.ordinal()
                .domain(name_domain)
                .range(helpers.color_map(name_domain.length));

            var plot_area = svg.append('g')
                .attr('clip-path', 'url(#plot_area_clip)');

            plot_area.append('clipPath')
                .attr('id', 'plot_area_clip')
                .append('rect')
                .attr('height', height-margin.top-margin.bottom)
                .attr('width', width)
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            // Highlight the selected circles.
            var brushmove = function(p) {
                var sample_list = [];
                var e = brush.extent();

                var plot_id = $(svg[0]).parents('.plot').attr('id').split('-')[1];
                svg.selectAll("circle").classed("selected", function(d) {
                    return e[0][0] <= d[xParam] && d[xParam] <= e[1][0]
                        && e[0][1] <= d[yParam] && d[yParam] <= e[1][1]
                        && !$(this).is('.hidden');
                    });
                var selected_samples = $('svg circle.selected');
                selected_samples.each(function(){ sample_list.push(this.id); });
                var patient_list = $.map(sample_list, function(d) { return d.substr(0, 12); })
                    .filter(function(item, i, a) { return i == a.indexOf(item); });

                sample_form_update(e, selected_samples.length, patient_list.length, sample_list);
            };

            // If the brush is empty, select all circles.
            var brushend = function() {
                if (brush.empty()) {
                    svg.selectAll(".hidden").classed("hidden", false);
                    $(svg[0]).parents('.plot').find('.save-cohort-card').hide();
                }
            };

            var brush = d3.svg.brush()
                .x(xScale)
                .y(yScale)
                .on('brush', brushmove)
                .on('brushend', brushend);

            var transformer = function(d) {
                return 'translate(' + xMap(d) + ',' + yMap(d) + ')';
            };

            var zoomer = function() {
                if(!selex_active) {
                    svg.select('.x.axis').call(xAxis);
                    svg.select('.y.axis').call(yAxis);
                    plot_area.selectAll('circle').attr('transform', transformer);
                }
            };

            var zoom = d3.behavior.zoom()
                .x(xScale)
                .y(yScale)
                .on('zoom', zoomer);

            svg.call(zoom);

            plot_area.selectAll('.dot')
                .data(data)
                .enter().append('circle')
                .attr('class', function(d) { return d[colorBy]; })
                .style('fill', function(d) { return color(colorVal(d)); })
                .attr('transform', transformer)
                .attr('r', 2)
                .attr('id', function(d) { return d['sample_id']; });

            // append axes
            svg.append('g')
                .attr('class', 'y axis')
                .attr('transform', 'translate(' + margin.left + ',0)')
                .call(yAxis);

            svg.append('g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(0,' + (height - margin.bottom) + ')')
                .call(xAxis);

            // append axes labels
            svg.append('g')
                .attr('class','x-label-container')
                .append('text')
                .attr('class', 'x label axis-label')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + ((width+margin.left)/2) + ',' + (height - 10) + ')')
                .text(xLabel);

            d3.select('.x.label').call(d3textwrap.textwrap().bounds({width: (width-margin.left)*0.75, height: 80}));
            d3.select('.x-label-container').selectAll('foreignObject')
                .attr('style','transform: translate('+(((width-margin.left)/2)-(((width-margin.left)*0.75)/2)+margin.left) + 'px,' + (height - 80)+'px);');
            d3.select('.x-label-container').selectAll('div').attr('class','axis-label');

            svg.append('g')
                .attr('class','y-label-container')
                .append('text')
                .attr('class', 'y label axis-label')
                .attr('text-anchor', 'middle')
                .attr('transform', 'rotate(-90) translate(' + (-1 * (height/2)) + ',15)')
                .text(yLabel);

            d3.select('.y.label').call(d3textwrap.textwrap().bounds({height: 60, width: (height-margin.top-margin.bottom)*0.75}));
            d3.select('.y-label-container').selectAll('foreignObject')
                .attr('style','transform: rotate(-90deg) translate(' + ((-1 * (height-margin.bottom)/2)-(((height-margin.top-margin.bottom)*0.75))/2) + 'px,15px);');
            d3.select('.y-label-container').selectAll('div').attr('class','axis-label');

            var legend_item_height = 28;

            legend = legend.attr('height', legend_item_height * color.domain().length + 30);
            legend.append('text')
                .attr('x', 0)
                .attr('y', 20)
                .text('Legend');
            legend = legend.selectAll('.legend')
                .data(color.domain())
                .enter().append('g')
                .attr('class', 'legend')
                .attr("transform", function(d, i) { return "translate(0," + (((i+1) * 20) + 10) + ")"; });

            legend.append('rect')
                .attr('width', 20)
                .attr('height', 20)
                .attr('class', 'selected')
                .style('stroke', color)
                .style('stroke-width', 1)
                .style('fill', color)
                .on('click', helpers.toggle_selection);

            legend.append('text')
                .attr('x', 25)
                .attr('y', 15)
                .text(function(d) {
                    if (d != null) {
                        if (colorBy == 'cohort') {
                            if (Array.isArray(d)) {
                                var cohort_name_label = "";
                                for (var i = 0; i < d.length; i++) {
                                    for (var j = 0; j < cohort_set.length; j++) {
                                        if (cohort_set[j]['id'] == d[i]) { cohort_name_label += cohort_set[j]['name'] + ','; }
                                    }
                                }
                                return cohort_name_label.slice(0,-1);
                            } else {
                                for (var i = 0; i < cohort_set.length; i++) {
                                    if (cohort_set[i]['id'] == d) { return cohort_set[i]['name']; }
                                }
                            }
                        } else {
                            return d;
                        }
                    } else {
                        return 'NA';
                    }
                });

            var check_selection_state = function(obj) {

                selex_active = !!obj;

                if (obj) {
                    // Disable zooming events and store their status
                    svg.on('.zoom',null);
                    zoom_status.translation = zoom.translate();
                    zoom_status.scale = zoom.scale();

                    // Append new brush event listeners to plot area only
                    plot_area.append('g')
                        .attr('class', 'brush')
                        .call(brush);
                } else {
                    // Resume zooming, restoring the zoom's last state
                    svg.call(zoom);
                    zoom_status.translation && zoom.translate(zoom_status.translation);
                    zoom_status.scale && zoom.scale(zoom_status.scale);
                    zoom_status.translation = null;
                    zoom_status.scale = null;

                    var plot_id = $(svg[0]).parents('.plot').attr('id').split('-')[1];
                    // Clear selections
                    $(svg[0]).parents('.plot').find('.selected-samples-count').html('Number of Samples: ' + 0);
                    $(svg[0]).parents('.plot').find('.selected-patients-count').html('Number of Participants: ' + 0);
                    $('#save-cohort-'+plot_id+'-modal input[name="samples"]').attr('value', []);
                    svg.selectAll('.selected').classed('selected', false);
                    $(svg[0]).parents('.plot').find('.save-cohort-card').hide();
                    // Get rid of the selection rectangle - comment out if we want to enable selection carry-over
                    brush.clear();
                    // Remove brush event listener plot area
                    plot_area.selectAll('.brush').remove();
                }
            };

            /*
                Update the sample cohort bar update
             */
            function sample_form_update(extent, total_samples, total_patients, sample_list){
                var plot_id = $(svg[0]).parents('.plot').attr('id').split('-')[1];
                $(svg[0]).parents('.plot').find('.selected-samples-count').html('Number of Samples: ' + total_samples);
                $(svg[0]).parents('.plot').find('.selected-patients-count').html('Number of Participants: ' + total_patients);
                $('#save-cohort-' + plot_id + '-modal input[name="samples"]').attr('value', sample_list);
                var topVal = Math.min((yScale(extent[1][1]) + 180),(height-$('.save-cohort-card').height()));
                var leftVal = Math.min((xScale(extent[1][0])+ 40),(width-$('.save-cohort-card').width()));
                $('.save-cohort-card').show()
                    .attr('style', 'position:absolute; top: '+ topVal +'px; left:' +leftVal+'px;');

                $('.save-cohort-card').find('.btn').prop('disabled', (total_samples <= 0));
            }

            function resize() {
                width = svg.node().parentNode.offsetWidth - 10;
                //TODO resize plot
            }

            function check_selection_state_wrapper(bool){
                check_selection_state(bool);
            }

            return {
                resize                : resize,
                check_selection_state : check_selection_state_wrapper
            }
        }
    };
});
