/**
 * Created by johan on 5/24/2017.
 */

const center = Cartesian3.fromDegrees(-155.20178273, 19.36479555);
const points = scene.primitives.add(new PointPrimitiveCollection());
pointPrimitives.modelMatrix = Transforms.eastNorthUpToFixedFrame(center);
pointPrimitives.add({
    color : Color.ORANGE,
    position : new Cartesian3(0.0, 0.0, 0.0) // center
});
pointPrimitives.add({
    color : Color.YELLOW,
    position : new Cartesian3(1000000.0, 0.0, 0.0) // east
});
pointPrimitives.add({
    color : Cesium.Color.GREEN,
    position : new Cartesian3(0.0, 1000000.0, 0.0) // north
});
pointPrimitives.add({
    color : Cesium.Color.CYAN,
    position : new Cartesian3(0.0, 0.0, 1000000.0) // up
});