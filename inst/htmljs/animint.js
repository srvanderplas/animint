// Define functions to render linked interactive plots using d3.

// Another script should define e.g.
// <script>
//   var plot = new animint("#plot","plot.json");
// </script>


// Constructor for animint Object.
var animint = function(to_select, json_file){
  var element = d3.select(to_select);
  this.element = element;
  var Selectors = {};
  this.Selectors = Selectors;
  var Plots = {};
  this.Plots = Plots;
  var Geoms = {};
  this.Geoms = Geoms;
  var SVGs = {};
  this.SVGs = SVGs;
  var Animation = {};
  this.Animation = Animation;
  var getcol = function(v_name){
    return function(d){return d[v_name];};
  }

  var add_geom = function(g_name, g_info){
  	d3.csv(g_info.data, function(error, response){
  	    // First convert to correct types.
  	  response.forEach(function(d){
    		for(var v_name in g_info.types){
    		    var r_type = g_info.types[v_name];
    		    if(r_type == "integer"){
    	    		d[v_name] = parseInt(d[v_name]);
    		    }else if(r_type == "numeric"){
    	    		d[v_name] = parseFloat(d[v_name]);
    		    }else if(r_type == "factor"){
    		    	//keep it as a character.
    		    }else if(r_type == "rgb"){
            	//keep it as a character.        	      
    		    }else if(r_type == "linetype"){
      	      //keep it as a character. 
    		    }else if(r_type == "label"){
              //keep it as a character
    		    }else if(r_type == "character" & v_name == "outliers"){
      	      d[v_name] = parseFloat(d[v_name].split(" @ "));
    		    }else{
    			    throw "unsupported R type "+r_type;
    		    }
  		    }
  	  });
  	  var nest = d3.nest();
  	  g_info.subord.forEach(function(aes_name){
    		var v_name = g_info.subvars[aes_name];
    		//alert(aes_name+" "+g_info.classed+" "+v_name);
    		nest.key(getcol(v_name));
  	  });
  	  g_info.data = nest.map(response);
  	  Geoms[g_name] = g_info;
  	  update_geom(g_name);
  	});
  }
  var axispadding = 30;
  var labelpadding = 35;
  var titlepadding = 30;
  var margin = {left: labelpadding+axispadding,
                right: 0,
                top: titlepadding,
                bottom: labelpadding+axispadding};
  var plotdim = {width: 0, height: 0, xstart: 0, xend: 0, ystart: 0, yend: 0,
                 graph: {width: 0, height: 0}, margin: margin, xlab: {x: 0, y:0},
                 ylab: {x: 0, y:0}, title: {x: 0, y:0}};
  var add_plot = function(p_name, p_info){
    // initialize svg group
  	var svg = element.append("svg")
  	    .attr("id",p_name)
  	    .attr("height",p_info.options.height)
  	    .attr("width",p_info.options.width);

    // calculate plot dimensions to be used in placing axes, labels, etc.
    plotdim.width = p_info.options.width;
    plotdim.height = p_info.options.height;
    plotdim.graph.width = plotdim.width-margin.left-margin.right;
    plotdim.graph.height = plotdim.height-margin.top-margin.bottom;
    plotdim.xstart = plotdim.margin.left;
    plotdim.xend = plotdim.graph.width+margin.left;
    plotdim.ystart = plotdim.margin.top;
    plotdim.yend = plotdim.graph.height+margin.top;
    plotdim.xlab.x = plotdim.xstart + plotdim.graph.width/2;
    plotdim.xlab.y = axispadding+labelpadding/2;
    plotdim.ylab.x = axispadding+labelpadding/2;
    plotdim.ylab.y = plotdim.yend - plotdim.graph.height/2;
    plotdim.title.x = plotdim.xstart + plotdim.graph.width/2;
    plotdim.title.y = plotdim.margin.top/2;
    
  	svg.x = d3.scale.linear()
  	    //.domain(p_info.ranges.x)
        .domain([0,1])
  	    .range([plotdim.xstart, plotdim.xend]);
  	svg.y = d3.scale.linear()
  	    //.domain(p_info.ranges.y)
        .domain([0,1])
  	    .range([plotdim.yend, plotdim.ystart]);
        
    function isArray(o) {  return Object.prototype.toString.call(o) === '[object Array]'; }
    //forces values to be in an array
    var xaxisvals = [];
    var xaxislabs = [];
    var yaxisvals = [];
    var yaxislabs = [];
    if(isArray(p_info.axis.x)){
      p_info.axis.x.forEach(function(d){xaxisvals.push(d);});
      p_info.axis.xlab.forEach(function(d){xaxislabs.push(d);});
    } else {
      xaxisvals.push(p_info.axis.x);
      xaxislabs.push(p_info.axis.xlab);
    }
    if(isArray(p_info.axis.y)){
      p_info.axis.y.forEach(function(d){yaxisvals.push(d);});
      p_info.axis.ylab.forEach(function(d){yaxislabs.push(d);});
    } else {
      yaxisvals.push(p_info.axis.y);
      yaxislabs.push(p_info.axis.ylab);
    }

    var xaxis = d3.svg.axis()
        .scale(svg.x)
        .tickValues(xaxisvals)
        .tickFormat(function(d) {return xaxislabs[xaxisvals.indexOf(d)].toString()})
        .orient("bottom");
      svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (plotdim.yend) + ")")
        .call(xaxis)
      .append("text")
        .text(p_info.axis.xname)
        .attr("class", "label")
        .style("text-anchor", "middle")
        .attr("transform", "translate("+(plotdim.xlab.x)+","+(plotdim.xlab.y)+")")
        ;
    var yaxis = d3.svg.axis().scale(svg.y)
        .tickValues(yaxisvals)
        .tickFormat(function(d) {return yaxislabs[yaxisvals.indexOf(d)].toString()})
        .orient("left");
      svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate("+(plotdim.xstart)+",0)")
        .call(yaxis)
      .append("text")
        .text(p_info.axis.yname)
        .attr("class", "label")
        .style("text-anchor", "middle")
        .attr("transform", "rotate(270)translate("+(-plotdim.ylab.y)+","+(-plotdim.ylab.x)+")") 
        // translate coordinates are specified in (-y, -x)
        ;
    svg.append("text")
       .text(p_info.title)
       .attr("class", "title")
       .attr("font-family", "sans-serif")
       .attr("font-size", "20px")
       .attr("transform", "translate("+(plotdim.title.x)+","+(plotdim.title.y)+")")
       .style("text-anchor", "middle")
       ;
  	svg.plot = p_info;
  	p_info.geoms.forEach(function(g_name){
  	    SVGs[g_name] = svg;
    });
    Plots[p_name] = p_info;
  }
  var add_selector = function(s_name, s_info){
  	Selectors[s_name] = s_info;
  }
  var update_geom = function(g_name){
  	var svg = SVGs[g_name];
  	var g_info = Geoms[g_name];
  	var data = g_info.data;
  	g_info.subord.forEach(function(aes_name){
      if(aes_name != "group"){
    		var v_name = g_info.subvars[aes_name];
    		var value = Selectors[v_name].selected;
    		if(data.hasOwnProperty(value)){
    		    data = data[value];
    		}else{
    		    data = [];
    		}
      }
  	});
  	var aes = g_info.aes;
  	var toXY = function(xy, a){
	    return function(d){
    		return svg[xy](d[ aes[a] ]);
	    }
  	}
    var elements = svg.selectAll("."+g_info.classed);

  	// TODO: set all of these on a per-item basis. Currently, only
  	// linetype and fill have some support for manual scales. This
  	// needs to be standardized!
  	var base_opacity = 1;
  	if(g_info.params.alpha){
  	    base_opacity = g_info.params.alpha;
  	}
    var get_alpha = function(d){
      var a;
      if(aes.hasOwnProperty("alpha") && d.hasOwnProperty(aes.alpha)){
        try{
      	  a = d[aes.alpha];
	      }catch(err){
	      	a = g_info.params.alpha;
	      }
      } else {
        a = base_opacity;
      }
	    
	    return a;
  	}
  	var size = 2;
  	if(g_info.params.size){
  	    size = g_info.params.size;
  	}
  	var get_size = function(d){
	    if(aes.hasOwnProperty("size") && d.hasOwnProperty(aes.size)){
    		return d[ aes.size ];
	    }
  	    return size;
  	}
    
    var linetype = "solid";
    if(g_info.params.linetype){
      linetype = g_info.params.linetype;
  	}
    var linetypesize2dasharray = function(lt, size){
      var o={
        "blank":size*0+","+size*10,
        "solid":0,
        "dashed":size*4+","+size*4,
        "dotted":size+","+size*2,
        "dotdash":size+","+size*2+","+size*4+","+size*2,
        "longdash":size*8+","+size*4,
        "twodash":size*2+","+size*2+","+size*6+","+size*2,
        "22":size*2+","+size*2,
        "42":size*4+","+size*2,
        "44":size*4+","+size*4,
        "13":size+","+size*3,
        "1343":size+","+size*3+","+size*4+","+size*3,
        "73":size*7+","+size*3,
        "2262":size*2+","+size*2+","+size*6+","+size*2,
        "12223242":size+","+size*2+","+size*2+","+size*2+","+size*3+","+size*2+","+size*4+","+size*2,
        "F282":size*15+","+size*2+","+size*8+","+size*2,
        "F4448444":size*15+","+size*4+","+size*4+","+size*4+","+size*8+","+size*4+","+size*4+","+size*4,
        "224282F2":size*2+","+size*2+","+size*4+","+size*2+","+size*8+","+size*2+","+size*16+","+size*2,
        "F1":size*16+","+size};
        
      if(lt in o) return o[lt]; else return genlinetype2dasharray(lt,size);
    }
    var genlinetype2dasharray = function(lt, size){
      str = lt.split("");
      strnum = str.map(function(d){return size*parseInt(d,16);});
      return strnum;  
    }
  	var get_dasharray = function(d){
  	    var lt;
        if(aes.hasOwnProperty("linetype") && d.hasOwnProperty(aes.linetype)){
          try{
        	  lt = d[aes.linetype];
  	      }catch(err){
  	      	lt = g_info.params.linetype;
  	      }
        } else {
          lt = linetype;
        }
  	    
  	    return linetypesize2dasharray(lt, get_size(d));
  	}
    var colour = "black";
    var fill = "black";
    var get_colour = function(d){
      if(aes.hasOwnProperty("colour") && d.hasOwnProperty(aes.colour)){
        return d[ aes.colour ];
	    }
	    return colour;
  	}
    var get_fill = function(d){
      if(aes.hasOwnProperty("fill") && d.hasOwnProperty(aes.fill)){
  	    return d[ aes.fill ];
	    }
	    return fill;
  	}
  	if(g_info.params.colour){
  	    colour = g_info.params.colour;
  	}
    if(g_info.params.fill){
  	    fill = g_info.params.fill;
  	}
  	var text_anchor = "middle";
  	if(g_info.params.hjust == 0){
  	    text_anchor = "start";
  	}
  	if(g_info.params.hjust == 1){
  	    text_anchor = "end";
  	}

  	var eActions, eAppend;
    //In order to get d3 lines to play nice, bind fake "data" (group id's) -- the kv variable
    //Then each line is plotted using a path object. 
  	if(g_info.geom == "line"){
  	    // case of only 1 line and no groups.
  	    if(!aes.hasOwnProperty("group")){
      		kv = [{"key":0,"value":0}];
      		data = {0:data};
  	    }else{
  		  // we need to use a path for each group.
  		    var kv = d3.entries(d3.keys(data));
      		kv = kv.map(function(d){
      		    d[aes.group] = d.value;
      		    return d;
  	    	});
  	    }
  	    var lineThing = d3.svg.line()
      		.x(toXY("x","x"))
      		.y(toXY("y","y"))
  	    ;
  	    elements = elements.data(kv); //select the correct group before returning anything
  	    eActions = function(e){
      		e.attr("d",function(d){
      		    var one_group = data[d.value];
      		    return lineThing(one_group);
      		})
  		    .style("fill","none")
  		    .style("stroke-width",size)
          .style("stroke", function(group_info){
            var one_group = data[group_info.value];
            var one_row = one_group[0]; // take color for first value in the group
            return(get_colour(one_row));
          })
          .style("stroke-dasharray", function(group_info){
            var one_group = data[group_info.value];
            var one_row = one_group[0]; // take linetype for first value in the group
            return(get_dasharray(one_row));
          })
          .style("stroke-width", function(group_info){
            var one_group = data[group_info.value];
            var one_row = one_group[0]; // take line size for first value in the group
            return(get_size(one_row));
          });
  	    }
  	    eAppend = "path";
  	} else if(g_info.geom == "path"){
  	    // case of only 1 line and no groups.
  	    if(!aes.hasOwnProperty("group")){
      		kv = [{"key":0,"value":0}];
      		data = {0:data};
  	    }else{
  		  // we need to use a path for each group.
  		    var kv = d3.entries(d3.keys(data));
      		kv = kv.map(function(d){
      		    d[aes.group] = d.value;
      		    return d;
  	    	});
  	    }
  	    var lineThing = d3.svg.line()
      		.x(toXY("x","x"))
      		.y(toXY("y","y"))
  	    ;
  	    elements = elements.data(kv); //select the correct group before returning anything
  	    eActions = function(e){
      		e.attr("d",function(d){
      		    var one_group = data[d.value];
      		    return lineThing(one_group);
      		})
  		    .style("fill","none")
  		    .style("stroke-width",size)
          .style("stroke", function(group_info){
            var one_group = data[group_info.value];
            var one_row = one_group[0]; // take color for first value in the group
            return(get_colour(one_row));
          })
          .style("stroke-dasharray", function(group_info){
            var one_group = data[group_info.value];
            var one_row = one_group[0]; // take linetype for first value in the group
            return(get_dasharray(one_row));
          })
          .style("stroke-width", function(group_info){
            var one_group = data[group_info.value];
            var one_row = one_group[0]; // take line size for first value in the group
            return(get_size(one_row));
          });
  	    }
  	    eAppend = "path";
  	}else if(g_info.geom == "polygon"){
        // case of only 1 line and no groups.
  	    if(!aes.hasOwnProperty("group")){
      		kv = [{"key":0,"value":0}];
      		data = {0:data};
  	    }else{
  		  // we need to use a path for each group.
  		    var kv = d3.entries(d3.keys(data));
      		kv = kv.map(function(d){
      		    d[aes.group] = d.value;
      		    return d;
  	    	});
  	    }
  	    var lineThing = d3.svg.line()
      		.x(toXY("x","x"))
      		.y(toXY("y","y"))
  	    ;
  	    elements = elements.data(kv); //select the correct group before returning anything
  	    eActions = function(e){
      		e.attr("d",function(d){
      		    var one_group = data[d.value];
      		    return lineThing(one_group);
      		})
  		    .style("fill", function(group_info){
            var one_group = data[group_info.value];
            var one_row = one_group[0]; // take color for first value in the group
            return(get_fill(one_row));
          })
  		    .style("stroke-width",size)
          .style("stroke", function(group_info){
            var one_group = data[group_info.value];
            var one_row = one_group[0]; // take color for first value in the group
            return(get_colour(one_row));
          })
          .style("stroke-dasharray", function(group_info){
            var one_group = data[group_info.value];
            var one_row = one_group[0]; // take linetype for first value in the group
            return(get_dasharray(one_row));
          })
          .style("stroke-width", function(group_info){
            var one_group = data[group_info.value];
            var one_row = one_group[0]; // take line size for first value in the group
            return(get_size(one_row));
          });
  	    }
  	    eAppend = "path";
  	}else if(g_info.geom == "text"){
  	    elements = elements.data(data);
  	    // TODO: how to support vjust? firefox doensn't support
  	    // baseline-shift... use paths?
  	    // http://commons.oreilly.com/wiki/index.php/SVG_Essentials/Text
  	    eActions = function(e){
  		e.attr("x",function(d){ return svg.x(d[ aes.x ]);})
  		    .attr("y",function(d){ return svg.y(d[ aes.y ]);})
  		    .text(function(d){ return d[aes.label]; })
  		    .style("text-anchor",text_anchor)
  		;
  	    }
  	    eAppend = "text";
  	}else if(g_info.geom == "point"){
  	    elements = elements.data(data);
  	    eActions = function(e){
  		   e.attr("cx",function(d){ return svg.x(d[ aes.x ]);})
  		    .attr("cy",function(d){ return svg.y(d[ aes.y ]);})
  		    .attr("r",get_size)
          .style("fill",get_fill)
          .style("stroke",get_colour)
  		;
  	    }
  	    eAppend = "circle";
  	}else if(g_info.geom == "jitter"){
        elements = elements.data(data);
  	    eActions = function(e){
  		   e.attr("cx",function(d){ return svg.x(d[ aes.x ]);})
  		    .attr("cy",function(d){ return svg.y(d[ aes.y ]);})
  		    .attr("r",get_size)
          .style("fill",get_fill)
          .style("stroke",get_colour)
  		;
  	    }
  	    eAppend = "circle";
  	}else if(g_info.geom == "ribbon"){
        // case of only 1 ribbon and no groups.
  	    if(!aes.hasOwnProperty("group")){
      		kv = [{"key":0,"value":0}];
      		data = {0:data};
  	    }else{
  		  // we need to use a path for each group.
  		    var kv = d3.entries(d3.keys(data));
      		kv = kv.map(function(d){
      		    d[aes.group] = d.value;
      		    return d;
  	    	});
  	    }
  	    var areaThing = d3.svg.area()
      		.x(toXY("x","x"))
          .y(toXY("y","ymax"))
          .y0(toXY("y","ymin"))
  	    ;
        elements = elements.data(kv); //select the correct group before returning anything
        eActions = function(e){
      		e.attr("d",function(d){
      		    var one_group = data[d.value];
      		    return areaThing(one_group);
      		})
          .attr("id", function(d){return d.key;})
  		    .style("fill", function(group_info){
            var one_group = data[group_info.value];
            var one_row = one_group[0]; // take fill for first value in the group
            return(get_fill(one_row));
          })
  		    .style("stroke-width", function(group_info){
            var one_group = data[group_info.value];
            var one_row = one_group[0]; // take size for first value in the group
            return(get_size(one_row));
          })
          .style("stroke", function(group_info){
            var one_group = data[group_info.value];
            var one_row = one_group[0]; // take color for first value in the group
            return(get_colour(one_row));
          })
          .style("stroke-dasharray", function(group_info){
            var one_group = data[group_info.value];
            var one_row = one_group[0]; // take linetype for first value in the group
            return(get_dasharray(one_row));
          })
          .style("stroke-width", function(group_info){
            var one_group = data[group_info.value];
            var one_row = one_group[0]; // take line size for first value in the group
            return(get_size(one_row));
          });
  	    }
  	    eAppend = "path";
  	}else if(g_info.geom == "tallrect"){
        elements = elements.data(data);
  	    eActions = function(e){
  		e.attr("x",function(d){return svg.x(d[aes.xmin]);})
  		    .attr("width",function(d){
  		    	return Math.abs(svg.x(d[ aes.xmax ])-svg.x(d[ aes.xmin ]));
  		    })
  		    .attr("y", svg.y.range()[1])
  		    .attr("height", svg.y.range()[0]-svg.y.range()[1])
  		    .style("fill",get_fill)
          .style("stroke-width", get_size)
          .style("stroke",get_colour)
  		;
  	    }
  	    eAppend = "rect";
  	}else if(g_info.geom == "rect"){
        elements = elements.data(data);
  	    eActions = function(e){
    	   e.attr("x",function(d){return svg.x(d[aes.xmin]);})
    	    .attr("width",function(d) {return Math.abs(svg.x(d[aes.xmax])-svg.x(d[aes.xmin]));})
  		    .attr("y",function(d){return svg.y(d[aes.ymax]);})
  		    .attr("height",function(d) {return Math.abs(svg.y(d[aes.ymax])-svg.y(d[aes.ymin]));})
  		    .style("stroke-dasharray",get_dasharray)
  		    .style("stroke-width",get_size)
  		    .style("stroke",get_colour)
          .style("fill", get_fill)
  		    ;
  	    }
  	    eAppend = "rect";
  	}else if(g_info.geom == "segment"){
        elements = elements.data(data);
  	    eActions = function(e){
  	     e.attr("x1",function(d){return svg.x(d[aes.x]);})
  		    .attr("x2",function(d){return svg.x(d[aes.xend]);})
  		    .attr("y1",function(d){return svg.y(d[aes.y]);})
  		    .attr("y2",function(d){return svg.y(d[aes.yend]);})
  		    .style("stroke-dasharray",get_dasharray)
  		    .style("stroke-width",get_size)
  		    .style("stroke",get_colour)
          ;
  	    }
  	    eAppend = "line";
    }else if(g_info.geom == "linerange"){
        elements = elements.data(data);
        eActions = function(e){
  	     e.attr("x1",function(d){return svg.x(d[aes.x]);})
  		    .attr("x2",function(d){return svg.x(d[aes.x]);})
  		    .attr("y1",function(d){return svg.y(d[aes.ymax]);})
  		    .attr("y2",function(d){return svg.y(d[aes.ymin]);})
  		    .style("stroke-dasharray",get_dasharray)
  		    .style("stroke-width",get_size)
  		    .style("stroke",get_colour)
          ;
  	    }
  	    eAppend = "line";
    }else if(g_info.geom == "vline"){
      elements = elements.data(data);
      eActions = function(e){
		   e.attr("x1",function(d){return svg.x(d[aes.xintercept]);})
		    .attr("x2",function(d){return svg.x(d[aes.xintercept]);})
		    .attr("y1",svg.y.range()[0])
		    .attr("y2",svg.y.range()[1])
		    .style("stroke-dasharray",get_dasharray)
		    .style("stroke-width",get_size)
		    .style("stroke",get_colour)
		;
	    }
	    eAppend = "line"; 
    }else if(g_info.geom == "hline"){  
      //pretty much a copy of geom_vline with obvious modifications
        elements = elements.data(data);
  	    eActions = function(e){
  	  	 e.attr("y1",function(d){return svg.y(d[aes.yintercept]);})
  		    .attr("y2",function(d){return svg.y(d[aes.yintercept]);})
  		    .attr("x1",svg.x.range()[0]+plotdim.margin.left)
  		    .attr("x2",svg.x.range()[1]-plotdim.margin.right)
  		    .style("stroke-dasharray",get_dasharray)
  		    .style("stroke-width",get_size)
  		    .style("stroke",get_colour)
  		;
  	    }
  	    eAppend = "line";
  	}else if(g_info.geom == "boxplot"){  
      fill = "white";
      elements = elements.data(data);
      eActions = function(e){
        e.attr("medianLine", function(d){
            return d.attr("x1",function(d){return svg.x(d[aes.xmin]);})
            .attr("x2",function(d){return svg.x(d[aes.xmax]);})
            .attr("y1",function(d){return svg.y(d[aes.middle]);})
    		    .attr("y2",function(d){return svg.y(d[aes.middle]);})
    		    .style("stroke-dasharray",get_dasharray)
    		    .style("stroke-width",get_size)
    		    .style("stroke",get_colour);
          })
          .attr("box", function(d){
            return d.attr("x",function(d){return svg.x(d[aes.xmin]);})
            .attr("width",function(d) {return svg.x(d[aes.xmax])-svg.x(d[aes.xmin]);})
      	    .attr("y",function(d){return svg.y(d[aes.upper]);})
    		    .attr("height",function(d) {return Math.abs(svg.y(d[aes.upper])-svg.y(d[aes.lower]));})
    		    .style("stroke-dasharray",get_dasharray)
    		    .style("stroke-width",get_size)
    		    .style("stroke",get_colour)
            .style("fill", get_fill);
          })
          .attr("center", function(d){
            return d.attr("x1",function(d){return svg.x(d[aes.x]);})
          .attr("x2",function(d){return svg.x(d[aes.x]);})
  		    .attr("y1",function(d){return svg.y(d[aes.ymin]);})
  		    .attr("y2",function(d){return svg.y(d[aes.ymax]);})
  		    .style("stroke-dasharray",get_dasharray)
  		    .style("stroke-width",get_size)
  		    .style("stroke",get_colour);
          });
      }
      eAppend = "box";
  	}else{
  	    return "unsupported geom "+g_info.geom;
  	}
  	elements.exit().remove();
  	var enter = elements.enter().insert(eAppend, "."+g_info.nextgeom);
  	enter.classed(g_info.classed, 1);
  	if(g_info.aes.hasOwnProperty("clickSelects")){
  	    var notOver = function(d){
  	    	return selectedOpacity(d, g_info.aes.clickSelects, 
  				            get_alpha(d), get_alpha(d)-1/2);
  	    }
  	    elements.style("opacity",notOver)
  		.on("mouseover",function(d){
  		    d3.select(this).style("opacity",function(d){
            return selectedOpacity(d, g_info.aes.clickSelects,
  					                       get_alpha(d), get_alpha(d));
  		    });
  		})
  		.on("mouseout",function(d){
  		    d3.select(this).style("opacity",notOver);
  		})
  		.on("click",function(d){
  		    var v_name = g_info.aes.clickSelects;
  		    update_selector(v_name, d[v_name]);
  		})
  		.text("")
  		.append("svg:title")
  		.text(function(d){
  		    var v_name = g_info.aes.clickSelects;
  		    return v_name+" "+d[v_name];
  		});
  	}else{
      if(g_info.geom=="line"){ // treat lines (groups of points) differently
        enter.style("opacity", function(group_info){
            var one_group = data[group_info.value];
            var one_row = one_group[0]; // take aesthetic for first value in the group
            return(get_alpha(one_row));
          })
      }else if(g_info.geom=="ribbon"){ // treat areas (groups of points) differently
        enter.style("opacity", function(group_info){
            var one_group = data[group_info.value];
            var one_row = one_group[0]; // take aesthetic for first value in the group
            return(get_alpha(one_row));
          })
      }else{
        enter.style("opacity",get_alpha);
      }  	    
  	}
  	eActions(enter);
  	if(g_info.duration){
  	    elements = elements.transition().duration(g_info.duration);
  	}
  	eActions(elements);
  }
  var update_selector = function(v_name, value){
  	Selectors[v_name].selected = value;
  	Selectors[v_name].subset.forEach(update_geom);
  	//Selectors[v_name].hilite.forEach(update_geom);
  }
  var selectedOpacity = function(d, v_name, selected, others){
  	if(d[v_name] == Selectors[v_name].selected){
  	    return selected;
  	}else{
  	    return others;
  	}
  }
  var animateIfInactive = function(){
  	var v_name = Animation.variable;
  	var cur = Selectors[v_name].selected;
  	var next = Animation.next[cur];
  	update_selector(v_name, next);
  	d3.timer(animateIfInactive, Animation.ms);
  }
  
  // Download the main description of the interactive plot.
  d3.json(json_file,function(error, response){
  	// Add plots.
  	for(var p_name in response.plots){
  	    add_plot(p_name, response.plots[p_name]);
  	}
  	// Add selectors.
  	for(var s_name in response.selectors){
  	    add_selector(s_name, response.selectors[s_name]);
  	}
  	// Add geoms and construct nest operators.
  	for(var g_name in response.geoms){
  	    add_geom(g_name, response.geoms[g_name]);
  	}
  	// Start timer if necessary.
  	if(response.time){
   	    Animation.next = {};
  	    Animation.ms = response.time.ms;
  	    Animation.variable = response.time.variable;
  	    var i, prev, cur, seq = response.time.sequence;
  	    for(i=0; i < seq.length; i++){
  		if(i==0){
  		    prev = seq.length;
  		}else{
  		    prev = seq[i-1];
  		}
  		cur = seq[i];
  		Animation.next[prev] = cur;
  	    }
  	    d3.timer(animateIfInactive, Animation.ms);
  	}
  });
}
