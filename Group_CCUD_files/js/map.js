$(window).load(function() {
	 var map = L.map('map', {
	        center: [37.020098201368135,107.31445312500001],
	        zoom: 5,
	        minZoom: 2,
	        maxZoom: 7,
	        attributionControl: false,
	        zoomControl:false,
	        dragging:false,
	        scrollWheelZoom:false
	 });
	 
	 map.fitBounds([[60.316523240258284,90.03320312500001],[60.316523240258284,128.88867187500003],[8.233237111274553,128.88867187500003],[8.233237111274553,90.03320312500001]]);
	 
	 //map.on("click",function(e){
		 //debugger;
	 //});
	 
	 map.on("mouseout",function(e){
		 if(popMarker){
			 map.removeLayer(popMarker);
		 }
	 });
	 
	 var geojson = L.geoJson(China, {
         style: style,
         onEachFeature: onEachFeature
     }).addTo(map);
	 
	 var citynames = ["武汉","郑州","厦门","杭州","苏州","南京","成都","天津","合肥","重庆"];
	 var latlngArray = [[30.6628,114.3896],[34.6234,113.4668],[24.6478,118.1689],[29.8773,119.5313],[31.3989,120.6519],[31.9208,118.8062],[30.7617,103.9526],[39.4189,117.4219],[32.0581,117.29],[30.1904,107.7539]];
	 var radiusArray = [3.206037339,2.223244055,1.829095518,2.286427601,2.420469172,2.96189064,2.305050465,3.781426244,1.625031462,3.277694782];
	 

	 for(var i=0;i<latlngArray.length;i++){
		 var circle = L.circle(latlngArray[i], {
			    opacity: 0,
			    fillColor: '#1d957d',
			    fillOpacity: 0.7,
			    radius: radiusArray[i]*65000
		 }).addTo(map);
		 
		var myIcon = L.divIcon({html: '<div style=\"width:'+24+'px;text-align:center;margin-left:-6px;margin-top:-4px;color:#fff">'+citynames[i]+'</div>',zIndexOffset:1});
		L.marker(latlngArray[i], {icon: myIcon}).addTo(map);
	 }
	 
	 function style(feature) {
		 return {
			 weight: 3,
			 opacity: 1,
			 color: '#36b5b5',
	         dashArray: '10,5',
	         fillOpacity: 1,
	         fillColor: '#f0f0f0'
		 };
	 }
	 
	 function onEachFeature(feature, layer) {
		 layer.on({
			 mouseover: highlightFeature,
			 mouseout: resetHighlight,
			 click: clickFeature
		 });
	 }
	 
	 var popMarker = null;
	 
	 function clickFeature(e){
		//debugger;
		if(popMarker){
			map.removeLayer(popMarker);
		}
		var myIcon = L.divIcon({html:"<div style='width:100px;padding-left-50px;margin-bottom:120px;font-family:\"Microsoft YaHei\";text-align:center;'>"+e.target.feature.properties.name+"</div>"});
		popMarker = L.marker(e.latlng, {icon: myIcon}).addTo(map);
		map.setView([35.67514743608467,108.19335937500001]);
	 }
	 
	 function highlightFeature(e){
		 var layer = e.target;
		 layer.setStyle({
			 weight: 5,
			 color: '#36b5b5',
	         dashArray: '10,5',
	         fillOpacity: 1,
	         fillColor: '#f0f0f0'
		 });
	 }
	 
	 function resetHighlight(e){
		 var layer = e.target;
		 layer.setStyle({
			 weight: 3,
			 opacity: 1,
			 color: '#36b5b5',
	         dashArray: '10,5',
	         fillOpacity: 1,
	         fillColor: '#f0f0f0'
		 });
	 }
});