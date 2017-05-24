require('cesium/Source/Widgets/widgets.css');
require('./style.css');
var BuildModuleUrl = require('cesium/Source/Core/buildModuleUrl');
BuildModuleUrl.setBaseUrl('./');

// Load all cesium components required
var Viewer = require('cesium/Source/Widgets/Viewer/Viewer');
var EllipsoidTerrainProvider = require('cesium/Source/Core/EllipsoidTerrainProvider');
var Cartesian3 = require('cesium/Source/Core/Cartesian3');
var CesiumMath = require('cesium/Source/Core/Math');
var Cartographic = require('cesium/Source/Core/Cartographic');
var Ellipsoid = require('cesium/Source/Core/Ellipsoid');
var Color = require('cesium/Source/Core/Color');
var ColorGeometryInstanceAttribute = require('cesium/Source/Core/ColorGeometryInstanceAttribute');
var GeometryInstance = require('cesium/Source/Core/GeometryInstance');
var Rectangle = require('cesium/Source/Core/Rectangle');
var RectangleGeometry = require('cesium/Source/Core/RectangleGeometry');
var EntityCollection = require('cesium/Source/DataSources/EntityCollection');
var sampleTerrain = require('cesium/Source/Core/sampleTerrain');
var ScreenSpaceEventHandler = require('cesium/Source/Core/ScreenSpaceEventHandler');
var ScreenSpaceEventType = require('cesium/Source/Core/ScreenSpaceEventType');
var createTileMapServiceImageryProvider = require('cesium/Source/Scene/createTileMapServiceImageryProvider');
var GroundPrimitive = require('cesium/Source/Scene/GroundPrimitive');
var CesiumTerrainProvider = require('cesium/Source/Core/CesiumTerrainProvider');
var CallbackProperty = require('cesium/Source/DataSources/CallbackProperty');

