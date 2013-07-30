/*global d3 */
var digraphs = function(wordlist) {
    //we'll use '^' and '$' as special letters representing the start and end of a word
    var alphabet = ['^'];    
    for (var a = 1; a <= 26; a += 1) {
        alphabet.push(String.fromCharCode(a + 64));
    }
    alphabet.push("$");
    
    //the data will be represented as a one-dimensional key-value object of digrams and frequencies
    var data = {};
    
    // initialize data object. No word begins with an end or ends with a beginning, hence the ```c < alphabet.length - 1``` and ```var i = 1```
    for (var c = 0; c < alphabet.length - 1; c += 1) {
        for (var i = 1; i < alphabet.length; i += 1) {
            data[alphabet[c] + alphabet[i]] = 0;
        }
    }    
    
    // if input looks like a path
    if (typeof wordlist === "string" && wordlist.length < 250) {
        d3.text(wordlist, function(error, data) {
            if (error) {
                console.log("Unable to load input as a path: ", error);
                //might as well try
                build(wordlist);
            } else {
                build(data);
            }
        });            
    } else {
        build(wordlist);
    }

    // words can be an array of strings or \s-delimited  string
    function build(words) {
        if (typeof words === "string") {
            words = words.split(/\s+/g);
        }

        words = words.map(function(d) {
            if (d.indexOf("-") == -1 && d.indexOf("'") == -1) {
                return '^' + d.trim().toUpperCase() + '$';    
            }
        }).filter(function(d) { return d; });        

        // calculate frequencies of digraphs        
        for (var c = 0; c < words.length; c += 1) {
            d3.range(words[c].length - 1).forEach(function(d) {
                data[words[c].substr(d, 2)] += 1;
            });
        }
            
        data = d3.entries(data);
    
        var all_width = parseInt(d3.select("#canvas").style("width"), 10),
            original_width = all_width,
            margin = [20, 10, 5, 5],
            width = all_width - margin[1] - margin[3],
            rangeBand = Math.floor(width) / 28;
            
        var ext = d3.extent(d3.values(data), function(d) {
            return d.value;
        });
    
        var color = function(d) {
            var value = typeof d === "object" ? d.value : d,
                normal = value / ext[1],
                normalsq = Math.pow(normal, 0.25),
                log = Math.log(value || 1) / Math.log(ext[1]);
            return d3.hsl(120 * (1 - normalsq), 0.8, 1 - log * 0.5);
        }
    
        var tooltip = d3.select("body")
            .append("div")
            .style("visibility", "hidden")
            .attr("class", "d3tooltip");
            
        var svg = d3.select("#canvas").append("svg")
            .attr("width", width)
            .attr("height", width + margin[0] + margin[2]);        

        var x = d3.scale.ordinal().rangeBands([0, width]);
        x.domain(alphabet);
            
        make_legend(25);
            
        // object to cache example lookups
        var lookups = {};
    
        // draw cells
        svg.selectAll(".cell")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "cell")
            .attr("x", function(d) { return margin[3] + x(d.key[1]); })
            .attr("y", function(d) { return margin[0] + x(d.key[0]); })
            .attr("width", rangeBand)
            .attr("height", rangeBand)
            .style("fill", color)
            .style("opacity", 1)
            .on("mouseover", function(d) { tooltip.html(d.key + ": " + commafy(d.value)); return tooltip.style("visibility", "visible");})
            .on("mousemove", function() { return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
            .on("mouseout", function() { return tooltip.style("visibility", "hidden");})
            .on("click", function(d) {
                lookup(d);
            });
    
        // axes    
        svg.selectAll(".xlabel")
            .data(alphabet.slice(1))
            .enter()
            .append("text")
            .attr("class", "xlabel")
            .attr("x", function(d) {
                return margin[3] + x(d) + rangeBand / 2;
            })
            .attr("y", function(d) {
                return margin[0] - 2;
            })
            .text(function(d) { return d; });
        
        svg.selectAll(".ylabel")
            .data(alphabet.slice(0, 27))
            .enter()
            .append("text")
            .attr("class", "ylabel")
            .attr("y", function(d, i) {
                return margin[0] + x(d) + rangeBand - 3;
            })
            .attr("x", function(d) {
                return margin[3] + rangeBand - 3;
            })
            .text(function(d) { return d; });
        
        function make_legend(N) {
            N = N || 10;
            var values = [],
                legend = [],
                max = d3.max(data, function(d) {
                    return d.value;
                });
                
            for (var d = 0; d <= 80; d += 10) {
                //values.push(125 << d);
                values.push(d * d);
            }
            
            values.map(function(d, i) {
                legend.push(d);
            });
            
            var legends = d3.select("#legend").append("svg")
                .attr("id", "legends")
                .attr("width", 150)
                .attr("height", 200);        
            
            legends.append("text")
                .attr("class", "legend_title")
                .attr("x", 0)
                .attr("y", 12 + x(0))
                .text("LEGEND");
                
            legends.selectAll(".legend_cell")
                .data(values)
                .enter()
                .append("rect")
                .attr("class", "legend_cell")
                .attr("x", function(d) {
                    return !d ? 1 : 0
                })
                .attr("y", function(d, i) { return 20 + (rangeBand + 1) * i; })
                .attr("width", function(d) {
                    return !d ? (rangeBand - 2) : rangeBand
                })
                .attr("height", function(d) {
                    return !d ? (rangeBand - 2) : rangeBand
                })
                .style("fill", color)
                .style("stroke", function(d) {
                    return !d ? "#CCC" : "#FFF";
                });
                
            legends.selectAll(".legend_text")
                .data(legend)
                .enter()
                .append("text")
                .attr("class", "legend_text")
                .attr("x", 20)
                .attr("y", function(d, i) { return 32 + i * (rangeBand + 1); })
                .text(function(d) { return d; });
                
            //legends.attr("transform", "translate(10, " + (x("$") - legends[0][0].getBBox().height - 30) + ")")
        }
        
        function lookup(d) {
            var count = 0;
            var pattern = new RegExp("([a-z']*)(" + d.key.replace("^", "\\b").replace("$", "\\b") + ")([a-z']*)", "gi"),
                match = pattern.exec(words),
                matches = [];
                    
            while (count < 150 && match) {
                matches.push(match[1] + "<strong>" + match[2] + "</strong>" + match[3]);
                count += 1;
                match = pattern.exec(words);
            }
            if (d.value > 150) {
                matches.push("<em>And " + commafy(d.value - 150) + " more</em>")
            }
            d3.select("#wordlist").html(matches.join("<br />"));
        }    
    
        function updateChart() {        
            all_width = parseInt(d3.select("#canvas").style("width"), 10);
            width = all_width - margin[1] - margin[3];
            rangeBand = Math.floor(width) / 28;

            var z = all_width / original_width;
    
            x.rangeBands([0, width]);
            
            svg.selectAll(".cell")
                .attr("x", function(d) { return margin[3] + x(d.key[1]); })
                .attr("y", function(d) { return margin[0] + x(d.key[0]); })
                .attr("width", rangeBand)
                .attr("height", rangeBand);
    
            svg.selectAll(".xlabel")
                .attr("x", function(d) {
                    return margin[3] + x(d) + rangeBand / 2;
                })
                .attr("y", function(d) {
                    return margin[0] - 4;
                });
            
            svg.selectAll(".ylabel")
                .attr("y", function(d, i) {
                    return margin[0] + x(d) + rangeBand - 3;
                })
                .attr("x", function(d) {
                    return margin[3] + rangeBand - 3;
                });
    
            d3.select("#canvas svg").attr("width", width);
        }
    
        var resizeTimer;
        window.onresize = function(event) {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                updateChart();
            }, 10);
        }
        updateChart();    
    }
    
    function commafy(val){
        while (/(\d+)(\d{3})/.test(val.toString())) {
          val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
        }
        return val;
    }
};