/*
 * Leaflet Canvas Layer
 *
 * Copyright (c) 2015, kyo (sinokyo@163.com)
 */

L.CanvasLayer = (L.Layer ? L.Layer : L.Class).extend({
	includes: [L.Mixin.Events],
	
	options: {
		fill: true,
		fillColor: 'rgba(51, 153, 255, 0.25)',
		stroke: true,
		color: 'rgba(51, 153, 255, 0.5)',
		weight: 1,
		clickable: true,
		zoomAnimation: true,
		redrawWhenMove: false
	},
	
	initialize: function(options) {
		L.setOptions(this, options);
	},
	
	onAdd: function(map) {
		this._map = map;
		this._initCanvas();
		this._initEvents();
		map.getPanes().overlayPane.appendChild(this._canvas);
		
		if (this.options.redrawWhenMove) {
			map.on('move', this.redraw, this);
		}
		map.on('moveend', this.redraw, this);
		this._draw();
	},
	
	onRemove: function(map) {
		map.getPanes().overlayPane.removeChild(this._canvas);
		map.off('moveend', this.redraw, this);
		
		if (this.options.redrawWhenMove) {
			map.off('move', this.redraw, this);
		}
		if (this.options.clickable) {
			map.off({
				'mousemove': this._mouseMove,
				'click': this._click
			}, this);
		}
		if (this.options.zoomAnimation && L.Browser.any3d) {
			map.off({
				'zoomanim': this._animateZoom,
				'zoomend': this._endZoom
			}, this);
		}
	},
	
	addTo: function(map) {
		map.addLayer(this);
		return this;
	},
	
	setData: function(data) {
		this._data = data;
		this.redraw();
	},
	
	redraw: function() {
		this._draw();
	},
	
	_draw: function() {
		if (this._map && this._canvas) {
			this._updateCanvasViewport();
			this._update();
		}
	},
	
	_update: function() {
		// implement in inherited layers
	},
	
	_initCanvas: function() {
		this._canvas = L.DomUtil.create('canvas');
		this._canvas.style.position = 'absolute';
		
		if (this.options.zoomAnimation && L.Browser.any3d) {
			this._canvas.className = 'leaflet-zoom-animated';
			this._map.on('zoomanim', this._animateZoom, this);
			this._map.on('zoomend', this._endZoom, this);
		} else {
			this._canvas.className = 'leaflet-zoom-hide';
		}
	},
	
	_initEvents: function() {
		if (this.options.clickable) {
			this._map.on('mousemove', this._mouseMove, this);
			this._map.on('click', this._click, this);
		}
	},
	
	_mouseMove: function(e) {
		if (!this._map || this._zooming) {
			return;
		}
		// TODO don't do on each move
		var feature = this._getFeature(e.layerPoint);
		
		if (feature) {
			this._canvas.style.cursor = 'pointer';
			this._mouseInside = true;
			this.fire('mouseover', e);
			
		} else if (this._mouseInside) {
			this._canvas.style.cursor = '';
			this._mouseInside = false;
			this.fire('mouseout', e);
		}
	},
	
	_click: function(e) {
		if (this._map.dragging && this._map.dragging.moved()) {
			return;
		}
		var feature = this._getFeature(e.layerPoint);
		
		if (feature) {
			e.feature = feature;
			this.fire('click', e);
		}
	},
	
	_updateCanvasViewport: function() {
		if (this._zooming) {
			return;
		}
		this._updateViewport();
		
		// TODO check if this works properly on mobile webkit
		L.DomUtil.setPosition(this._canvas, this._viewport.min);
	},
	
	_updateViewport: function() {
		var size = this._map.getSize(),
		    panePos = L.DomUtil.getPosition(this._map._mapPane),
		    min = panePos.multiplyBy(-1)._round(),
		    max = min.add(size.multiplyBy(1)._round());
		
		this._canvas.width = size.x,
		this._canvas.height = size.y;
		this._viewport = new L.Bounds(min, max);
	},
	
	_animateZoom: function(e) {
		var scale = this._map.getZoomScale(e.zoom),
		    offset = this._map._getCenterOffset(e.center)._multiplyBy(-scale)._add(this._viewport.min);
		
		this._canvas.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString(offset) + ' scale(' + scale + ') ';
		this._zooming = true;
	},
	
	_endZoom: function() {
		this._zooming = false;
	},
	
	_getFeature: function(point) {
		var projs = this._projs || [],
			parts;
		
		for (var i = 0; i < projs.length; i++) {
			parts = projs[i];
			
			if (parts && this._containsPoint(parts, point)) {
				return this._data.features[i];
			}
		}
		return null;
	},
	
	_controlPoint: function(p1, p2) {
		var x = (p1.x + p2.x) / 2,
			y = (p1.y + p2.y) / 2,
			d = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p1.y, 2)),
			delta = d / 5;
		
		if (p1.x === p2.x) {
			if (p1.y > p2.y) {
				return [x - delta, y];
			} else {
				return [x + delta, y];
			}
		} else if (p1.y === p2.y) {
			if (p1.x > p2.x) {
				return { x:x, y:y + delta };
			} else {
				return { x:x, y:y - delta };
			}
		} else {
			var cx = x + (p2.y - p1.y) / 5,
				cy = y + (x - cx) * (p1.x - x) / (p1.y - y);
			
			return { x:cx, y:cy };
		}
	},
	
	_latLng2Screen: function(lat, lng) {
		var lp = this._map.latLngToLayerPoint(new L.latLng(lat, lng));
		return this._map.layerPointToContainerPoint(lp)._round();
	}
});