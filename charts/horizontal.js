var myModule = angular.module('myModule', [$timeout])

    .directive('HorizontalBarchart', function ($timeout) {
        return {
            restrict: 'E',
            scope: {
                onClick: '&',
                keyField: '@',
                keyLabel: '@',
                primaryData: '=',
                primaryValueField: '@',
                primaryBarClass: '@',
                secondaryData: '=',
                secondaryValueField: '@',
                secondaryBarClass: '@',
                tooltipContent: '&'
            },
            link: function (scope, element, attrs) {
                var BAR_MIN_WIDTH = 3;
                var containerId = '#' + attrs.id;
                var renderPrimaryTimeout, renderSecondaryTimeout;

                // Define chart sizes and margin
                var margin = {top: 15, right: 20, bottom: 10, left: 10};
                var containerWidth = +attrs.width;

                //------------------------------------------------------------------------------------------------------
                //----------------------------------------------- Tooltip ----------------------------------------------
                //------------------------------------------------------------------------------------------------------
                var tooltip = d3.tip()
                    .attr('class', 'horizontal-barchart-cls d3-tip')
                    .offset([-10, 0])
                    .html(function (primaryDatum, index) {
                        var secondaryDatum = scope.secondaryData ? scope.secondaryData[index] : undefined;
                        return scope.tooltipContent({
                            keyLabel: scope.keyLabel,
                            key: getKey(primaryDatum),
                            primaryValue: getPrimaryValue(primaryDatum),
                            secondaryValue: secondaryDatum && getSecondaryValue(secondaryDatum)
                        });
                    });

                //------------------------------------------------------------------------------------------------------
                //---------------------------------------- Data manipulation -------------------------------------------
                //------------------------------------------------------------------------------------------------------
                function getKey(data) {
                    return data[scope.keyField];
                }

                function getPrimaryValue(data) {
                    return data[scope.primaryValueField];
                }

                function getSecondaryValue(data) {
                    return data[scope.secondaryValueField];
                }

                //------------------------------------------------------------------------------------------------------
                //--------------------------------------------- Bar class ----------------------------------------------
                //------------------------------------------------------------------------------------------------------
                function getPrimaryClassName() {
                    return scope.primaryBarClass ? scope.primaryBarClass : 'transparentBar';
                }

                function getSecondaryClassName() {
                    return scope.secondaryBarClass ? scope.secondaryBarClass : 'blueBar';
                }

                //------------------------------------------------------------------------------------------------------
                //------------------------------------------- Chart utils ----------------------------------------------
                //------------------------------------------------------------------------------------------------------
                var xScale, yScale;
                var xAxis;
                var svg;

                function initScales(width, height) {
                    xScale = d3.scale.linear().range([0, width]);
                    yScale = d3.scale.ordinal().rangeBands([0, height], 0.18);
                }

                function configureScales(statData) {
                    xScale.domain([0, d3.max(statData, getPrimaryValue)]);
                    yScale.domain(statData.map(getKey));
                }

                function initAxes(height) {

                    var ticksThreshold;
                    if (xScale.domain()[1] >= 1e9) {
                        ticksThreshold = 2;
                    }
                    else if (xScale.domain()[1] < 1e9 && xScale.domain()[1] >= 1e6) {
                        ticksThreshold = 3;
                    }
                    else if (xScale.domain()[1] < 1e6 && xScale.domain()[1] >= 1e3) {
                        ticksThreshold = 5;
                    }
                    else {
                        ticksThreshold = 7;
                    }
                    var ticksNbre = xScale.domain()[1] > ticksThreshold ? ticksThreshold : xScale.domain()[1];

                    xAxis = d3.svg.axis()
                        .scale(xScale)
                        .tickFormat(d3.format(',d'))
                        .orient('top')
                        .tickSize(-height)
                        .ticks(ticksNbre);
                }

                function createContainer(width, height) {
                    svg = d3.select(containerId)
                        .append('svg')
                        .attr('class', 'horizontal-barchart-cls')
                        .attr('width', width)
                        .attr('height', height)
                        .append('g')
                        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

                    svg.call(tooltip);
                }

                function drawGrid() {
                    svg.append('g')
                        .attr('class', 'grid')
                        .call(xAxis)
                        .selectAll('.tick text')
                        .style('text-anchor', 'middle');
                }

                function createBarsContainers() {
                    svg.append('g')
                        .attr('class', 'primaryBar');

                    svg.append('g')
                        .attr('class', 'secondaryBar');
                }

                function adaptToMinHeight(realWidth) {
                    return realWidth > 0 && realWidth < BAR_MIN_WIDTH ? BAR_MIN_WIDTH : realWidth;
                }

                function drawBars(containerClassName, statData, getValue, barClassName) {
                    var bars = svg.select('.' + containerClassName)
                        .selectAll('.' + barClassName)
                        .data(statData, getKey);

                    //enter
                    bars.enter()
                        .append('rect')
                        .attr('class', barClassName)
                        .attr('transform', function (d) {
                            return 'translate(0,' + yScale(getKey(d)) + ')';
                        })
                        .attr('height', yScale.rangeBand())
                        .attr('width', xScale(0))
                        .transition().delay(function (d, i) {
                            return i * 30;
                        })
                        .attr('width', function (d) {
                            var realWidth = xScale(getValue(d));
                            return adaptToMinHeight(realWidth);
                        });

                    //update
                    bars.transition()
                        .ease('exp')
                        .delay(function (d, i) {
                            return i * 30;
                        })
                        .attr('width', function (d) {
                            var realWidth = xScale(getValue(d));
                            return adaptToMinHeight(realWidth);
                        });
                }

                function drawKeysLabels(statData, width) {
                    svg.append('g')
                        .attr('class', 'labels')
                        .selectAll('label')
                        .data(statData)
                        .enter()

                        //label container
                        .append('foreignObject')
                        .attr('width', width)
                        .attr('height', yScale.rangeBand())
                        .attr('transform', function (d) {
                            return 'translate(0,' + yScale(getKey(d)) + ')';
                        })

                        //label
                        .append('xhtml:div')
                        .attr('class', 'label ' + getSecondaryClassName())
                        .html(function (d) {
                            return getKey(d) || '(EMPTY)';
                        });
                }

                function drawHoverBars(statData, width) {
                    svg.selectAll('g.bg-rect')
                        .data(statData)
                        .enter()
                        .append('g')
                        .attr('class', 'hover')
                        .attr('transform', function (d) {
                            return 'translate(0, ' + (yScale(getKey(d)) - 2) + ')';
                        })
                        .append('rect')
                        .attr('width', width)
                        .attr('height', yScale.rangeBand() + 4)
                        .attr('class', 'bg-rect')
                        .style('opacity', 0)
                        .on('mouseenter', function (d, i) {
                            d3.select(this).style('opacity', 0.4);
                            tooltip.show(d, i);
                        })
                        .on('mouseleave', function (d) {
                            d3.select(this).style('opacity', 0);
                            tooltip.hide(d);
                        })
                        .on('click', function (d) {
                            //create a new reference as the data object could be modified outside the component
                            scope.onClick({item: _.extend({}, d)});
                        });
                }

                //------------------------------------------------------------------------------------------------------
                //------------------------------------------- Chart render ---------------------------------------------
                //------------------------------------------------------------------------------------------------------
                function renderWholeHBarchart(firstVisuData, secondVisuData) {
                    // Chart sizes dynamically computed (it depends on the bars number)
                    var containerHeight = Math.ceil(((+attrs.height) / 15) * (firstVisuData.length + 1));
                    var width = containerWidth - margin.left - margin.right;
                    var height = containerHeight - margin.top - margin.bottom;

                    initScales(width, height);
                    configureScales(firstVisuData);
                    initAxes(height);
                    createContainer(containerWidth, containerHeight);
                    drawGrid();
                    createBarsContainers();

                    drawBars('primaryBar', firstVisuData, getPrimaryValue, getPrimaryClassName());
                    renderSecondaryBars(secondVisuData);

                    drawKeysLabels(firstVisuData, width);
                    drawHoverBars(firstVisuData, width);
                }

                function renderSecondaryBars(secondVisuData) {
                    if (secondVisuData) {
                        drawBars('secondaryBar', secondVisuData, getSecondaryValue, getSecondaryClassName());
                    }
                }

                //------------------------------------------------------------------------------------------------------
                //---------------------------------------------- Watchers ----------------------------------------------
                //------------------------------------------------------------------------------------------------------
                var oldVisuData;
                scope.$watchGroup(['primaryData', 'secondaryData'],
                    function (newValues) {
                        var firstVisuData = newValues[0];
                        var secondVisuData = newValues[1];
                        var firstDataHasChanged = firstVisuData !== oldVisuData;

                        if (firstDataHasChanged) {
                            oldVisuData = firstVisuData;
                            element.empty();
                            //because the tooltip is not a child of the horizontal barchart element
                            d3.selectAll('.horizontal-barchart-cls.d3-tip').remove();
                            if (firstVisuData) {
                                $timeout.cancel(renderPrimaryTimeout);
                                renderPrimaryTimeout = $timeout(renderWholeHBarchart.bind(this, firstVisuData, secondVisuData), 100, false);
                            }
                        }
                        else {
                            $timeout.cancel(renderSecondaryTimeout);
                            renderSecondaryTimeout = $timeout(renderSecondaryBars.bind(this, secondVisuData), 100, false);
                        }
                    }
                );

                scope.$on('$destroy', function () {
                    d3.selectAll('.horizontal-barchart-cls.d3-tip').remove();
                    $timeout.cancel(renderPrimaryTimeout);
                    $timeout.cancel(renderSecondaryTimeout);
                });
            }
        };
    })


    .controller('MyCtrl', function ($scope) {

        $scope.getTooltip = function (keyLabel, key, primaryValue, secondaryValue) {
            var title = 'Record';
            var keyString = key;
            var rangeLimits = state.playground.statistics.rangeLimits;
            var minLabel = $translate.instant('MIN');
            var maxLabel = $translate.instant('MAX');

            //range
            if (key instanceof Array) {
                var uniqueValue = key[0] === key[1];
                title = uniqueValue ? 'Value' : 'Range';

                if (uniqueValue) {
                    keyString = key[0];
                } else {
                    if (key[0] <= rangeLimits.min) {
                        if (key[1] >= rangeLimits.max) {
                            keyString = '[' + minLabel + ',' + maxLabel + ']';
                        } else {
                            keyString = '[' + minLabel + ',' + key[1] + '[';
                        }
                    } else {
                        if (key[1] >= rangeLimits.max) {
                            keyString = '[' + key[0] + ',' + maxLabel + ']';
                        } else {
                            keyString = '[' + key[0] + ',' + key[1] + '[';
                        }
                    }
                }
            }

            if (state.playground.filter.gridFilters.length) {
                if (state.playground.statistics.histogram.aggregation) {
                    return TOOLTIP_FILTERED_AGGREG_TEMPLATE({
                        label: keyLabel,
                        title: title,
                        key: keyString,
                        primaryValue: primaryValue
                    });
                }
                else {
                    var percentage = getPercentage(secondaryValue, primaryValue);
                    return TOOLTIP_FILTERED_TEMPLATE({
                        label: keyLabel,
                        title: title,
                        percentage: percentage,
                        key: keyString,
                        primaryValue: primaryValue,
                        secondaryValue: secondaryValue
                    });
                }
            }
            else {
                return TOOLTIP_TEMPLATE({
                    label: keyLabel,
                    title: title,
                    key: keyString,
                    primaryValue: primaryValue
                });
            }
        }

    });

