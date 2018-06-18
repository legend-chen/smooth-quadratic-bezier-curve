function trace()
{
    var args = arguments;
    var traceInfo = (new Error).stack.split("\n")[2];
    var traceLocation = traceInfo.substring(traceInfo.lastIndexOf(" "));
    
    Array.prototype.push.call(args, traceLocation);
    console.log.apply(null, args);
}

function Vector2D (a, b)
{
    var _this = this;
    _this.x = a || 0;
    _this.y = b || 0;
}

function Vec2DDistanceSq (v1, v2)
{
	var ySeparation = v2.y - v1.y;
	var xSeparation = v2.x - v1.x;
	
	return ySeparation*ySeparation + xSeparation*xSeparation;
}

var BezierCurve = (function(){

	function BezierCurve (p1, c1, c2, p2)
    {
        var _this = this;
        _this.P0 = p1;
        _this.P1 = c1;
        _this.P2 = c2;
        _this.P3 = p2;
    }
    
    var __proto__  = BezierCurve.prototype;

    var epsilon = 0.0001;

    __proto__._bezier_even = function (t)
    {
    	var _this = this;

        var x = t*_this._nBezierLength; //如果按照匀速增长,此时对应的曲线长度  

        var t0, t1, t2, x2, d2, i;
        // First try a few iterations of Newton's method -- normally very fast.
        for (t2 = t, i = 0; i < 8; i++)
        {
            x2 = _this._bezier_length(t2) - x;
            if (Math.abs(x2) < epsilon) return t2;
            d2 = _this._bezier_speed(t2);
            if (Math.abs(d2) < 1e-6) break;
            t2 = t2 - x2 / d2;
        }
        
        // Fall back to the bisection method for reliability.
        t0 = 0.0; t1 = 1.0; t2 = t; 
        if (t2 < t0) return t0;
        if (t2 > t1) return t1;
        
        while (t0 < t1)
        {
            x2 = _this._bezier_length(t2);
            if (Math.abs(x2 - x) < epsilon) return t2;
            (x > x2) ? t0 = t2 : t1 = t2;
            t2 = (t1 - t0) * 0.5 + t0;
        }
        return t2; // Failure. 
    }

    __proto__._bezier_position = function (t, point)
    {
    	var _this = this;
        var P0 = _this.P0;
        var P1 = _this.P1;
        var P2 = _this.P2;
        var P3 = _this.P3;
        // P0 (1 - t)^3 + 3 P1 t (1 - t)^2 + 3 P2 t^2 (1 - t) + P3 t^3;
        var k = 1-t;
        var a = k*k*k;
        var b = 3*t*k*k;
        var c = 3*t*t*k;
        var d = t*t*t;

        point.x = a*P0.x+b*P1.x+c*P2.x+d*P3.x;
        point.y = a*P0.y+b*P1.y+c*P2.y+d*P3.y;
        return point;
        // return new Vector2D(
        //     a*P0.x+b*P1.x+c*P2.x+d*P3.x, 
        //     a*P0.y+b*P1.y+c*P2.y+d*P3.y); 
    }

    __proto__._bezier_speed = function (t)
    {
    	var _this = this;
        var P0 = _this.P0;
        var P1 = _this.P1;
        var P2 = _this.P2;
        var P3 = _this.P3;

        var k = 1-t;
        var a = -3*k*k;
        var b = k*(3*k-6*t);
        var c = t*(-3*t+6*k);
        var d = 3*t*t;

        var vx = a*P0.x+b*P1.x+c*P2.x+d*P3.x;
        var vy = a*P0.y+b*P1.y+c*P2.y+d*P3.y;

        return Math.sqrt(vx*vx+vy*vy);
    }

    //长度方程,使用Simpson积分算法  
    var TOTAL_SIMPSON_STEP = 1000;

    __proto__._bezier_length = function (t)   
    {  
    	var _this = this;
        //在总长度范围内，使用simpson算法的分割数  
        var step = Math.round(TOTAL_SIMPSON_STEP*t);
        
        if (step & 1) step++;
        if (step == 0) return 0;  

        var t_step = t/step;  
      
        var f4 = 0;  
        var f2 = 0;
        var dt = 0;
      
        for (var i=1, n=step; i<n; i++)  
        {  
            dt = t_step * i;
            if(i&1) f4 += _this._bezier_speed(dt); 
            else f2 += _this._bezier_speed(dt);   
        }

        return (_this._bezier_speed(0)+_this._bezier_speed(t)+2*f2+4*f4)*t_step/3;  
    }

    return BezierCurve;
})();


//椭圆曲线公式
var EllipseLength = (function (){

	function EllipseLength(param_a, param_b)   
    {
        var _this = this;

        _this.a = param_a;
        _this.b = param_b;
    }

    var __proto__  = EllipseLength.prototype;

    __proto__._ellipse_speed = function (t)
    {
        var _this = this;
        var x = _this.a*Math.sin(t);
        var y = _this.b*Math.cos(t);
        return Math.sqrt(x*x+y*y);
    }

    var TOTAL_SIMPSON_STEP = 1E4;
    //在总长度范围内，使用simpson算法的分割数  
    __proto__._integration = function (st, ed)
    {
        var _this = this;

        var step = Math.round(TOTAL_SIMPSON_STEP*(ed-st));
        
        if (step & 1) step++;

        var dStep = (ed-st)/step;  
      
        var f4 = 0;  
        var f2 = 0;
        var index = 0;
      
        for (var i=1, n=step; i<n; i++)  
        {  
            index = st + dStep * i;
            if(i&1) f4 += _this._ellipse_speed(index); 
            else f2 += _this._ellipse_speed(index);   
        }
        return (_this._ellipse_speed(st)+_this._ellipse_speed(ed)+2*f2+4*f4)*dStep/3;  
    }

    return EllipseLength;
})();
	
var ellipse = new EllipseLength(100, 100);
var result = ellipse._integration(0, 2*Math.PI) 
trace(result/Math.PI);