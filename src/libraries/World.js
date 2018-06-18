/**
 * Created by legend on 16/12/7.
 */
/*
 * Copyright (C) 2012 Legend Chen.  All rights reserved.
 */
// 2015-11-20 foundation of graphics
// 2016-12-12 uniform points on cubic bezier curve
// 2018-6-18 update graphics
(function (){
    var style = document.createElement("style"),
    styleText = "body {position:absolute; top:0; left:0; right:0; bottom:0; cursor:default}";
    style.type = 'text/css';
    style.appendChild(document.createTextNode(styleText));
    document.getElementsByTagName('head')[0].appendChild(style);
    
    function onReady()
    {
        var clientWidth = document.body.offsetWidth;
        var clientHeight = document.body.offsetHeight;

        //initialize a working canvas to draw Graphics
        stage =
        {
            // canvas: canvas, 
            // graphics: context,
            graphics: Graphics.create(clientWidth, clientHeight),
            clientWidth: clientWidth,
            clientHeight: clientHeight,
            centerX: clientWidth >> 1,
            centerY: clientHeight >> 1
        };

        var device = stage.graphics;

        document.body.appendChild(device._canvas);

        document.body.insertAdjacentHTML("beforeEnd", "<div style=\"position:absolute;top:0\">" + 
            //clientWidth + " × " + clientHeight + 
            // "<br />devicePixelRatio = " + devicePixelRatio + 
            "<a href='http://github.com/legend-chen/smooth-quadratic-bezier-curve' style='line-height:12px;font-size:12px'> http://github.com/legend-chen/smooth-quadratic-bezier-curve</a>"
            + "</div>");
    }
    
    window.addEventListener("DOMContentLoaded", onReady);

})();


var stage;

(function(){
        
    var PerfCountFreq   = 30
    var TimeScale       = 1 / PerfCountFreq

    var dBoundarySize   = 100;
    var dDataNumber     = 16;


    var vPointA = new Vector2D(-dBoundarySize * 2, -dBoundarySize * 2);
    var vPointB = new Vector2D(dBoundarySize * 2, dBoundarySize * 2);
    var vControlC = new Vector2D(-dBoundarySize * 2, 0);
    var vControlD = new Vector2D(dBoundarySize * 2, 0);
    
    var pBoundaryShape;

    var pVertexsArray = [];
    var pBezierControls = [vPointA, vControlC, vControlD, vPointB];
    var pBoundaryShape = [new Vector2D(-1, -1),
            new Vector2D(-1, 1),
            new Vector2D(1, 1),
            new Vector2D(1, -1)];
        
    pBoundaryShape.forEach(function (pVertex)
    {
        pVertex.x *= dBoundarySize;
        pVertex.y *= dBoundarySize;
    });

    var pBezier = new BezierCurve(vPointA, vControlC, vControlD, vPointB);

    function onRenderBezier (time_elapsed)
    {
        var gdi = stage.graphics;

        pBezier._nBezierLength = pBezier._bezier_length(1);
        //598.1526117893177
        //598.1126117893177 600
        //trace(nBezierLength, bezier_speed(0));

        for (var i = 1, n=dDataNumber; i < n; i++)
        {
            var t = i/n;
            t = pBezier._bezier_even(t);

            var vertex = pVertexsArray[i]

            if (vertex == undefined)
            {
                vertex = new Vector2D();
                pVertexsArray[i] = vertex;
            }

            pBezier._bezier_position(t, vertex);
            
        }

        gdi._clear();

        //drawBackground
        gdi._context.beginPath();
        gdi._drawPolygon(pBoundaryShape);
        gdi._stroke("rgb(0,0,0)", 1);
        gdi._fill("#dad8f9", 1);

        pVertexsArray.forEach(function (point, index)
        {
            //drawPoint
            gdi._context.beginPath();
            gdi._context.arc(point.x, -point.y, 4, 0, Math.PI * 2, false);
            gdi._stroke("#000", 1);

            //drawPointLabel
            gdi._context.beginPath();
            gdi._fill("#000", 1);
            gdi._context.fillText(index, point.x + 4, -point.y);


            });


        pBezierControls.forEach(function (point, index)
            {
                //drawControlPoint
                var color = index == 0 || index == 3 ? "#F00" : "#00F";
                gdi._context.beginPath();
                gdi._context.arc(point.x, -point.y, 4, 0, Math.PI * 2, false);
                gdi._stroke(color, 1);

                //drawControlPointLabel
                gdi._context.beginPath();
                gdi._fill(index == 0 || index == 3 ? "#F00" : "#00F", 1);
                gdi._context.fillText(index, point.x + 4, -point.y);
            
            });
    }

    function onReady()
    {
        var last_timestamp;
        var frame_animation = requestAnimationFrame;
        function draw(timestamp)
        {
            var time_elapsed = (timestamp - last_timestamp) * TimeScale || 0;
            last_timestamp = timestamp;

            if (isNeedRedrawing)
            {
                onRenderBezier(time_elapsed);

                isNeedRedrawing = false;
                //Render(time_elapsed);
            }

            frame_animation(draw);
        }
        
        frame_animation(draw);
    }
    
    window.addEventListener("load", onReady);

    var isCaptured;
    var isNeedRedrawing = true;
    var vSelectedPoint;

    var vPoint = new Vector2D();

    function onMouseDown(event)
    {
        convertToCoordinates(event, vPoint);

        isCaptured = true;
        vSelectedPoint = undefined;

        for (var i = 0, n=4; i < n; i++)
        {
            var pVertex = pBezierControls[i];

            var distance2q = Vec2DDistanceSq(pVertex, vPoint);

            // trace(pVertex, vPoint)
            if (distance2q < 100)
            {
                vSelectedPoint = pVertex;
                break;
            }
        }

        //trace("mousedown", event.target.offsetLeft)
    }

    function onMouseMove()
    {
        if (isCaptured)
        {
            convertToCoordinates(event, vPoint);

            if (vSelectedPoint)
            {
                vSelectedPoint.x = vPoint.x;
                vSelectedPoint.y = vPoint.y;
                isNeedRedrawing = true;
            }
            //trace("mousemoe", vSelectedPoint)
        }
    }

    function onMouseUp()
    {
        isCaptured = false;
    }

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("keydown", function (event)
        {
            if (event.keyCode == 68 && event.metaKey)
            {
                disableDefault(event)
//                println("cmd + shirt+ d");
                saveCvs("demo.png", stage.graphics._canvas);
            }
           
        });

    function disableDefault(event)
    {
        event.stopPropagation();
        event.preventDefault();
    };

    function saveCvs (fName, canvas)
    {   
        var url = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");   
        // var url = URL.createObjectURL(new Blob([fBlob], {type:'application/x-download'}));
        var link = document.createElement('a');
        link.href = url;
        link.download = fName;

        var event = document.createEvent('MouseEvents');
        event.initMouseEvent('click');
        link.dispatchEvent(event);
        //URL.revokeObjectURL(url);
    };
    
    function convertToCoordinates(event, point)
    {
        var pageX = event.pageX;
        var pageY = event.pageY;
        var clientRect = event.target.getBoundingClientRect();
        point.x = pageX - clientRect.left - stage.centerX;
        point.y = pageY - clientRect.top  - stage.centerY;
        point.y = -point.y;
    }

})();

