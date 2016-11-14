const truncatePoint = require('./truncate_point');
const xtend = require('xtend');
const constrainFeatureMovement = require('./constrain_feature_movement');
const Constants = require('../constants');

module.exports = function(features, delta) {
  const constrainedDelta = constrainFeatureMovement(features.map(feature => feature.toGeoJSON()), delta);

  features.forEach(feature => {
    const currentCoordinates = feature.getCoordinates();

    const moveCoordinate = (coord) => {
        let point = truncatePoint({
          lng: coord[0] + constrainedDelta.lng,
          lat: coord[1] + constrainedDelta.lat
        });
        return [point.lng, point.lat];
    };
    const moveRing = (ring) => ring.map(coord => moveCoordinate(coord));
    const moveMultiPolygon = (multi) => multi.map(ring => moveRing(ring));

    let nextCoordinates;
    if (feature.type === Constants.geojsonTypes.POINT) {
      nextCoordinates = moveCoordinate(currentCoordinates);
    } else if (feature.type === Constants.geojsonTypes.LINE_STRING || feature.type === Constants.geojsonTypes.MULTI_POINT) {
      nextCoordinates = currentCoordinates.map(moveCoordinate);
    } else if (feature.type === Constants.geojsonTypes.POLYGON || feature.type === Constants.geojsonTypes.MULTI_LINE_STRING) {
      nextCoordinates = currentCoordinates.map(moveRing);
    } else if (feature.type === Constants.geojsonTypes.MULTI_POLYGON) {
      nextCoordinates = currentCoordinates.map(moveMultiPolygon);
    }

    feature.incomingCoords(nextCoordinates);

    if (feature.properties.circle) {
      feature.updateCenter(constrainedDelta)
    }
  });
};
