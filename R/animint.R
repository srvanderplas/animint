#' Convert a ggplot to a list. Called from gg2animint(). 
#' @param p ggplot2 plot
#' @return list representing a ggplot, with elements, ranges, axes, scales, geoms, and options
#' @export
#' @seealso \code{\link{gg2animint}}
#' @examples
#' gg2list(ggplot() + geom_point(data=data.frame(x=rnorm(100, 3, 1), y=rnorm(100, 5, 1))), aes(x=x, y=y))
#' 
gg2list <- function(p){
  plist <- list(ranges=list(x=c(),y=c()))
  plistextra <- ggplot2::ggplot_build(p)
  for(sc in plistextra$plot$scales$scales){
    # TODO: make use of other scales than manual.
    if(sc$scale_name == "manual"){
      plist$scales[[sc$aesthetics]] <- sc$palette(0)
    }else if(sc$scale_name == "brewer"){
      plist$scales[[sc$aesthetics]] <- sc$palette(length(sc$range$range))
    }else if(sc$scale_name == "hue"){
      plist$scales[[sc$aesthetics]] <- sc$palette(length(sc$range$range))
    }else if(sc$scale_name == "linetype_d"){
      plist$scales[[sc$aesthetics]] <- sc$palette(length(sc$range$range))
    }else if(sc$scale_name == "alpha_c"){
      plist$scales[[sc$aesthetics]] <- sc$palette(sc$range$range)
    }else if(sc$scale_name == "size_c"){
      plist$scales[[sc$aesthetics]] <- sc$palette(sc$range$range)
    }
  }
  for(i in seq_along(plistextra$plot$layers)){
    g <- layer2list(i, plistextra)

    ## Idea: use the ggplot2:::coord_transform(coords, data, scales)
    ## function to handle cases like coord_flip. scales is a list of
    ## 12, coords is a list(limits=list(x=NULL,y=NULL)) with class
    ## e.g. c("cartesian","coord"). The result is a transformed data
    ## frame where all the data values are between 0 and 1. 
    
    # TODO: constant values passed into aes are not transformed.
    g$untransformed <- g$data
    g$data <- ggplot2:::coord_transform(plistextra$plot$coord, g$data,
                                        plistextra$panel$ranges[[1]])
    plist$geoms[[i]] <- g
#     for(ax.name in names(plist$ranges)){
#       plist$ranges[[ax.name]] <-
#         c(plist$ranges[[ax.name]], g$ranges[ax.name,])
#     }
  }
#   plist$ranges <- lapply(plist$ranges, range, na.rm=TRUE)
  
  # Export axis specification as a combination of breaks and
  # labels, on an 0-1 axis scale. This allows transformations 
  # to be used out of the box, with no additional d3 coding. 
  theme.pars <- ggplot2:::plot_theme(p)  
  
  # if("element_blank"%in%attr(theme.pars$axis.text.x, "class")) 
  ## code to get blank elements... come back later?
  plist$axis <- list(
#     x = plistextra$panel$ranges[[1]]$x.major_source,
    x = plistextra$panel$ranges[[1]]$x.major,
    xlab = plistextra$panel$ranges[[1]]$x.labels,
    xname = plistextra$plot$labels$x,
#     y = plistextra$panel$ranges[[1]]$y.major_source,
    y = plistextra$panel$ranges[[1]]$y.major,
    ylab = plistextra$panel$ranges[[1]]$y.labels,
    yname = plistextra$plot$labels$y
  )
  plist$title <- plistextra$plot$labels$title
  plist$options <- list(width=300,height=300)
  plist
}

#' Convert a layer to a list. Called from gg2list()
#' @param i index of layer, in order of call. 
#' @param plistextra output from ggplot2::ggplot_build(p)
#' @return list representing a layer, with corresponding aesthetics, ranges, and groups.
#' @export
#' @seealso \code{\link{gg2animint}}
layer2list <- function(i, plistextra){
  g <- list(geom=plistextra$plot$layers[[i]]$geom$objname,
            data=plistextra$plot$layers[[i]]$data)
  ##str(g$data)
  
  ## g <- list(geom=plistextra$plot$layers[[i]]$geom$objname,
  ##           data=plistextra$data[[i]])
  g$aes <- list()

  calc.geoms <- c("abline", "area", "bar", "bin2d", "boxplot", "contour", "crossbar", "density", "density2d", "dotplot", "errorbar", "freqpoly", "hex", "histogram", "map", "quantile", "smooth", "step", "tile", "raster", "violin", "polygon", "linerange")
  
  # use un-named parameters so that they will not be exported
  # to JSON as a named object, since that causes problems with
  # e.g. colour.
  g$params <- plistextra$plot$layers[[i]]$geom_params
  for(p.name in names(g$params)){
    names(g$params[[p.name]]) <- NULL
  }

  ggdata <- plistextra$data[[i]]
  usegg <- c("colour","fill","linetype","alpha","size","label")
  
  # TODO: Fix non-calculated geoms so that relevant parameters are transformed AND 
  #       clickSelects/showSelected still works.
  if(!g$geom%in%calc.geoms){
    # Populate list of aesthetics
    for(aes.name in names(plistextra$plot$layers[[i]]$mapping)){
      x <- plistextra$plot$layers[[i]]$mapping[[aes.name]]
      ##str(plistextra$data[[i]])
      ##str(g$data)
      g$aes[[aes.name]] <- 
        if(aes.name %in% usegg){
          g$data[[aes.name]] <- ggdata[[aes.name]]
          aes.name
        }else if(is.symbol(x)){
          if(is.factor(g$data[[as.character(x)]])){
            ## BUG: for example in breakpointError$error$layers[[2]],

### Browse[1]> plistextra$data[[i]]
###     x           y group clickSelects PANEL
### 1   1  5.00000000     1          133     1
### 2   2  4.00183002     1          133     1
### 3   3  3.01800018     1          133     1

            ## so since group=bases.per.probe and
            ## clickSelects=bases.per.probe, we end up first
            ## overwriting g$data$bases.per.probe with an integer =>
            ## BUG! Temporary solution: just don't overwrite...? This
            ## causes a problem...

### > Error in Summary.factor(c(4L, 4L, 3L, 3L, 4L, 3L, 4L, 3L, 4L, 2L, 4L,  : 
### range not meaningful for factors

            
            ##g$data[[as.character(x)]] <- plistextra$data[[i]][[aes.name]]
          }
          g$data[[aes.name]] <- plistextra$data[[i]][,aes.name]
          as.character(x)
#           aes.name
        }else if(is.language(x)){
          newcol <- as.character(as.expression(x))
          g$data[[newcol]] <- plistextra$data[[i]][[aes.name]]
          newcol
        }else if(is.numeric(x)){
          newcol <- aes.name
          g$data[[newcol]] <- plistextra$data[[i]][[aes.name]]
          newcol
        }else{
          str(x)
          stop("don't know how to convert")
        }
    }
  } else {
    g$data <- plistextra$data[[i]]
    for(aes.name in names(plistextra$plot$layers[[i]]$mapping))
    g$aes[[aes.name]] <- 
      if(aes.name%in%names(g$data)){
        g$data[[aes.name]] <- plistextra$data[[i]][,aes.name]
        aes.name
      }
  }
  
  # Check g$data for color/fill - convert to hexadecimal.
  toRGB <- function(x) rgb(t(col2rgb(as.character(x))), maxColorValue=255)
  for(color.var in c("colour", "color", "fill")){
    if(color.var %in% names(g$data)){
      g$data[,color.var] <- toRGB(g$data[,color.var])
    }
  }

  if("flip"%in%attr(plistextra$plot$coordinates, "class")){
    oldnames <- names(g$data)
    newnames <- oldnames
    xs <- which(oldnames%in%c("x", "xmin", "xend", "xmax", "xintercept"))
    ys <- which(oldnames%in%c("y", "ymin", "ymax", "yend", "yintercept"))
    
    newnames[xs] <- gsub("x", "y", oldnames[xs])
    newnames[ys] <- gsub("y", "x", oldnames[ys])
    
    names(g$data) <- newnames
  }
  
  some.vars <- c(g$aes[grepl("showSelected",names(g$aes))])
  g$update <- c(some.vars, g$aes[names(g$aes)=="clickSelects"])
  subset.vars <- c(some.vars, g$aes[names(g$aes)=="group"])
  g$subord <- as.list(names(subset.vars))
  g$subvars <- as.list(subset.vars)
  
  if(g$geom=="abline"){
    g$geom <- "segment"
    slope <- plistextra$data[[i]]$slope
    intercept <- plistextra$data[[i]]$intercept
    temp.x <- matrix(plistextra$panel$ranges[[1]]$x.range, ncol=2, nrow=length(slope), byrow=TRUE)
    temp.y <- slope*temp.x+intercept
    g$data <- unique(data.frame(x=temp.x[,1], 
                   xend=temp.x[,2], 
                   y=temp.y[,1], 
                   yend=temp.y[,2]), 
                   group=1:length(slope))
    g$aes$x <- "x"
    g$aes$xend <- "xend"
    g$aes$y <- "y"
    g$aes$yend <- "yend"
    g$aes <- g$aes[-which(names(g$aes)%in%c("intercept", "slope"))]
    g$subvars <- list()
    g$subord <- list()
  } else if(g$geom=="density" | g$geom=="area"){
    g$geom <- "ribbon"
    g$aes$x <- "x"
    g$aes$ymax <- "ymax"
    g$aes$ymin <- "ymin"
  } else if(g$geom=="tile" | g$geom=="raster"){
    g$geom <- "rect"
    g$aes$xmin <- "xmin"
    g$aes$xmax <- "xmax"
    g$aes$ymin <- "ymin"
    g$aes$ymax <- "ymax"
    if(is.null(g$aes$colour) & !is.null(g$aes$fill)){
      g$aes$colour <- g$aes$fill
    }
  } else if(g$geom=="bin2d"){
    stop("bin2d is not supported in animint. Try using geom_tile() and binning the data yourself.")
  } else if(g$geom=="boxplot"){
    # outliers are specified as a list... 
    # change so that they are specified as a single string which can then be parsed in JavaScript.
    # there has got to be a better way to do this!!
    g$data$outliers <- paste("[", sapply(g$data$outliers, FUN=paste, collapse=" , ") , "]", sep="")
    g$aes$xmin <- "xmin"
    g$aes$xmax <- "xmax"
    g$aes$ymin <- "ymin"
    g$aes$ymax <- "ymax"
    g$aes$lower <- "lower"
    g$aes$middle <- "middle"
    g$aes$upper <- "upper"
    g$aes$outliers <- "outliers"
    g$aes$notchupper <- "notchupper"
    g$aes$notchlower <- "notchlower"
    stop("boxplots are not supported in animint")
  } else if(g$geom=="histogram" | g$geom=="bar"){
    g$geom <- "rect"
    g$aes$xmin <- "xmin"
    g$aes$xmax <- "xmax"
    g$aes$ymin <- "ymin"
    g$aes$ymax <- "ymax"
  } else if(g$geom=="linerange"){
    g$data <- unique(g$data)
  }else if(g$geom=="violin"){
    g$geom <- "polygon"
    g$data <- transform(g$data, xminv = x-violinwidth*(x-xmin),xmaxv = x+violinwidth*(xmax-x))
    newdata <- ddply(g$data, .(group), function(df) rbind(arrange(transform(df, x=xminv), y), arrange(transform(df, x=xmaxv), -y)))
    newdata <- ddply(newdata, .(group), function(df) rbind(df, df[1,]))
    g$data <- newdata
  } else if(g$geom=="step"){
    g$geom <- "path"
    datanames <- names(g$data)
    g$data <- ddply(g$data, .(group), function(df) ggplot2:::stairstep(df))
  } else if(g$geom=="contour" | g$geom=="density2d"){
    g$geom <- "path"
    g$aes$group <- "piece"
    # reset g$subord, g$subvars now that group aesthetic exists.
    subset.vars <- c(some.vars, g$aes[names(g$aes)=="group"])
    g$subord <- as.list(names(subset.vars))
    g$subvars <- as.list(subset.vars)
  } else if(g$geom=="freqpoly"){
    g$geom <- "path"
    g$aes$group <- "group"
    g$aes$y <- "y"
    # reset g$subord, g$subvars now that group aesthetic exists.
    subset.vars <- c(some.vars, g$aes[names(g$aes)=="group"])
    g$subord <- as.list(names(subset.vars))
    g$subvars <- as.list(subset.vars)
  } else if(g$geom=="quantile"){
    g$geom <- "path"
    g$aes$group <- "group"
    # reset g$subord, g$subvars now that group aesthetic exists.
    subset.vars <- c(some.vars, g$aes[names(g$aes)=="group"])
    g$subord <- as.list(names(subset.vars))
    g$subvars <- as.list(subset.vars)
  }
  
  

  
  # Use ggplot2's ranges, which incorporate all layers. 
  # Strictly speaking, this isn't "layer" information as much 
  # as it is plot information, but d3 specification is easier 
  # using layers. 
#   g$ranges <- matrix(c(plistextra$panel$ranges[[1]]$x.range, 
#                        plistextra$panel$ranges[[1]]$y.range),
#                      2,2,dimnames=list(axis=c("x","y"),limit=c("min","max")), byrow=TRUE)
  g$ranges <- matrix(c(c(0,1), 
                       c(0,1)),
                     2,2,dimnames=list(axis=c("x","y"),limit=c("min","max")), byrow=TRUE)
  
  # Old way of getting ranges... still needed for handling Inf values.
#     range.map <- c(xintercept="x",x="x",xend="x",xmin="x",xmax="x",
#                    yintercept="y",y="y",yend="y",ymin="y",ymax="y")
#     for(aesname in names(range.map)){
#       if(aesname %in% names(g$aes)){
#         var.name <- g$aes[[aesname]]
#         ax.name <- range.map[[aesname]]
#         v <- g$data[[var.name]]
#         if(is.factor(v)){
#           g$data[[var.name]] <- ggdata[[aesname]]
#         }else{
#           r <- range(v, na.rm=TRUE, finite=TRUE)
#           ## TODO: handle Inf like in ggplot2.
#           size <- r[2]-r[1]
#           rowidx <- which(dimnames(g$ranges)$axis%in%ax.name)
#           if(length(rowidx)>0){
#             g$data[[var.name]][g$data[[var.name]]==Inf] <- g$ranges[rowidx,2]
#             g$data[[var.name]][g$data[[var.name]]==-Inf] <- g$ranges[rowidx,1]
#           }
#         }          
#       }
#     }
  g
}

#' Workhorse function for the animint package.
#' Convert a list of ggplots to a d3-ready graphic. 
#' Adds aesthetics clickSelects and updateSelected to utilize 
#' d3's mouseover and interactivity features for multiple linked plots,
#' and allows animated sequences of graphics. 
#' 
#' Supported ggplot2 geoms: 
#' \itemize{
#' \item point 
#' \item jitter
#' \item line
#' \item rect
#' \item tallRect (new with this package)
#' \item segment
#' \item hline
#' \item vline
#' \item bar
#' \item text
#' \item tile
#' \item raster
#' \item ribbon
#' \item abline
#' \item density
#' \item path
#' \item polygon
#' \item histogram
#' \item violin
#' \item linerange
#' \item step
#' \item contour
#' \item density2d
#' \item area
#' \item freqpoly
#' }
#' Unsupported geoms: 
#' \itemize{
#' \item rug
#' \item dotplot
#' \item hex
#' \item quantile - should *theoretically* work but in practice does not work
#' \item smooth - can be created using geom_line and geom_ribbon
#' \item boxplot - can be created using geom_rect and geom_segment
#' \item crossbar - can be created using geom_rect and geom_segment
#' \item pointrange - can be created using geom_linerange and geom_point
#' \item bin2d - bin using ddply() and then use geom_tile()
#' \item map - can be created using geom_polygon or geom_path
#'}
#' Supported scales: 
#' \itemize{
#' \item alpha, 
#' \item fill/colour (brewer, gradient, identity, manual)
#' \item linetype
#' \item x and y axis scales, manual break specification, manual labels
#' \item area 
#' \item size
#' }
#' Unsupported scales: 
#' \itemize{
#' \item shape. Open and closed circles can be represented by manipulating fill and colour scales and using default (circle) points, but d3 does not support many R shape types, so mapping between the two is difficult.
#' }
#' TODO: 
#' \itemize{
#' \item add legends
#' }
#' 
#' @title gg2animint
#' @param plot.list list of named ggplots with showSelected and clickSelects aesthetics. Input must be a list, so to use a single ggplot named g, it must be passed to the function as plot.list = list(g=g).
#' @param out.dir directory to store html/js/csv files 
#' @param open.browser Should R open a browser? Note: Chrome will not display local html files unless you are running a local webserver or have launched chrome with the option --allow-file-access-from-files. Firefox should display local html files (including those containing javascript).
#' @return invisible list of ggplots in list format
#' @export 
#' @seealso \code{\link{ggplot2}}
#' @example examples/breakpointExamples.R
gg2animint <- function(plot.list, out.dir=tempfile(), open.browser=interactive()){
  ## Check that it is a list and every element is named.
  stopifnot(is.list(plot.list))
  stopifnot(!is.null(names(plot.list)))
  stopifnot(all(names(plot.list)!=""))
  
  plist <- list() ## for extracted plots.
  olist <- list() ## for options.
  df.list <- list() ## for data.frames so we can look at their values
  ## to create an animation.
  
  ## Extract essential info from ggplots, reality checks.
  for(plot.name in names(plot.list)){
    p <- plot.list[[plot.name]]
    if(is.ggplot(p)){
      plist[[plot.name]] <- gg2list(p)
    }else if(is.list(p)){ ## for options.
      olist[[plot.name]] <- p
    }else{
      stop("list items must be ggplots or option lists")
    }
  }
  
  dir.create(out.dir,showWarnings=FALSE)
  i <- 1 #geom counter.
  result <- list(geoms=list(), selectors=list(), plots=list())
  for(plot.name in names(plist)){
    p <- plist[[plot.name]]
    result$plots[[plot.name]]$geoms <- list()
    for(g in p$geoms){
      g$classed <- sprintf("geom%d_%s_%s", i, g$geom, plot.name)
      result$plots[[plot.name]]$geoms <-
        c(result$plots[[plot.name]]$geoms, g$classed)
      df.list[[g$classed]] <- g$data
      ## Construct the selector.
      for(v.name in g$update){
        if(!v.name %in% names(result$selectors)){
          ## select the first one. TODO: customize.
          result$selectors[[v.name]] <- list(selected=g$data[[v.name]][1])
        }
        result$selectors[[v.name]]$subset <-
          c(result$selectors[[v.name]]$subset, list(g$classed))
      }
      ## Output data to csv.
      csv.name <- sprintf("%s.csv", g$classed)
      write.csv(g$data, file.path(out.dir, csv.name),
                quote=FALSE,row.names=FALSE)
      
      ## Output types
      ## Check to see if character type is d3's rgb type. 
      is.linetype <- function(x){
        x <- tolower(x)
        namedlinetype <- x%in%c("blank", "solid", "dashed", "dotted", "dotdash", "longdash", "twodash")
        xsplit <- sapply(x, function(i) sum(is.na(strtoi(strsplit(i,"")[[1]],16)))==0)
        return(namedlinetype | xsplit)
      }
      g$types <- as.list(sapply(g$data, class))
      charidx <- which(g$types=="character")
      g$types[charidx] <- sapply(charidx, function(i) 
        if(sum(!is.rgb(g$data[[i]]))==0){"rgb"
        }else if(sum(!is.linetype(g$data[[i]]))==0){"linetype"
        }else if(names(g$data[[i]])=="label"){ "label"
        }else "character")
      
      g$data <- csv.name
      ## Finally save to the master geom list.
      result$geoms[[g$classed]] <- g
      i <- i+1
    }
    result$plots[[plot.name]]$scales <- p$scales
    result$plots[[plot.name]]$options <- p$options
    result$plots[[plot.name]]$ranges <- p$ranges
    result$plots[[plot.name]]$axis <- p$axis
    result$plots[[plot.name]]$title <- p$title
  }
  ## add nextgeom so that drawing order is preserved.
  
  if(length(result$geoms)-1>0){
    for(i in 1:(length(result$geoms)-1)){
      result$geoms[[i]]$nextgeom <- result$geoms[[i+1]]$classed
    }
  }
  ## Go through options and add to the list.
  for(v.name in names(olist$duration)){
    for(g.name in result$selectors[[v.name]]$subset){
      result$geoms[[g.name]]$duration <- olist$duration[[v.name]]
    }
  }
  ## Set plot sizes.
  for(d in c("width","height")){
    if(is.list(olist[[d]])){
      if(is.null(names(olist[[d]]))){ #use this size for all plots.
        for(plot.name in names(result$plots)){
          result$plots[[plot.name]]$options[[d]] <- olist[[d]][[1]]
        }
      }else{ #use the size specified for the named plot.
        for(plot.name in names(olist[[d]])){
          result$plots[[plot.name]]$options[[d]] <- olist[[d]][[plot.name]]
        }
      }
    }
  }
  if(is.list(olist$time)){
    v.name <- olist$time$variable
    geom.names <- result$selectors[[v.name]]$subset
    u.list <- lapply(geom.names,function(g)unique(df.list[[g]][,v.name]))
    olist$time$sequence <- sort(unique(unlist(u.list)))
    result$time <- olist$time
  }
  ## Finally, copy html/js/json files to out.dir.
  src.dir <- system.file("htmljs",package="animint")
  to.copy <- Sys.glob(file.path(src.dir, "*"))
  file.copy(to.copy, out.dir, overwrite=TRUE)
  json <- RJSONIO::toJSON(result)
  cat(json,file=file.path(out.dir,"plot.json"))
  if(open.browser){
    browseURL(sprintf("%s/index.html",out.dir))
  }
  invisible(result)
  ### An invisible copy of the R list that was exported to JSON.
}


#' Check if character is an RGB hexadecimal color value
#' @param x character 
#' @return True/False value
#' @export 
is.rgb <- function(x){
  grepl("NULL", x) | (grepl("#", x) & nchar(x)==7)
}
