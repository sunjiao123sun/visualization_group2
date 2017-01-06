/*
 * Leaflet Canvas Flows Layer
 *
 * Copyright (c) 2015, kyo (sinokyo@163.com)
 */

L.CanvasLayer.Flows = L.CanvasLayer.extend({
	options: {
		weight: -3.2,
		reverse: false,
		clickable: false,
		asyn: false
	},
	_beziers: [],
	_controls: [],
	_flowend: false,
	_animid: null,
	
	initialize: function(options) {
		L.CanvasLayer.prototype.initialize.call(this, options);
	},
	
	onRemove: function(map) {
		this.clear();
		L.CanvasLayer.prototype.onRemove.call(this, map);
	},
	
	setData: function(data) {
		this.stop();
		this._data = data;
		this._updateBeziers();
		this.options.asyn ? this._animateAsyn() : this._animate();
	},
	
	_update: function() {
		if (!this._data) {
			return;
		}
		this._updateBeziers();
		
		if (!this._flowend) {
			this.options.asyn ? this._animateAsyn() : this._animate();
			return;
		}
		var size = this._map.getSize(),
			ctx = this._canvas.getContext('2d'),
			from, to;
		
		if (this.options.reverse) {
			from = this._data.to;
			to = this._data.from;
		} else {
			from = this._data.from;
			to = this._data.to;
		}
		var	ops = this.options,
			p0, pp0, p2, pp2, p, bezier;
		
		ctx.clearRect(0, 0, size.x, size.y);
		ctx.globalCompositeOperation = "lighten";
		//if(ops.weight!=2){
			//ctx.shadowOffsetX=5;
			//ctx.shadowOffsetY=5;
			//ctx.shadowBlur=5;
			//ctx.shadowColor="rgba(0,0,0,0.5)";
		//}
		
		for (var i = 0; i < from.length; i++) {
			p0 = from[i];
			pp0 = this._latLng2Screen(p0[1], p0[0]);
			
			for (var j = 0; j < to[i].length; j++) {
				p2 = to[i][j];
				pp2 = this._latLng2Screen(p2[1], p2[0]);
				p = this._controls[i][j];
				bezier = this._beziers[i][j];
				
				// Curve Background
				ctx.lineWidth = ops.weight + 4;
				ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
				this._curve(ctx, pp0, p, pp2);
				
				// Curve
				ctx.lineWidth = ops.weight;
				ctx.strokeStyle = this._color(j, 0.8);
				this._curve(ctx, pp0, p, pp2);
				
				// Arrow
				ctx.fillStyle = this._color(j, 1);
				this._arrow(ctx, bezier[bezier.length - 1], bezier[bezier.length - 2]);
			}
		}
	},
	
	_animate: function() {
		// synchronize
		if (!this._data) {
			return;
		}
		if (this._animid) {
			L.Util.cancelAnimFrame(this._animid);
			this._animid = null;
		}
		var size = this._map.getSize(),
			ctx = this._canvas.getContext('2d'),
			beziers = this._beziers,
			ops = this.options,
			that = this,
			start = 0,
			end = 40,
			coords;
		
		var _anim = function() {
			++start;
			
			if (start <= end) {
				ctx.clearRect(0, 0, size.x, size.y);
				ctx.globalCompositeOperation = "lighten";
				//if(ops.weight!=2){
					//ctx.shadowOffsetX=5;
					//ctx.shadowOffsetY=5;
					//ctx.shadowBlur=5;
					//ctx.shadowColor="rgba(0,0,0,0.5)";
				//}
				for (var i = 0; i < beziers.length; i++) {
					for (var j = 0; j < beziers[i].length; j++) {
						coords = beziers[i][j].slice(0, start);
						
						ctx.lineWidth = ops.weight + 4;
						ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
						that._line(ctx, coords);
						
						ctx.lineWidth = ops.weight;
						ctx.strokeStyle = that._color(j, 0.8);
						that._line(ctx, coords);
						
						if (start > 1) {
							ctx.fillStyle = that._color(j, 1);
							that._arrow(ctx, coords[coords.length - 1], coords[coords.length - 2]);
						}
					}
				}
				that._animid = L.Util.requestAnimFrame(_anim, that);
			} else {
				L.Util.cancelAnimFrame(that._animid);
				that._flowend = true;
				that._update();
				that.fire('flowend', { data:that._data });
			}
		};
		this._animid = L.Util.requestAnimFrame(_anim, this);
	},
	
	_animateAsyn: function() {
		// asynchronism
		if (!this._data) {
			return;
		}
		if (this._animid) {
			L.Util.cancelAnimFrame(this._animid);
			this._animid = null;
		}
		var size = this._map.getSize(),
			ctx = this._canvas.getContext('2d'),
			beziers = this._beziers,
			ops = this.options,
			that = this,
			start = 0,
			end = 0,
			i, j, c, k, coords;
		
		for (i = 0; i < beziers.length; i++) {
			end += beziers[i].length;
		}
		var _anim = function() {
			++start;
			
			if (start <= end) {
				ctx.clearRect(0, 0, size.x, size.y);
				c = 0;
				k = start;
				
				for (i = 0; i < beziers.length; i++) {
					if ((k -= beziers[i].length) <= 0) {
						break;
					}
					++c;
				}
				k += beziers[c].length;	// add last deleted points
				
				for (j = 0; j < c; j++) {
					coords = beziers[j];
					
					ctx.lineWidth = ops.weight + 4;
					ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
					that._line(ctx, coords);
					
					ctx.lineWidth = ops.weight;
					ctx.strokeStyle = that._color(j, 0.8);
					that._line(ctx, coords);
					
					ctx.fillStyle = that._color(j, 1);
					that._arrow(ctx, coords[coords.length - 1], coords[coords.length - 2]);
				}
				if (k > 1) {
					coords = beziers[j].slice(0, k);
					
					ctx.lineWidth = ops.weight + 4;
					ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
					that._line(ctx, coords);
					
					ctx.lineWidth = ops.weight;
					ctx.strokeStyle = that._color(j, 0.8);
					that._line(ctx, coords);
					
					ctx.fillStyle = that._color(j, 1);
					that._arrow(ctx, coords[coords.length - 1], coords[coords.length - 2]);
				}
				that._animid = L.Util.requestAnimFrame(_anim, that);
			} else {
				L.Util.cancelAnimFrame(that._animid);
				that._flowend = true;
				that._update();
				that.fire('flowend', { data:that._data });
			}
		};
		this._animid = L.Util.requestAnimFrame(_anim, this);
	},
	
	_curve: function(ctx, p1, p, p2) {
		ctx.beginPath();
		ctx.moveTo(p1.x, p1.y);
		ctx.quadraticCurveTo(p.x, p.y, p2.x, p2.y);
		ctx.stroke();
		ctx.closePath();
	},
	
	_line: function(ctx, coords) {
		if (!coords || coords.length < 1) {
			return;
		}
		ctx.beginPath();
		ctx.moveTo(coords[0][0], coords[0][1]);
		
		for (var i = 1; i < coords.length; i++) {
			ctx.lineTo(coords[i][0], coords[i][1]);
		}
		ctx.stroke();
		ctx.closePath();
	},
	
	_arrow: function(ctx, p1, p2) {
		return;
		var angle = this._angle(p1, p2),
			pts = this._arrowPoints(p1);
		
		ctx.save();
		ctx.beginPath();
		ctx.translate(p1[0], p1[1]);
		ctx.moveTo(0, 0);
		ctx.rotate(angle);
		
		for (var i = 0; i < pts.length; i++) {
			ctx.lineTo(pts[i].x - p1[0], pts[i].y - p1[1]);
		}
		ctx.fill();
		ctx.restore();
	},
	
	_angle: function(p1, p2) {
		if (p1[0] === p2[0]) {
			if (p1[1] > p2[1]) {
				return Math.PI;
			}
			return 0;
		}
		if (p1[1] === p2[1]) {
			if (p1[0] < p2[0]) {
				return -Math.PI / 2;
			}
			return Math.PI / 2;
		}
		if (p1[0] < p2[0]) {
			if (p1[1] < p2[1]) {
				return -Math.atan((p2[0] - p1[0]) / (p2[1] - p1[1]));
			}
			return -Math.PI / 2 - Math.atan((p2[1] - p1[1]) / (p1[0] - p2[0]));
		}
		if (p1[1] < p2[1]) {
			return Math.atan((p1[0] - p2[0]) / (p2[1] - p1[1]));
		}
		return Math.PI / 2 + Math.atan((p1[1] - p2[1]) / (p1[0] - p2[0]));
	},
	
	_arrowPoints: function(p1) {
		var r = 8,
			a1 = {},
			a2 = {},
			a3 = {},
			sq3 = Math.sqrt(3);
		
		a2.x = p1[0];
		a2.y = p1[1] + r;
		a1.x = Math.round(p1[0] - r * sq3 / 2);
		a3.x = Math.round(p1[0] + r * sq3 / 2);
		a1.y = a3.y = p1[1] + r * 3 / 2;
		return [a1, a2, a3];
	},
	
	_updateBeziers: function() {
		this._beziers = [];
		this._controls = [];
		
		var geo = this._data.geo,
			from, to, p1, pp1, p2, pp2, p, bezier;
		
		if (this.options.reverse) {
			from = this._data.to;
			to = this._data.from;
		} else {
			from = this._data.from;
			to = this._data.to;
		}
		for (var i = 0; i < from.length; i++) {
			p1 = from[i];
			pp1 = this._latLng2Screen(p1[1], p1[0]);
			this._beziers[i] = [];
			this._controls[i] = [];
			
			for (var j = 0; j < to[i].length; j++) {
				p2 = to[i][j];
				pp2 = this._latLng2Screen(p2[1], p2[0]);
				
				if (this.options.reverse) {
					p = this._controlPoint(pp2, pp1);
					bezier = this._bezier(pp2, p, pp1);
				} else {
					p = this._controlPoint(pp1, pp2);
					bezier = this._bezier(pp1, p, pp2);
				}
				this._beziers[i].push(bezier);
				this._controls[i].push(p);
			}
		}
	},
	
	_bezier: function(p1, p, p2) {
		var coords = [],
			d = 0.025,
			x, y, pre;
		
		for (var i = 0; i <= 1; i += d) {
			x = Math.pow(1 - i, 2) * p1.x + 2 * i * (1 - i) * p.x + Math.pow(i, 2) * p2.x;
			y = Math.pow(1 - i, 2) * p1.y + 2 * i * (1 - i) * p.y + Math.pow(i, 2) * p2.y;
			
			if (coords.length > 0) {
				pre = coords[coords.length - 1];
				
				if (pre[0] === x && pre[1] === y) {
					continue;	// do not add a next same point
				}
			}
			coords.push([x, y]);
		}
		pre = coords[coords.length - 1];
		
		if (pre[0] !== p2.x || pre[1] !== p2.y) {
			coords.push([p2.x, p2.y]);	// add last point
		}
		return coords;
	},
	
	_color: function(i, opacity) {
		var colors = this._data.colors;
		return 'rgba(' + colors[i % colors.length].concat(opacity).join(',') + ')';
	},
	
	stop: function() {
		if (this._animid) {
			L.Util.cancelAnimFrame(this._animid);
			this._animid = null;
		}
		var size = this._map.getSize();
		this._canvas.getContext('2d').clearRect(0, 0, size.x, size.y);
		this._flowend = false;
	},
	
	clear: function() {
		this.stop();
		this._data = null;
	}
});

L.CanvasLayer.flows = function(options) {
    return new L.CanvasLayer.Flows(options);
};